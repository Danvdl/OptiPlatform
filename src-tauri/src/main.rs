#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_store::Builder as StoreBuilder;

fn main() {
    tauri::Builder::default()
        .plugin(StoreBuilder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
