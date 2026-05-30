import { Link, useLocation, useNavigate } from "react-router-dom";

import DashboardIcon from "../icons/DashboardIcon";
import TeamsIcon from "../icons/TeamsIcon";
import AthletesIcon from "../icons/AthletesIcon";
import TrainingsIcon from "../icons/TrainingsIcon";
import MatchesIcon from "../icons/MatchesIcon";
import MessagesIcon from "../icons/MessagesIcon";
import AnalyticsIcon from "../icons/AnalyticsIcon";

import { clearSession, getClubName, getStoredClubs } from "../utils/club";
import useClubRole from "../hooks/useClubRole";
import ThemeToggle from "../components/ThemeToggle";
import { t } from "../i18n/el";

import "./layout.css";

export default function MainLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const clubName = getClubName();
  const { role, isAdmin, isAthlete, ready } = useClubRole();

  const menu = [{ label: t("dashboard"), path: "/dashboard", icon: <DashboardIcon /> }];

  menu.push({ label: t("calendar"), path: "/calendar", icon: <TrainingsIcon /> });

  if (!isAthlete) {
    menu.push(
      { label: t("teams"), path: "/teams", icon: <TeamsIcon /> },
      { label: t("athletes"), path: "/athletes", icon: <AthletesIcon /> }
    );
    if (ready && isAdmin) {
      menu.push({ label: t("staff"), path: "/staff", icon: <AthletesIcon /> });
    }
  } else {
    menu.push({ label: t("myProfile"), path: "/my-profile", icon: <AthletesIcon /> });
  }

  menu.push(
    { label: t("trainings"), path: "/trainings", icon: <TrainingsIcon /> },
    { label: t("matches"), path: "/matches", icon: <MatchesIcon /> },
    { label: t("messages"), path: "/messages", icon: <MessagesIcon /> }
  );

  if (!isAthlete) {
    menu.push({ label: t("analytics"), path: "/analytics", icon: <AnalyticsIcon /> });
  }

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
        <p className="club-label">
          {clubName}
          {role ? ` · ${role}` : ready ? "" : " · …"}
        </p>

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
          <ThemeToggle />
          <Link
            to="/settings"
            className={
              location.pathname === "/settings" ? "menu-item active" : "menu-item"
            }
          >
            {t("settings")}
          </Link>
          {getStoredClubs().length > 1 && (
            <button type="button" className="sidebar-btn" onClick={switchClub}>
              Switch Club
            </button>
          )}
          <button type="button" className="sidebar-btn logout" onClick={logout}>
            {t("logout")}
          </button>
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
