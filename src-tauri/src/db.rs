use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use anyhow::Result;
use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::models::*;

#[derive(Clone)]
pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn new(db_path: &str) -> Result<Self> {
        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(&format!("sqlite://{}?mode=rwc", db_path))
            .await?;

        let db = Self { pool };
        db.migrate().await?;
        Ok(db)
    }

    async fn migrate(&self) -> Result<()> {
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS collections (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                port INTEGER NOT NULL UNIQUE,
                base_path TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS routes (
                id TEXT PRIMARY KEY,
                collection_id TEXT NOT NULL,
                name TEXT NOT NULL,
                method TEXT NOT NULL,
                path TEXT NOT NULL,
                status_code INTEGER NOT NULL,
                response_body TEXT,
                response_headers TEXT,
                delay_ms INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
                UNIQUE(collection_id, method, path)
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    // Collection methods
    pub async fn create_collection(&self, req: CreateCollectionRequest) -> Result<Collection> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        let collection = Collection {
            id: id.clone(),
            name: req.name,
            description: req.description,
            port: req.port,
            base_path: req.base_path,
            created_at: now,
            updated_at: now,
        };

        sqlx::query(
            r#"
            INSERT INTO collections (id, name, description, port, base_path, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            "#,
        )
        .bind(&collection.id)
        .bind(&collection.name)
        .bind(&collection.description)
        .bind(collection.port as i32)
        .bind(&collection.base_path)
        .bind(collection.created_at.to_rfc3339())
        .bind(collection.updated_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(collection)
    }

    pub async fn get_collections(&self) -> Result<Vec<Collection>> {
        let rows = sqlx::query_as::<_, (String, String, Option<String>, i32, Option<String>, String, String)>(
            "SELECT id, name, description, port, base_path, created_at, updated_at FROM collections ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await?;

        let collections = rows
            .into_iter()
            .map(|(id, name, description, port, base_path, created_at, updated_at)| Collection {
                id,
                name,
                description,
                port: port as u16,
                base_path,
                created_at: DateTime::parse_from_rfc3339(&created_at).unwrap().with_timezone(&Utc),
                updated_at: DateTime::parse_from_rfc3339(&updated_at).unwrap().with_timezone(&Utc),
            })
            .collect();

        Ok(collections)
    }

    pub async fn get_collection(&self, id: &str) -> Result<Option<Collection>> {
        let row = sqlx::query_as::<_, (String, String, Option<String>, i32, Option<String>, String, String)>(
            "SELECT id, name, description, port, base_path, created_at, updated_at FROM collections WHERE id = ?1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(|(id, name, description, port, base_path, created_at, updated_at)| Collection {
            id,
            name,
            description,
            port: port as u16,
            base_path,
            created_at: DateTime::parse_from_rfc3339(&created_at).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&updated_at).unwrap().with_timezone(&Utc),
        }))
    }

    pub async fn update_collection(&self, req: UpdateCollectionRequest) -> Result<Collection> {
        let mut collection = self.get_collection(&req.id).await?
            .ok_or_else(|| anyhow::anyhow!("Collection not found"))?;

        if let Some(name) = req.name {
            collection.name = name;
        }
        if let Some(description) = req.description {
            collection.description = Some(description);
        }
        if let Some(port) = req.port {
            collection.port = port;
        }
        if let Some(base_path) = req.base_path {
            collection.base_path = Some(base_path);
        }

        collection.updated_at = Utc::now();

        sqlx::query(
            r#"
            UPDATE collections 
            SET name = ?2, description = ?3, port = ?4, base_path = ?5, updated_at = ?6
            WHERE id = ?1
            "#,
        )
        .bind(&collection.id)
        .bind(&collection.name)
        .bind(&collection.description)
        .bind(collection.port as i32)
        .bind(&collection.base_path)
        .bind(collection.updated_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(collection)
    }

    pub async fn delete_collection(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM collections WHERE id = ?1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    // Route methods
    pub async fn create_route(&self, req: CreateRouteRequest) -> Result<Route> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        let route = Route {
            id: id.clone(),
            collection_id: req.collection_id,
            name: req.name,
            method: req.method,
            path: req.path,
            status_code: req.status_code,
            response_body: req.response_body,
            response_headers: req.response_headers,
            delay_ms: req.delay_ms,
            created_at: now,
            updated_at: now,
        };

        sqlx::query(
            r#"
            INSERT INTO routes (id, collection_id, name, method, path, status_code, response_body, response_headers, delay_ms, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
            "#,
        )
        .bind(&route.id)
        .bind(&route.collection_id)
        .bind(&route.name)
        .bind(route.method.as_str())
        .bind(&route.path)
        .bind(route.status_code as i32)
        .bind(&route.response_body)
        .bind(route.response_headers.as_ref().map(|h| h.to_string()))
        .bind(route.delay_ms.map(|d| d as i32))
        .bind(route.created_at.to_rfc3339())
        .bind(route.updated_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(route)
    }

    pub async fn get_routes(&self, collection_id: &str) -> Result<Vec<Route>> {
        let rows = sqlx::query_as::<_, (String, String, String, String, String, i32, Option<String>, Option<String>, Option<i32>, String, String)>(
            "SELECT id, collection_id, name, method, path, status_code, response_body, response_headers, delay_ms, created_at, updated_at FROM routes WHERE collection_id = ?1 ORDER BY created_at DESC"
        )
        .bind(collection_id)
        .fetch_all(&self.pool)
        .await?;

        let routes = rows
            .into_iter()
            .map(|(id, collection_id, name, method, path, status_code, response_body, response_headers, delay_ms, created_at, updated_at)| Route {
                id,
                collection_id,
                name,
                method: serde_json::from_str(&format!("\"{}\"", method)).unwrap(),
                path,
                status_code: status_code as u16,
                response_body,
                response_headers: response_headers.and_then(|h| serde_json::from_str(&h).ok()),
                delay_ms: delay_ms.map(|d| d as u32),
                created_at: DateTime::parse_from_rfc3339(&created_at).unwrap().with_timezone(&Utc),
                updated_at: DateTime::parse_from_rfc3339(&updated_at).unwrap().with_timezone(&Utc),
            })
            .collect();

        Ok(routes)
    }

    pub async fn get_route(&self, id: &str) -> Result<Option<Route>> {
        let row = sqlx::query_as::<_, (String, String, String, String, String, i32, Option<String>, Option<String>, Option<i32>, String, String)>(
            "SELECT id, collection_id, name, method, path, status_code, response_body, response_headers, delay_ms, created_at, updated_at FROM routes WHERE id = ?1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(|(id, collection_id, name, method, path, status_code, response_body, response_headers, delay_ms, created_at, updated_at)| Route {
            id,
            collection_id,
            name,
            method: serde_json::from_str(&format!("\"{}\"", method)).unwrap(),
            path,
            status_code: status_code as u16,
            response_body,
            response_headers: response_headers.and_then(|h| serde_json::from_str(&h).ok()),
            delay_ms: delay_ms.map(|d| d as u32),
            created_at: DateTime::parse_from_rfc3339(&created_at).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&updated_at).unwrap().with_timezone(&Utc),
        }))
    }

    pub async fn update_route(&self, req: UpdateRouteRequest) -> Result<Route> {
        let mut route = self.get_route(&req.id).await?
            .ok_or_else(|| anyhow::anyhow!("Route not found"))?;

        if let Some(name) = req.name {
            route.name = name;
        }
        if let Some(method) = req.method {
            route.method = method;
        }
        if let Some(path) = req.path {
            route.path = path;
        }
        if let Some(status_code) = req.status_code {
            route.status_code = status_code;
        }
        if req.response_body.is_some() {
            route.response_body = req.response_body;
        }
        if req.response_headers.is_some() {
            route.response_headers = req.response_headers;
        }
        if req.delay_ms.is_some() {
            route.delay_ms = req.delay_ms;
        }

        route.updated_at = Utc::now();

        sqlx::query(
            r#"
            UPDATE routes 
            SET name = ?2, method = ?3, path = ?4, status_code = ?5, response_body = ?6, response_headers = ?7, delay_ms = ?8, updated_at = ?9
            WHERE id = ?1
            "#,
        )
        .bind(&route.id)
        .bind(&route.name)
        .bind(route.method.as_str())
        .bind(&route.path)
        .bind(route.status_code as i32)
        .bind(&route.response_body)
        .bind(route.response_headers.as_ref().map(|h| h.to_string()))
        .bind(route.delay_ms.map(|d| d as i32))
        .bind(route.updated_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(route)
    }

    pub async fn delete_route(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM routes WHERE id = ?1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}