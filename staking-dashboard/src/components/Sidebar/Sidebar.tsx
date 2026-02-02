import styles from "./Sidebar.module.css";
import { Link, useLocation } from "react-router-dom";
import logoSvg from "../../assets/logo.svg";
import AdminTools from "../AdminTools/AdminTools";

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoWrapper}>
        <img src={logoSvg} alt="Aztec Logo" className={styles.logoIcon} />
        <h1 className={styles.logo}>Aztec Staking</h1>
      </div>
      <div className={styles.menuWrapper}>
        <ul>
          <li>
            <Link
              to="/"
              className={isActive("/") ? styles.activeLink : styles.link}
            >
              My Position
            </Link>
          </li>
          <li>
            <Link
              to="/providers"
              className={
                isActive("/providers") ? styles.activeLink : styles.link
              }
            >
              Providers
            </Link>
          </li>
          <li>
            <Link
              to="/register-validator"
              className={
                isActive("/register-validator")
                  ? styles.activeLink
                  : styles.link
              }
            >
              Register Validator
            </Link>
          </li>
        </ul>
      </div>
      <AdminTools />
    </aside>
  );
}
