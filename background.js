// background.js

let timerState = {
    isRunning: false,
    timeLeft: 25 * 60, // 25 minutes in seconds
    totalTime: 25 * 60,
    trackingEnabled: true,
    currentSessionId: null
};

let currentUrl = null;
let lastUrlSwitchTime = Date.now();
let activeTabId = null;

// Initialize
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ sessions: [] });
});

// --- TIMER LOGIC ---
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "focusTimer") {
        if (timerState.timeLeft > 0) {
            timerState.timeLeft--;
            
            // Update Badge Text (Icon)
            const minutes = Math.floor(timerState.timeLeft / 60);
            chrome.action.setBadgeText({ text: `${minutes}m` });
            
            // Track the current site usage every second
            if (timerState.trackingEnabled && timerState.isRunning) {
                trackCurrentSite(1); // Add 1 second to current site
            }
        } else {
            finishSession();
        }
    }
});

function startTimer() {
    if (timerState.isRunning) return;
    
    timerState.isRunning = true;
    timerState.currentSessionId = Date.now();
    lastUrlSwitchTime = Date.now();
    
    // Create new session object in storage
    const newSession = {
        id: timerState.currentSessionId,
        date: new Date().toLocaleDateString(),
        duration: timerState.totalTime,
        sites: {} // { "github.com": 120, "youtube.com": 30 }
    };

    chrome.storage.local.get(['sessions'], (result) => {
        const sessions = result.sessions || [];
        sessions.push(newSession);
        chrome.storage.local.set({ sessions: sessions });
    });

    chrome.alarms.create("focusTimer", { periodInMinutes: 1 / 60 }); // Ticks every second
    chrome.action.setBadgeBackgroundColor({ color: "#48bb78" });
}

function stopTimer() {
    chrome.alarms.clear("focusTimer");
    timerState.isRunning = false;
    timerState.timeLeft = 25 * 60; // Reset
    chrome.action.setBadgeText({ text: "" });
}

function finishSession() {
    stopTimer();
    // Notification
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Focus Session Complete!',
        message: 'Great job! Check your dashboard to see your stats.'
    });
}

// --- TRACKER LOGIC ---
async function trackCurrentSite(secondsToAdd) {
    if (!currentUrl) return;

    try {
        const domain = new URL(currentUrl).hostname;
        
        // Get current sessions, update the last one
        chrome.storage.local.get(['sessions'], (result) => {
            let sessions = result.sessions || [];
            let currentSession = sessions.find(s => s.id === timerState.currentSessionId);
            
            if (currentSession) {
                if (!currentSession.sites[domain]) {
                    currentSession.sites[domain] = 0;
                }
                currentSession.sites[domain] += secondsToAdd;
                
                // Save back
                chrome.storage.local.set({ sessions: sessions });
            }
        });
    } catch (e) {
        // Ignore invalid URLs (like chrome://)
    }
}

// Listen for Tab Changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    if (!timerState.isRunning) return;
    
    const tab = await chrome.tabs.get(activeInfo.tabId);
    currentUrl = tab.url;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!timerState.isRunning) return;
    if (tab.active && changeInfo.url) {
        currentUrl = changeInfo.url;
    }
});

// --- COMMUNICATION WITH POPUP ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_STATUS") {
        sendResponse(timerState);
    } else if (request.action === "START_TIMER") {
        // ...
        startTimer(); // Ensure this function exists below
        sendResponse({ status: "started" });
    } else if (request.action === "STOP_TIMER") {
        stopTimer(); // Ensure this function exists below
        sendResponse({ status: "stopped" });
    }
    // IMPORTANT: In V3, if you are async, you must return true. 
    // Since we are synchronous here, we don't strictly need it, but it's safe.
});