/* ═══════════════════════════════════════════════════════════════
   PITVISION AI — Main JavaScript
   Loading screen, navigation, sound engine, scroll animations
   ═══════════════════════════════════════════════════════════════ */

// ── Loading Screen ───────────────────────────────────────────────
(function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');

    if (!loadingScreen) return;

    const messages = [
        'Initializing telemetry...',
        'Loading race strategy...',
        'Connecting to pit wall...',
        'Analyzing tire degradation...',
        'Calibrating ML model...',
        'Ready to race.'
    ];

    let progress = 0;
    let msgIndex = 0;
    const totalDuration = 2800;
    const interval = totalDuration / 100;

    const timer = setInterval(() => {
        progress += 1;
        if (loadingBar) loadingBar.style.width = progress + '%';

        const newMsgIndex = Math.min(Math.floor(progress / (100 / messages.length)), messages.length - 1);
        if (newMsgIndex !== msgIndex) {
            msgIndex = newMsgIndex;
            if (loadingText) loadingText.textContent = messages[msgIndex];
        }

        if (progress >= 100) {
            clearInterval(timer);
            setTimeout(() => {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 800);
            }, 400);
        }
    }, interval);
})();


// ── Navigation ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('nav-hamburger');
    const navLinks = document.getElementById('nav-links');

    // Scroll behavior — transparent to glass
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 60) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Mobile hamburger
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });

        // Close on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
            });
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Initialize scroll reveal
    initScrollReveal();

    // Initialize sound engine
    initSoundEngine();
});


// ── Scroll Reveal Animation ──────────────────────────────────────
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(el => observer.observe(el));
}


// ── Sound Engine (Web Audio API & HTML5 Audio) ─────────────────────
let audioCtx = null;
let soundEnabled = false;

// Pre-load the F1 click sound
const f1ClickSound = new Audio('/static/audio/f1.mpeg');

function playF1ClickSound() {
    if (!soundEnabled) return;
    f1ClickSound.currentTime = 0;
    f1ClickSound.play().catch(err => {
        console.warn('F1 click sound failed to play:', err);
    });
}

function initSoundEngine() {
    const toggle = document.getElementById('sound-toggle');
    if (!toggle) return;

    // Load preference
    soundEnabled = localStorage.getItem('pitvision-sound') === 'true';
    updateSoundToggle(toggle);

    toggle.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        localStorage.setItem('pitvision-sound', soundEnabled);
        updateSoundToggle(toggle);

        if (soundEnabled && !audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Play test sound when enabling
        if (soundEnabled) {
            playF1ClickSound();
        }
    });

    // Attach hover sounds to buttons
    document.querySelectorAll('.btn, .nav-links a, .tire-option').forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (soundEnabled) playTelemetryBeep();
        });
    });

    // Attach click sounds to major interactive elements
    document.querySelectorAll('[data-sound="click"], .btn, button[type="submit"]').forEach(el => {
        el.addEventListener('click', () => {
            playF1ClickSound();
        });
    });
}

function updateSoundToggle(toggle) {
    toggle.textContent = soundEnabled ? '🔊' : '🔇';
    toggle.title = soundEnabled ? 'Mute Sound' : 'Enable Sound';
}

function playTelemetryBeep() {
    if (!soundEnabled || !audioCtx) {
        if (!audioCtx && soundEnabled) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (!audioCtx) return;
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(3200, audioCtx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.08);
}

function playGearShift() {
    // Redirect gear shift sound to F1 click sound
    playF1ClickSound();
}

function playConfirmation() {
    if (!soundEnabled || !audioCtx) return;

    // Two-tone rising confirmation
    const now = audioCtx.currentTime;

    [880, 1320].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.05, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.2);
    });
}

function playRadioEffect() {
    if (!soundEnabled || !audioCtx) return;

    // White noise burst (radio static)
    const bufferSize = audioCtx.sampleRate * 0.15;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.02;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 5;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    source.start();
}

// Make sound functions globally available
window.PitVisionSound = {
    beep: playTelemetryBeep,
    gearShift: playGearShift,
    confirm: playConfirmation,
    radio: playRadioEffect,
};
