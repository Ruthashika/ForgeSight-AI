import os
import json
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq


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
PREDICTION_DB_PATH = BASE_DIR / "data" / "prediction_history.db"

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
# CLOUD LLM — GROQ
# ============================================================

GROQ_MODEL = "openai/gpt-oss-120b"

groq_client = Groq(
    api_key=os.environ.get("GROQ_API_KEY")
)


def ask_groq(messages):

    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        temperature=0.3,
        max_tokens=1000,
    )

    return response.choices[0].message.content.strip()


# ============================================================
# INPUT SCHEMAS
# ============================================================

class MachineInput(BaseModel):

    machine_name: str
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
# PREDICTION HISTORY DATABASE
# ============================================================

def get_db_connection():
    PREDICTION_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(PREDICTION_DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_prediction_database():
    connection = get_db_connection()
    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS prediction_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                machine_name TEXT NOT NULL,
                machine_type TEXT NOT NULL,
                air_temperature REAL NOT NULL,
                process_temperature REAL NOT NULL,
                rotational_speed REAL NOT NULL,
                torque REAL NOT NULL,
                tool_wear REAL NOT NULL,
                prediction INTEGER NOT NULL,
                health_status TEXT NOT NULL,
                failure_probability REAL NOT NULL,
                risk_level TEXT NOT NULL,
                recommendation TEXT NOT NULL,
                predicted_at TEXT NOT NULL
            )
            """
        )
        connection.commit()
    finally:
        connection.close()


initialize_prediction_database()


def save_prediction(data, prediction_result):
    connection = get_db_connection()
    try:
        cursor = connection.execute(
            """
            INSERT INTO prediction_history (
                machine_name, machine_type, air_temperature,
                process_temperature, rotational_speed, torque,
                tool_wear, prediction, health_status,
                failure_probability, risk_level, recommendation,
                predicted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                data.machine_name.strip(),
                data.machine_type,
                data.air_temperature,
                data.process_temperature,
                data.rotational_speed,
                data.torque,
                data.tool_wear,
                prediction_result["prediction"],
                prediction_result["health_status"],
                prediction_result["failure_probability"],
                prediction_result["risk_level"],
                prediction_result["recommendation"],
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        connection.commit()
        return cursor.lastrowid
    finally:
        connection.close()


def get_prediction_history(machine_name=None, limit=100):
    connection = get_db_connection()
    try:
        if machine_name:
            rows = connection.execute(
                """
                SELECT * FROM prediction_history
                WHERE machine_name = ?
                ORDER BY predicted_at DESC
                LIMIT ?
                """,
                (machine_name.strip(), limit),
            ).fetchall()
        else:
            rows = connection.execute(
                """
                SELECT * FROM prediction_history
                ORDER BY predicted_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

        return [dict(row) for row in rows]
    finally:
        connection.close()


def get_chat_history_context(message, limit=20):
    """
    Retrieve authoritative prediction-history data for chatbot questions.

    Machine-specific history is matched case-insensitively. New records store
    failure_probability as a raw probability from 0 to 1. Older records from
    the previous API version stored the human-readable percentage in the same
    database field, so legacy values greater than 1 are normalized here.
    """

    message_lower = message.lower().strip()

    history_keywords = (
        "history",
        "historical",
        "previous",
        "past prediction",
        "past predictions",
        "latest prediction",
        "last prediction",
        "recent prediction",
        "recent predictions",
        "latest status",
        "last status",
        "risk trend",
        "trend",
        "what happened",
        "how many predictions",
        "prediction count",
        "predictions made",
    )

    connection = get_db_connection()

    try:
        total_predictions = int(
            connection.execute(
                "SELECT COUNT(*) FROM prediction_history"
            ).fetchone()[0]
        )

        if total_predictions == 0:
            return {
                "available": False,
                "reason": "No prediction history is currently available.",
                "machine_name": None,
                "record_count": 0,
                "records": [],
            }

        machine_rows = connection.execute(
            """
            SELECT DISTINCT machine_name
            FROM prediction_history
            WHERE TRIM(machine_name) <> ''
            """
        ).fetchall()

        machine_names = [
            str(row[0]).strip()
            for row in machine_rows
            if row[0]
        ]

        # Match the longest machine name first to avoid partial-name collisions.
        machine_names.sort(key=len, reverse=True)

        matched_machine = next(
            (
                name
                for name in machine_names
                if name.lower() in message_lower
            ),
            None,
        )

        is_history_question = (
            matched_machine is not None
            or any(
                keyword in message_lower
                for keyword in history_keywords
            )
        )

        # Ordinary questions do not need prediction-history data.
        if not is_history_question:
            return {
                "available": False,
                "reason": "The question does not require prediction history.",
                "machine_name": None,
                "record_count": 0,
                "records": [],
            }

        def normalize_records(records):
            normalized = []

            for record in records:
                record = dict(record)

                raw_probability = float(
                    record.get("failure_probability", 0.0)
                )

                # New records store raw probability (0 to 1).
                # Legacy records stored the percentage (0 to 100) in this field.
                if raw_probability > 1:
                    probability = raw_probability / 100
                    percentage = round(raw_probability, 2)
                else:
                    probability = raw_probability
                    percentage = round(raw_probability * 100, 2)

                record["failure_probability"] = round(
                    probability,
                    6,
                )
                record["failure_percentage"] = percentage

                normalized.append(record)

            return normalized

        # ====================================================
        # MACHINE-SPECIFIC HISTORY
        # ====================================================

        if matched_machine:
            machine_records = get_prediction_history(
                machine_name=matched_machine,
                limit=limit,
            )

            normalized_records = normalize_records(
                machine_records
            )

            return {
                "available": True,
                "machine_name": matched_machine,
                "record_count": len(normalized_records),
                "records_returned": len(normalized_records),
                "records": normalized_records,
            }

        # ====================================================
        # GENERAL HISTORY
        # ====================================================

        distinct_machine_count = int(
            connection.execute(
                """
                SELECT COUNT(DISTINCT TRIM(machine_name))
                FROM prediction_history
                WHERE TRIM(machine_name) <> ''
                """
            ).fetchone()[0]
        )

        recent_records = get_prediction_history(
            limit=limit
        )

        normalized_records = normalize_records(
            recent_records
        )

        return {
            "available": True,
            "machine_name": None,
            "total_predictions": total_predictions,
            "distinct_machines": distinct_machine_count,
            "records_returned": len(normalized_records),
            "records": normalized_records,
        }

    finally:
        connection.close()


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

        "llm_available": bool(
            os.environ.get("GROQ_API_KEY")
        ),
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

        prediction_result = {

            "success": True,

            "machine_name": data.machine_name.strip(),

            "prediction": prediction,

            "health_status": health_status,

            "failure_probability":
                failure_percentage,

            "risk_level": risk_level,

            "recommendation":
                recommendation,
        }

        if not data.machine_name.strip():
            return {
                "success": False,
                "error": "Machine name is required.",
            }

        prediction_id = save_prediction(
            data,
            prediction_result,
        )

        prediction_result["prediction_id"] = prediction_id

        return prediction_result

    except Exception as error:

        return {
            "success": False,
            "error": str(error),
        }


# ============================================================
# PREDICTION HISTORY
# ============================================================

@app.get("/prediction-history")
def prediction_history(machine_name: str | None = None):

    try:
        history = get_prediction_history(machine_name=machine_name)

        return {
            "success": True,
            "machine_name": machine_name,
            "count": len(history),
            "history": history,
        }

    except Exception as error:

        return {
            "success": False,
            "error": str(error),
        }


# ============================================================
# TEST CLOUD GROQ CONNECTION
# ============================================================

@app.get("/test-llm")
def test_llm():

    try:

        reply = ask_groq([
            {
                "role": "user",

                "content":
                    "Reply with exactly: ForgeSight cloud LLM connection successful."
            }
        ])

        return {

            "success": True,

            "reply": reply,

            "provider": "Groq",

            "model": GROQ_MODEL,
        }

    except Exception as error:

        return {

            "success": False,

            "error": str(error),
        }


# ============================================================
# EXTRACT MACHINE READINGS FROM CHAT
# ============================================================

def extract_machine_readings(message):

    t = message.lower()

    r = {}

    m = re.search(
        r"(?:machine\s*)?type\s*[:=]?\s*([hlm])\b",
        t,
    )

    if m:
        r["machine_type"] = m.group(1).upper()

    patterns = {

        "air_temperature": [

            r"air\s*temperature\s*[:=]?\s*(-?\d+(?:\.\d+)?)",

            r"air\s*temp\s*[:=]?\s*(-?\d+(?:\.\d+)?)",
        ],

        "process_temperature": [

            r"process\s*temperature\s*[:=]?\s*(-?\d+(?:\.\d+)?)",

            r"process\s*temp\s*[:=]?\s*(-?\d+(?:\.\d+)?)",
        ],

        "rotational_speed": [

            r"rotational\s*speed\s*[:=]?\s*(\d+(?:\.\d+)?)",

            r"rpm\s*[:=]?\s*(\d+(?:\.\d+)?)",
        ],

        "torque": [

            r"torque\s*[:=]?\s*(\d+(?:\.\d+)?)",
        ],

        "tool_wear": [

            r"tool\s*wear\s*[:=]?\s*(\d+(?:\.\d+)?)",

            r"wear\s*[:=]?\s*(\d+(?:\.\d+)?)",
        ],
    }

    for field, ps in patterns.items():

        for p in ps:

            m = re.search(p, t)

            if m:

                r[field] = float(
                    m.group(1)
                )

                break

    required = [

        "machine_type",

        "air_temperature",

        "process_temperature",

        "rotational_speed",

        "torque",

        "tool_wear",
    ]

    return (
        r
        if all(x in r for x in required)
        else None
    )


# ============================================================
# RUN ACTUAL MODEL PREDICTION FOR COPILOT
# ============================================================

def run_actual_prediction(r):

    if model is None:
        return None

    features = pd.DataFrame(

        [[
            r["machine_type"],
            r["air_temperature"],
            r["process_temperature"],
            r["rotational_speed"],
            r["torque"],
            r["tool_wear"],
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

    prediction = int(
        model.predict(features)[0]
    )

    probability = (
        1.0
        if prediction
        else 0.0
    )

    if hasattr(
        model,
        "predict_proba",
    ):

        probs = model.predict_proba(
            features
        )[0]

        if hasattr(
            model,
            "classes_",
        ):

            probability = float(
                dict(
                    zip(
                        model.classes_,
                        probs,
                    )
                ).get(
                    1,
                    probs[-1],
                )
            )

        else:

            probability = float(
                probs[-1]
            )

    percentage = round(
        probability * 100,
        2,
    )

    risk = (
        "HIGH"
        if percentage >= 70
        else "MODERATE"
        if percentage >= 35
        else "LOW"
    )

    status = (

        "FAILURE RISK DETECTED"

        if prediction

        else (

            "MACHINE REQUIRES ATTENTION"

            if risk == "MODERATE"

            else "MACHINE HEALTHY"
        )
    )

    recommendation = (

        "Inspect the machine before continued "
        "operation and follow safety/isolation procedures."

        if prediction

        else (

            "Continue close monitoring and "
            "schedule preventive inspection."

            if risk == "MODERATE"

            else
            "Continue normal operation and regular monitoring."
        )
    )

    return {

        "prediction": prediction,

        "failure_probability": percentage,

        "risk_level": risk,

        "health_status": status,

        "recommendation": recommendation,
    }


# ============================================================
# BUILD FORGESIGHT PROMPT
# ============================================================

def build_prompt(
    mode,
    context,
    prediction=None,
    history_context=None,
):

    style = {

        "simple":
            "Explain for a beginner with simple examples and minimal jargon.",

        "normal":
            "Give a clear balanced engineering explanation.",

        "technical":
            "Give detailed engineering explanations including sensors, failure mechanisms and model limitations.",

    }.get(
        mode,
        "Give a clear balanced engineering explanation.",
    )

    actual = (

        f"\nACTUAL MODEL RESULT:\n"
        f"{json.dumps(prediction, indent=2)}\n"
        f"Use these values exactly; do not invent a prediction.\n"

        if prediction

        else ""
    )

    history = (
        f"""
AUTHORITATIVE FORGESIGHT PREDICTION HISTORY
============================================

The following data comes directly from the ForgeSight prediction database.
This data is authoritative for stored prediction-history questions.

Rules for using this data:
1. Use these database records when answering questions about stored predictions.
2. Do not claim that a machine has no history when records are present here.
3. Do not replace stored machine-history values with training-dataset statistics.
4. Do not invent, infer, or fabricate historical records.
5. For a latest/current stored prediction question, use the first record because
   the records are ordered newest-first.
6. failure_probability is the raw model probability from 0 to 1.
7. failure_percentage is the human-readable percentage from 0 to 100.
8. Historical records are different from a new live model prediction.
9. Only perform a new live prediction when the user provides complete sensor
   readings that can be passed to the model.

DATABASE HISTORY:
{json.dumps(history_context, indent=2)}

Use stored history values exactly. If the requested historical data is not
present in this database context, clearly say that it is not available.
"""
        if history_context and history_context.get("available")
        else ""
    )

    return f"""
You are the ForgeSight Maintenance Intelligence Assistant inside ForgeSight AI.

Answer general and technical questions about industrial machines, maintenance, predictive maintenance, motors, bearings, gearboxes, pumps, temperature, RPM, torque, tool wear, vibration, lubrication, failures, troubleshooting and ForgeSight analytics.

Use conversation history for follow-ups.

Distinguish general knowledge from ForgeSight facts.

Never invent statistics, readings, history, model metrics or predictions.

When PREDICTION HISTORY DATA is provided, treat it as the authoritative record of predictions stored by ForgeSight. Use it to answer questions about a machine's latest status, previous predictions, prediction count, risk changes, failure probability, recommendations, timestamps and recent activity.

If the requested historical record is not included in the provided data, say that the available ForgeSight history does not contain enough information rather than guessing. Do not confuse the training dataset statistics with stored machine prediction history.

Do not claim to physically inspect or definitively diagnose a machine.

For dangerous maintenance, recommend shutdown/isolation, lockout/tagout where applicable, manufacturer instructions and qualified personnel.

{style}

FORGESIGHT CONTEXT:

{json.dumps(context, indent=2)}

{actual}
"""


# ============================================================
# FORGESIGHT COPILOT CHAT
# ============================================================

@app.post("/chat")
def forge_chat(
    data: ChatMessage
):

    message = data.message.strip()

    if not message:

        return {
            "success": True,

            "reply":
                "Hi! Ask me about machines, sensors, failures, maintenance or ForgeSight.",
        }

    try:

        context = get_forgesight_context()

        readings = extract_machine_readings(
            message
        )

        prediction = (
            run_actual_prediction(readings)
            if readings
            else None
        )

        history_context = get_chat_history_context(message)

        messages = [

            {
                "role": "system",

                "content":
                    build_prompt(
                        data.mode,
                        context,
                        prediction,
                        history_context,
                    ),
            }
        ]

        # Add a separate database-grounding message so the LLM receives an
        # explicit authoritative source for machine-history questions.
        if (
            history_context
            and history_context.get("available")
        ):
            messages.append(
                {
                    "role": "system",
                    "content": (
                        "DATABASE GROUNDING INSTRUCTION:\n"
                        "The following prediction-history data was retrieved "
                        "directly from the ForgeSight database. It is "
                        "authoritative for this conversation. Do not say that "
                        "the machine has no prediction history when records are "
                        "present. For a latest prediction question, use the "
                        "newest record (the first record in the records list).\n\n"
                        + json.dumps(
                            history_context,
                            indent=2,
                        )
                    ),
                }
            )

        for item in data.history[-12:]:

            if (
                isinstance(item, dict)
                and item.get("role")
                in ["user", "assistant"]
            ):

                content = (
                    item.get("content")
                    or item.get("text")
                )

                if content:

                    messages.append(
                        {
                            "role":
                                item["role"],

                            "content":
                                str(content),
                        }
                    )

        user_content = message

        if (
            history_context
            and history_context.get("available")
            and history_context.get("records")
        ):
            latest_record = history_context["records"][0]

            user_content = (
                f"{message}\n\n"
                "IMPORTANT DATABASE NOTE: ForgeSight has matching stored "
                "prediction history for this question. Use the database "
                "records supplied in the system messages. Do not answer that "
                "the history is unavailable. If this asks for the latest "
                "prediction, use the newest stored record (first record)."
                f"\nLatest stored record ID: {latest_record.get('id')}"
            )

        messages.append(
            {
                "role": "user",
                "content": user_content,
            }
        )

        # ====================================================
        # GROQ CLOUD LLM
        # ====================================================

        reply = ask_groq(messages)

        return {

            "success": True,

            "reply":
                reply
                or "Please try asking again.",

            "provider": "Groq",

            "model": GROQ_MODEL,

            "mode": data.mode,

            "machine_prediction":
                prediction,
        }

    except Exception as error:

        print(
            f"⚠ Copilot error: {error}"
        )

        return {

            "success": False,

            "reply":
                "The maintenance assistant encountered an error.",

            "error":
                str(error),
        }