import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Gauge,
  Loader2,
  ShieldCheck,
  Thermometer,
  Wrench,
  Zap,
} from "lucide-react";

function Recommendations() {
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

  const getMaintenancePlan = (riskLevel) => {
    if (riskLevel === "HIGH") {
      return {
        title: "Immediate Intervention",
        description:
          "The machine requires priority attention. Inspect critical operating parameters before continued heavy operation.",
        actions: [
          "Perform an immediate machine inspection",
          "Check tool condition and excessive wear",
          "Inspect thermal conditions and cooling performance",
          "Verify torque and rotational-speed stability",
          "Schedule corrective maintenance as soon as possible",
        ],
        timeline: "Immediate",
        priority: "Critical",
      };
    }

    if (riskLevel === "MODERATE") {
      return {
        title: "Preventive Maintenance",
        description:
          "The machine shows a moderate risk profile. Preventive inspection should be scheduled before the condition worsens.",
        actions: [
          "Schedule a preventive machine inspection",
          "Review tool wear and operating conditions",
          "Monitor temperature behavior closely",
          "Check operating load and torque stability",
          "Continue monitoring the machine for changes",
        ],
        timeline: "Within 7 days",
        priority: "Medium",
      };
    }

    return {
      title: "Routine Monitoring",
      description:
        "The current machine profile is relatively healthy. Continue routine monitoring and scheduled maintenance.",
      actions: [
        "Continue normal machine operation",
        "Maintain regular sensor monitoring",
        "Track tool wear progression",
        "Follow the normal maintenance schedule",
        "Review machine health periodically",
      ],
      timeline: "Routine schedule",
      priority: "Low",
    };
  };

  const handleAnalyze = async (event) => {
    event.preventDefault();

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/predict",
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
          data.error || "Unable to generate recommendation."
        );
      }

      const maintenancePlan = getMaintenancePlan(
        data.risk_level
      );

      setResult({
        ...data,
        maintenancePlan,
      });
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to ForgeSight AI."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="recommendations-page">

      <div className="recommendations-glow recommendations-glow-one" />
      <div className="recommendations-glow recommendations-glow-two" />

      <section className="recommendations-container">

        {/* HEADER */}
        <div className="recommendations-header">

          <div className="recommendations-eyebrow">
            <Wrench size={15} />
            SMART MAINTENANCE
          </div>

          <h1>
            Maintenance
            <span> Recommendations</span>
          </h1>

          <p>
            Turn machine health predictions into practical
            maintenance actions with ForgeSight AI.
          </p>

        </div>

        {/* CONTENT */}
        <div className="recommendations-layout">

          {/* INPUT */}
          <form
            className="recommendations-card"
            onSubmit={handleAnalyze}
          >

            <div className="recommendations-card-header">

              <div className="recommendations-icon">
                <Gauge size={20} />
              </div>

              <div>
                <h2>Machine Assessment</h2>
                <p>
                  Enter the latest operating conditions
                </p>
              </div>

            </div>

            <div className="recommendation-form-grid">

              <div className="recommendation-field">
                <label>Machine Type</label>

                <select
                  name="machine_type"
                  value={formData.machine_type}
                  onChange={handleChange}
                >
                  <option value="L">L — Low</option>
                  <option value="M">M — Medium</option>
                  <option value="H">H — High</option>
                </select>
              </div>

              <div className="recommendation-field">
                <label>
                  <Thermometer size={14} />
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

              <div className="recommendation-field">
                <label>
                  <Thermometer size={14} />
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

              <div className="recommendation-field">
                <label>Rotational Speed [rpm]</label>

                <input
                  type="number"
                  name="rotational_speed"
                  value={formData.rotational_speed}
                  onChange={handleChange}
                  step="1"
                  required
                />
              </div>

              <div className="recommendation-field">
                <label>Torque [Nm]</label>

                <input
                  type="number"
                  name="torque"
                  value={formData.torque}
                  onChange={handleChange}
                  step="0.1"
                  required
                />
              </div>

              <div className="recommendation-field">
                <label>Tool Wear [min]</label>

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

            <button
              type="submit"
              className="recommendation-analyze-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="spin"
                  />
                  Generating Strategy...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Generate Maintenance Strategy
                </>
              )}
            </button>

          </form>

          {/* RESULT */}
          <div className="recommendations-card recommendation-result">

            {!result && !error && !loading && (
              <div className="recommendation-empty">

                <div className="recommendation-empty-icon">
                  <Wrench size={38} />
                </div>

                <h2>Maintenance Strategy</h2>

                <p>
                  Analyze a machine profile to generate an
                  AI-powered maintenance plan.
                </p>

              </div>
            )}

            {loading && (
              <div className="recommendation-empty">

                <div className="recommendation-empty-icon">
                  <Loader2
                    size={38}
                    className="spin"
                  />
                </div>

                <h2>Generating Strategy</h2>

                <p>
                  ForgeSight is evaluating the machine risk
                  profile...
                </p>

              </div>
            )}

            {error && !loading && (
              <div className="recommendation-error">

                <AlertTriangle size={34} />

                <h2>Unable to Generate Strategy</h2>

                <p>{error}</p>

              </div>
            )}

            {result && !loading && (
              <div className="recommendation-result-content">

                {/* RESULT HEADER */}
                <div className="recommendation-result-header">

                  <div>
                    <span>
                      FORGESIGHT ASSESSMENT
                    </span>

                    <h2>
                      {result.maintenancePlan.title}
                    </h2>
                  </div>

                  <div
                    className={`recommendation-status ${result.risk_level.toLowerCase()}`}
                  >
                    {result.prediction === 1 ? (
                      <AlertTriangle size={25} />
                    ) : (
                      <CheckCircle2 size={25} />
                    )}
                  </div>

                </div>

                {/* RISK SUMMARY */}
                <div
                  className={`recommendation-risk ${result.risk_level.toLowerCase()}`}
                >

                  <div>
                    <span>RISK LEVEL</span>

                    <strong>
                      {result.risk_level}
                    </strong>
                  </div>

                  <div className="risk-probability">
                    <span>FAILURE PROBABILITY</span>

                    <strong>
                      {result.failure_probability}%
                    </strong>
                  </div>

                </div>

                {/* DESCRIPTION */}
                <div className="recommendation-description">

                  <ShieldCheck size={19} />

                  <p>
                    {result.maintenancePlan.description}
                  </p>

                </div>

                {/* ACTIONS */}
                <div className="maintenance-actions">

                  <div className="maintenance-actions-header">
                    <div>
                      <span>RECOMMENDED ACTIONS</span>
                      <h3>
                        What should happen next?
                      </h3>
                    </div>

                    <Wrench size={19} />
                  </div>

                  <div className="maintenance-action-list">

                    {result.maintenancePlan.actions.map(
                      (action, index) => (
                        <div
                          className="maintenance-action"
                          key={action}
                        >
                          <div className="action-number">
                            {String(index + 1).padStart(2, "0")}
                          </div>

                          <p>{action}</p>

                        </div>
                      )
                    )}

                  </div>

                </div>

                {/* TIMELINE */}
                <div className="maintenance-meta">

                  <div className="maintenance-meta-item">

                    <Clock3 size={17} />

                    <div>
                      <span>Recommended Timeline</span>
                      <strong>
                        {result.maintenancePlan.timeline}
                      </strong>
                    </div>

                  </div>

                  <div className="maintenance-meta-item">

                    <Activity size={17} />

                    <div>
                      <span>Priority</span>
                      <strong>
                        {result.maintenancePlan.priority}
                      </strong>
                    </div>

                  </div>

                </div>

              </div>
            )}

          </div>

        </div>

      </section>
    </main>
  );
}

export default Recommendations;