use std::os::windows::process::CommandExt;
use std::sync::Mutex;
use std::process::Command;
use std::net::IpAddr;
use tauri::State;
use trust_dns_resolver::Resolver; // For reverse DNS lookup

// Global state to hold the target machine as a Fully Qualified Domain Name (FQDN).
struct AppState {
    target_machine: Mutex<String>,
}

/// Executes a remote command via PowerShell remoting on the target machine.
/// It constructs an Invoke-Command call and returns the output.
#[tauri::command]
fn remote_command(target: &str, command: &str) -> Result<String, String> {
    let ps_command = format!(
        "Invoke-Command -ComputerName {} -ScriptBlock {{{}}}",
        target, command
    );
    println!("Executing remote command: {}", ps_command);
    let output = Command::new("powershell")
        .arg("-NoProfile")
        .arg("-Command")
        .arg(&ps_command)
        .output()
        .map_err(|e| format!("Failed to execute PowerShell: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    if !stdout.trim().is_empty() {
        Ok(stdout)
    } else {
        Ok(stderr)
    }
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
            let resolver = Resolver::from_system_conf()
                .map_err(|e| format!("Resolver error: {}", e))?;
            match resolver.reverse_lookup(ip) {
                Ok(response) => {
                    if let Some(name) = response.iter().next() {
                        // Convert to UTF-8 and remove any trailing dot.
                        let hostname = name.to_utf8();
                        hostname.trim_end_matches('.').to_string()
                    } else {
                        return Err("Reverse lookup returned no results".into());
                    }
                },
                Err(e) => {
                    println!("Reverse lookup failed: {}", e);
                    target.to_string() // fallback to input if lookup fails
                }
            }
        },
        Err(_) => target.to_string(), // not an IP, assume it's already a hostname/FQDN.
    };
    
    let mut t = state.target_machine.lock().map_err(|e| e.to_string())?;
    *t = fqdn.clone();
    println!("Target set to: {}", fqdn);
    Ok(())
}


/// Pings the target machine locally by running the ping command on this machine.
/// Uses the stored target machine (FQDN or hostname) as the parameter.
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
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| format!("Failed to execute ping: {}", e))?;
    let result = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(result)
}

#[tauri::command]
fn issue_restart(state: State<AppState>) -> Result<String, String> {
    let t = state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.is_empty() {
        return Err("No target machine set".into());
    }
    let output = Command::new("cmd")
        .args(&[
            "/C", 
            "shutdown", 
            "/r", 
            "/t", 
            "0", 
            "/m", 
            &format!("\\\\{}", *t)
        ])
        .output()
        .map_err(|e| format!("Failed to execute restart: {}", e))?;
    let result = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(result)
}

#[tauri::command]
fn issue_shutdown(state: State<AppState>) -> Result<String, String> {
    let t = state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.is_empty() {
        return Err("No target machine set".into());
    }
    let output = Command::new("cmd")
        .args(&[
            "/C", 
            "shutdown", 
            "/s", 
            "/t", 
            "0", 
            "/m", 
            &format!("\\\\{}", *t)
        ])
        .output()
        .map_err(|e| format!("Failed to execute shutdown: {}", e))?;
    let result = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(result)
}

/// Retrieves the current logged-on user from the target machine via remote PowerShell.
/// It runs the "whoami" command on the remote machine.
/// whoami returns the administrator user thats remoted into PowerShell. Using Get_WMIObject
#[tauri::command]
fn get_current_user(state: State<AppState>) -> Result<String, String> {
    let t = state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.is_empty() {
        return Err("No target machine set".into());
    }
    remote_command(&*t, "(Get-WmiObject -Class Win32_ComputerSystem).UserName")
}

#[tauri::command]
fn get_ipconfig(state: State<AppState>) -> Result<String, String> {
    let t = state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.is_empty() {
        return Err("No target machine set".into());
    }
    remote_command(&*t, "(ipconfig /all)")
}

