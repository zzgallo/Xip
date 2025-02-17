use std::sync::Mutex;
use std::process::Command;
use tauri::State;

// Global state to hold the target machine
struct AppState {
    target_machine: Mutex<String>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn set_target(target: &str, state: State<AppState>) -> Result<(), String> {
    let mut t = state.target_machine.lock().map_err(|e| e.to_string())?;
    *t = target.to_string();
    Ok(())
}

#[tauri::command]
fn ping(state: State<AppState>) -> Result<String, String> {
    // Retrieve the cached target
    let t = state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.is_empty() {
        return Err("No target machine set".into());
    }
    // Execute the ping command (Windows: -n 4 sends 4 echo requests)
    let output = Command::new("ping")
        .arg("-n")
        .arg("4")
        .arg(&*t)
        .output()
        .map_err(|e| format!("Failed to execute ping: {}", e))?;
    let result = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(result)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            target_machine: Mutex::new(String::new()),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, set_target, ping])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
