use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Collection {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub port: u16,
    pub base_path: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Route {
    pub id: String,
    pub collection_id: String,
    pub name: String,
    pub method: HttpMethod,
    pub path: String,
    pub status_code: u16,
    pub response_body: Option<String>,
    pub response_headers: Option<serde_json::Value>,
    pub delay_ms: Option<u32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum HttpMethod {
    Get,
    Post,
    Put,
    Delete,
    Patch,
    Head,
    Options,
}

impl HttpMethod {
    pub fn as_str(&self) -> &'static str {
        match self {
            HttpMethod::Get => "GET",
            HttpMethod::Post => "POST",
            HttpMethod::Put => "PUT",
            HttpMethod::Delete => "DELETE",
            HttpMethod::Patch => "PATCH",
            HttpMethod::Head => "HEAD",
            HttpMethod::Options => "OPTIONS",
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCollectionRequest {
    pub name: String,
    pub description: Option<String>,
    pub port: u16,
    pub base_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCollectionRequest {
    pub id: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub port: Option<u16>,
    pub base_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateRouteRequest {
    pub collection_id: String,
    pub name: String,
    pub method: HttpMethod,
    pub path: String,
    pub status_code: u16,
    pub response_body: Option<String>,
    pub response_headers: Option<serde_json::Value>,
    pub delay_ms: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateRouteRequest {
    pub id: String,
    pub name: Option<String>,
    pub method: Option<HttpMethod>,
    pub path: Option<String>,
    pub status_code: Option<u16>,
    pub response_body: Option<String>,
    pub response_headers: Option<serde_json::Value>,
    pub delay_ms: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct ServerStatus {
    pub port: u16,
    pub collection_id: String,
    pub collection_name: String,
    pub is_running: bool,
    pub base_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TestRouteRequest {
    pub route_id: String,
}

#[derive(Debug, Serialize)]
pub struct TestRouteResponse {
    pub url: String,
    pub method: String,
    pub status_code: u16,
    pub headers: serde_json::Value,
    pub body: String,
    pub response_time_ms: u64,
}