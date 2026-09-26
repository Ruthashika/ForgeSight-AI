import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sun, Moon } from "lucide-react";

import Navbar from "./components/Navbar";
import ForgeSightCopilot from "./components/ForgeSightCopilot";

import Home from "./pages/Home";
import Prediction from "./pages/Prediction";
import Analytics from "./pages/Analytics";
import Insights from "./pages/Insights";
import Recommendations from "./pages/Recommendations";
import About from "./pages/About";

import { useTheme } from "./useTheme";

function App() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />

        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={
            isDark
              ? "Switch to light theme"
              : "Switch to dark theme"
          }
          title={
            isDark
              ? "Switch to light theme"
              : "Switch to dark theme"
          }
        >
          {isDark ? (
            <Sun size={19} />
          ) : (
            <Moon size={19} />
          )}

          <span>
            {isDark ? "Light mode" : "Dark mode"}
          </span>
        </button>

        <main className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/prediction"
              element={<Prediction />}
            />
            <Route
              path="/analytics"
              element={<Analytics />}
            />
            <Route
              path="/insights"
              element={<Insights />}
            />
            <Route
              path="/recommendations"
              element={<Recommendations />}
            />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>

        <ForgeSightCopilot />
      </div>
    </BrowserRouter>
  );
}

export default App;