import os
import json
import re
import urllib.request
import urllib.error
from pathlib import Path

import joblib
import pandas as pd

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ============================================================
# FORGESIGHT AI — FASTAPI BACKEND
# ============================================================

app = FastAPI(
    title="ForgeSight AI",
    description="Predictive maintenance intelligence API",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://forgesight-ai-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "models" / "forgesight_model.pkl"

DATA_PATH = BASE_DIR / "data" / "ai4i2020.csv"

PERFORMANCE_PATH = (
    BASE_DIR / "models" / "model_comparison.csv"
)


# ============================================================
# LOAD FORGESIGHT ML MODEL
# ============================================================

model = None

try:
    model = joblib.load(MODEL_PATH)

    print(
        f"✓ ForgeSight model loaded: {MODEL_PATH}"
    )

except Exception as error:

    print(
        f"⚠ Model could not be loaded: {error}"
    )


# ============================================================
# LOCAL OLLAMA LLM
# ============================================================

OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
OLLAMA_MODEL = "llama3.2:3b"


def ask_ollama(messages):
    payload = {"model": OLLAMA_MODEL, "messages": messages, "stream": False,
               "options": {"temperature": 0.3, "num_ctx": 4096}}
    request = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        result = json.loads(response.read().decode("utf-8"))
    return result.get("message", {}).get("content", "").strip()


# ============================================================
# INPUT SCHEMAS
# ============================================================

class MachineInput(BaseModel):
    machine_type: str
    air_temperature: float
    process_temperature: float
    rotational_speed: float
    torque: float
    tool_wear: float


class ChatMessage(BaseModel):
    message: str
    history: list = []
    mode: str = "normal"


# ============================================================
# HELPER — LOAD DATASET
# ============================================================

def load_dataset():

    if not DATA_PATH.exists():

        raise FileNotFoundError(
            f"Dataset not found: {DATA_PATH}"
        )

    return pd.read_csv(DATA_PATH)


# ============================================================
# HELPER — MODEL PERFORMANCE
# ============================================================

def get_model_performance():

    if not PERFORMANCE_PATH.exists():

        return {
            "selected_model": "Unknown",
            "metrics": {},
        }

    performance_df = pd.read_csv(
        PERFORMANCE_PATH,
        index_col=0,
    )

    if performance_df.empty:

        return {
            "selected_model": "Unknown",
            "metrics": {},
        }

    # Select model with highest F1 score
    best_model_name = performance_df["f1"].idxmax()

    best_row = performance_df.loc[
        best_model_name
    ]

    metrics = {
        "accuracy": round(
            float(best_row["accuracy"]) * 100,
            2,
        ),
        "precision": round(
            float(best_row["precision"]) * 100,
            2,
        ),
        "recall": round(
            float(best_row["recall"]) * 100,
            2,
        ),
        "f1_score": round(
            float(best_row["f1"]) * 100,
            2,
        ),
        "roc_auc": round(
            float(best_row["roc_auc"]) * 100,
            2,
        ),
    }

    return {
        "selected_model": best_model_name,
        "metrics": metrics,
    }


# ============================================================
# HELPER — FEATURE IMPORTANCE
# ============================================================

def get_feature_importance():

    if model is None:
        return []

    try:

        # Trained object is a Pipeline
        preprocessor = model.named_steps[
            "preprocessor"
        ]

        classifier = model.named_steps[
            "classifier"
        ]

        # Get transformed feature names
        feature_names = (
            preprocessor
            .get_feature_names_out()
        )

        importances = (
            classifier.feature_importances_
        )

        importance_data = []

        for feature_name, importance in zip(
            feature_names,
            importances,
        ):

            clean_name = feature_name

            # Remove transformer prefixes
            if "__" in clean_name:

                clean_name = clean_name.split(
                    "__",
                    1,
                )[1]

            # Aggregate categorical machine type
            if clean_name.startswith("Type_"):

                clean_name = "Machine Type"

            importance_data.append(
                {
                    "feature": clean_name,
                    "importance": round(
                        float(importance) * 100,
                        2,
                    ),
                }
            )

        # Aggregate duplicate Machine Type entries
        aggregated = {}

        for item in importance_data:

            feature = item["feature"]

            aggregated[feature] = (
                aggregated.get(feature, 0)
                + item["importance"]
            )

        result = [
            {
                "feature": feature,
                "importance": round(
                    importance,
                    2,
                ),
            }
            for feature, importance
            in aggregated.items()
        ]

        result.sort(
            key=lambda item: item["importance"],
            reverse=True,
        )

        return result

    except Exception as error:

        print(
            f"⚠ Feature importance error: {error}"
        )

        return []


# ============================================================
# HELPER — FORGESIGHT CONTEXT FOR LLM
# ============================================================

def get_forgesight_context():

    try:

        df = load_dataset()

        total_machines = len(df)

        total_failures = int(
            df["Machine failure"].sum()
        )

        total_healthy = (
            total_machines
            - total_failures
        )

        failure_rate = round(
            (
                total_failures
                / total_machines
            )
            * 100,
            2,
        )

        machine_types = (
            df["Type"]
            .value_counts()
            .sort_index()
            .astype(int)
            .to_dict()
        )

        failures_by_type = (
            df.groupby("Type")[
                "Machine failure"
            ]
            .sum()
            .astype(int)
            .to_dict()
        )

        failure_modes = {
            "Tool Wear Failure": int(
                df["TWF"].sum()
            ),
            "Heat Dissipation Failure": int(
                df["HDF"].sum()
            ),
            "Power Failure": int(
                df["PWF"].sum()
            ),
            "Overstrain Failure": int(
                df["OSF"].sum()
            ),
            "Random Failure": int(
                df["RNF"].sum()
            ),
        }

        sensor_averages = {
            "Air Temperature [K]": round(
                float(
                    df[
                        "Air temperature [K]"
                    ].mean()
                ),
                2,
            ),
            "Process Temperature [K]": round(
                float(
                    df[
                        "Process temperature [K]"
                    ].mean()
                ),
                2,
            ),
            "Rotational Speed [rpm]": round(
                float(
                    df[
                        "Rotational speed [rpm]"
                    ].mean()
                ),
                2,
            ),
            "Torque [Nm]": round(
                float(
                    df["Torque [Nm]"].mean()
                ),
                2,
            ),
            "Tool Wear [min]": round(
                float(
                    df["Tool wear [min]"].mean()
                ),
                2,
            ),
        }

        model_info = get_model_performance()

        feature_importance = (
            get_feature_importance()
        )

        return {
            "dataset": {
                "total_machines": total_machines,
                "total_failures": total_failures,
                "total_healthy": total_healthy,
                "failure_rate": failure_rate,
                "machine_types": machine_types,
                "failures_by_type": failures_by_type,
                "failure_modes": failure_modes,
                "sensor_averages": sensor_averages,
            },
            "model": model_info,
            "feature_importance": feature_importance,
        }

    except Exception as error:

        print(
            f"⚠ ForgeSight context error: {error}"
        )

        return {
            "error": str(error)
        }


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "application": "ForgeSight AI",
        "status": "online",
        "message": "See Failures Before They Happen.",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "dataset_available": DATA_PATH.exists(),
        "llm_available": True,
    }


