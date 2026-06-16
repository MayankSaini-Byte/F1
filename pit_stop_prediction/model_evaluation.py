import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
    roc_curve
)

def evaluate_predictions(y_true, y_pred, y_prob):
    auc = roc_auc_score(y_true, y_prob)
    acc = accuracy_score(y_true, y_pred)
    
    print("=" * 60)
    print("                  Model Evaluation Metrics")
    print("=" * 60)
    print(f"Accuracy Score: {acc:.4f}")
    print(f"ROC-AUC Score:  {auc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_true, y_pred))
    print("=" * 60)
    
    return {"accuracy": acc, "roc_auc": auc}

def plot_confusion_matrix(y_true, y_pred, title="Confusion Matrix"):
    cm = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False, ax=ax)
    ax.set_xlabel('Predicted Label')
    ax.set_ylabel('True Label')
    ax.set_title(title, fontweight='bold', pad=10)
    plt.tight_layout()
    return fig

def plot_roc_curve(y_true, y_prob, title="ROC Curve"):
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    auc = roc_auc_score(y_true, y_prob)
    
    fig, ax = plt.subplots(figsize=(6, 5))
    ax.plot(fpr, tpr, label=f"ROC Curve (AUC = {auc:.4f})", color='cornflowerblue', lw=2)
    ax.plot([0, 1], [0, 1], 'k--', lw=2)
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel('False Positive Rate')
    ax.set_ylabel('True Positive Rate')
    ax.set_title(title, fontweight='bold', pad=10)
    ax.legend(loc="lower right")
    plt.tight_layout()
    return fig
