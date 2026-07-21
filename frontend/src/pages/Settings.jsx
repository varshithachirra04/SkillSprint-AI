import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import Sidebar from "../components/Sidebar";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const { addToast } = useToast();

  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [reminders, setReminders] = useState(true);
  const [sessionAlerts, setSessionAlerts] = useState(true);

  function handleSave(e) {
    e.preventDefault();
    addToast("⚙️ Settings saved successfully!", "success");
  }

  function triggerPwaInstall() {
    addToast("PWA Install triggered! Look at browser search/address bar.", "info");
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="page-main">
        <div className="page-header">
          <span className="section-eyebrow">Customize your dashboard</span>
          <h1>Settings</h1>
        </div>

        <div className="card">
          <h2>Application Preferences</h2>
          <form onSubmit={handleSave} className="settings-form">
            <div className="settings-section">
              <h3>Display Theme</h3>
              <div className="theme-setting-row">
                <span>Current Theme: <strong>{theme === "dark" ? "Dark Mode" : "Light Mode"}</strong></span>
                <button type="button" className="btn-secondary" style={{ width: "auto" }} onClick={toggle}>
                  Toggle Theme {theme === "dark" ? "☀️" : "🌙"}
                </button>
              </div>
            </div>

            <div className="settings-section">
              <h3>Notifications & Reminders</h3>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={reminders}
                  onChange={(e) => setReminders(e.target.checked)}
                />
                <span className="checkbox-label">
                  <strong>Daily Reminders</strong>
                  <span className="checkbox-subtext">Send push alerts if I haven't completed my sessions by 6:00 PM.</span>
                </span>
              </label>

              <label className="checkbox-field" style={{ marginTop: 16 }}>
                <input
                  type="checkbox"
                  checked={sessionAlerts}
                  onChange={(e) => setSessionAlerts(e.target.checked)}
                />
                <span className="checkbox-label">
                  <strong>Pomodoro Sounds</strong>
                  <span className="checkbox-subtext">Play a gentle chime when focus and break periods end.</span>
                </span>
              </label>
            </div>

            <div className="settings-section">
              <h3>Install Offline App</h3>
              <p className="settings-subtext">
                SkillSprint can be installed on your desktop or phone to run as a full app, even when offline.
              </p>
              <button type="button" className="btn-secondary" style={{ width: "auto" }} onClick={triggerPwaInstall}>
                📥 Install SkillSprint App
              </button>
            </div>

            <div className="settings-section">
              <h3>Account Information</h3>
              <div className="account-info-fields">
                <div className="field">
                  <label>Name</label>
                  <input value={user?.name || ""} disabled />
                </div>
                <div className="field">
                  <label>Email Address</label>
                  <input value={user?.email || ""} disabled />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: 12 }}>
              Save Settings
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
