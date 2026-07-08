// --- GLOBAL CONFIGURATION ---
Chart.defaults.color = '#1e293b';
Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";
Chart.defaults.font.weight = '600';

let c1_inj, c1_em, c2_urea, c2_nox;

// --- CANVAS ANIMATION (FEATURE 1) ---
let globalFlowSpeed = 1;
let globalNoxDensity = 0.5;
let globalEfficiency = 0.8;
let particles = [];
let canvas, ctx;

class Particle {
    constructor(canvasHeight) {
        this.x = -10;
        this.y = Math.random() * canvasHeight;
        this.baseSpeed = Math.random() * 1.5 + 1.5;
        this.size = Math.random() * 2.5 + 2;
        this.color = '#ef4444'; // Red (Raw NOx)
        this.passed = false;
        this.wobbleOffset = Math.random() * Math.PI * 2;
    }
    update(canvasWidth) {
        this.x += this.baseSpeed * globalFlowSpeed;
        this.y += Math.sin(this.x * 0.05 + this.wobbleOffset) * 0.5;

        let catalystStart = canvasWidth * 0.35;
        if (!this.passed && this.x > catalystStart + (Math.random() * 50)) {
            this.passed = true;
            if (Math.random() < globalEfficiency) {
                this.color = '#10b981'; // Green (Clean Air: N2 + H2O)
            }
        }
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function animateCatalyst() {
    if (!canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let catStartX = canvas.width * 0.35;
    let catWidth = canvas.width * 0.3;
    
    // Draw Catalyst Monolith
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(catStartX, 10, catWidth, canvas.height - 20);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    
    for(let i = 15; i < canvas.height - 10; i += 12) {
        ctx.beginPath();
        ctx.moveTo(catStartX, i);
        ctx.lineTo(catStartX + catWidth, i);
        ctx.stroke();
    }

    if (Math.random() < globalNoxDensity) {
        particles.push(new Particle(canvas.height));
        if (globalNoxDensity > 0.6) particles.push(new Particle(canvas.height)); 
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(canvas.width);
        particles[i].draw(ctx);
        if (particles[i].x > canvas.width + 10) {
            particles.splice(i, 1);
        }
    }
    requestAnimationFrame(animateCatalyst);
}

// --- FEATURE 1: AI ADAPTIVE CONTROL ---
function initFeature1() {
    const chartOptions = (titleText) => ({
        responsive: true, maintainAspectRatio: false,
        plugins: { 
            title: { display: true, text: titleText, color: '#01502a', font: { size: 16, weight: 'bold' } },
            legend: { labels: { color: '#1e293b', font: { weight: '600' } } }
        },
        scales: { 
            x: { grid: { color: '#e2e8f0' } }, y: { beginAtZero: true, grid: { color: '#e2e8f0' } } 
        }
    });

    c1_inj = new Chart(document.getElementById('chart1_inj').getContext('2d'), {
        type: 'line',
        data: { labels: [], datasets: [
            { label: 'Static ECU Injection (L/h)', borderColor: '#ef4444', borderDash: [4, 4], data: [], borderWidth: 2, pointRadius: 0 },
            { label: 'AI Adaptive Injection (L/h)', borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', data: [], borderWidth: 3, pointRadius: 0, fill: true }
        ]},
        options: chartOptions('Real-Time Urea Injection Command Comparison')
    });

    c1_em = new Chart(document.getElementById('chart1_em').getContext('2d'), {
        type: 'line',
        data: { labels: [], datasets: [
            { label: 'Escaped NOx - Static ECU (ppm)', borderColor: '#ef4444', borderDash: [4, 4], data: [], borderWidth: 2, pointRadius: 0 },
            { label: 'Escaped NOx - Smart AI (ppm)', borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', data: [], borderWidth: 3, pointRadius: 0, fill: true }
        ]},
        options: chartOptions('Final Environmental NOx Emission Impact')
    });

    canvas = document.getElementById('catalystCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        const resizeCanvas = () => { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        animateCatalyst();
    }
    
    document.getElementById('sl_temp').addEventListener('input', updateFeature1);
    document.getElementById('sl_nox').addEventListener('input', updateFeature1);
    document.getElementById('sl_load').addEventListener('input', updateFeature1);
    updateFeature1();
}

function updateFeature1() {
    let temp = parseFloat(document.getElementById('sl_temp').value);
    let nox = parseFloat(document.getElementById('sl_nox').value);
    let load = parseFloat(document.getElementById('sl_load').value);

    document.getElementById('val_temp').innerText = temp;
    document.getElementById('val_nox').innerText = nox;
    document.getElementById('val_load').innerText = load;

    let labels = [], ecuUreaData = [], aiUreaData = [], noxEcuData = [], noxAiData = [];
    let totalAiUrea = 0;
    let ai_efficiency = 0, factor = 0;

    if (temp < 220) { ai_efficiency = 0.40 + (temp - 150) * 0.004; factor = 0.6; } 
    else if (temp >= 220 && temp <= 350) { ai_efficiency = 0.95 - (load / 1000); factor = 1.0; } 
    else { ai_efficiency = 0.85 - (temp - 350) * 0.002; factor = 0.85; }

    globalEfficiency = ai_efficiency;
    globalFlowSpeed = 0.5 + (load / 50); 
    globalNoxDensity = 0.2 + (nox / 1000); 

    const base_urea_ratio = 0.002;

    for (let i = 0; i < 100; i++) {
        labels.push(i);
        let noiseTemp = (Math.random() * 4 - 2);
        let noiseNox = (Math.random() * 20 - 10);
        let t_dyn = temp + (load / 10) * Math.sin(i / 5) + noiseTemp;
        let n_dyn = nox + (load) * Math.cos(i / 4) + noiseNox;

        let ecu_inj = nox * base_urea_ratio;
        let ai_inj = n_dyn * base_urea_ratio * factor;

        ecuUreaData.push(ecu_inj); aiUreaData.push(ai_inj); totalAiUrea += ai_inj;
        noxEcuData.push(n_dyn * 0.4); noxAiData.push(n_dyn * (1 - ai_efficiency));
    }

    document.getElementById('m_urea').innerText = (totalAiUrea / 100).toFixed(2) + " L/h";
    document.getElementById('m_eff').innerText = (ai_efficiency * 100).toFixed(1) + " %";

    let m_slip = document.getElementById('m_slip');
    if (temp >= 220 && temp <= 350) { m_slip.innerText = "HIGHLY SECURE"; m_slip.className = "metric-value"; m_slip.style.color = "var(--primary-green)"; } 
    else if (temp > 350) { m_slip.innerText = "HIGH RISK"; m_slip.className = "metric-value danger"; } 
    else { m_slip.innerText = "DEPOSIT RISK"; m_slip.className = "metric-value warning"; }

    c1_inj.data.labels = labels; c1_inj.data.datasets[0].data = ecuUreaData; c1_inj.data.datasets[1].data = aiUreaData; c1_inj.update();
    c1_em.data.labels = labels; c1_em.data.datasets[0].data = noxEcuData; c1_em.data.datasets[1].data = noxAiData; c1_em.update();
}

// --- FEATURE 2: PREDICTIVE MAINTENANCE ---
function initFeature2() {
    const barOptions = (titleText, maxVal) => ({
        responsive: true, maintainAspectRatio: false,
        plugins: { title: { display: true, text: titleText, color: '#01502a', font: { size: 16, weight: 'bold' } }, legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, max: maxVal, grid: { color: '#e2e8f0' } } }
    });

    c2_urea = new Chart(document.getElementById('chart2_bar_urea').getContext('2d'), {
        type: 'bar',
        data: { labels: ['Ideal Target Volume', 'Pure Actual (No AI)', 'Compensated Output (AI Healed)'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#001d5e', '#ef4444', '#10b981'], borderRadius: 6 }] },
        options: barOptions('Urea Fluid Output Volume from Pump', 3.0)
    });

    c2_nox = new Chart(document.getElementById('chart2_bar_nox').getContext('2d'), {
        type: 'bar',
        data: { labels: ['Safe Standard Threshold', 'Escaped Emission (No AI Correction)', 'Escaped Emission (With AI Healing)'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#64748b', '#ef4444', '#10b981'], borderRadius: 6 }] },
        options: barOptions('Physical Damage Impact on Final Emission', null)
    });

    document.getElementById('sl_clog').addEventListener('input', updateFeature2);
    document.getElementById('sl_aging').addEventListener('input', updateFeature2);
    updateFeature2();
}

function updateFeature2() {
    let clog = parseFloat(document.getElementById('sl_clog').value);
    let aging = parseFloat(document.getElementById('sl_aging').value);

    document.getElementById('val_clog').innerText = clog; 
    document.getElementById('val_aging').innerText = aging;

    let health_score = 100 - (clog * 0.8) - (aging * 0.5);
    let s_text = document.getElementById('status_text'); 
    let s_action = document.getElementById('status_action');

    if (health_score > 80) { 
        s_text.innerText = `NORMAL (${health_score.toFixed(1)}%)`; s_text.className = "ai-status-text status-normal"; 
        s_action.innerText = "AI Action: Components are in good condition. Operations running optimally."; 
    } 
    else if (health_score > 50) { 
        s_text.innerText = `WARNING! (${health_score.toFixed(1)}%)`; s_text.className = "ai-status-text status-warning"; 
        s_action.innerText = "AI Action: Self-Healing mode activated! AI detects mechanical clogging and increases urea pump pressure modulation."; 
    } 
    else { 
        s_text.innerText = `CRITICAL (${health_score.toFixed(1)}%)`; s_text.className = "ai-status-text status-critical"; 
        s_action.innerText = "AI Action: Damage exceeds tolerance limits. System highly recommends immediate physical mechanical repair."; 
    }

    let ideal_urea = 1.5; let actual_urea = ideal_urea * (1 - (clog / 100)); let actual_healed;

    if (clog > 15 && clog <= 60) { actual_healed = (ideal_urea * (1 + (clog / 100) * 1.2)) * (1 - (clog / 100)); } 
    else if (clog > 60) { actual_healed = (ideal_urea * 2.0) * (1 - (clog / 100)); } 
    else { actual_healed = actual_urea; }

    let nox_base = 500;
    c2_urea.data.datasets[0].data = [ideal_urea, actual_urea, actual_healed]; c2_urea.update();
    c2_nox.data.datasets[0].data = [50, nox_base * (1 - (0.9 * (actual_urea / ideal_urea) * (1 - aging / 100))), nox_base * (1 - (0.9 * (actual_healed / ideal_urea) * (1 - aging / 100)))]; c2_nox.update();
}

// --- INITIALIZE BASED ON PAGE ---
window.onload = function() {
    if (document.getElementById('chart1_inj')) initFeature1();
    if (document.getElementById('chart2_bar_urea')) initFeature2();
};