# ============================================================
# ANALYTICS
# ============================================================

@app.get("/analytics")
def get_analytics():

    try:

        df = load_dataset()

        total_machines = len(df)

        total_failures = int(
            df["Machine failure"].sum()
        )

        total_healthy = (
            total_machines
            - total_failures
        )

        failure_rate = round(
            (
                total_failures
                / total_machines
            )
            * 100,
            2,
        )

        machine_types = (
            df["Type"]
            .value_counts()
            .sort_index()
            .astype(int)
            .to_dict()
        )

        failures_by_type = (
            df.groupby("Type")[
                "Machine failure"
            ]
            .sum()
            .astype(int)
            .to_dict()
        )

        failure_modes = {
            "Tool Wear Failure": int(
                df["TWF"].sum()
            ),
            "Heat Dissipation Failure": int(
                df["HDF"].sum()
            ),
            "Power Failure": int(
                df["PWF"].sum()
            ),
            "Overstrain Failure": int(
                df["OSF"].sum()
            ),
            "Random Failure": int(
                df["RNF"].sum()
            ),
        }

        sensor_averages = {
            "Air Temperature [K]": round(
                float(
                    df[
                        "Air temperature [K]"
                    ].mean()
                ),
                2,
            ),
            "Process Temperature [K]": round(
                float(
                    df[
                        "Process temperature [K]"
                    ].mean()
                ),
                2,
            ),
            "Rotational Speed [rpm]": round(
                float(
                    df[
                        "Rotational speed [rpm]"
                    ].mean()
                ),
                2,
            ),
            "Torque [Nm]": round(
                float(
                    df["Torque [Nm]"].mean()
                ),
                2,
            ),
            "Tool Wear [min]": round(
                float(
                    df["Tool wear [min]"].mean()
                ),
                2,
            ),
        }

        return {
            "success": True,

            "summary": {
                "total_machines": total_machines,
                "total_failures": total_failures,
                "total_healthy": total_healthy,
                "failure_rate": failure_rate,
            },

            "machine_types": machine_types,

            "failures_by_type": failures_by_type,

            "failure_modes": failure_modes,

            "sensor_averages": sensor_averages,
        }

    except Exception as error:

        return {
            "success": False,
            "error": str(error),
        }


