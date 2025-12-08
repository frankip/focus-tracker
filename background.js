// background.js

let timerState = {
    isRunning: false,
    timeLeft: 25 * 60, // 25 minutes in seconds
    totalTime: 25 * 60,
    trackingEnabled: true,
    currentSessionId: null
};

let activeTab = {
    url: null,
    startTime: null
};

// Initialize
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ sessions: [], visitedSites: {} });
});

function recordTimeSpent() {
    if (!activeTab.url || !activeTab.startTime) {
        return;
    }

    const endTime = Date.now();
    const timeSpentInSeconds = Math.round((endTime - activeTab.startTime) / 1000);

    if (timeSpentInSeconds < 1) {
        return; 
    }

    try {
        const domain = new URL(activeTab.url).hostname;
        
        chrome.storage.local.get('visitedSites', (data) => {
            const sites = data.visitedSites || {};
            sites[domain] = (sites[domain] || 0) + timeSpentInSeconds;
            chrome.storage.local.set({ visitedSites: sites });
        });

    } catch (e) {
        console.warn("Could not parse URL:", activeTab.url);
    }
}


// --- GLOBAL SITE TRACKING LISTENERS ---

// Fired when the active tab in a window changes.
chrome.tabs.onActivated.addListener((activeInfo) => {
    recordTimeSpent(); // Record time for the tab that just became inactive

    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab && tab.url && tab.url.startsWith('http')) {
            activeTab.url = tab.url;
            activeTab.startTime = Date.now();
        } else {
            activeTab.url = null;
            activeTab.startTime = null;
        }
    });
});

// Fired when a tab is updated.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // We only care about active tabs where the URL has changed.
    if (tab.active && changeInfo.url) {
        recordTimeSpent(); // Record time for the old URL.
        
        if (tab.url.startsWith('http')) {
            activeTab.url = tab.url;
            activeTab.startTime = Date.now();
        } else {
            activeTab.url = null;
            activeTab.startTime = null;
        }
    }
});

// Fired when the currently focused window changes.
chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // User has switched to another application
        recordTimeSpent();
        activeTab.url = null;
        activeTab.startTime = null;
    } else {
        // User has switched back to a Chrome window, find the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0 && tabs[0].url && tabs[0].url.startsWith('http')) {
                activeTab.url = tabs[0].url;
                activeTab.startTime = Date.now();
            } else {
                activeTab.url = null;
                activeTab.startTime = null;
            }
        });
    }
});


// --- TIMER LOGIC ---
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "focusTimer") {
        if (timerState.timeLeft > 0) {
            timerState.timeLeft--;
            
            const minutes = Math.floor(timerState.timeLeft / 60);
            chrome.action.setBadgeText({ text: `${minutes}m` });
            
            if (timerState.trackingEnabled && timerState.isRunning) {
                trackCurrentSiteForSession(1); // Add 1 second to current site in session
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
    
    const newSession = {
        id: timerState.currentSessionId,
        date: new Date().toLocaleDateString(),
        duration: timerState.totalTime,
        sites: {}
    };

    chrome.storage.local.get(['sessions'], (result) => {
        const sessions = result.sessions || [];
        sessions.push(newSession);
        chrome.storage.local.set({ sessions: sessions });
    });

    chrome.alarms.create("focusTimer", { periodInMinutes: 1 / 60 });
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
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Focus Session Complete!',
        message: 'Great job! Check your dashboard to see your stats.'
    });
}

// --- SESSION-SPECIFIC TRACKER LOGIC ---
function trackCurrentSiteForSession(secondsToAdd) {
    if (!activeTab.url) return;

    try {
        const domain = new URL(activeTab.url).hostname;
        
        chrome.storage.local.get(['sessions'], (result) => {
            let sessions = result.sessions || [];
            let currentSession = sessions.find(s => s.id === timerState.currentSessionId);
            
            if (currentSession) {
                if (!currentSession.sites[domain]) {
                    currentSession.sites[domain] = 0;
                }
                currentSession.sites[domain] += secondsToAdd;
                
                chrome.storage.local.set({ sessions: sessions });
            }
        });
    } catch (e) {
        // Ignore invalid URLs
    }
}

// --- COMMUNICATION WITH POPUP ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_STATUS") {
        sendResponse(timerState);
    } else if (request.action === "START_TIMER") {
        startTimer();
        sendResponse({ status: "started" });
    } else if (request.action === "STOP_TIMER") {
        stopTimer();
        sendResponse({ status: "stopped" });
    }
    return true; // Indicates that the response is sent asynchronously
});