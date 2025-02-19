use std::sync::Mutex;
use std::process::Command;
use std::net::IpAddr;
use tauri::State;
use trust_dns_resolver::Resolver; // For reverse DNS lookup

// Global state to hold the target machine as a FQDN.
struct AppState {
    target_machine: Mutex<String>,
}

/// Sets the target machine, converting an IP address to its FQDN if needed.
/// Returns an error if the input is empty.
#[tauri::command]
fn set_target(target: &str, state: State<AppState>) -> Result<(), String> {
    if target.trim().is_empty() {
        return Err("Target cannot be empty".into());
    }

    let fqdn = match target.parse::<IpAddr>() {
        Ok(ip) => {
            let resolver = Resolver::from_system_conf().map_err(|e| format!("Resolver error: {}", e))?;
            let response = resolver.reverse_lookup(ip).map_err(|e| format!("Reverse lookup error: {}", e))?;
            if let Some(name) = response.iter().next() {
                name.to_utf8()
            } else {
                return Err("Reverse lookup returned no results".into());
            }
        },
        Err(_) => target.to_string(),
    };

    let mut t = state.target_machine.lock().map_err(|e| e.to_string())?;
    *t = fqdn.clone();
    println!("Target set to: {}", fqdn);
    Ok(())
}

/// Pings the target machine locally by running the ping command on this machine.
/// It uses the stored target machine (FQDN or hostname) as the parameter.
#[tauri::command]
fn ping(state: State<AppState>) -> Result<String, String> {
    let t = state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.is_empty() {
        return Err("No target machine set".into());
    }
    let output = Command::new("ping")
        .arg("-n")
        .arg("2")
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
        .invoke_handler(tauri::generate_handler![
            set_target,
            ping
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
