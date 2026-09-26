import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Flame,
  Gauge,
  ShieldAlert,
  Wrench,
} from "lucide-react";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Insights() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch(
          "https://forgesight-ai.onrender.com/analytics"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Unable to load failure insights."
          );
        }

        setData(result);
      } catch (err) {
        setError(
          err.message ||
            "Unable to connect to ForgeSight AI."
        );
      }
    };

    fetchInsights();
  }, []);

  const failureModes = useMemo(() => {
    if (!data) return [];

    return Object.entries(data.failure_modes)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  if (error) {
    return (
      <main className="insights-page">
        <div className="insights-message">
          <AlertTriangle size={36} />
          <h2>Failure Insights Unavailable</h2>
          <p>{error}</p>
          <small>
            Make sure the ForgeSight backend is running.
          </small>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="insights-page">
        <div className="insights-message">
          <Activity size={36} className="spin" />
          <h2>Analyzing Failure Patterns...</h2>
          <p>
            ForgeSight is preparing machine failure intelligence.
          </p>
        </div>
      </main>
    );
  }

  const dominantFailure = failureModes[0];
  const secondFailure = failureModes[1];
  const thirdFailure = failureModes[2];

  const dominantPercentage = (
    (dominantFailure.value / data.summary.total_failures) *
    100
  ).toFixed(1);

  const overallFailureRate = data.summary.failure_rate;

  return (
    <main className="insights-page">

      {/* Background */}
      <div className="insights-glow insights-glow-one"></div>
      <div className="insights-glow insights-glow-two"></div>

      <section className="insights-container">

        {/* HEADER */}
        <div className="insights-header">

          <div className="insights-eyebrow">
            <BrainCircuit size={15} />
            FAILURE INTELLIGENCE
          </div>

          <h1>
            Failure
            <span> Insights</span>
          </h1>

          <p>
            Understand the mechanisms behind machine failures
            and identify the patterns that matter most.
          </p>

        </div>

        {/* TOP METRICS */}
        <div className="insight-summary-grid">

          <div className="insight-summary-card featured">

            <div className="insight-summary-icon">
              <ShieldAlert size={22} />
            </div>

            <div>
              <span>DOMINANT FAILURE MODE</span>

              <strong>
                {dominantFailure.name}
              </strong>

              <small>
                {dominantFailure.value} cases
              </small>
            </div>

          </div>

          <div className="insight-summary-card">

            <div className="insight-summary-icon">
              <Flame size={22} />
            </div>

            <div>
              <span>DOMINANT SHARE</span>

              <strong>
                {dominantPercentage}%
              </strong>

              <small>
                of observed failures
              </small>
            </div>

          </div>

          <div className="insight-summary-card">

            <div className="insight-summary-icon">
              <AlertTriangle size={22} />
            </div>

            <div>
              <span>TOTAL FAILURES</span>

              <strong>
                {data.summary.total_failures}
              </strong>

              <small>
                {overallFailureRate}% dataset failure rate
              </small>
            </div>

          </div>

        </div>

        {/* FAILURE RANKING + CHART */}
        <div className="insights-main-grid">

          {/* RANKING */}
          <div className="insights-card">

            <div className="insights-card-header">

              <div>
                <h2>Failure Mode Ranking</h2>

                <p>
                  Most frequently observed failure mechanisms
                </p>
              </div>

              <BarChart3 size={19} />

            </div>

            <div className="failure-ranking">

              {failureModes.map((mode, index) => {

                const percentage = (
                  (mode.value / data.summary.total_failures) *
                  100
                ).toFixed(1);

                return (
                  <div
                    className="failure-ranking-item"
                    key={mode.name}
                  >

                    <div className="ranking-top">

                      <div className="ranking-name">

                        <span className="ranking-number">
                          0{index + 1}
                        </span>

                        <strong>
                          {mode.name}
                        </strong>

                      </div>

                      <div className="ranking-value">
                        {mode.value}
                      </div>

                    </div>

                    <div className="ranking-bar">

                      <div
                        className="ranking-fill"
                        style={{
                          width: `${Math.min(
                            percentage,
                            100
                          )}%`,
                        }}
                      />

                    </div>

                    <div className="ranking-meta">
                      <span>
                        {percentage}% of failures
                      </span>

                      {index === 0 && (
                        <span className="dominant-tag">
                          DOMINANT
                        </span>
                      )}
                    </div>

                  </div>
                );
              })}

            </div>

          </div>

          {/* CHART */}
          <div className="insights-card">

            <div className="insights-card-header">

              <div>
                <h2>Failure Distribution</h2>

                <p>
                  Comparison across observed failure categories
                </p>
              </div>

              <Activity size={19} />

            </div>

            <div className="insights-chart">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={failureModes}
                  layout="vertical"
                  margin={{
                    top: 10,
                    right: 25,
                    left: 15,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    type="number"
                    stroke="#68748f"
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={155}
                    stroke="#68748f"
                  />

                  <Tooltip />

                  <Bar
                    dataKey="value"
                    fill="#52f3ff"
                    radius={[0, 7, 7, 0]}
                  />

                </BarChart>
              </ResponsiveContainer>

            </div>

          </div>

        </div>

        {/* AI INTERPRETATION */}
        <div className="ai-insight-card">

          <div className="ai-insight-icon">
            <BrainCircuit size={25} />
          </div>

          <div className="ai-insight-content">

            <span className="ai-insight-label">
              FORGESIGHT AI INTERPRETATION
            </span>

            <h2>
              {dominantFailure.name} is the most prominent
              observed failure mechanism.
            </h2>

            <p>
              It accounts for{" "}
              <strong>{dominantPercentage}%</strong>{" "}
              of all recorded machine failures in this
              dataset, with{" "}
              <strong>{dominantFailure.value}</strong>{" "}
              observed cases.
              {secondFailure && (
                <>
                  {" "}
                  It is followed by{" "}
                  <strong>{secondFailure.name}</strong>{" "}
                  with{" "}
                  <strong>{secondFailure.value}</strong>{" "}
                  cases.
                </>
              )}
            </p>

          </div>

        </div>

        {/* OPERATIONAL SIGNALS */}
        <div className="insights-bottom-grid">

          {/* PRIORITY */}
          <div className="insights-card priority-card">

            <div className="insights-card-header">

              <div>
                <h2>Maintenance Priority</h2>

                <p>
                  Suggested focus based on failure frequency
                </p>
              </div>

              <Wrench size={19} />

            </div>

            <div className="priority-list">

              <div className="priority-item high">

                <div className="priority-icon">
                  <AlertTriangle size={17} />
                </div>

                <div>
                  <strong>
                    High Attention
                  </strong>

                  <span>
                    {dominantFailure.name}
                  </span>
                </div>

                <small>
                  Priority 01
                </small>

              </div>

              <div className="priority-item medium">

                <div className="priority-icon">
                  <Gauge size={17} />
                </div>

                <div>
                  <strong>
                    Monitor Closely
                  </strong>

                  <span>
                    {secondFailure.name}
                  </span>
                </div>

                <small>
                  Priority 02
                </small>

              </div>

              <div className="priority-item normal">

                <div className="priority-icon">
                  <CheckCircle2 size={17} />
                </div>

                <div>
                  <strong>
                    Continue Monitoring
                  </strong>

                  <span>
                    {thirdFailure.name}
                  </span>
                </div>

                <small>
                  Priority 03
                </small>

              </div>

            </div>

          </div>

          {/* DATA CONTEXT */}
          <div className="insights-card context-card">

            <div className="insights-card-header">

              <div>
                <h2>Dataset Context</h2>

                <p>
                  Current ForgeSight intelligence scope
                </p>
              </div>

              <Activity size={19} />

            </div>

            <div className="context-grid">

              <div className="context-item">
                <span>Machines analyzed</span>
                <strong>
                  {data.summary.total_machines.toLocaleString()}
                </strong>
              </div>

              <div className="context-item">
                <span>Failure observations</span>
                <strong>
                  {data.summary.total_failures}
                </strong>
              </div>

              <div className="context-item">
                <span>Healthy observations</span>
                <strong>
                  {data.summary.total_healthy.toLocaleString()}
                </strong>
              </div>

              <div className="context-item">
                <span>Overall failure rate</span>
                <strong>
                  {data.summary.failure_rate}%
                </strong>
              </div>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Insights;
