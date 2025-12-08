// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // Load session-based data (existing logic)
    loadSessionData();

    // Load all-time website data
    renderAllTimeStats();

    // Add event listener for the clear button
    const clearButton = document.getElementById('clear-data-btn');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            // Ask for confirmation before clearing
            if (confirm("Are you sure you want to clear all tracked website data? This action cannot be undone.")) {
                chrome.storage.local.set({ visitedSites: {}, sessions: [] }, () => {
                    console.log("All tracking data cleared.");
                    // Reload the page to reflect the cleared data
                    window.location.reload();
                });
            }
        });
    }
});

function loadSessionData() {
    chrome.storage.local.get(['sessions'], (result) => {
        const sessions = result.sessions || [];
        
        if (sessions.length === 0) {
            // Don't overwrite the entire page if all-time stats might exist
            document.querySelector('.report-container').innerHTML = "<h2>No focus sessions recorded yet.</h2>";
            return;
        }

        const lastSession = sessions[sessions.length - 1];
        const siteData = lastSession.sites;

        const labels = Object.keys(siteData);
        const dataValues = Object.values(siteData).map(seconds => Math.round(seconds / 60)); // convert to minutes
        
        const listContainer = document.getElementById('site-list-container');
        if (!listContainer) return;
        listContainer.innerHTML = '';
        
        const totalSeconds = Object.values(siteData).reduce((a, b) => a + b, 0);

        labels.forEach((site) => {
            const time = siteData[site];
            const minutes = Math.floor(time / 60);
            const percentage = totalSeconds > 0 ? ((time / totalSeconds) * 100).toFixed(0) : 0;
            
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="site-name">${site}</span>
                <span class="site-time">${minutes}m</span>
                <div class="progress-bar">
                    <div style="width: ${percentage}%"></div>
                </div>
            `;
            listContainer.appendChild(li);
        });

        const ctx = document.getElementById('myPieChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Minutes',
                    data: dataValues,
                    backgroundColor: ['#48bb78', '#ed8936', '#e53e3e', '#4299e1', '#9f7aea'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
        
        document.querySelector('.stats-grid .card:nth-child(1) .big-number').innerText = sessions.length;
        document.querySelector('.stats-grid .card:nth-child(2) .big-number').innerText = `${Math.round(lastSession.duration / 60)}m`;
        document.querySelector('.stats-grid .card:nth-child(3) .big-number').innerText = labels.length;
    });
}

function renderAllTimeStats() {
    chrome.storage.local.get('visitedSites', (data) => {
        const sites = data.visitedSites || {};
        const tableBody = document.querySelector('#all-sites-table tbody');

        if (!tableBody) return;
        tableBody.innerHTML = ''; // Clear existing rows

        const sortedSites = Object.entries(sites).sort(([, a], [, b]) => b - a);

        if (sortedSites.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 2;
            td.textContent = 'No website data tracked yet.';
            tr.appendChild(td);
            tableBody.appendChild(tr);
            return;
        }

        for (const [site, seconds] of sortedSites) {
            const tr = document.createElement('tr');
            const siteTd = document.createElement('td');
            siteTd.textContent = site;
            const timeTd = document.createElement('td');
            timeTd.textContent = formatTime(seconds);
            
            tr.appendChild(siteTd);
            tr.appendChild(timeTd);
            tableBody.appendChild(tr);
        }
    });
}

function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let timeString = '';
    if (hours > 0) timeString += `${hours}h `;
    if (minutes > 0) timeString += `${minutes}m `;
    if (seconds > 0 || timeString === '') timeString += `${seconds}s`;
    
    return timeString.trim();
}