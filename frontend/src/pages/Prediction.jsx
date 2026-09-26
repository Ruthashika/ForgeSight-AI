import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Thermometer,
  Wrench,
} from "lucide-react";

function Prediction() {
  const [formData, setFormData] = useState({
    machine_type: "M",
    air_temperature: 300,
    process_temperature: 310,
    rotational_speed: 1500,
    torque: 40,
    tool_wear: 100,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        name === "machine_type"
          ? value
          : Number(value),
    }));
  };

  const handleReset = () => {
    setFormData({
      machine_type: "M",
      air_temperature: 300,
      process_temperature: 310,
      rotational_speed: 1500,
      torque: 40,
      tool_wear: 100,
    });

    setResult(null);
    setError("");
  };

  const handlePredict = async (event) => {
    event.preventDefault();

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch(
        "https://forgesight-ai.onrender.com/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Prediction failed."
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to ForgeSight AI."
      );
    } finally {
      setLoading(false);
    }
  };

  const getRiskClass = () => {
    if (!result) return "";

    return result.risk_level.toLowerCase();
  };

  return (
    <main className="prediction-page">
      <section className="prediction-hero">

        {/* HEADER */}
        <div className="prediction-header">

          <div className="section-eyebrow">
            <Activity size={16} />
            AI MACHINE INTELLIGENCE
          </div>

          <h1>
            Machine Health
            <span> Prediction</span>
          </h1>

          <p>
            Enter the current operating parameters of your
            machine. ForgeSight AI analyzes the sensor profile
            and estimates potential failure risk.
          </p>

        </div>

        {/* MAIN GRID */}
        <div className="prediction-layout">

          {/* INPUT PANEL */}
          <form
            className="prediction-card input-card"
            onSubmit={handlePredict}
          >

            <div className="card-heading">

              <div className="heading-icon">
                <Gauge size={20} />
              </div>

              <div>
                <h2>Machine Parameters</h2>
                <p>Current operating conditions</p>
              </div>

            </div>

            <div className="form-grid">

              {/* MACHINE TYPE */}
              <div className="form-group">

                <label>Machine Type</label>

                <select
                  name="machine_type"
                  value={formData.machine_type}
                  onChange={handleChange}
                >
                  <option value="L">
                    L — Low
                  </option>

                  <option value="M">
                    M — Medium
                  </option>

                  <option value="H">
                    H — High
                  </option>
                </select>

              </div>

              {/* AIR TEMPERATURE */}
              <div className="form-group">

                <label>
                  <Thermometer size={15} />
                  Air Temperature [K]
                </label>

                <input
                  type="number"
                  name="air_temperature"
                  value={formData.air_temperature}
                  onChange={handleChange}
                  step="0.1"
                  required
                />

              </div>

              {/* PROCESS TEMPERATURE */}
              <div className="form-group">

                <label>
                  <Thermometer size={15} />
                  Process Temperature [K]
                </label>

                <input
                  type="number"
                  name="process_temperature"
                  value={formData.process_temperature}
                  onChange={handleChange}
                  step="0.1"
                  required
                />

              </div>

              {/* ROTATIONAL SPEED */}
              <div className="form-group">

                <label>
                  <RotateCcw size={15} />
                  Rotational Speed [rpm]
                </label>

                <input
                  type="number"
                  name="rotational_speed"
                  value={formData.rotational_speed}
                  onChange={handleChange}
                  step="1"
                  required
                />

              </div>

              {/* TORQUE */}
              <div className="form-group">

                <label>
                  <Gauge size={15} />
                  Torque [Nm]
                </label>

                <input
                  type="number"
                  name="torque"
                  value={formData.torque}
                  onChange={handleChange}
                  step="0.1"
                  required
                />

              </div>

              {/* TOOL WEAR */}
              <div className="form-group">

                <label>
                  <Wrench size={15} />
                  Tool Wear [min]
                </label>

                <input
                  type="number"
                  name="tool_wear"
                  value={formData.tool_wear}
                  onChange={handleChange}
                  step="1"
                  required
                />

              </div>

            </div>

            {/* ACTIONS */}
            <div className="prediction-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={handleReset}
              >
                <RotateCcw size={16} />
                Reset
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <Loader2
                      size={17}
                      className="spin"
                    />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Activity size={17} />
                    Analyze Machine
                  </>
                )}

              </button>

            </div>

          </form>

          {/* RESULT PANEL */}
          <div className="prediction-card result-card">

            {/* INITIAL STATE */}
            {!result && !loading && !error && (
              <div className="empty-result">

                <div className="empty-orb">
                  <ShieldCheck size={42} />
                </div>

                <h2>Awaiting Analysis</h2>

                <p>
                  Submit the machine parameters to generate
                  an AI-powered health assessment.
                </p>

                <div className="empty-line"></div>

              </div>
            )}

            {/* LOADING */}
            {loading && (
              <div className="empty-result">

                <div className="empty-orb">
                  <Loader2
                    size={42}
                    className="spin"
                  />
                </div>

                <h2>Analyzing Machine</h2>

                <p>
                  ForgeSight AI is evaluating the sensor
                  profile...
                </p>

              </div>
            )}

            {/* ERROR */}
            {error && !loading && (
              <div className="error-result">

                <div className="error-icon">
                  <AlertTriangle size={32} />
                </div>

                <h2>Analysis Failed</h2>

                <p>{error}</p>

                <small>
                  Make sure FastAPI is running on port 8000.
                </small>

              </div>
            )}

            {/* RESULT */}
            {result && !loading && (
              <div className="result-content">

                <div className="result-top">

                  <div>
                    <span className="result-label">
                      FORGESIGHT ASSESSMENT
                    </span>

                    <h2>
                      Machine Health Result
                    </h2>
                  </div>

                  <div
                    className={`status-icon ${getRiskClass()}`}
                  >
                    {result.prediction === 1 ? (
                      <AlertTriangle size={28} />
                    ) : (
                      <CheckCircle2 size={28} />
                    )}
                  </div>

                </div>

                {/* HEALTH STATUS */}
                <div
                  className={`health-banner ${getRiskClass()}`}
                >

                  <div>

                    <span>HEALTH STATUS</span>

                    <strong>
                      {result.health_status}
                    </strong>

                  </div>

                  <div className="risk-pill">
                    {result.risk_level}
                  </div>

                </div>

                {/* FAILURE PROBABILITY */}
                <div className="probability-section">

                  <div className="probability-heading">

                    <span>
                      Failure Probability
                    </span>

                    <strong>
                      {result.failure_probability}%
                    </strong>

                  </div>

                  <div className="progress-track">

                    <div
                      className={`progress-fill ${getRiskClass()}`}
                      style={{
                        width: `${Math.min(
                          result.failure_probability,
                          100
                        )}%`,
                      }}
                    ></div>

                  </div>

                </div>

                {/* RECOMMENDATION */}
                <div className="recommendation-box">

                  <div className="recommendation-icon">
                    <Wrench size={20} />
                  </div>

                  <div>

                    <span>
                      AI RECOMMENDATION
                    </span>

                    <p>
                      {result.recommendation}
                    </p>

                  </div>

                </div>

                {/* FOOTER */}
                <div className="result-footer">

                  <ShieldCheck size={16} />

                  AI assessment generated from
                  current operating parameters

                </div>

              </div>
            )}

          </div>

        </div>

      </section>
    </main>
  );
}

export default Prediction;
