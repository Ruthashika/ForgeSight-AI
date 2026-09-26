import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Database,
  Gauge,
  Layers3,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

function About() {
  const pipeline = [
    {
      number: "01",
      title: "Machine Sensors",
      description:
        "Operating parameters such as temperature, speed, torque, and tool wear are collected.",
      icon: Gauge,
    },
    {
      number: "02",
      title: "Data Processing",
      description:
        "Sensor values are prepared and transformed into the format required by the predictive model.",
      icon: Layers3,
    },
    {
      number: "03",
      title: "Machine Learning",
      description:
        "A trained Random Forest pipeline analyzes the current machine profile.",
      icon: BrainCircuit,
    },
    {
      number: "04",
      title: "Failure Probability",
      description:
        "ForgeSight estimates the probability of a potential machine failure.",
      icon: Activity,
    },
    {
      number: "05",
      title: "Risk Analysis",
      description:
        "The prediction is translated into Low, Moderate, or High operational risk.",
      icon: ShieldCheck,
    },
    {
      number: "06",
      title: "Maintenance Action",
      description:
        "Risk information is converted into practical maintenance recommendations.",
      icon: Wrench,
    },
  ];

  const technologies = [
    "React + Vite",
    "FastAPI",
    "Python",
    "scikit-learn",
    "Random Forest",
    "Recharts",
  ];

  const capabilities = [
    "Machine failure prediction",
    "Failure-pattern analytics",
    "Failure-mode intelligence",
    "Risk classification",
    "Maintenance recommendations",
    "Real-time API inference",
  ];

  return (
    <main className="about-page">

      <div className="about-glow about-glow-one"></div>
      <div className="about-glow about-glow-two"></div>

      <section className="about-container">

        {/* HEADER */}
        <div className="about-header">

          <div className="about-eyebrow">
            <Sparkles size={15} />
            ABOUT FORGESIGHT AI
          </div>

          <h1>
            Intelligence Built to
            <span> Anticipate Failure.</span>
          </h1>

          <p>
            ForgeSight AI is a predictive-maintenance platform
            that transforms machine operating data into
            actionable failure intelligence and maintenance
            decisions.
          </p>

        </div>

        {/* PLATFORM OVERVIEW */}
        <div className="about-overview">

          <div className="about-overview-main">

            <div className="about-icon-large">
              <Cpu size={34} />
            </div>

            <div>
              <span className="about-label">
                FORGESIGHT AI
              </span>

              <h2>
                See Failures Before They Happen.
              </h2>

              <p>
                The platform combines machine-learning
                prediction, operational analytics, failure
                intelligence, and maintenance guidance in a
                single workflow.
              </p>
            </div>

          </div>

          <div className="about-overview-side">

            <div>
              <Database size={18} />
              <span>
                10,000 machine observations
              </span>
            </div>

            <div>
              <Activity size={18} />
              <span>
                6 predictive sensor inputs
              </span>
            </div>

            <div>
              <ShieldCheck size={18} />
              <span>
                5 observed failure modes
              </span>
            </div>

          </div>

        </div>

        {/* PIPELINE */}
        <div className="about-section-heading">

          <div>
            <span>HOW IT WORKS</span>
            <h2>
              From Machine Data to Maintenance Action
            </h2>
          </div>

          <p>
            Every ForgeSight assessment follows a structured
            predictive-maintenance workflow.
          </p>

        </div>

        <div className="pipeline-grid">

          {pipeline.map((step) => {
            const Icon = step.icon;

            return (
              <div
                className="pipeline-card"
                key={step.number}
              >

                <div className="pipeline-top">

                  <span className="pipeline-number">
                    {step.number}
                  </span>

                  <div className="pipeline-icon">
                    <Icon size={20} />
                  </div>

                </div>

                <h3>{step.title}</h3>

                <p>{step.description}</p>

              </div>
            );
          })}

        </div>

        {/* PLATFORM CAPABILITIES */}
        <div className="about-section-heading capabilities-heading">

          <div>
            <span>PLATFORM CAPABILITIES</span>
            <h2>
              What ForgeSight Delivers
            </h2>
          </div>

          <p>
            A complete workflow from predictive analysis
            to proactive maintenance.
          </p>

        </div>

        <div className="capabilities-grid">

          {capabilities.map((capability) => (
            <div
              className="capability-item"
              key={capability}
            >
              <CheckCircle2 size={18} />
              <span>{capability}</span>
            </div>
          ))}

        </div>

        {/* TECHNOLOGY */}
        <div className="technology-section">

          <div className="about-section-heading">

            <div>
              <span>TECHNOLOGY STACK</span>
              <h2>
                Built with Modern AI Engineering
              </h2>
            </div>

            <p>
              The system separates the user interface,
              prediction API, and machine-learning layer.
            </p>

          </div>

          <div className="technology-grid">

            {technologies.map((technology) => (
              <div
                className="technology-card"
                key={technology}
              >
                <div className="technology-dot"></div>
                <span>{technology}</span>
              </div>
            ))}

          </div>

        </div>

        {/* FOOTER STATEMENT */}
        <div className="about-final">

          <div className="about-final-icon">
            <BrainCircuit size={25} />
          </div>

          <div>

            <span>
              FORGESIGHT AI
            </span>

            <h2>
              Predict. Understand. Act.
            </h2>

            <p>
              The goal is simple: turn machine data into
              earlier decisions, smarter maintenance, and
              fewer unexpected failures.
            </p>

          </div>

        </div>

      </section>
    </main>
  );
}

export default About;