# ============================================================
# MODEL INFORMATION
# ============================================================

@app.get("/model-info")
def get_model_info():

    try:

        performance = (
            get_model_performance()
        )

        feature_importance = (
            get_feature_importance()
        )

        return {
            "success": True,

            "model": performance[
                "selected_model"
            ],

            "metrics": performance[
                "metrics"
            ],

            "feature_importance":
                feature_importance,
        }

    except Exception as error:

        return {
            "success": False,
            "error": str(error),
        }


# ============================================================
# PREDICTION
# ============================================================

@app.post("/predict")
def predict_machine_failure(
    data: MachineInput,
):

    if model is None:

        return {
            "success": False,
            "error":
                "Machine learning model is not loaded.",
        }

    features = pd.DataFrame(
        [[
            data.machine_type,
            data.air_temperature,
            data.process_temperature,
            data.rotational_speed,
            data.torque,
            data.tool_wear,
        ]],
        columns=[
            "Type",
            "Air temperature [K]",
            "Process temperature [K]",
            "Rotational speed [rpm]",
            "Torque [Nm]",
            "Tool wear [min]",
        ],
    )

    try:

        prediction = int(
            model.predict(features)[0]
        )

        failure_probability = (
            1.0
            if prediction == 1
            else 0.0
        )

        if hasattr(
            model,
            "predict_proba",
        ):

            probabilities = (
                model.predict_proba(
                    features
                )[0]
            )

            if hasattr(
                model,
                "classes_",
            ):

                class_probabilities = dict(
                    zip(
                        model.classes_,
                        probabilities,
                    )
                )

                failure_probability = float(
                    class_probabilities.get(
                        1,
                        0.0,
                    )
                )

            else:

                failure_probability = float(
                    probabilities[-1]
                )

        failure_percentage = round(
            failure_probability * 100,
            2,
        )

        if failure_percentage >= 70:

            risk_level = "HIGH"

        elif failure_percentage >= 35:

            risk_level = "MODERATE"

        else:

            risk_level = "LOW"

        if prediction == 1:

            health_status = (
                "FAILURE RISK DETECTED"
            )

        else:

            health_status = (
                "MACHINE HEALTHY"
            )

        if risk_level == "HIGH":

            recommendation = (
                "Immediate inspection recommended. "
                "Consider reducing machine load and "
                "scheduling maintenance."
            )

        elif risk_level == "MODERATE":

            recommendation = (
                "Preventive maintenance recommended. "
                "Continue monitoring machine parameters "
                "and schedule an inspection."
            )

        else:

            recommendation = (
                "Machine operating within a relatively "
                "safe range. Continue regular monitoring."
            )

        return {
            "success": True,
            "prediction": prediction,
            "health_status": health_status,
            "failure_probability":
                failure_percentage,
            "risk_level": risk_level,
            "recommendation":
                recommendation,
        }

    except Exception as error:

        return {
            "success": False,
            "error": str(error),
        }


# ============================================================
# TEST LOCAL OLLAMA CONNECTION
# ============================================================

@app.get("/test-llm")
def test_llm():
    try:
        reply = ask_ollama([{"role": "user", "content": "Reply with exactly: ForgeSight local LLM connection successful."}])
        return {"success": True, "reply": reply, "provider": "Ollama", "model": OLLAMA_MODEL}
    except urllib.error.URLError:
        return {"success": False, "error": f"Ollama is not running. Start Ollama and install {OLLAMA_MODEL}."}
    except Exception as error:
        return {"success": False, "error": str(error)}


