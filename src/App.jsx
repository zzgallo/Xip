import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  FaTachometerAlt,
  FaDesktop,
  FaNetworkWired,
  FaUserAlt,
} from "react-icons/fa";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./App.css";
import SidebarButton from "./SidebarButton";

const ResponsiveGridLayout = WidthProvider(Responsive);

function App() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [terminalOutput, setTerminalOutput] = useState("Command executed...");
  const [target, setTarget] = useState("");
  
  // Default layouts for each section
  const [layouts, setLayouts] = useState({
    system: {
      lg: [
        { i: "actions", x: 0, y: 0, w: 6, h: 13, minW: 3, minH: 4 },
        { i: "terminal", x: 6, y: 0, w: 6, h: 13, minW: 3, minH: 4 },
        { i: "info1", x: 0, y: 8, w: 6, h: 13, minW: 3, minH: 3 },
        { i: "info2", x: 6, y: 8, w: 6, h: 13, minW: 3, minH: 3 }
      ]
    },
    network: {
      lg: [
        { i: "actions", x: 0, y: 0, w: 6, h: 13, minW: 3, minH: 4 },
        { i: "terminal", x: 6, y: 0, w: 6, h: 13, minW: 3, minH: 4 },
        { i: "info1", x: 0, y: 8, w: 6, h: 13, minW: 3, minH: 3 },
        { i: "info2", x: 6, y: 8, w: 6, h: 13, minW: 3, minH: 3 }
      ]
    },
    active_directory: {
      lg: [
        { i: "actions", x: 0, y: 0, w: 6, h: 13, minW: 3, minH: 4 },
        { i: "terminal", x: 6, y: 0, w: 6, h: 13, minW: 3, minH: 4 },
        { i: "info1", x: 0, y: 8, w: 6, h: 13, minW: 3, minH: 3 },
        { i: "info2", x: 6, y: 8, w: 6, h: 13, minW: 3, minH: 3 }
      ]
    }
  });

  const handleSetTarget = async () => {
    try {
      await invoke("set_target", { target });
      setTerminalOutput(`Target set: ${target}`);
    } catch (error) {
      setTerminalOutput(`Failed to set target: ${error}`);
    }
  };

  const handlePing = async () => {
    try {
      setTerminalOutput("Pinging...");
      const result = await invoke("ping");
      setTerminalOutput(result);
    } catch (error) {
      setTerminalOutput(`Ping error: ${error}`);
    }
  };

  const handleTestCurrentUser = async () => {
    try {
      const user = await invoke("get_current_user");
      setTerminalOutput(`Current user: ${user}`);
    } catch (error) {
      setTerminalOutput(`Error: ${error}`);
    }
  };

  // Handle layout changes
  const onLayoutChange = (layout, layouts) => {
    // Save the new layout for the current section
    setLayouts(prevLayouts => ({
      ...prevLayouts,
      [activeSection]: layouts
    }));
  };

  // Content for interactive grid sections:
  const systemActionButtons = (
    <div className="xip-action-grid">
      <h3 className="panel-title">System Actions</h3>
      <button className="xip-action-button">Local Users</button>
      <button className="xip-action-button">Local Groups</button>
      <button className="xip-action-button">Shares</button>
      <button className="xip-action-button">C$</button>
      <button className="xip-action-button">Event Viewer</button>
      <button className="xip-action-button">Services</button>
      <button className="xip-action-button">Computer Mgmt</button>
    </div>
  );

  const networkActionButtons = (
    <div className="xip-action-grid">
      <h3 className="panel-title">Network Actions</h3>
      <button className="xip-action-button" onClick={handlePing}>
        Ping Machine
      </button>
      <button className="xip-action-button">Check IP Config</button>
      <button className="xip-action-button">Trace Route</button>
      <button className="xip-action-button">Open Ports</button>
      <button className="xip-action-button" onClick={handleTestCurrentUser}>
        Test Current User
      </button>
    </div>
  );

  const adActionButtons = (
    <div className="xip-action-grid">
      <h3 className="panel-title">Active Directory Actions</h3>
      <button className="xip-action-button">List Users</button>
      <button className="xip-action-button">List Groups</button>
      <button className="xip-action-button">Reset Password</button>
      <button className="xip-action-button">Create User</button>
      <button className="xip-action-button">Sync Status</button>
    </div>
  );

  // Terminal panel (common for all interactive sections)
  const terminalPanel = (
    <div className="terminal-panel">
      <h3 className="panel-title">Terminal Output</h3>
      <div className="terminal-output">
        <pre>{terminalOutput}</pre>
      </div>
    </div>
  );

  // Extra information panels
  const renderInfoPanel1 = () => {
    if (activeSection === "system") {
      return (
        <div className="info-panel">
          <h3 className="panel-title">System Information</h3>
          <div className="info-content">
            <p>OS: Windows Server 2019</p>
            <p>CPU: Intel Xeon E5-2680 v4</p>
            <p>Memory: 32GB DDR4</p>
            <p>Disk: 500GB SSD</p>
          </div>
        </div>
      );
    } else if (activeSection === "network") {
      return (
        <div className="info-panel">
          <h3 className="panel-title">Network Status</h3>
          <div className="info-content">
            <p>IP Address: 192.168.1.100</p>
            <p>Subnet Mask: 255.255.255.0</p>
            <p>Gateway: 192.168.1.1</p>
            <p>DNS: 8.8.8.8, 8.8.4.4</p>
          </div>
        </div>
      );
    } else if (activeSection === "active_directory") {
      return (
        <div className="info-panel">
          <h3 className="panel-title">AD Domain Information</h3>
          <div className="info-content">
            <p>Domain: example.local</p>
            <p>Forest Functional Level: 2016</p>
            <p>Domain Controllers: 2</p>
            <p>Total Users: 256</p>
          </div>
        </div>
      );
    }
  };

  const renderInfoPanel2 = () => {
    if (activeSection === "system") {
      return (
        <div className="info-panel">
          <h3 className="panel-title">System Performance</h3>
          <div className="info-content">
            <p>CPU Usage: 23%</p>
            <p>Memory Usage: 68%</p>
            <p>Disk I/O: 12MB/s</p>
            <p>Uptime: 5d 12h 34m</p>
          </div>
        </div>
      );
    } else if (activeSection === "network") {
      return (
        <div className="info-panel">
          <h3 className="panel-title">Network Traffic</h3>
          <div className="info-content">
            <p>Upload: 1.2 MB/s</p>
            <p>Download: 5.7 MB/s</p>
            <p>Active Connections: 32</p>
            <p>Packets Lost: 0.1%</p>
          </div>
        </div>
      );
    } else if (activeSection === "active_directory") {
      return (
        <div className="info-panel">
          <h3 className="panel-title">Recent AD Events</h3>
          <div className="info-content">
            <p>Last Password Change: 2h ago</p>
            <p>Group Policy Update: 4h ago</p>
            <p>New User Accounts: 3 today</p>
            <p>Account Lockouts: 1 today</p>
          </div>
        </div>
      );
    }
  };

  // Render grid layout for the current section
  const renderGridContent = () => {
    if (activeSection === "dashboard") {
      return (
        <div className="xip-section" key="dashboard">
          <h1 className="dashboard-title">Dashboard</h1>
          <div className="stats-container">
            <div className="stat-card">System Uptime: 5h 12m</div>
            <div className="stat-card">CPU Usage: 23%</div>
            <div className="stat-card">Memory Usage: 68%</div>
            <div className="stat-card">OS Version: --</div>
            <div className="stat-card">Current User: --</div>
          </div>
        </div>
      );
    }

    // Get the grid items for the current section
    const gridItems = {
      system: {
        actions: systemActionButtons,
        terminal: terminalPanel,
        info1: renderInfoPanel1(),
        info2: renderInfoPanel2(),
      },
      network: {
        actions: networkActionButtons,
        terminal: terminalPanel,
        info1: renderInfoPanel1(),
        info2: renderInfoPanel2(),
      },
      active_directory: {
        actions: adActionButtons,
        terminal: terminalPanel,
        info1: renderInfoPanel1(),
        info2: renderInfoPanel2(),
      },
    };

    return (
      <div className="grid-container">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts[activeSection]}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={30}
          onLayoutChange={onLayoutChange}
          isDraggable={true}
          isResizable={true}
          margin={[10, 10]}
          containerPadding={[15, 15]}
          draggableHandle=".panel-title"
        >
          <div key="actions" className="grid-item">
            {gridItems[activeSection].actions}
          </div>
          <div key="terminal" className="grid-item">
            {gridItems[activeSection].terminal}
          </div>
          <div key="info1" className="grid-item">
            {gridItems[activeSection].info1}
          </div>
          <div key="info2" className="grid-item">
            {gridItems[activeSection].info2}
          </div>
        </ResponsiveGridLayout>
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="content-container">
        <aside className="sidebar">
          <img src="/logoseal.png" alt="logo" className="sidebar-logo" />
          <SidebarButton
            active={activeSection === "dashboard"}
            onClick={() => setActiveSection("dashboard")}
            icon={FaTachometerAlt}
            label="Dashboard"
          />
          <SidebarButton
            active={activeSection === "system"}
            onClick={() => setActiveSection("system")}
            icon={FaDesktop}
            label="System"
          />
          <SidebarButton
            active={activeSection === "network"}
            onClick={() => setActiveSection("network")}
            icon={FaNetworkWired}
            label="Network"
          />
          <SidebarButton
            active={activeSection === "active_directory"}
            onClick={() => setActiveSection("active_directory")}
            icon={FaUserAlt}
            label="Active Directory"
          />
        </aside>
        <main className="main-content">
          <div className="target-machine-field" style={{ margin: "20px", padding: "10px" }}>
            <input
              type="text"
              placeholder="Enter machine name or IP"
              className="machine-input"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <button className="machine-submit" onClick={handleSetTarget}>
              Submit
            </button>
          </div>
          {/* New special header container */}
          <div className="special-header-container">
  {/* SVG shape for the header */}
  <svg
    className="tab-shape"
    viewBox="0 0 900 158"
    preserveAspectRatio="xMidYMax meet"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M -95,200 C 80,120 120,50 190,20 H 898 V 200 Z"
      fill="#252422"
      stroke="#EB5E28"
      strokeWidth="4"
    />
  </svg>

  {/* Quick-action buttons overlaid on top of the SVG */}
  <div className="quick-actions">
  <SidebarButton label="Action 1" onClick={() => {}} />
  <SidebarButton label="Action 2" onClick={() => {}} />
  <SidebarButton label="Action 3" onClick={() => {}} />
  </div>
</div>

          {renderGridContent()}
        </main>
      </div>
    </div>
  );
}

export default App;