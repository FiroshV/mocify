use axum::{
    extract::{Path, State},
    http::{HeaderMap, Method, StatusCode},
    response::{IntoResponse, Response},
    routing::any,
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::oneshot;
use tokio::time::{sleep, Duration};
use tower_http::cors::CorsLayer;

use crate::db::Database;
use crate::models::HttpMethod;

pub struct MockServer {
    port: u16,
    collection_id: String,
    shutdown_tx: Option<oneshot::Sender<()>>,
}

impl MockServer {
    pub fn new(port: u16, collection_id: String) -> Self {
        Self {
            port,
            collection_id,
            shutdown_tx: None,
        }
    }

    pub async fn start(&mut self, db: Database) -> Result<(), String> {
        let (shutdown_tx, shutdown_rx) = oneshot::channel();
        self.shutdown_tx = Some(shutdown_tx);

        let app_state = Arc::new(MockServerState {
            db,
            collection_id: self.collection_id.clone(),
        });

        let app = Router::new()
            .route("/*path", any(handle_mock_request))
            .route("/", any(handle_mock_request))
            .layer(CorsLayer::permissive())
            .with_state(app_state);

        let addr = SocketAddr::from(([127, 0, 0, 1], self.port));
        
        tokio::spawn(async move {
            let listener = tokio::net::TcpListener::bind(addr)
                .await
                .expect("Failed to bind");
            
            axum::serve(listener, app)
                .with_graceful_shutdown(async {
                    shutdown_rx.await.ok();
                })
                .await
                .expect("Server error");
        });

        Ok(())
    }

    pub fn stop(&mut self) {
        if let Some(tx) = self.shutdown_tx.take() {
            let _ = tx.send(());
        }
    }
}

#[derive(Clone)]
struct MockServerState {
    db: Database,
    collection_id: String,
}

async fn handle_mock_request(
    State(state): State<Arc<MockServerState>>,
    method: Method,
    Path(path): Path<String>,
    _headers: HeaderMap,
) -> Response {
    let path = format!("/{}", path);
    
    // Get all routes for this collection
    let routes = match state.db.get_routes(&state.collection_id).await {
        Ok(routes) => routes,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    };

    // Find matching route
    let matching_route = routes.into_iter().find(|route| {
        route.path == path && method_matches(&method, &route.method)
    });

    match matching_route {
        Some(route) => {
            // Apply delay if specified
            if let Some(delay_ms) = route.delay_ms {
                sleep(Duration::from_millis(delay_ms as u64)).await;
            }

            // Build response
            let mut response = Response::builder()
                .status(route.status_code);

            // Check if Content-Type is already specified and add custom headers
            let mut has_content_type = false;
            if let Some(ref headers_json) = route.response_headers {
                if let Ok(headers_map) = serde_json::from_value::<serde_json::Map<String, serde_json::Value>>(headers_json.clone()) {
                    for (key, value) in &headers_map {
                        if key.to_lowercase() == "content-type" {
                            has_content_type = true;
                        }
                        if let Ok(header_value) = value.as_str().unwrap_or("").parse::<axum::http::HeaderValue>() {
                            response = response.header(key, header_value);
                        }
                    }
                }
            }
            
            // Add default Content-Type if not specified
            if !has_content_type {
                response = response.header("content-type", "application/json");
            }

            // Add body
            let body = route.response_body.unwrap_or_else(|| "".to_string());
            response.body(body).unwrap().into_response()
        }
        None => {
            (StatusCode::NOT_FOUND, "Route not found").into_response()
        }
    }
}

fn method_matches(axum_method: &Method, route_method: &HttpMethod) -> bool {
    match route_method {
        HttpMethod::Get => axum_method == Method::GET,
        HttpMethod::Post => axum_method == Method::POST,
        HttpMethod::Put => axum_method == Method::PUT,
        HttpMethod::Delete => axum_method == Method::DELETE,
        HttpMethod::Patch => axum_method == Method::PATCH,
        HttpMethod::Head => axum_method == Method::HEAD,
        HttpMethod::Options => axum_method == Method::OPTIONS,
    }
}