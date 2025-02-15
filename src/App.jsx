import { useState } from "react";
import { 
  FaSearch, FaCog, FaTerminal, 
  FaTachometerAlt, FaDesktop, FaNetworkWired, FaUserAlt 
} from "react-icons/fa";
import "./App.css";

function App() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(true);

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <div className="search-bar">
            <FaSearch className="icon" />
            <input type="text" className="search-input" placeholder="Search..." />
          </div>

          <div className="target-machine">
            <input type="text" placeholder="Enter machine name or IP" className="machine-input" />
            <button className="machine-submit">Submit</button>
          </div>
        </div>

        <div className="navbar-right">
          <FaCog className="icon settings-icon" />
          <img src="/profile.png" alt="Profile" className="profile-pic" />
        </div>
      </nav>

      <div className="content-container">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
          <img src="/logoseal.png" alt="logo" className="sidebar-logo" />
          <ul>
            <li 
              className={activeSection === "dashboard" ? "active-item" : ""}
              onClick={() => setActiveSection("dashboard")}
            >
              <FaTachometerAlt className="sidebar-icon" /> 
              {sidebarOpen && "Dashboard"}
            </li>
            <li 
              className={activeSection === "system" ? "active-item" : ""}
              onClick={() => setActiveSection("system")}
            >
              <FaDesktop className="sidebar-icon" /> 
              {sidebarOpen && "System"}
            </li>
            <li 
              className={activeSection === "network" ? "active-item" : ""}
              onClick={() => setActiveSection("network")}
            >
              <FaNetworkWired className="sidebar-icon" /> 
              {sidebarOpen && "Network"}
            </li>
            <li 
              className={activeSection === "active_directory" ? "active-item" : ""}
              onClick={() => setActiveSection("active_directory")}
            >
              <FaUserAlt className="sidebar-icon" /> 
              {sidebarOpen && "Active Directory"}
            </li>
          </ul>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "<<" : ">>"}
          </button>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {activeSection === "dashboard" && (
            <div className="xip-section" key={activeSection}>
              <h1 className="dashboard-title">Dashboard</h1>
              <div className="stats-container">
                <div className="stat-card">System Uptime: 5h 12m</div>
                <div className="stat-card">CPU Usage: 23%</div>
                <div className="stat-card">Memory Usage: 68%</div>
                <div className="stat-card">OS Version: --</div>
                <div className="stat-card">Current User: --</div>
              </div>
            </div>
          )}

          {activeSection === "system" && (
            <div className="xip-section" key={activeSection}>
              <h1>Hardware</h1>
              <div className="xip-action-grid">
                <button className="xip-action-button">Hardware Info</button>
                <button className="xip-action-button">Printers</button>
                <button className="xip-action-button">USB Devices</button>
                <button className="xip-action-button">Restart System</button>
                <button className="xip-action-button">Shutdown System</button>
              </div>
              <h1>System Management</h1>
              <div className="xip-action-grid">
                <button className="xip-action-button">Local Users</button>
                <button className="xip-action-button">Local Groups</button>
                <button className="xip-action-button">Shares</button>
                <button className="xip-action-button">C$</button>
                <button className="xip-action-button">Event Viewer</button>
                <button className="xip-action-button">Services</button>
                <button className="xip-action-button">Computer Mgmt</button>
              </div>
            </div>
          )}

          {activeSection === "network" && (
            <div className="xip-section" key={activeSection}>
              <h1>Network</h1>
              <div className="xip-action-grid">
                <button className="xip-action-button">Ping Machine</button>
                <button className="xip-action-button">Check IP Config</button>
                <button className="xip-action-button">Trace Route</button>
                <button className="xip-action-button">Check Open Ports</button>
                <button className="xip-action-button">SMPT Telnet Test</button>
              </div>
            </div>
          )}

          {activeSection === "active_directory" && (
            <div className="xip-section" key={activeSection}>
              <h1>Active Directory</h1>
              <div className="xip-action-grid">
                <button className="xip-action-button">List Users</button>
                <button className="xip-action-button">List Groups</button>
                <button className="xip-action-button">Reset Password</button>
                <button className="xip-action-button">Create User</button>
                <button className="xip-action-button">Sync Status</button>
              </div>
            </div>
          )}

          {/* Terminal Panel */}
          <div className="terminal-panel-container" key="terminal">
            <div
              className="terminal-panel-header"
              onClick={() => setTerminalOpen(!terminalOpen)}
            >
              <div className="terminal-title">
                <FaTerminal className="icon" />
                <span>Terminal Output</span>
              </div>
              <button className="terminal-toggle">
                {terminalOpen ? "Collapse" : "Expand"}
              </button>
            </div>
            <div
              className="terminal-panel"
              style={{ maxHeight: terminalOpen ? "200px" : "0px" }}
            >
              <div className="terminal-output">
                <p>Command executed...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
