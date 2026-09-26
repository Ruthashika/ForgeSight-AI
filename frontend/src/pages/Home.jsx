import {
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  Cpu,
  Gauge,
  Zap,
} from "lucide-react";

import "../App.css";

function Home() {
  return (
    <div className="app">

      {/* Background effects */}
      <div className="bg-glow glow-one"></div>
      <div className="bg-glow glow-two"></div>
      <div className="grid-overlay"></div>

      {/* Hero */}
      <main id="home" className="hero-section">

        {/* Hero content */}
        <div className="hero-content">

          <div className="status-pill">
            <span className="status-dot"></span>
            AI-POWERED PREDICTIVE MAINTENANCE
          </div>

          <h1>
            See Failures
            <br />
            <span>Before They Happen.</span>
          </h1>

          <p className="hero-description">
            ForgeSight AI transforms machine sensor data into intelligent
            failure predictions, risk insights, and proactive maintenance
            decisions.
          </p>

          {/* Hero actions */}
          <div className="hero-actions">

            <a
              className="primary-button"
              href="/prediction"
            >
              Predict Machine Health
              <ArrowRight size={18} />
            </a>

            <a
              className="secondary-button"
              href="/analytics"
            >
              Explore Intelligence
            </a>

          </div>

          {/* Trust indicators */}
          <div className="trust-row">

            <div>
              <ShieldCheck size={18} />
              <span>AI-driven analysis</span>
            </div>

            <div>
              <BrainCircuit size={18} />
              <span>Predictive intelligence</span>
            </div>

            <div>
              <Zap size={18} />
              <span>Real-time insights</span>
            </div>

          </div>

        </div>

        {/* Hero visual */}
        <div className="hero-visual">

          <div className="visual-orbit orbit-one"></div>
          <div className="visual-orbit orbit-two"></div>

          {/* Machine core */}
          <div className="machine-core">

            <div className="core-glow"></div>

            <Cpu
              size={82}
              strokeWidth={1.2}
            />

            <div className="core-label">

              <span>SYSTEM STATUS</span>

              <strong>MONITORING</strong>

            </div>

          </div>

          {/* Machine Health card */}
          <div className="floating-card card-health">

            <div className="card-icon">
              <Gauge size={18} />
            </div>

            <div>
              <span>Machine Health</span>
              <strong>94.8%</strong>
            </div>

            <div className="mini-chart">

              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>

            </div>

          </div>

          {/* Failure Risk card */}
          <div className="floating-card card-risk">

            <div className="risk-ring">
              <span>12%</span>
            </div>

            <div>
              <span>Failure Risk</span>
              <strong>LOW</strong>
            </div>

          </div>

          {/* AI Prediction card */}
          <div className="floating-card card-ai">

            <BrainCircuit size={18} />

            <div>
              <span>AI Prediction</span>
              <strong>No Failure Detected</strong>
            </div>

          </div>

        </div>

      </main>

      {/* Bottom metrics */}
      <section className="metrics-section">

        <div className="metric">

          <span>01</span>

          <div>
            <strong>Predict</strong>
            <p>
              Identify potential failures early
            </p>
          </div>

        </div>

        <div className="metric">

          <span>02</span>

          <div>
            <strong>Analyze</strong>
            <p>
              Understand machine behavior
            </p>
          </div>

        </div>

        <div className="metric">

          <span>03</span>

          <div>
            <strong>Act</strong>
            <p>
              Turn insights into maintenance
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}

export default Home;