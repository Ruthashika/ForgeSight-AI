import { useEffect, useState } from "react";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Gauge,
  BrainCircuit,
  Target,
  ShieldCheck,
  TrendingUp,
  Thermometer,
  RotateCcw,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [analyticsResponse, modelResponse] =
          await Promise.all([
            fetch("https://forgesight-ai.onrender.com/analytics"),
            fetch("https://forgesight-ai.onrender.com/model-info"),
          ]);

        const analyticsData =
          await analyticsResponse.json();

        const modelData =
          await modelResponse.json();

        if (
          !analyticsResponse.ok ||
          !analyticsData.success
        ) {
          throw new Error(
            analyticsData.error ||
              "Unable to load analytics."
          );
        }

        if (
          !modelResponse.ok ||
          !modelData.success
        ) {
          throw new Error(
            modelData.error ||
              "Unable to load model information."
          );
        }

        setAnalytics(analyticsData);
        setModelInfo(modelData);
      } catch (err) {
        setError(
          err.message ||
            "Unable to connect to ForgeSight AI."
        );
      }
    };

    loadData();
  }, []);

  if (error) {
    return (
      <main className="analytics-page">
        <div className="analytics-message">
          <AlertTriangle size={35} />
          <h2>Analytics Unavailable</h2>
          <p>{error}</p>
          <small>
            Make sure FastAPI is running on port 8000.
          </small>
        </div>
      </main>
    );
  }

  if (!analytics || !modelInfo) {
    return (
      <main className="analytics-page">
        <div className="analytics-message">
          <Activity
            size={35}
            className="spin"
          />
          <h2>
            Loading Machine Intelligence...
          </h2>
          <p>
            ForgeSight is preparing your analytics.
          </p>
        </div>
      </main>
  );
}

  const healthData = [
    {
      name: "Healthy",
      value: analytics.summary.total_healthy,
    },
    {
      name: "Failure",
      value: analytics.summary.total_failures,
    },
  ];

  const machineTypeData =
    Object.entries(
      analytics.machine_types
    ).map(([type, count]) => ({
      type,
      count,
    }));

  const failureTypeData =
    Object.entries(
      analytics.failures_by_type
    ).map(([type, count]) => ({
      type,
      count,
    }));

  const failureModeData =
    Object.entries(
      analytics.failure_modes
    ).map(([name, value]) => ({
      name,
      value,
    }));

  const featureImportance =
    modelInfo.feature_importance || [];

  return (
    <main className="analytics-page">

      <div className="analytics-glow analytics-glow-one"></div>
      <div className="analytics-glow analytics-glow-two"></div>

      <section className="analytics-container">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="analytics-header">

          <div className="analytics-eyebrow">
            <Activity size={15} />
            MACHINE INTELLIGENCE
          </div>

          <h1>
            Predictive
            <span> Analytics</span>
          </h1>

          <p>
            Explore machine behavior, failure patterns,
            sensor characteristics, and the AI model
            powering ForgeSight.
          </p>

        </div>

        {/* ====================================================
            DATASET SUMMARY
        ==================================================== */}

        <div className="analytics-stats">

          <div className="analytics-stat">

            <div className="analytics-stat-icon">
              <Database size={20} />
            </div>

            <div>
              <span>Total Machines</span>
              <strong>
                {analytics.summary.total_machines.toLocaleString()}
              </strong>
            </div>

          </div>

          <div className="analytics-stat">

            <div className="analytics-stat-icon">
              <AlertTriangle size={20} />
            </div>

            <div>
              <span>Failure Cases</span>
              <strong>
                {analytics.summary.total_failures.toLocaleString()}
              </strong>
            </div>

          </div>

          <div className="analytics-stat">

            <div className="analytics-stat-icon">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <span>Healthy Machines</span>
              <strong>
                {analytics.summary.total_healthy.toLocaleString()}
              </strong>
            </div>

          </div>

          <div className="analytics-stat">

            <div className="analytics-stat-icon">
              <TrendingUp size={20} />
            </div>

            <div>
              <span>Failure Rate</span>
              <strong>
                {analytics.summary.failure_rate}%
              </strong>
            </div>

          </div>

        </div>

        {/* ====================================================
            EXISTING ANALYTICS
        ==================================================== */}

        <div className="analytics-grid">

          {/* HEALTH */}
          <div className="analytics-card">

            <div className="analytics-card-header">
              <div>
                <h2>
                  Machine Health Distribution
                </h2>

                <p>
                  Healthy vs failure observations
                </p>
              </div>
            </div>

            <div className="analytics-chart">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={healthData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                  >
                    <Cell fill="#52f3ff" />
                    <Cell fill="#ff7185" />
                  </Pie>

                  <Tooltip />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>

          {/* MACHINE TYPE */}
          <div className="analytics-card">

            <div className="analytics-card-header">
              <div>
                <h2>
                  Machine Type Distribution
                </h2>

                <p>
                  Dataset observations by machine class
                </p>
              </div>
            </div>

            <div className="analytics-chart">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={machineTypeData}
                >

                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                  />

                  <XAxis dataKey="type" />
                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    fill="#52f3ff"
                    radius={[
                      7,
                      7,
                      0,
                      0,
                    ]}
                  />

                </BarChart>
              </ResponsiveContainer>

            </div>

          </div>

          {/* FAILURES BY TYPE */}
          <div className="analytics-card">

            <div className="analytics-card-header">
              <div>
                <h2>
                  Failures by Machine Type
                </h2>

                <p>
                  Failure observations across L, M and H
                </p>
              </div>
            </div>

            <div className="analytics-chart">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={failureTypeData}
                >

                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                  />

                  <XAxis dataKey="type" />
                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    fill="#7c5cfc"
                    radius={[
                      7,
                      7,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

          {/* FAILURE MODES */}
          <div className="analytics-card">

            <div className="analytics-card-header">
              <div>
                <h2>
                  Failure Mode Breakdown
                </h2>

                <p>
                  Distribution of known failure mechanisms
                </p>
              </div>
            </div>

            <div className="analytics-chart">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={failureModeData}
                  layout="vertical"
                >

                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                  />

                  <XAxis type="number" />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={155}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="value"
                    fill="#38d6ff"
                    radius={[
                      0,
                      7,
                      7,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>

        {/* ====================================================
            SENSOR PROFILE
        ==================================================== */}

        <div className="analytics-card sensor-profile">

          <div className="analytics-card-header">

            <div>
              <h2>
                Average Sensor Profile
              </h2>

              <p>
                Mean operating characteristics across
                10,000 machine observations
              </p>
            </div>

          </div>

          <div className="sensor-grid">

            <div className="sensor-item">
              <Thermometer size={20} />
              <span>Air Temperature</span>
              <strong>
                {
                  analytics.sensor_averages[
                    "Air Temperature [K]"
                  ]
                } K
              </strong>
            </div>

            <div className="sensor-item">
              <Thermometer size={20} />
              <span>Process Temperature</span>
              <strong>
                {
                  analytics.sensor_averages[
                    "Process Temperature [K]"
                  ]
                } K
              </strong>
            </div>

            <div className="sensor-item">
              <RotateCcw size={20} />
              <span>Rotational Speed</span>
              <strong>
                {
                  analytics.sensor_averages[
                    "Rotational Speed [rpm]"
                  ]
                } rpm
              </strong>
            </div>

            <div className="sensor-item">
              <Gauge size={20} />
              <span>Torque</span>
              <strong>
                {
                  analytics.sensor_averages[
                    "Torque [Nm]"
                  ]
                } Nm
              </strong>
            </div>

            <div className="sensor-item">
              <Wrench size={20} />
              <span>Tool Wear</span>
              <strong>
                {
                  analytics.sensor_averages[
                    "Tool Wear [min]"
                  ]
                } min
              </strong>
            </div>

          </div>

        </div>

        {/* ====================================================
            MODEL PERFORMANCE
        ==================================================== */}

        <div className="model-section">

          <div className="analytics-section-heading">

            <div>

              <div className="analytics-eyebrow">
                <BrainCircuit size={15} />
                MODEL TRANSPARENCY
              </div>

              <h2>
                AI Model Performance
              </h2>

              <p>
                ForgeSight's prediction engine is powered by
                a trained {modelInfo.model} classifier.
              </p>

            </div>

            <div className="model-badge">
              <ShieldCheck size={16} />
              {modelInfo.model}
            </div>

          </div>

          <div className="model-metrics-grid">

            <div className="model-metric-card">
              <Target size={20} />
              <span>Accuracy</span>
              <strong>
                {modelInfo.metrics.accuracy}%
              </strong>
            </div>

            <div className="model-metric-card">
              <Gauge size={20} />
              <span>Precision</span>
              <strong>
                {modelInfo.metrics.precision}%
              </strong>
            </div>

            <div className="model-metric-card">
              <Activity size={20} />
              <span>Recall</span>
              <strong>
                {modelInfo.metrics.recall}%
              </strong>
            </div>

            <div className="model-metric-card">
              <BrainCircuit size={20} />
              <span>F1 Score</span>
              <strong>
                {modelInfo.metrics.f1_score}%
              </strong>
            </div>

            <div className="model-metric-card">
              <TrendingUp size={20} />
              <span>ROC-AUC</span>
              <strong>
                {modelInfo.metrics.roc_auc}%
              </strong>
            </div>

          </div>

          <div className="model-note">

            <ShieldCheck size={17} />

            <p>
              These metrics are calculated from the held-out
              test set used during ForgeSight model evaluation.
              For predictive maintenance, recall is particularly
              important because missed failures can be more costly
              than false alarms.
            </p>

          </div>

        </div>

        {/* ====================================================
            FEATURE IMPORTANCE
        ==================================================== */}

        <div className="feature-section">

          <div className="analytics-section-heading">

            <div>

              <div className="analytics-eyebrow">
                <Gauge size={15} />
                MODEL EXPLAINABILITY
              </div>

              <h2>
                Feature Importance
              </h2>

              <p>
                Relative importance assigned by the trained
                Random Forest to the predictive inputs.
              </p>

            </div>

          </div>

          <div className="feature-layout">

            <div className="analytics-card feature-chart-card">

              <div className="feature-chart">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={featureImportance}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 25,
                      left: 10,
                      bottom: 5,
                    }}
                  >

                    <CartesianGrid
                      stroke="rgba(255,255,255,0.06)"
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      type="number"
                      unit="%"
                    />

                    <YAxis
                      type="category"
                      dataKey="feature"
                      width={185}
                    />

                    <Tooltip
                      formatter={(value) => [
                        `${value}%`,
                        "Importance",
                      ]}
                    />

                    <Bar
                      dataKey="importance"
                      fill="#7c5cfc"
                      radius={[
                        0,
                        7,
                        7,
                        0,
                      ]}
                    />

                  </BarChart>
                </ResponsiveContainer>

              </div>

            </div>

            <div className="analytics-card feature-summary-card">

              <div className="feature-summary-header">

                <div className="analytics-stat-icon">
                  <BrainCircuit size={20} />
                </div>

                <div>
                  <span>
                    TOP PREDICTIVE SIGNAL
                  </span>

                  <strong>
                    {featureImportance[0]?.feature ||
                      "Unavailable"}
                  </strong>
                </div>

              </div>

              <div className="feature-summary-list">

                {featureImportance
                  .slice(0, 5)
                  .map((item, index) => (
                    <div
                      className="feature-summary-item"
                      key={item.feature}
                    >

                      <div>
                        <span>
                          0{index + 1}
                        </span>

                        <strong>
                          {item.feature}
                        </strong>
                      </div>

                      <b>
                        {item.importance}%
                      </b>

                    </div>
                  ))}

              </div>

              <div className="feature-summary-note">
                <AlertTriangle size={16} />

                <p>
                  Feature importance indicates how much
                  each input contributes to the Random Forest's
                  decision process. It does not mean that an
                  individual feature independently causes failure.
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>
    </main>
  );
}

export default Analytics;
