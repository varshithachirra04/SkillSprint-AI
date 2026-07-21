import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const NAV_ITEMS = [
  { to: "/",            label: "Dashboard",   icon: "▲" },
  { to: "/analytics",   label: "Analytics",   icon: "◈" },
  { to: "/quiz",        label: "Quiz",        icon: "◇" },
  { to: "/tools",       label: "AI Tools",    icon: "◎" },
  { to: "/chat",        label: "Study AI",    icon: "◉" },
  { to: "/leaderboard", label: "Leaderboard", icon: "◆" },
  { to: "/settings",    label: "Settings",    icon: "◈" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand" onClick={() => navigate("/")}>
        <div className="brand-icon">⚡</div>
        <span>Skill<span className="brand-accent">Sprint</span></span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={toggle} title="Toggle theme">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <div className="sidebar-user">
          <span className="sidebar-user-name">{user?.name}</span>
          <button className="btn-link sidebar-logout" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
