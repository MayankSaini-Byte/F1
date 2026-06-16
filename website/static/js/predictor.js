/* ═══════════════════════════════════════════════════════════════
   PITVISION AI — Predictor Logic
   Form handling, API calls, result display with animations
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    initTireSelector();
    initSliders();
    initPredictorForm();
    initWhyPredictionCollapse();
});


// ── Tire Compound Visual Selector ────────────────────────────────
function initTireSelector() {
    const selector = document.getElementById('tire-selector');
    const hiddenInput = document.getElementById('input-compound');
    if (!selector) return;

    const options = selector.querySelectorAll('.tire-option');
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            hiddenInput.value = opt.dataset.compound;
        });
    });
}


// ── Slider Value Displays ────────────────────────────────────────
function initSliders() {
    // Tyre Life slider
    const tyreSlider = document.getElementById('input-tyrelife');
    const tyreDisplay = document.getElementById('tyre-life-display');
    if (tyreSlider && tyreDisplay) {
        tyreSlider.addEventListener('input', () => {
            tyreDisplay.textContent = tyreSlider.value;
        });
    }

    // Race Progress slider
    const progressSlider = document.getElementById('input-progress');
    const progressDisplay = document.getElementById('progress-display');
    if (progressSlider && progressDisplay) {
        progressSlider.addEventListener('input', () => {
            progressDisplay.textContent = progressSlider.value + '%';
        });
    }
}


// ── Predictor Form Submission ────────────────────────────────────
function initPredictorForm() {
    const form = document.getElementById('predictor-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await runPrediction();
    });
}

async function runPrediction() {
    const waitingEl = document.getElementById('result-waiting');
    const loadingEl = document.getElementById('prediction-loading');
    const resultEl = document.getElementById('result-display');
    const scanText = document.getElementById('scanning-text');

    // Switch to loading state
    if (waitingEl) waitingEl.style.display = 'none';
    if (resultEl) { resultEl.style.display = 'none'; resultEl.classList.remove('active'); }
    if (loadingEl) { loadingEl.style.display = 'flex'; loadingEl.classList.add('active'); }

    // Sound effect
    if (window.PitVisionSound) window.PitVisionSound.radio();

    // Scanning text animation
    const scanMessages = [
        'Analyzing race data...',
        'Processing tire telemetry...',
        'Computing degradation model...',
        'Evaluating pit window...',
        'Generating recommendation...',
    ];

    let scanIdx = 0;
    const scanInterval = setInterval(() => {
        scanIdx = (scanIdx + 1) % scanMessages.length;
        if (scanText) scanText.textContent = scanMessages[scanIdx];
    }, 600);

    // Gather form data
    const progressValue = parseFloat(document.getElementById('input-progress').value) / 100;
    const tyreLife = parseFloat(document.getElementById('input-tyrelife').value);

    const payload = {
        Driver: document.getElementById('input-driver').value || 'VER',
        Compound: document.getElementById('input-compound').value || 'SOFT',
        Race: document.getElementById('input-race').value,
        Year: parseInt(document.getElementById('input-year').value),
        PitStop: 0,
        LapNumber: parseInt(document.getElementById('input-lap').value),
        Stint: parseInt(document.getElementById('input-stint').value),
        TyreLife: tyreLife,
        Position: parseInt(document.getElementById('input-position').value),
        LapTime_s: parseFloat(document.getElementById('input-laptime').value),
        LapTime_Delta: 0,
        Cumulative_Degradation: tyreLife * 1.2,  // Estimate
        RaceProgress: progressValue,
        Position_Change: 0,
    };

    try {
        // Call API
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        // Minimum loading time for dramatic effect
        await new Promise(resolve => setTimeout(resolve, 2200));

        clearInterval(scanInterval);

        if (!response.ok) throw new Error('Prediction failed');
        const result = await response.json();

        // Display results
        showPredictionResult(result, payload);

    } catch (err) {
        clearInterval(scanInterval);
        console.error('Prediction error:', err);

        // Show error state
        if (loadingEl) { loadingEl.style.display = 'none'; loadingEl.classList.remove('active'); }
        if (waitingEl) {
            waitingEl.style.display = 'flex';
            waitingEl.querySelector('h3').textContent = 'Error';
            waitingEl.querySelector('p').textContent = 'Failed to connect to prediction server. Make sure the backend is running.';
        }
    }
}


// ── Display Prediction Result ────────────────────────────────────
function showPredictionResult(result, payload) {
    const loadingEl = document.getElementById('prediction-loading');
    const resultEl = document.getElementById('result-display');

    // Hide loading
    if (loadingEl) { loadingEl.style.display = 'none'; loadingEl.classList.remove('active'); }

    // Show result
    if (resultEl) { resultEl.style.display = 'block'; resultEl.classList.add('active'); }

    // Sound
    if (window.PitVisionSound) window.PitVisionSound.confirm();

    // Action text
    const actionEl = document.getElementById('result-action');
    if (actionEl) {
        if (result.pit_next_lap) {
            actionEl.textContent = 'PIT NOW';
            actionEl.className = 'result-action pit';
        } else {
            actionEl.textContent = 'STAY OUT';
            actionEl.className = 'result-action stay';
        }
    }

    // Window
    const windowEl = document.getElementById('result-window');
    if (windowEl) {
        windowEl.textContent = `Recommended Window: Lap ${result.recommended_window_start}–${result.recommended_window_end}`;
    }

    // Animate confidence ring
    animateRing('confidence-arc', 'confidence-number', result.confidence);
    animateRing('probability-arc', 'probability-number', result.probability);

    // Tire life
    const tireLifeEl = document.getElementById('result-tire-life');
    if (tireLifeEl) {
        tireLifeEl.textContent = result.tire_life_remaining_estimate + ' laps';
    }

    // Risk badge
    const riskEl = document.getElementById('result-risk');
    if (riskEl) {
        const riskClass = result.strategy_risk.toLowerCase();
        riskEl.innerHTML = `<span class="risk-badge ${riskClass}">${result.strategy_risk}</span>`;
    }

    // Uncertainty Card Indicator
    const uncertaintyEl = document.getElementById('result-uncertainty');
    if (uncertaintyEl) {
        let text = 'LOW';
        let cls = 'low';
        const conf = result.confidence;
        if (conf > 85) {
            text = 'LOW UNCERTAINTY';
            cls = 'low';
        } else if (conf >= 70) {
            text = 'MEDIUM UNCERTAINTY';
            cls = 'medium';
        } else {
            text = 'HIGH UNCERTAINTY';
            cls = 'high';
        }
        uncertaintyEl.innerHTML = `<span class="uncertainty-value ${cls}">${text}</span>`;
    }

    // Populate Key Decision Factors
    populateFactors(payload);

    // Render charts
    renderTireWearChart(payload.TyreLife, payload.Compound, result);
    renderStrategyChart(payload.LapNumber, result);
}

// ── Initialize WHY THIS PREDICTION Collapse ─────────────────────
function initWhyPredictionCollapse() {
    const toggle = document.getElementById('why-prediction-toggle');
    const content = document.getElementById('why-prediction-content');
    if (!toggle || !content) return;

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        content.classList.toggle('open');
    });
}

// ── Populate Decision Factors Dynamically ────────────────────────
function populateFactors(payload) {
    const container = document.getElementById('factors-container');
    if (!container) return;

    const tyreLife = parseFloat(payload.TyreLife) || 0;
    const compound = payload.Compound || 'SOFT';
    const progress = (parseFloat(payload.RaceProgress) || 0.5) * 100;
    const position = parseInt(payload.Position) || 10;
    const stint = parseInt(payload.Stint) || 1;

    // Calculate dynamic weights
    let wTireAge = Math.min(55, Math.max(10, 15 + tyreLife * 1.5));
    
    let wCompound = 15;
    if (compound === 'SOFT') wCompound = 25;
    else if (compound === 'MEDIUM') wCompound = 18;
    else if (compound === 'HARD') wCompound = 10;
    else wCompound = 20;

    let wProgress = 10 + (progress / 100) * 20;
    let wPosition = Math.min(20, Math.max(5, 22 - position));
    let wStint = 8 + stint * 3;

    const total = wTireAge + wCompound + wProgress + wPosition + wStint;
    
    // Normalize and convert to percentage
    const factors = [
        { name: `Tire Age: ${tyreLife} Laps`, weight: Math.round((wTireAge / total) * 100) },
        { name: `Compound: ${compound}`, weight: Math.round((wCompound / total) * 100) },
        { name: `Race Progress: ${Math.round(progress)}%`, weight: Math.round((wProgress / total) * 100) },
        { name: `Position: P${position}`, weight: Math.round((wPosition / total) * 100) },
        { name: `Current Stint: Stint ${stint}`, weight: Math.round((wStint / total) * 100) }
    ];

    // Sort descending
    factors.sort((a, b) => b.weight - a.weight);

    // Make sure they sum to exactly 100% (adjust the largest if necessary)
    const sum = factors.reduce((acc, f) => acc + f.weight, 0);
    if (sum !== 100) {
        factors[0].weight += (100 - sum);
    }

    container.innerHTML = '';
    factors.forEach(f => {
        const row = document.createElement('div');
        row.className = 'factor-row';
        row.innerHTML = `
            <div class="factor-header">
                <span class="factor-name">${f.name}</span>
                <span class="factor-percentage">${f.weight}% Impact</span>
            </div>
            <div class="factor-bar-track">
                <div class="factor-bar-fill" style="width: 0%;"></div>
            </div>
        `;
        container.appendChild(row);

        // Trigger animation after rendering
        setTimeout(() => {
            const fill = row.querySelector('.factor-bar-fill');
            if (fill) fill.style.width = f.weight + '%';
        }, 100);
    });
}


// ── Animated Confidence Ring ─────────────────────────────────────
function animateRing(arcId, numberId, value) {
    const arc = document.getElementById(arcId);
    const numberEl = document.getElementById(numberId);
    if (!arc || !numberEl) return;

    const circumference = 326.7; // 2 * PI * 52
    const offset = circumference - (value / 100) * circumference;

    // Reset
    arc.style.strokeDashoffset = circumference;

    // Animate after brief delay
    setTimeout(() => {
        arc.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
        arc.style.strokeDashoffset = offset;
    }, 100);

    // Animate number
    animateNumber(numberEl, value, '%');
}


// ── Number Counter Animation ─────────────────────────────────────
function animateNumber(el, target, suffix = '') {
    const duration = 1500;
    const start = performance.now();

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;
        el.textContent = current.toFixed(1) + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}


// ── Tire Wear Chart (Plotly) ─────────────────────────────────────
function renderTireWearChart(currentTyreLife, compound, result) {
    const container = document.getElementById('tire-wear-chart');
    if (!container) return;

    const maxLife = { SOFT: 22, MEDIUM: 32, HARD: 42, INTER: 28, WET: 22 };
    const max = maxLife[compound] || 30;
    const laps = [];
    const degradation = [];

    for (let i = 0; i <= max; i++) {
        laps.push(i);
        // Exponential degradation curve
        degradation.push(100 - (100 * Math.pow(i / max, 1.5)));
    }

    const colors = {
        SOFT: '#FF3333', MEDIUM: '#FFC300', HARD: '#FFFFFF',
        INTER: '#43B02A', WET: '#0072CE'
    };

    const data = [
        {
            x: laps,
            y: degradation,
            type: 'scatter',
            mode: 'lines',
            name: compound + ' Compound',
            line: { color: colors[compound] || '#00F0FF', width: 2.5 },
            fill: 'tozeroy',
            fillcolor: (colors[compound] || '#00F0FF') + '10',
        },
        {
            x: [currentTyreLife],
            y: [100 - (100 * Math.pow(currentTyreLife / max, 1.5))],
            type: 'scatter',
            mode: 'markers',
            name: 'Current Position',
            marker: {
                color: '#E10600',
                size: 12,
                symbol: 'diamond',
                line: { color: '#FFFFFF', width: 1.5 }
            },
        }
    ];

    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'Inter', color: 'rgba(255,255,255,0.5)', size: 11 },
        xaxis: {
            title: 'Tire Age (Laps)',
            gridcolor: 'rgba(255,255,255,0.04)',
            zerolinecolor: 'rgba(255,255,255,0.06)',
        },
        yaxis: {
            title: 'Tire Performance %',
            range: [0, 105],
            gridcolor: 'rgba(255,255,255,0.04)',
            zerolinecolor: 'rgba(255,255,255,0.06)',
        },
        legend: { x: 0.6, y: 0.95, font: { size: 10 }, bgcolor: 'rgba(0,0,0,0)' },
        margin: { t: 10, b: 50, l: 50, r: 20 },
        showlegend: true,
    };

    Plotly.newPlot(container, data, layout, { responsive: true, displayModeBar: false });
}


// ── Strategy Comparison Chart ────────────────────────────────────
function renderStrategyChart(currentLap, result) {
    const container = document.getElementById('strategy-chart');
    if (!container) return;

    const strategies = ['Aggressive', 'Balanced', 'Conservative'];
    const pitLaps = [
        Math.max(1, currentLap - 2),
        result.recommended_window_start,
        result.recommended_window_end + 3,
    ];
    const riskLevels = [85, 50, 20];

    const data = [{
        x: strategies,
        y: pitLaps,
        type: 'bar',
        marker: {
            color: ['#FF3D00', '#00F0FF', '#00E676'],
            line: { color: 'rgba(255,255,255,0.1)', width: 1 },
        },
        text: pitLaps.map(l => 'Lap ' + l),
        textposition: 'outside',
        textfont: { family: 'Orbitron', size: 11, color: 'rgba(255,255,255,0.7)' },
        hovertemplate: '%{x}<br>Pit on Lap %{y}<extra></extra>',
    }];

    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'Inter', color: 'rgba(255,255,255,0.5)', size: 12 },
        xaxis: { gridcolor: 'rgba(255,255,255,0.03)' },
        yaxis: {
            title: 'Pit Stop Lap',
            gridcolor: 'rgba(255,255,255,0.04)',
            zerolinecolor: 'rgba(255,255,255,0.06)',
        },
        margin: { t: 30, b: 40, l: 50, r: 20 },
        bargap: 0.4,
    };

    Plotly.newPlot(container, data, layout, { responsive: true, displayModeBar: false });
}
