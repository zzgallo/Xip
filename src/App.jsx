import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  FaTachometerAlt,
  FaDesktop,
  FaNetworkWired,
  FaUserAlt,
  FaTasks,
  FaPowerOff,
  FaUndo,
  FaPodcast,
  FaCogs,
} from "react-icons/fa";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./App.css";
import SidebarButton from "./SidebarButton";
import SettingsSection from "./SettingsSection";
const ResponsiveGridLayout = WidthProvider(Responsive);

function App() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [terminalOutput, setTerminalOutput] = useState("Ready");
  const [target, setTarget] = useState("");
  
  // Default layouts for each section
  const [layouts, setLayouts] = useState({
    system: {
      lg: [
        { i: "actions", x: 0, y: 0, w: 3, h: 13, minW: 3, minH: 4 },
        { i: "terminal", x: 6, y: 0, w: 9, h: 13, minW: 3, minH: 4 },
        { i: "info1", x: 0, y: 8, w: 6, h: 8, minW: 3, minH: 3 },
        { i: "info2", x: 6, y: 8, w: 6, h: 8, minW: 3, minH: 3 }
      ]
    },
    network: {
      lg: [
        { i: "actions", x: 0, y: 0, w: 3, h: 13, minW: 3, minH: 4 },
        { i: "terminal", x: 6, y: 0, w: 9, h: 13, minW: 3, minH: 4 },
        { i: "info1", x: 0, y: 8, w: 6, h: 8, minW: 3, minH: 3 },
        { i: "info2", x: 6, y: 8, w: 6, h: 8, minW: 3, minH: 3 }
      ]
    },
    active_directory: {
      lg: [
        { i: "actions", x: 0, y: 0, w: 3, h: 13, minW: 3, minH: 4 },
        { i: "terminal", x: 6, y: 0, w: 9, h: 13, minW: 3, minH: 4 },
        { i: "info1", x: 0, y: 8, w: 6, h: 8, minW: 3, minH: 3 },
        { i: "info2", x: 6, y: 8, w: 6, h: 8, minW: 3, minH: 3 }
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

  const handleRestart = async () => {
    if (!window.confirm("Are you sure you want to RESTART the remote machine?")) {
      return; // 
    }
    try {
      setTerminalOutput("Restarting target machine...");
      const result = await invoke("issue_restart");
      setTerminalOutput(result);
    } catch (error) {
      setTerminalOutput(`Restart error: ${error}`);
    }
  };

  const handleShutdown = async () => {
    if (!window.confirm("Are you sure you want to SHUTDOWN the remote machine?")) {
      return; // 
    }
    try {
      setTerminalOutput("Shutting down target machine...");
      const result = await invoke("issue_shutdown");
      setTerminalOutput(result);
    } catch (error) {
      setTerminalOutput(`Shutdown error: ${error}`);
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

  // Open C$
  const handleOpenCShare = async () => {
    try {
      await invoke("open_c_share");
    } catch (error) {
      setTerminalOutput('Error Opening C$: ${error}')
    }
  };

  // Show Ipconfig /all
  const handleGetIPConfig = async () => {
    try {
      const ipconfig = await invoke("get_ipconfig");
      setTerminalOutput(`${ipconfig}`);
    } catch (error) {
      setTerminalOutput(`Error: ${error}`);
    }
  };

  // Open lusrmgr.msc
  const handleOpenUsersGroups = async () => {
    try {
      await invoke("open_lusrmgr");
    } catch (error) {
      console.error("Error from open_lusrmgr:", error);
      setTerminalOutput(`Error Opening Users & Groups: ${error.toString()}`);
    }
  };
  ;

  // Open Shares
  const handleOpenShares = async () => {
    try {
      await invoke("open_shares");
    } catch (error) {
      setTerminalOutput(`Error Opening Shares: ${error.toString()}`);
    }
  };

  // Open Services
  const handleOpenServices = async () => {
    try {
      await invoke("open_services");
    } catch (error) {
      console.error("Error from open_services:", error);
      setTerminalOutput(`Error Opening Services: ${error.toString()}`);
    }
  }

  // Open Event Viewer
  const handleOpenEventViewer = async () => {
    try {
      await invoke("open_eventvwr");
    } catch (error) {
      console.error("Error from open_eventvwr:", error);
      setTerminalOutput(`Error Opening Event Viewer: ${error.toString()}`);
    }
  }

  // Open Computer Management
  const handleOpenCompMgmt = async () => {
    try {
      await invoke("open_compmgmt");
    } catch (error) {
      console.error("Error from open_compmgmt:", error);
      setTerminalOutput(`Error Opening Computer Management: ${error.toString()}`);
    }
  }

  const handleOpenDevicemgr = async () => {
    try {
      await invoke("open_devicemgr");
    } catch (error) {
      console.error("Error from open_devicemgr:", error);
      setTerminalOutput(`Error Opening Device Manager: ${error.toString()}`);
    }
  }

  const handleOpenADUC = async () => {
    try {
      await invoke("open_aduc");
    } catch (error) {
        console.error("Error from open_aduc:", error);
        setTerminalOutput(`Error Opening Active Directory: ${error.toString()}`);
      }
    }

    const handleOpenDHCP = async () => {
      try {
        await invoke("open_dhcp");
      } catch (error) {
          console.error("Error from open_dhcp:", error);
          setTerminalOutput(`Error Opening DHCP: ${error.toString()}`);
        }
      }

      const handleOpenDNS = async () => {
        try {
          await invoke("open_dns");
        } catch (error) {
            console.error("Error from open_dns:", error);
            setTerminalOutput(`Error Opening DNS: ${error.toString()}`);
          }
        }

      const handleOpenGPU = async () => {
        try {
          await invoke("open_gpu");
        } catch (error) {
            console.error("Error from open_gpu:", error);
            setTerminalOutput(`Error Opening Group Policy: ${error.toString()}`);
          }
        }

      const handleOpenPerfMon = async () => {
        try {
          await invoke("open_perfmon");
        } catch (error) {
            console.error("Error from open_perfmon:", error);
            setTerminalOutput(`Error Opening Performance Monitor: ${error.toString()}`);
          }
        }
      const handleOpenPrintMGR = async () => {
        try {
          await invoke("open_printmgr");
        } catch (error) {
            console.error("Error from open_printmgr:", error);
            setTerminalOutput(`Error Opening Print Management: ${error.toString()}`);
          }
        } 
        
      
  
  // Content for interactive grid sections:
  const systemActionButtons = (
    <div className="xip-action-grid">
      <h3 className="panel-title">System Actions</h3>
      <button className="xip-action-button" onClick={handleOpenUsersGroups}>Local Users & Groups</button>
      <button className="xip-action-button" onClick={handleTestCurrentUser}>
        Get Current User
      </button>
      <button className="xip-action-button" onClick={handleOpenDevicemgr}>Device Manager</button>
      <button className="xip-action-button" onClick={handleOpenShares}>Shares</button>
      <button className="xip-action-button" onClick={handleOpenCShare}>C$</button>
      <button className="xip-action-button" onClick={handleOpenEventViewer}>Event Viewer</button>
      <button className="xip-action-button" onClick={handleOpenServices}>Services</button>
      <button className="xip-action-button" onClick={handleOpenCompMgmt}>Computer Management</button>
      <button className="xip-action-button" onClick={handleOpenPerfMon}>Performance Monitor</button>
      <button className="xip-action-button" onClick={handleOpenPrintMGR}>Print Manangement</button>
    </div>
  );

  const networkActionButtons = (
    <div className="xip-action-grid">
      <h3 className="panel-title">Network Actions</h3>
      <button className="xip-action-button" onClick={handlePing}>
        Ping Machine
      </button>
      <button className="xip-action-button" onClick={handleGetIPConfig}>Check IP Config</button>
      <button className="xip-action-button">Trace Route</button>
      <button className="xip-action-button">Open Ports</button>
      <button className="xip-action-button" onClick={handleOpenDHCP}>Open DHCP</button>
      <button className="xip-action-button" onClick={handleOpenDNS}>Open DNS</button>
      <button className="xip-action-button" onClick={handleOpenGPU}>Open Group Policy</button>

    </div>
  );

  const adActionButtons = (
    <div className="xip-action-grid">
      <h3 className="panel-title">Active Directory Actions</h3>
      <button className="xip-action-button" onClick={handleOpenADUC}>Active Directory Users & Computers</button>
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
            <p>OS: null</p>
            <p>CPU: null</p>
            <p>Memory: null</p>
            <p>Disk: null</p>
          </div>
        </div>
      );
    } else if (activeSection === "network") {
      return (
        <div className="info-panel">
          <h3 className="panel-title">Network Status</h3>
          <div className="info-content">
            <p>IP Address: null</p>
            <p>Subnet Mask: null</p>
            <p>Gateway: null</p>
            <p>DNS: null</p>
          </div>
        </div>
      );
    } else if (activeSection === "active_directory") {
      return (
        <div className="info-panel">
          <h3 className="panel-title">AD Domain Information</h3>
          <div className="info-content">
            <p>Domain: null</p>
            <p>null</p>
            <p>null</p>
            <p>null</p>
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
            <p>CPU Usage: null</p>
            <p>Memory Usage: null</p>
            <p>Disk I/O: null</p>
            <p>Uptime: null</p>
          </div>
        </div>
      );
    } else if (activeSection === "network") {
      return (
        <div className="info-panel">
          <h3 className="panel-title">Network Traffic</h3>
          <div className="info-content">
            <p>Upload: null</p>
            <p>Download: null</p>
            <p>Active Connections: null</p>
            <p>Packets Lost: null</p>
          </div>
        </div>
      );
    } else if (activeSection === "active_directory") {
      return (
        <div className="info-panel">
          <h3 className="panel-title">Recent AD Events</h3>
          <div className="info-content">
            <p>Last Password Change: null</p>
            <p>Group Policy Update: null</p>
            <p>New User Accounts: null</p>
            <p>Account Lockouts: null</p>
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
    } else if (activeSection === "install") {
      return (
        <div className="xip-section" key="dashboard">
          <h1 className="install-title">Install</h1>
        </div>
      );
    } else if (activeSection === "settings" ) {
      return <SettingsSection key="settings" />;
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
          <SidebarButton
            active={activeSection === "install"}
            onClick={() => setActiveSection("install")}
            icon={FaTasks}
            label="Install"
          />
          <hr style={{
            border: 'none',
            height: '2px',
            backgroundColor: '#CCC5B9',
            margin: '15px'
          }} />

      <div className="bottom-buttons">
      <SidebarButton
            active={activeSection === "settings"}
            onClick={() => setActiveSection("settings")}
            icon={FaCogs}
            label="Settings"
  />
      </div>
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
  <SidebarButton
            active={activeSection === "install"}
            onClick={handlePing}
            icon={FaPodcast}
            label="Ping"
  />
  <SidebarButton
            active={activeSection === "install"}
            onClick={handleRestart}
            icon={FaUndo}
            label="Restart"
  />
  <SidebarButton
            active={activeSection === "install"}
            onClick={handleShutdown}
            icon={FaPowerOff}
            label="Shutdown"  
  />          
      </div>
</div>

          {renderGridContent()}
        </main>
      </div>
    </div>
  );
}

export default App;