def extract_machine_readings(message):
    t = message.lower(); r = {}
    m = re.search(r"(?:machine\s*)?type\s*[:=]?\s*([hlm])\b", t)
    if m: r["machine_type"] = m.group(1).upper()
    patterns = {
        "air_temperature": [r"air\s*temperature\s*[:=]?\s*(-?\d+(?:\.\d+)?)", r"air\s*temp\s*[:=]?\s*(-?\d+(?:\.\d+)?)"],
        "process_temperature": [r"process\s*temperature\s*[:=]?\s*(-?\d+(?:\.\d+)?)", r"process\s*temp\s*[:=]?\s*(-?\d+(?:\.\d+)?)"],
        "rotational_speed": [r"rotational\s*speed\s*[:=]?\s*(\d+(?:\.\d+)?)", r"rpm\s*[:=]?\s*(\d+(?:\.\d+)?)"],
        "torque": [r"torque\s*[:=]?\s*(\d+(?:\.\d+)?)"],
        "tool_wear": [r"tool\s*wear\s*[:=]?\s*(\d+(?:\.\d+)?)", r"wear\s*[:=]?\s*(\d+(?:\.\d+)?)"],
    }
    for field, ps in patterns.items():
        for p in ps:
            m = re.search(p, t)
            if m: r[field] = float(m.group(1)); break
    required = ["machine_type", "air_temperature", "process_temperature", "rotational_speed", "torque", "tool_wear"]
    return r if all(x in r for x in required) else None


def run_actual_prediction(r):
    if model is None: return None
    features = pd.DataFrame([[r["machine_type"], r["air_temperature"], r["process_temperature"], r["rotational_speed"], r["torque"], r["tool_wear"]]], columns=["Type", "Air temperature [K]", "Process temperature [K]", "Rotational speed [rpm]", "Torque [Nm]", "Tool wear [min]"])
    prediction = int(model.predict(features)[0]); probability = 1.0 if prediction else 0.0
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(features)[0]
        probability = float(dict(zip(model.classes_, probs)).get(1, probs[-1])) if hasattr(model, "classes_") else float(probs[-1])
    percentage = round(probability * 100, 2)
    risk = "HIGH" if percentage >= 70 else "MODERATE" if percentage >= 35 else "LOW"
    status = "FAILURE RISK DETECTED" if prediction else ("MACHINE REQUIRES ATTENTION" if risk == "MODERATE" else "MACHINE HEALTHY")
    recommendation = "Inspect the machine before continued operation and follow safety/isolation procedures." if prediction else ("Continue close monitoring and schedule preventive inspection." if risk == "MODERATE" else "Continue normal operation and regular monitoring.")
    return {"prediction": prediction, "failure_probability": percentage, "risk_level": risk, "health_status": status, "recommendation": recommendation}


def build_prompt(mode, context, prediction=None):
    style = {"simple": "Explain for a beginner with simple examples and minimal jargon.", "normal": "Give a clear balanced engineering explanation.", "technical": "Give detailed engineering explanations including sensors, failure mechanisms and model limitations."}.get(mode, "Give a clear balanced engineering explanation.")
    actual = f"\nACTUAL MODEL RESULT:\n{json.dumps(prediction, indent=2)}\nUse these values exactly; do not invent a prediction.\n" if prediction else ""
    return f"""You are the PredictX Maintenance Intelligence Assistant inside ForgeSight AI. Answer general and technical questions about industrial machines, maintenance, predictive maintenance, motors, bearings, gearboxes, pumps, temperature, RPM, torque, tool wear, vibration, lubrication, failures, troubleshooting and ForgeSight analytics. Use conversation history for follow-ups. Distinguish general knowledge from ForgeSight facts. Never invent statistics, readings, history, model metrics or predictions. Do not claim to physically inspect or definitively diagnose a machine. For dangerous maintenance, recommend shutdown/isolation, lockout/tagout where applicable, manufacturer instructions and qualified personnel. {style}\n\nFORGESIGHT CONTEXT:\n{json.dumps(context, indent=2)}{actual}"""


@app.post("/chat")
def forge_chat(data: ChatMessage):
    message = data.message.strip()
    if not message:
        return {"success": True, "reply": "Hi! Ask me about machines, sensors, failures, maintenance or ForgeSight."}
    try:
        context = get_forgesight_context(); readings = extract_machine_readings(message)
        prediction = run_actual_prediction(readings) if readings else None
        messages = [{"role": "system", "content": build_prompt(data.mode, context, prediction)}]
        for item in data.history[-12:]:
            if isinstance(item, dict) and item.get("role") in ["user", "assistant"]:
                content = item.get("content") or item.get("text")
                if content: messages.append({"role": item["role"], "content": str(content)})
        messages.append({"role": "user", "content": message})
        reply = ask_ollama(messages)
        return {"success": True, "reply": reply or "Please try asking again.", "provider": "Ollama", "model": OLLAMA_MODEL, "mode": data.mode, "machine_prediction": prediction}
    except urllib.error.URLError:
        return {"success": False, "reply": "Ollama is not running. Start Ollama and try again.", "error": "Ollama connection failed"}
    except Exception as error:
        print(f"⚠ Copilot error: {error}")
        return {"success": False, "reply": "The maintenance assistant encountered an error.", "error": str(error)}

