import React from "react";
import "./SettingsSection.css";

const SettingsSection = () => {
  const handleSaveSettings = () => {
    alert("Settings saved!");
  };

  return (
    <div className="settings-section">
      {/* Save Button Positioned to Top Right */}
      <button className="settings-save-button" onClick={handleSaveSettings}>
        Save Settings
      </button>

      <h1 className="settings-title">Settings</h1>
    </div>
  );
};

export default SettingsSection;
