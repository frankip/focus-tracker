// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['sessions'], (result) => {
        const sessions = result.sessions || [];
        
        if (sessions.length === 0) {
            document.querySelector('.main-content').innerHTML = "<h2>No sessions recorded yet. Go do some work!</h2>";
            return;
        }

        // Get the most recent session
        const lastSession = sessions[sessions.length - 1];
        const siteData = lastSession.sites;

        // Prepare data for Chart
        const labels = Object.keys(siteData);
        const dataValues = Object.values(siteData).map(seconds => Math.round(seconds / 60)); // convert to minutes
        
        // Render List
        const listContainer = document.getElementById('site-list-container');
        listContainer.innerHTML = '';
        
        // Calculate total for percentage bars
        const totalSeconds = Object.values(siteData).reduce((a, b) => a + b, 0);

        labels.forEach((site, index) => {
            const time = siteData[site];
            const minutes = Math.floor(time / 60);
            const percentage = ((time / totalSeconds) * 100).toFixed(0);
            
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

        // Render Chart
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
        
        // Update Summary Cards
        document.querySelector('.stats-grid .card:nth-child(1) .big-number').innerText = sessions.length;
        document.querySelector('.stats-grid .card:nth-child(2) .big-number').innerText = "25m"; // Static for MVP
        document.querySelector('.stats-grid .card:nth-child(3) .big-number').innerText = labels.length;
    });
});