// Open C$
#[tauri::command]
fn open_c_share(state: State<AppState>) -> Result<(), String> {
    let t = state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.trim().is_empty() {
        return Err("No target machine set".into());
    }
    // Construct the UNC path. Note the double backslashes for Windows UNC syntax.
    let unc_path = format!("\\\\{}\\c$", t);
    println!("Opening C$ share at: {}", unc_path);
    
    // Launch Windows Explorer with the UNC path.
    std::process::Command::new("explorer.exe")
        .arg(unc_path)
        .spawn()
        .map_err(|e| format!("Failed to open C$ share: {}", e))?;
    Ok(())
}

#[tauri::command]
fn open_lusrmgr(state: State<AppState>) -> Result<(), String> {
    let t = state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.trim().is_empty() {
        return Err("No target machine set".into());
    }
    // Construct the argument string to open lusrmgr.msc for the remote target.
    let computer_arg = format!("/computer:{}", t);
    println!("Opening lusrmgr.msc on target: {}", t);
    
    std::process::Command::new("mmc.exe")
        .arg("lusrmgr.msc")
        .arg(computer_arg)
        .spawn()
        .map_err(|e| format!("Failed to open lusrmgr.msc: {}", e))?;
    Ok(())
}

#[tauri::command]
fn open_shares(state: State<AppState>) -> Result<(), String> {
    let t = state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.trim().is_empty() {
        return Err("No target machine set".into());
    }
    // Construct the UNC path to open the root of the target machine's shares.
    let computer_arg = format!("/computer:{}", t);
    println!("Opening shares at: {}", t);

    std::process::Command::new("mmc.exe")
        .arg("fsmgmt.msc")
        .arg(computer_arg)
        .spawn()
        .map_err(|e| format!("Failed to open shares: {}", e))?;
    Ok(())
}

#[tauri::command]
fn open_services(state: State<AppState>) -> Result<(), String> {
    let t = state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.trim().is_empty() {
        return Err("No target machine set".into());
    }
    let computer_arg = format!("/computer:{}", t);
    println!("Opening services at: {}", t);

    std::process::Command::new("mmc.exe")
        .arg("services.msc")
        .arg(computer_arg)
        .spawn()
        .map_err(|e| format!("Failed to open services: {}", e))?;
    Ok(())
}

#[tauri::command]
fn open_eventvwr(state: State<AppState>) -> Result<(), String> {
    let t = state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.trim().is_empty() {
        return Err("No target machine set".into());
    }
    let computer_arg = format!("/computer:{}", t);
    println!("Opening Event Viewer at: {}", t);

    std::process::Command::new("mmc.exe")
        .arg("eventvwr.msc")
        .arg(computer_arg)
        .spawn()
        .map_err(|e| format!("Failed to open Event Viewer: {}", e))?;
    Ok(())
}

#[tauri::command]
fn open_compmgmt(state: State<AppState>) -> Result<(), String> {
    let t = state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.trim().is_empty() {
        return Err("No target machine set".into());
    }
    let computer_arg = format!("/computer:{}", t);
    println!("Opening Computer Management at: {}", t);

    std::process::Command::new("mmc.exe")
        .arg("compmgmt.msc")
        .arg(computer_arg)
        .spawn()
        .map_err(|e| format!("Failed to open Computer Management: {}", e))?;
    Ok(())
}

#[tauri::command]
fn open_diskmgmt(state: State<AppState>) -> Result<(), String> {
    let t = state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.trim().is_empty() {
        return Err("No target machine set".into());
    }
    let computer_arg = format!("/computer:{}", t);
    println!("Opening Disk Management at: {}", t);

    std::process::Command::new("mmc.exe")
        .arg("diskmgmt.msc")
        .arg(computer_arg)
        .spawn()
        .map_err(|e| format!("Failed to open Disk Management: {}", e))?;
    Ok(())
}

#[tauri::command]
fn open_aduc() -> Result<(), String> {
    println!("Opening Active Directory");
    std::process::Command::new("mmc.exe")
        .arg("dsa.msc")
        .spawn()
        .map_err(|e| format!("failed to open Active Directory: {}", e))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            target_machine: Mutex::new(String::new()),
        })
        .invoke_handler(tauri::generate_handler![
            set_target,
            ping,
            get_current_user,
            remote_command,
            open_c_share,
            open_lusrmgr,
            open_shares,
            open_services,
            open_eventvwr,
            open_compmgmt,
            open_diskmgmt,
            get_ipconfig,
            open_aduc,
            issue_restart,
            issue_shutdown
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

