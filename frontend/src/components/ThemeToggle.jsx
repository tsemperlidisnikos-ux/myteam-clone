import { useTheme } from "../hooks/useTheme";
import { t } from "../i18n/el";

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button type="button" className="sidebar-btn" onClick={toggle}>
      {dark ? t("lightMode") : t("darkMode")}
    </button>
  );
}
