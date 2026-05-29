import { Link, useLocation, useNavigate } from "react-router-dom";

import DashboardIcon from "../icons/DashboardIcon";
import TeamsIcon from "../icons/TeamsIcon";
import AthletesIcon from "../icons/AthletesIcon";
import TrainingsIcon from "../icons/TrainingsIcon";
import MatchesIcon from "../icons/MatchesIcon";
import MessagesIcon from "../icons/MessagesIcon";
import AnalyticsIcon from "../icons/AnalyticsIcon";

import { clearSession, getClubName, getStoredClubs } from "../utils/club";

import "./layout.css";

export default function MainLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const clubName = getClubName();

  const menu = [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { label: "Teams", path: "/teams", icon: <TeamsIcon /> },
    { label: "Athletes", path: "/athletes", icon: <AthletesIcon /> },
    { label: "Trainings", path: "/trainings", icon: <TrainingsIcon /> },
    { label: "Matches", path: "/matches", icon: <MatchesIcon /> },
    { label: "Messages", path: "/messages", icon: <MessagesIcon /> },
    { label: "Analytics", path: "/analytics", icon: <AnalyticsIcon /> },
  ];

  const logout = () => {
    clearSession();
    navigate("/");
  };

  const switchClub = () => {
    if (getStoredClubs().length > 1) {
      localStorage.removeItem("clubId");
      localStorage.removeItem("clubName");
      localStorage.removeItem("clubRole");
      navigate("/choose-club");
    }
  };

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <h2 className="logo">MyTeam</h2>
        <p className="club-label">{clubName}</p>

        <nav className="menu">
          {menu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={
                location.pathname === item.path ||
                location.pathname.startsWith(`${item.path}/`)
                  ? "menu-item active"
                  : "menu-item"
              }
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link
            to="/settings"
            className={
              location.pathname === "/settings" ? "menu-item active" : "menu-item"
            }
          >
            Settings
          </Link>
          {getStoredClubs().length > 1 && (
            <button type="button" className="sidebar-btn" onClick={switchClub}>
              Switch Club
            </button>
          )}
          <button type="button" className="sidebar-btn logout" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
