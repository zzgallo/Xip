import { useState } from "react";
import { FaSearch, FaCog, FaTerminal } from "react-icons/fa";
import "./App.css";

function App() {
  const [activeSection, setActiveSection] = useState("dashboard");

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="search-bar">
          <FaSearch className="icon" />
          <input type="text" className="search-input" placeholder="Search..." />
        </div>

        <div className="target-machine">
          <input type="text" placeholder="Enter machine name or IP" className="machine-input" />
          <button className="machine-submit">Submit</button>
        </div>

        <div className="navbar-icons">
          <FaCog className="icon" />
        </div>
      </nav>

      <div className="content-container">
        {/* Sidebar */}
        <aside className="sidebar">
        <img src="/xiplogo.png" alt="Xip Logo" className="sidebar-logo" />

          <ul>
            <li onClick={() => setActiveSection("dashboard")}>Dashboard</li>
            <li onClick={() => setActiveSection("system")}>System</li>
            <li onClick={() => setActiveSection("network")}>Network</li>
            <li onClick={() => setActiveSection("active_directory")}>Active Directory</li>
            <li onClick={() => setActiveSection("disk_drives")}>Disk Drives</li>
            <li onClick={() => setActiveSection("p1")}>P1</li>
            <li onClick={() => setActiveSection("p2")}>p2</li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {activeSection === "dashboard" && (
            <>
              <h1 className="dashboard-title">Dashboard</h1>
              <div className="stats-container">
                <div className="stat-card">System Uptime: 5h 12m</div>
                <div className="stat-card">CPU Usage: 23%</div>
                <div className="stat-card">Memory Usage: 68%</div>
                <div className="stat-card">Ping: -- ms</div>
                <div className="stat-card">OS Version: --</div>
                <div className="stat-card">Current User: --</div>
              </div>
            </>
          )}

          {activeSection === "system" && (
            <div className="xip-section">
              <h1>System</h1>
              <div className="xip-action-grid">
                <button className="xip-action-button">View Processes</button>
                <button className="xip-action-button">Restart System</button>
                <button className="xip-action-button">Shutdown System</button>
                <button className="xip-action-button">View Installed Apps</button>
              </div>
            </div>
          )}

          {activeSection === "network" && (
            <div className="xip-section">
              <h1>Network</h1>
              <div className="xip-action-grid">
                <button className="xip-action-button">Ping Machine</button>
                <button className="xip-action-button">Check IP Config</button>
                <button className="xip-action-button">Trace Route</button>
                <button className="xip-action-button">Check Open Ports</button>
              </div>
            </div>
          )}

          {activeSection === "active_directory" && (
            <div className="xip-section">
              <h1>Active Directory</h1>
              <div className="xip-action-grid">
                <button className="xip-action-button">List Users</button>
                <button className="xip-action-button">List Groups</button>
                <button className="xip-action-button">Reset Password</button>
                <button className="xip-action-button">Create User</button>
              </div>
            </div>
          )}

          {activeSection === "logs" && (
            <div className="xip-section">
              <h1>Logs</h1>
              <div className="xip-action-grid">
                <button className="xip-action-button">View System Logs</button>
                <button className="xip-action-button">View Security Logs</button>
                <button className="xip-action-button">Clear Logs</button>
              </div>
            </div>
          )}

          {/* Terminal Panel */}
          <div className="terminal-panel">
            <div className="terminal-header">
              <FaTerminal className="icon" />
              <span>Terminal Output</span>
            </div>
            <div className="terminal-output">
              <p> Command executed...</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
