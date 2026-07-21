import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <div className="topbar">
      <div className="brand">
        Skill<span className="brand-mark">Sprint</span>
      </div>
      <div className="topbar-actions">
        <span>{user?.name}</span>
        <button className="btn-link" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}
