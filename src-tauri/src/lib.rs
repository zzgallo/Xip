use std::collections::HashMap;
use std::os::windows::process::CommandExt;
use std::sync::{Arc, Mutex};
use std::process::{Child, Command};
use std::net::IpAddr;
use std::time::Duration;
use::std::thread;
use tauri::State;
use trust_dns_resolver::Resolver; // For reverse DNS lookup

// Global state to hold the target machine as a Fully Qualified Domain Name (FQDN).
struct AppState {
    pub target_machine: Mutex<String>,
}

// ProcessTracker holds a hashmap of the process ID' to their Child handles
pub struct ProcessTracker {
    pub processes: Mutex<HashMap<u32, Child>>,
}


// Function that enforces a timeout on spawned processes
fn enforce_timeout(pid: u32, timeout: Duration, tracker: Arc<ProcessTracker>) {
    thread::spawn(move || {
        thread::sleep(timeout);
        let mut processes = tracker.processes.lock().unwrap();
        if let Some(mut child) = processes.remove(&pid) {
            match child.try_wait() {
                Ok(Some(status)) => {
                    println!("Process {} completed with status: {:?}", pid, status);
                }
                _ => {
                    println!("Process {} exceeded timeout; terminating...", pid);
                    let _ = child.kill();
                }
            }
        }
    });
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
fn open_c_share(
    target_state: tauri::State<AppState>,
    tracker: tauri::State<Arc<ProcessTracker>>
    )-> Result<(), String> {
    let t = target_state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.trim().is_empty() {
        return Err("No target machine set".into());
    }
    // Construct the UNC path. Note the double backslashes for Windows UNC syntax.
    let unc_path = format!("\\\\{}\\c$", t);
    println!("Opening C$ share at: {}", unc_path);
    
    // Launch Windows Explorer with the UNC path.
    let child = std::process::Command::new("explorer.exe")
        .arg(unc_path)
        .spawn()
        .map_err(|e| format!("Failed to open C$ share: {}", e))?;

    let pid = child.id();

    tracker
        .processes
        .lock()
        .unwrap()
        .insert(pid, child);

    enforce_timeout(pid, std::time::Duration::from_secs(30), (*tracker).clone());

    Ok(())
}

#[tauri::command]
fn open_lusrmgr(
    target_state: tauri::State<AppState>,
    tracker: tauri::State<Arc<ProcessTracker>>
    ) -> Result<(), String> {
    let t = target_state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.trim().is_empty() {
        return Err("No target machine set".into());
    }
    // Construct the argument string to open lusrmgr.msc for the remote target.
    let computer_arg = format!("/computer:{}", t);
    println!("Opening lusrmgr.msc on target: {}", t);
    
    let child = std::process::Command::new("mmc.exe")
        .arg("lusrmgr.msc")
        .arg(computer_arg)
        .spawn()
        .map_err(|e| format!("Failed to open lusrmgr.msc: {}", e))?;

    let pid = child.id();

    tracker
        .processes
        .lock()
        .unwrap()
        .insert(pid, child);

    enforce_timeout(pid, std::time::Duration::from_secs(30), (*tracker).clone());

    Ok(())
}

#[tauri::command]
fn open_shares(
    target_state: tauri::State<AppState>,
    tracker: tauri::State<Arc<ProcessTracker>>
    ) -> Result<(), String> {
    let t = target_state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.trim().is_empty() {
        return Err("No target machine set".into());
    }
    // Construct the UNC path to open the root of the target machine's shares.
    let computer_arg = format!("/computer:{}", t);
    println!("Opening shares at: {}", t);

    let child = std::process::Command::new("mmc.exe")
        .arg("fsmgmt.msc")
        .arg(computer_arg)
        .spawn()
        .map_err(|e| format!("Failed to open shares: {}", e))?;

    let pid = child.id();

    tracker
        .processes
        .lock()
        .unwrap()
        .insert(pid, child);

    enforce_timeout(pid, std::time::Duration::from_secs(30), (*tracker).clone());

    Ok(())
}

#[tauri::command]
fn open_services(
    target_state: tauri::State<AppState>,
    tracker: tauri::State<Arc<ProcessTracker>>
    ) -> Result<(), String> {
    let t = target_state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.trim().is_empty() {
        return Err("No target machine set".into());
    }
    let computer_arg = format!("/computer:{}", t);
    println!("Opening services at: {}", t);

    let child = std::process::Command::new("mmc.exe")
        .arg("services.msc")
        .arg(computer_arg)
        .spawn()
        .map_err(|e| format!("Failed to open services: {}", e))?;

    let pid = child.id();

    tracker
        .processes
        .lock()
        .unwrap()
        .insert(pid, child);

    enforce_timeout(pid, std::time::Duration::from_secs(30), (*tracker).clone());

    Ok(())
}

#[tauri::command]
fn open_eventvwr(
    target_state: tauri::State<AppState>,
    tracker: tauri::State<Arc<ProcessTracker>>
) -> Result<(), String> {
    // Ensure a target machine is set.
    let t = target_state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.trim().is_empty() {
        return Err("No target machine set".into());
    }
    let computer_arg = format!("/computer:{}", t);
    println!("Opening Event Viewer at: {}", t);

    // Spawn the process and store its handle in a variable.
    let child = std::process::Command::new("mmc.exe")
        .arg("eventvwr.msc")
        .arg(computer_arg)
        .spawn()
        .map_err(|e| format!("Failed to open Event Viewer: {}", e))?;

    // Retrieve the PID from the spawned process.
    let pid = child.id();

    // Tag the process: store it in our process tracker.
    tracker
        .processes
        .lock()
        .unwrap()
        .insert(pid, child);

    // Start timeout enforcement (30 seconds in this example).
    enforce_timeout(pid, std::time::Duration::from_secs(30), (*tracker).clone());

    Ok(())
}



#[tauri::command]
fn open_compmgmt(
    target_state: tauri::State<AppState>,
    tracker: tauri::State<Arc<ProcessTracker>>
    ) -> Result<(), String> {
    let t = target_state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.trim().is_empty() {
        return Err("No target machine set".into());
    }
    let computer_arg = format!("/computer:{}", t);
    println!("Opening Computer Management at: {}", t);

    let child = std::process::Command::new("mmc.exe")
        .arg("compmgmt.msc")
        .arg(computer_arg)
        .spawn()
        .map_err(|e| format!("Failed to open Computer Management: {}", e))?;

    let pid = child.id();

    tracker
        .processes
        .lock()
        .unwrap()
        .insert(pid, child);

    enforce_timeout(pid, std::time::Duration::from_secs(30), (*tracker).clone());

    Ok(())
}

#[tauri::command]
fn open_devicemgr(
    target_state: tauri::State<AppState>,
    tracker: tauri::State<Arc<ProcessTracker>>
    ) -> Result<(), String> {
    let t = target_state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.trim().is_empty() {
        return Err("No target machine set".into());
    }
    let computer_arg = format!("/computer:{}", t);
    println!("Opening Disk Management at: {}", t);

    let child = std::process::Command::new("mmc.exe")
        .arg("devmgmt.msc")
        .arg(computer_arg)
        .spawn()
        .map_err(|e| format!("Failed to open Device Manager: {}", e))?;

    let pid = child.id();

    tracker
        .processes
        .lock()
        .unwrap()
        .insert(pid, child);

    enforce_timeout(pid, std::time::Duration::from_secs(30), (*tracker).clone());

    Ok(())
}

#[tauri::command]
fn open_aduc() -> Result<(), String> {
    println!("Opening Active Directory");
    std::process::Command::new("mmc.exe")
        .arg("dsa.msc")
        .spawn()
        .map_err(|e| format!("Failed to open Active Directory: {}", e))?;
    Ok(())
}

#[tauri::command]
fn open_dhcp() -> Result<(), String> {
    println!("Opening DHCP");
    std::process::Command::new("mmc.exe")
        .arg("dhcpmgmt.msc")
        .spawn()
        .map_err(|e| format!("Failed to open DHCP: {}", e))?;
    Ok(())
}

#[tauri::command]
fn open_dns() -> Result<(), String> {
    println!("Opening DNS");
    std::process::Command::new("mmc.exe")
        .arg("dnsmgmt.msc")
        .spawn()
        .map_err(|e| format!("Failed to open DNS: {}", e))?;
    Ok(())
}

#[tauri::command]
fn open_gpu() -> Result<(), String> {
    println!("Opening Group Policy");
    std::process::Command::new("mmc.exe")
        .arg("gpmc.msc")
        .spawn()
        .map_err(|e| format!("Failed to open Group Policy: {}", e))?;
    Ok(())
}

#[tauri::command]
fn open_perfmon(
    target_state: tauri::State<AppState>,
    tracker: tauri::State<Arc<ProcessTracker>>
    ) -> Result<(), String> {
    let t = target_state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.trim().is_empty() {
        return Err("No target machine set".into());
    }
    let computer_arg = format!("/computer:{}", t);
    println!("Opening Performance Monitor at: {}", t);

    let child = std::process::Command::new("mmc.exe")
        .arg("perfmon")
        .arg(computer_arg)
        .spawn()
        .map_err(|e| format!("Failed to open Performance Monitor: {}", e))?;

    let pid = child.id();

    tracker
        .processes
        .lock()
        .unwrap()
        .insert(pid, child);

    enforce_timeout(pid, std::time::Duration::from_secs(30), (*tracker).clone());

    Ok(())
}

#[tauri::command]
fn open_printmgr(
    target_state: tauri::State<AppState>,
    tracker: tauri::State<Arc<ProcessTracker>>
    ) -> Result<(), String> {
    let t = target_state.target_machine.lock().map_err(|e| e.to_string())?;
    if t.trim().is_empty() {
        return Err("No target machine set".into());
    }
    let computer_arg = format!("/computer:{}", t);
    println!("Opening Print Management at: {}", t);

    let child = std::process::Command::new("mmc.exe")
        .arg("printmanagement.msc")
        .arg(computer_arg)
        .spawn()
        .map_err(|e| format!("Failed to open Print Management: {}", e))?;

    let pid = child.id();

    tracker
        .processes
        .lock()
        .unwrap()
        .insert(pid, child);

    enforce_timeout(pid, std::time::Duration::from_secs(30), (*tracker).clone());

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let process_tracker = Arc::new(ProcessTracker {
        processes: Mutex::new(HashMap::new()),
    });

    let app = tauri::Builder::default()
        .manage(AppState {
            target_machine: Mutex::new(String::new()),
        })
        .manage(process_tracker.clone())
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
            open_devicemgr,
            get_ipconfig,
            open_aduc,
            issue_restart,
            issue_shutdown,
            open_dhcp,
            open_dns,
            open_gpu,
            open_perfmon,
            open_printmgr
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(move |_app_handle, event| {
        if let tauri::RunEvent::ExitRequested { api: _, .. } = event {
            let mut processes = process_tracker.processes.lock().unwrap();
            for (pid, mut child) in processes.drain() {
                println!("Gracefully terminating process {} on shutdown.", pid);
                let _ = child.kill();
            }
        }
    });
}



