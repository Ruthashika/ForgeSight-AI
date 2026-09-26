from pathlib import Path

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier


# ============================================================
# ForgeSight AI - Predictive Maintenance Model Training
# Dataset: AI4I 2020 Predictive Maintenance Dataset
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "ai4i2020.csv"
MODEL_DIR = BASE_DIR / "models"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 60)
print("FORGESIGHT AI - MODEL TRAINING")
print("=" * 60)

# ------------------------------------------------------------
# 1. Load dataset
# ------------------------------------------------------------
if not DATA_PATH.exists():
    raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

df = pd.read_csv(DATA_PATH)

print(f"\nDataset loaded: {DATA_PATH}")
print(f"Shape: {df.shape}")

# ------------------------------------------------------------
# 2. Select features and target
# ------------------------------------------------------------
FEATURES = [
    "Type",
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]",
]

TARGET = "Machine failure"

X = df[FEATURES].copy()
y = df[TARGET].astype(int)

print("\nFeatures:")
for feature in FEATURES:
    print(f"  - {feature}")

print(f"\nTarget: {TARGET}")
print("\nTarget distribution:")
print(y.value_counts().sort_index())

# ------------------------------------------------------------
# 3. Train / test split
# ------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

print(f"\nTraining samples: {len(X_train)}")
print(f"Testing samples:  {len(X_test)}")

# ------------------------------------------------------------
# 4. Preprocessing
# ------------------------------------------------------------
categorical_features = ["Type"]

numeric_features = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]",
]

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            Pipeline(
                steps=[
                    ("imputer", SimpleImputer(strategy="most_frequent")),
                    (
                        "onehot",
                        OneHotEncoder(
                            handle_unknown="ignore",
                            sparse_output=False,
                        ),
                    ),
                ]
            ),
            categorical_features,
        ),
        (
            "numeric",
            Pipeline(
                steps=[
                    ("imputer", SimpleImputer(strategy="median")),
                    ("scaler", StandardScaler()),
                ]
            ),
            numeric_features,
        ),
    ]
)

# ------------------------------------------------------------
# 5. Candidate models
# ------------------------------------------------------------
models = {
    "Logistic Regression": LogisticRegression(
        max_iter=2000,
        class_weight="balanced",
        random_state=42,
    ),
    "Random Forest": RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_split=4,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    ),
}

results = {}

print("\n" + "=" * 60)
print("MODEL COMPARISON")
print("=" * 60)

best_name = None
best_pipeline = None
best_f1 = -1

# ------------------------------------------------------------
# 6. Train and evaluate
# ------------------------------------------------------------
for name, classifier in models.items():

    print(f"\nTraining {name}...")

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )

    pipeline.fit(X_train, y_train)

    predictions = pipeline.predict(X_test)
    probabilities = pipeline.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, predictions)
    precision = precision_score(y_test, predictions, zero_division=0)
    recall = recall_score(y_test, predictions, zero_division=0)
    f1 = f1_score(y_test, predictions, zero_division=0)
    roc_auc = roc_auc_score(y_test, probabilities)

    results[name] = {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "roc_auc": roc_auc,
    }

    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1 Score : {f1:.4f}")
    print(f"ROC-AUC  : {roc_auc:.4f}")

    if f1 > best_f1:
        best_f1 = f1
        best_name = name
        best_pipeline = pipeline

# ------------------------------------------------------------
# 7. Display winner
# ------------------------------------------------------------
print("\n" + "=" * 60)
print("BEST MODEL")
print("=" * 60)

print(f"Selected model: {best_name}")
print(f"Best F1 score: {best_f1:.4f}")

# ------------------------------------------------------------
# 8. Detailed report for best model
# ------------------------------------------------------------
best_predictions = best_pipeline.predict(X_test)

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        best_predictions,
        target_names=["Healthy", "Failure"],
        zero_division=0,
    )
)

# ------------------------------------------------------------
# 9. Save model
# ------------------------------------------------------------
MODEL_PATH = MODEL_DIR / "forgesight_model.pkl"

joblib.dump(best_pipeline, MODEL_PATH)

print("\n" + "=" * 60)
print("MODEL SAVED")
print("=" * 60)
print(f"Model path: {MODEL_PATH}")

# ------------------------------------------------------------
# 10. Save evaluation results
# ------------------------------------------------------------
results_df = pd.DataFrame(results).T
results_path = MODEL_DIR / "model_comparison.csv"

results_df.to_csv(results_path)

print(f"Comparison saved: {results_path}")

print("\nTraining completed successfully.")