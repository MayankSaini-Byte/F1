import os
import pandas as pd

CSV_PATH = os.path.join(os.path.dirname(__file__), 'CSVs', 'train.csv')

def load_raw_data():
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Source CSV not found at {CSV_PATH}. Please make sure train.csv is in data/CSVs/.")
    
    return pd.read_csv(CSV_PATH)

if __name__ == '__main__':
    df = load_raw_data()
    print(f"Loaded DataFrame with shape: {df.shape}")
