use std::sync::Mutex;
use std::process::Command;
use tauri::State;

struct AppState {
    target_machine: Mutex<String>,
}

#[tauri::command]
fn remote_command(target: &str, command: &str) -> Result<String, String> {
    // Construct the PowerShell command string
    let ps_command = format!(
        "Invoke-Command -ComputerName {} -ScriptBlock {{{}}}",
        target, command
    );
    // Log the command for debugging purposes
    println!("Executing PowerShell command: {}", ps_command);

    let output = Command::new("powershell")
        .arg("-NoProfile")
        .arg("-Command")
        .arg(&ps_command)
        .output()
        .map_err(|e| format!("Failed to execute PowerShell: {}", e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    // Return stdout if it has content, otherwise return stderr
    if !stdout.trim().is_empty() {
        Ok(stdout)
    } else {
        Ok(stderr)
    }
}

#[tauri::command]
fn set_target(target: &str, state: State<AppState>) -> Result<(), String> {
    let mut t = state.target_machine.lock().map_err(|e| e.to_string())?;
    *t = target.to_string();
    Ok(())
}

#[tauri::command]
fn ping(state: State<AppState>) -> Result<String, String> {
    let t = state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.is_empty() {
        return Err("No target machine set".into());
    }

    // Execute the ping command on Windows: -n 4 sends 4 ping requests
    let output = Command::new("ping")
        .arg("-n")
        .arg("2")
        .arg(&*t)
        .output()
        .map_err(|e| format!("Failed to execute ping: {}", e))?;

    let result = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(result)
}

#[tauri::command]
fn get_current_user() -> Result<String, String> {
    let output = Command::new("whoami")
        .output()
        .map_err(|e| format!("Failed to execute whoami: {}", e))?;
    let result = String::from_utf8_lossy(&output.stdout).trim().to_string();
    Ok(result)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            target_machine: Mutex::new(String::new()),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![set_target, ping, get_current_user, remote_command])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
