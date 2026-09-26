import { NavLink, Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
} from "lucide-react";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <div className="brand-icon">
          <Activity size={21} />
        </div>

        <div>
          <span className="brand-name">
            ForgeSight
          </span>

          <span className="brand-ai">
            AI
          </span>
        </div>
      </Link>

      <div className="nav-links">

        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          Home
        </NavLink>

        <NavLink
          to="/prediction"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          Prediction
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          Analytics
        </NavLink>

        <NavLink
          to="/insights"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          Insights
        </NavLink>

        <NavLink
          to="/recommendations"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          Recommendations
        </NavLink>

        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          About
        </NavLink>

      </div>

      <Link
        to="/prediction"
        className="nav-button"
      >
        Launch Platform
        <ArrowRight size={16} />
      </Link>
    </nav>
  );
}

export default Navbar;