import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

function normalizeRecord(record) {
  const storedProbability = Number(record.failure_probability ?? 0);

  // Older local records stored the percentage (e.g. 0.47),
  // while newer records store the raw probability (e.g. 0.004712).
  const rawProbability =
    storedProbability > 1
      ? storedProbability / 100
      : storedProbability;

  const failurePercentage =
    storedProbability > 1
      ? storedProbability
      : rawProbability * 100;

  return {
    ...record,
    failure_probability: rawProbability,
    failure_percentage: failurePercentage,
  };
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function History() {
  const [records, setRecords] = useState([]);
  const [machineFilter, setMachineFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/prediction-history`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load prediction history."
        );
      }

      setRecords(
        (data.history || []).map(normalizeRecord)
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the ForgeSight backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const machineNames = useMemo(() => {
    return [
      ...new Set(
        records
          .map((record) => record.machine_name)
          .filter(Boolean)
      ),
    ];
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (machineFilter === "ALL") return records;

    return records.filter(
      (record) => record.machine_name === machineFilter
    );
  }, [records, machineFilter]);

  const latest = filteredRecords[0] || null;

  const summary = useMemo(() => {
    const healthy = filteredRecords.filter(
      (record) => Number(record.prediction) === 0
    ).length;

    const failures = filteredRecords.filter(
      (record) => Number(record.prediction) === 1
    ).length;

    const highRisk = filteredRecords.filter(
      (record) => record.risk_level === "HIGH"
    ).length;

    const averageFailurePercentage =
      filteredRecords.length > 0
        ? filteredRecords.reduce(
            (total, record) =>
              total + Number(record.failure_percentage || 0),
            0
          ) / filteredRecords.length
        : 0;

    return {
      total: filteredRecords.length,
      healthy,
      failures,
      highRisk,
      averageFailurePercentage,
    };
  }, [filteredRecords]);

  const riskClass = (risk) => {
    if (risk === "HIGH") return "history-risk high";
    if (risk === "MODERATE") return "history-risk moderate";
    return "history-risk low";
  };

  return (
    <main className="history-page">
      <section className="history-hero">
        <div className="history-header">
          <div className="section-eyebrow">
            <Database size={16} />
            MACHINE PREDICTION HISTORY
          </div>

          <div className="history-heading-row">
            <div>
              <h1>
                Prediction
                <span> History</span>
              </h1>

              <p>
                Review stored ForgeSight predictions for each machine,
                monitor risk changes, and trace previous sensor-based
                assessments.
              </p>
            </div>

            <button
              type="button"
              className="secondary-button history-refresh"
              onClick={loadHistory}
              disabled={loading}
            >
              <RefreshCw
                size={16}
                className={loading ? "spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="history-error">
            <AlertTriangle size={18} />
            <div>
              <strong>History unavailable</strong>
              <p>{error}</p>
              <small>
                Make sure FastAPI is running on port 8000.
              </small>
            </div>
          </div>
        )}

        {!error && (
          <>
            <div className="history-toolbar history-card">
              <div className="history-filter-label">
                <Search size={17} />
                <div>
                  <span>Machine</span>
                  <strong>
                    {machineFilter === "ALL"
                      ? "All machines"
                      : machineFilter}
                  </strong>
                </div>
              </div>

              <select
                className="history-machine-select"
                value={machineFilter}
                onChange={(event) =>
                  setMachineFilter(event.target.value)
                }
                disabled={loading || machineNames.length === 0}
              >
                <option value="ALL">All machines</option>
                {machineNames.map((machineName) => (
                  <option
                    key={machineName}
                    value={machineName}
                  >
                    {machineName}
                  </option>
                ))}
              </select>
            </div>

            <div className="history-stats">
              <div className="history-stat history-card">
                <div className="history-stat-icon">
                  <Database size={20} />
                </div>
                <div>
                  <span>Total Predictions</span>
                  <strong>{summary.total}</strong>
                </div>
              </div>

              <div className="history-stat history-card">
                <div className="history-stat-icon success">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <span>Healthy Results</span>
                  <strong>{summary.healthy}</strong>
                </div>
              </div>

              <div className="history-stat history-card">
                <div className="history-stat-icon danger">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <span>Failure Results</span>
                  <strong>{summary.failures}</strong>
                </div>
              </div>

              <div className="history-stat history-card">
                <div className="history-stat-icon warning">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <span>Average Failure Risk</span>
                  <strong>
                    {summary.averageFailurePercentage.toFixed(2)}%
                  </strong>
                </div>
              </div>
            </div>

            <section className="history-latest-grid">
              <div className="history-card history-latest-card">
                <div className="history-card-heading">
                  <div>
                    <span className="history-label">
                      Latest Stored Prediction
                    </span>
                    <h2>
                      {latest?.machine_name ||
                        "No prediction selected"}
                    </h2>
                  </div>

                  {latest && (
                    <span
                      className={riskClass(
                        latest.risk_level
                      )}
                    >
                      {latest.risk_level}
                    </span>
                  )}
                </div>

                {latest ? (
                  <div className="latest-details">
                    <div>
                      <span>Status</span>
                      <strong>
                        {latest.health_status}
                      </strong>
                    </div>
                    <div>
                      <span>Failure Probability</span>
                      <strong>
                        {latest.failure_percentage.toFixed(2)}%
                      </strong>
                    </div>
                    <div>
                      <span>Prediction ID</span>
                      <strong>#{latest.id}</strong>
                    </div>
                    <div>
                      <span>Predicted At</span>
                      <strong>
                        {formatDate(latest.predicted_at)}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="history-empty">
                    No stored predictions are available for this selection.
                  </p>
                )}
              </div>

              <div className="history-card history-sensor-card">
                <div className="history-card-heading">
                  <div>
                    <span className="history-label">
                      Latest Sensor Snapshot
                    </span>
                    <h2>Operating Parameters</h2>
                  </div>
                  <Activity size={20} />
                </div>

                {latest ? (
                  <div className="sensor-grid">
                    <div>
                      <span>Air Temperature</span>
                      <strong>
                        {latest.air_temperature} K
                      </strong>
                    </div>
                    <div>
                      <span>Process Temperature</span>
                      <strong>
                        {latest.process_temperature} K
                      </strong>
                    </div>
                    <div>
                      <span>Rotational Speed</span>
                      <strong>
                        {latest.rotational_speed} rpm
                      </strong>
                    </div>
                    <div>
                      <span>Torque</span>
                      <strong>{latest.torque} Nm</strong>
                    </div>
                    <div>
                      <span>Tool Wear</span>
                      <strong>{latest.tool_wear} min</strong>
                    </div>
                    <div>
                      <span>Machine Type</span>
                      <strong>{latest.machine_type}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="history-empty">
                    Sensor information will appear after a prediction is stored.
                  </p>
                )}
              </div>
            </section>

            <section className="history-card history-table-card">
              <div className="history-card-heading">
                <div>
                  <span className="history-label">
                    Stored Records
                  </span>
                  <h2>Prediction Timeline</h2>
                </div>

                <div className="history-record-count">
                  <Clock3 size={15} />
                  {filteredRecords.length} records
                </div>
              </div>

              {loading ? (
                <div className="history-loading">
                  <RefreshCw size={22} className="spin" />
                  Loading prediction history...
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="history-empty-state">
                  <Database size={28} />
                  <h3>No prediction history</h3>
                  <p>
                    Run a prediction for this machine and its result will
                    appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="history-table-wrapper">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Machine</th>
                        <th>Prediction</th>
                        <th>Risk</th>
                        <th>Failure %</th>
                        <th>Torque</th>
                        <th>Tool Wear</th>
                        <th>Predicted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record) => (
                        <tr key={record.id}>
                          <td>#{record.id}</td>
                          <td className="machine-cell">
                            {record.machine_name}
                          </td>
                          <td>
                            <span
                              className={
                                Number(record.prediction) === 0
                                  ? "history-status healthy"
                                  : "history-status failure"
                              }
                            >
                              {Number(record.prediction) === 0
                                ? "Healthy"
                                : "Failure risk"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={riskClass(
                                record.risk_level
                              )}
                            >
                              {record.risk_level}
                            </span>
                          </td>
                          <td>
                            {Number(
                              record.failure_percentage || 0
                            ).toFixed(2)}%
                          </td>
                          <td>{record.torque} Nm</td>
                          <td>{record.tool_wear} min</td>
                          <td>{formatDate(record.predicted_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="history-note">
              <Activity size={16} />
              <p>
                This page reads the same prediction history database used by
                the ForgeSight Copilot, so dashboard records and chatbot history
                stay synchronized.
              </p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default History;
