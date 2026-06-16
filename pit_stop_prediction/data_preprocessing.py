import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    data = df.copy()
    
    compound_hardness = {'SOFT': 1, 'MEDIUM': 2, 'HARD': 3, 'INTER': 4, 'WET': 5}
    data['Compound_Hardness'] = data['Compound'].map(compound_hardness).fillna(3).astype(int)
    data['Tyre_Stress'] = data['TyreLife'] / data['Compound_Hardness']
    data['Degradation_Rate'] = data['Cumulative_Degradation'] / (data['TyreLife'] + 1)
    data['Position_Pressure'] = data['Position'] * data['TyreLife']
    
    if 'id' in data.columns and 'PitStop' in data.columns:
        data['Stops_So_Far'] = data.groupby('id')['PitStop'].transform('cumsum')
    else:
        data['Stops_So_Far'] = 0.0
        
    data['Compound_x_TyreLife'] = data['Compound_Hardness'] * data['TyreLife']
    
    return data

def build_preprocessor(numerical_cols, categorical_cols):
    cat_pipeline = Pipeline([
        ('impute', SimpleImputer(strategy='most_frequent')),
        ('ohe', OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore'))
    ])
    
    num_pipeline = Pipeline([
        ('impute', SimpleImputer(strategy='median')),
        ('scale', StandardScaler())
    ])
    
    preprocessor = ColumnTransformer([
        ('cat', cat_pipeline, categorical_cols),
        ('num', num_pipeline, numerical_cols)
    ])
    
    return preprocessor
