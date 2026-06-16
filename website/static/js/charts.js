/* ═══════════════════════════════════════════════════════════════
   PITVISION AI — Charts Module
   Plotly.js chart configurations for the model insights page
   ═══════════════════════════════════════════════════════════════ */

// Charts are rendered inline in model_insights.html and predictor.js
// This file provides shared Plotly layout defaults

const PITVISION_CHART_LAYOUT = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
        family: 'Inter, sans-serif',
        color: 'rgba(255,255,255,0.5)',
        size: 12,
    },
    xaxis: {
        gridcolor: 'rgba(255,255,255,0.04)',
        zerolinecolor: 'rgba(255,255,255,0.06)',
    },
    yaxis: {
        gridcolor: 'rgba(255,255,255,0.04)',
        zerolinecolor: 'rgba(255,255,255,0.06)',
    },
    margin: { t: 20, b: 50, l: 60, r: 20 },
};

const PITVISION_CHART_CONFIG = {
    responsive: true,
    displayModeBar: false,
};
