// popup.js
console.log("we are live")
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const statusText = document.getElementById('status-text');
const trackingToggle = document.getElementById('tracking-toggle');

// Update UI based on time
function updateDisplay(timeLeft, isRunning) {
    // Safety check: if time is undefined, default to 25:00
    if (timeLeft === undefined || timeLeft === null) {
        timerDisplay.textContent = "25:00";
        return;
    }

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (isRunning) {
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        statusText.textContent = "Focus in progress...";
    } else {
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        statusText.textContent = "Ready to focus?";
    }
}

// Safer message sending function
function safeSendMessage(message, callback) {
    chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
            // Background script is dead or sleeping
            console.log("Background connection failed:", chrome.runtime.lastError.message);
            statusText.textContent = "Reload extension (Error)";
            return;
        }
        if (response && callback) {
            callback(response);
        }
    });
}

// Get initial status
safeSendMessage({ action: "GET_STATUS" }, (response) => {
    updateDisplay(response.timeLeft, response.isRunning);
    if (response.trackingEnabled !== undefined) {
        trackingToggle.checked = response.trackingEnabled;
    }
});

// Update display every second
setInterval(() => {
    safeSendMessage({ action: "GET_STATUS" }, (response) => {
        updateDisplay(response.timeLeft, response.isRunning);
    });
}, 1000);

// Start Button
startBtn.addEventListener('click', () => {
    safeSendMessage({
        action: "START_TIMER",
        tracking: trackingToggle.checked
    }, () => {
        // Force an immediate update
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
    });
});

// Stop Button
stopBtn.addEventListener('click', () => {
    safeSendMessage({ action: "STOP_TIMER" }, () => {
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        timerDisplay.textContent = "25:00";
    });
});

// --- THEME LOGIC ---
function initializeTheme() {
    // 1. Get stored theme (default light)
    const savedTheme = localStorage.getItem('dashboard-theme') || 'light';
    applyTheme(savedTheme);

    // 2. Bind toggle button
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const current = document.body.dataset.theme;
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
        });
    }
}

function applyTheme(theme) {
    document.body.dataset.theme = theme;
    localStorage.setItem('dashboard-theme', theme);

    // Update button icon if needed
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.textContent = theme === 'dark' ? '☀️' : 'fq'; // Moon for light mode (switch to dark), Sun for dark mode (switch to light)
        themeBtn.textContent = theme === 'dark' ? '☀️' : '🌓';
        themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
}

// Initialize theme on load
initializeTheme();