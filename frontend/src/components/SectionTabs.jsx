import { NavLink } from "react-router-dom";

export default function SectionTabs() {
  return (
    <div className="nav-tabs">
      <NavLink to="/" end className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}>
        Planner
      </NavLink>
      <NavLink to="/chat" className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}>
        Study Doubts
      </NavLink>
    </div>
  );
}
