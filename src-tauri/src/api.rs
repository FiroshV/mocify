use tauri::State;
use std::time::Instant;
use log::{info, debug, error};

use crate::{AppState, models::*, mock_server::MockServer};

// Collection commands
#[tauri::command]
pub async fn create_collection(
    state: State<'_, AppState>,
    request: CreateCollectionRequest,
) -> Result<Collection, String> {
    info!("Creating collection...");
    debug!("Request: {:?}", request);

    let result = state.db.create_collection(request).await;

    match &result {
        Ok(collection) => {
            info!("Collection created successfully");
            debug!("Collection: {:?}", collection);
        },
        Err(e) => {
            error!("Failed to create collection: {}", e);
        }
    }

    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_collections(
    state: State<'_, AppState>,
) -> Result<Vec<Collection>, String> {
    state.db.get_collections()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_collection(
    state: State<'_, AppState>,
    request: UpdateCollectionRequest,
) -> Result<Collection, String> {
    state.db.update_collection(request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_collection(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    // Stop server if running
    let mut servers = state.servers.lock().await;
    if let Some(collection) = state.db.get_collection(&id).await.map_err(|e| e.to_string())? {
        if let Some(mut server) = servers.remove(&collection.port) {
            server.stop();
        }
    }
    
    state.db.delete_collection(&id)
        .await
        .map_err(|e| e.to_string())
}

// Route commands
#[tauri::command]
pub async fn create_route(
    state: State<'_, AppState>,
    request: CreateRouteRequest,
) -> Result<Route, String> {
    state.db.create_route(request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_routes(
    state: State<'_, AppState>,
    collection_id: String,
) -> Result<Vec<Route>, String> {
    state.db.get_routes(&collection_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_route(
    state: State<'_, AppState>,
    request: UpdateRouteRequest,
) -> Result<Route, String> {
    state.db.update_route(request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_route(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    state.db.delete_route(&id)
        .await
        .map_err(|e| e.to_string())
}

// Server commands
#[tauri::command]
pub async fn start_server(
    state: State<'_, AppState>,
    collection_id: String,
) -> Result<ServerStatus, String> {
    let collection = state.db.get_collection(&collection_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Collection not found")?;

    let mut servers = state.servers.lock().await;
    
    // Check if server already running on this port
    if servers.contains_key(&collection.port) {
        return Err("Server already running on this port".to_string());
    }

    let mut server = MockServer::new(collection.port, collection_id.clone());
    server.start(state.db.clone()).await?;
    
    servers.insert(collection.port, server);

    Ok(ServerStatus {
        port: collection.port,
        collection_id: collection.id,
        collection_name: collection.name,
        is_running: true,
        base_url: format!("http://localhost:{}", collection.port),
    })
}

#[tauri::command]
pub async fn stop_server(
    state: State<'_, AppState>,
    port: u16,
) -> Result<(), String> {
    let mut servers = state.servers.lock().await;
    
    if let Some(mut server) = servers.remove(&port) {
        server.stop();
        Ok(())
    } else {
        Err("Server not found".to_string())
    }
}

#[tauri::command]
pub async fn get_running_servers(
    state: State<'_, AppState>,
) -> Result<Vec<ServerStatus>, String> {
    let servers = state.servers.lock().await;
    let collections = state.db.get_collections()
        .await
        .map_err(|e| e.to_string())?;
    
    let mut server_statuses = Vec::new();
    
    for collection in collections {
        let is_running = servers.contains_key(&collection.port);
        server_statuses.push(ServerStatus {
            port: collection.port,
            collection_id: collection.id,
            collection_name: collection.name,
            is_running,
            base_url: format!("http://localhost:{}", collection.port),
        });
    }
    
    Ok(server_statuses)
}

#[tauri::command]
pub async fn test_route(
    state: State<'_, AppState>,
    request: TestRouteRequest,
) -> Result<TestRouteResponse, String> {
    let route = state.db.get_route(&request.route_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Route not found")?;
    
    let collection = state.db.get_collection(&route.collection_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Collection not found")?;
    
    // Check if server is running
    let servers = state.servers.lock().await;
    if !servers.contains_key(&collection.port) {
        return Err("Server not running. Please start the server first.".to_string());
    }
    drop(servers);
    
    // Make HTTP request to test the route
    let url = format!("http://localhost:{}{}", collection.port, route.path);
    let client = reqwest::Client::new();
    
    let start = Instant::now();
    
    let request_builder = match route.method {
        HttpMethod::Get => client.get(&url),
        HttpMethod::Post => client.post(&url),
        HttpMethod::Put => client.put(&url),
        HttpMethod::Delete => client.delete(&url),
        HttpMethod::Patch => client.patch(&url),
        HttpMethod::Head => client.head(&url),
        HttpMethod::Options => client.request(reqwest::Method::OPTIONS, &url),
    };
    
    let response = request_builder
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    let elapsed = start.elapsed().as_millis() as u64;
    
    let status_code = response.status().as_u16();
    let headers = response.headers().clone();
    let body = response.text().await.map_err(|e| e.to_string())?;
    
    // Convert headers to JSON
    let mut headers_json = serde_json::Map::new();
    for (key, value) in headers.iter() {
        headers_json.insert(
            key.to_string(),
            serde_json::Value::String(value.to_str().unwrap_or("").to_string())
        );
    }
    
    Ok(TestRouteResponse {
        url,
        method: route.method.as_str().to_string(),
        status_code,
        headers: serde_json::Value::Object(headers_json),
        body,
        response_time_ms: elapsed,
    })
}