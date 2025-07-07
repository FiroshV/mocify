#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod api;
mod db;
mod mock_server;
mod models;

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::api::*;
use crate::db::Database;
use crate::mock_server::MockServer;

type ServerMap = Arc<Mutex<HashMap<u16, MockServer>>>;

#[derive(Clone)]
struct AppState {
    db: Database,
    servers: ServerMap,
}

#[tokio::main]
async fn main() {
    env_logger::init();

    // Generate Tauri context once
    let context = tauri::generate_context!();
    
    // Initialize database in current directory for now
    let db = Database::new("./mocify.db").await.expect("Failed to initialize database");
    
    // Initialize app state
    let app_state = AppState {
        db,
        servers: Arc::new(Mutex::new(HashMap::new())),
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            create_collection,
            get_collections,
            update_collection,
            delete_collection,
            create_route,
            get_routes,
            update_route,
            delete_route,
            start_server,
            stop_server,
            get_running_servers,
            test_route
        ])
        .run(context)
        .expect("error while running tauri application");
}