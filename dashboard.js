// dashboard.js

let pieChartInstance = null;
let allSitesChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();

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

function initializeTheme() {
    const savedTheme = localStorage.getItem('dashboard-theme') || 'light';
    applyTheme(savedTheme);

    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
            applyTheme(next);
        });
    }
}

function applyTheme(theme) {
    document.body.dataset.theme = theme;
    localStorage.setItem('dashboard-theme', theme);
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
    }

    // Update chart colors to match theme
    if (pieChartInstance) {
        const legendColor = theme === 'dark' ? '#ffffff' : '#1f2a3d';
        const tooltipBg = theme === 'dark' ? '#1f2d4a' : '#ffffff';
        const tooltipBorder = theme === 'dark' ? '#274472' : '#d8e0ea';
        pieChartInstance.options.plugins.legend.labels.color = legendColor;
        pieChartInstance.options.plugins.tooltip.backgroundColor = tooltipBg;
        pieChartInstance.options.plugins.tooltip.borderColor = tooltipBorder;
        pieChartInstance.options.plugins.tooltip.titleColor = legendColor;
        pieChartInstance.options.plugins.tooltip.bodyColor = legendColor;
        pieChartInstance.update();
    }

    if (allSitesChartInstance) {
        const legendColor = theme === 'dark' ? '#ffffff' : '#1f2a3d';
        const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
        const borderColor = theme === 'dark' ? '#274472' : '#d8e0ea';
        allSitesChartInstance.options.scales.x.ticks.color = legendColor;
        allSitesChartInstance.options.scales.y.ticks.color = legendColor;
        allSitesChartInstance.options.scales.x.grid.color = gridColor;
        allSitesChartInstance.options.scales.y.grid.color = gridColor;
        allSitesChartInstance.options.plugins.legend.labels.color = legendColor;
        allSitesChartInstance.options.plugins.tooltip.backgroundColor = theme === 'dark' ? '#1f2d4a' : '#ffffff';
        allSitesChartInstance.options.plugins.tooltip.borderColor = borderColor;
        allSitesChartInstance.options.plugins.tooltip.titleColor = legendColor;
        allSitesChartInstance.options.plugins.tooltip.bodyColor = legendColor;
        allSitesChartInstance.update();
    }
}

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

        const pieCanvas = document.getElementById('myPieChart');
        if (!pieCanvas) {
            console.warn('Pie chart canvas not found');
            return;
        }

        const ctx = pieCanvas.getContext('2d');
        if (!ctx) {
            console.warn('Unable to acquire 2D context for pie chart');
            return;
        }
        const isDark = document.body.dataset.theme === 'dark';
        const legendColor = isDark ? '#ffffff' : '#1f2a3d';
        const tooltipBg = isDark ? '#1f2d4a' : '#ffffff';
        const tooltipBorder = isDark ? '#274472' : '#d8e0ea';

        if (pieChartInstance) {
            pieChartInstance.destroy();
        }

        pieChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Minutes',
                    data: dataValues,
                    backgroundColor: ['#48bb78', '#ed8936', '#e53e3e', '#4299e1', '#9f7aea'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: legendColor,
                            boxWidth: 14,
                            usePointStyle: true
                        },
                        onClick: (evt, legendItem, legend) => {
                            const index = legendItem.index;
                            const chart = legend.chart;
                            chart.toggleDataVisibility(index);
                            chart.update();
                        }
                    },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderWidth: 1,
                        titleColor: legendColor,
                        bodyColor: legendColor
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        });
        
        const totalFocusSeconds = sessions.reduce((sum, session) => {
            const secondsThisSession = Object.values(session.sites || {}).reduce((a, b) => a + b, 0);
            return sum + secondsThisSession;
        }, 0);

        document.querySelector('.stats-grid .card:nth-child(1) .big-number').innerText = sessions.length;
        document.querySelector('.stats-grid .card:nth-child(2) .big-number').innerText = formatTime(totalFocusSeconds);
        document.querySelector('.stats-grid .card:nth-child(3) .big-number').innerText = labels.length;
    });
}

function renderAllTimeStats() {
    chrome.storage.local.get('visitedSites', (data) => {
        const sites = data.visitedSites || {};
        const tableBody = document.querySelector('#all-sites-table tbody');
        const chartBtn = document.getElementById('all-sites-chart-btn');
        const chartWrapper = document.getElementById('all-sites-chart-wrapper');
        const chartCanvas = document.getElementById('allSitesChart');

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

        if (chartBtn && chartWrapper && chartCanvas) {
            chartBtn.onclick = () => {
                const isVisible = chartWrapper.style.display !== 'none';
                if (isVisible) {
                    chartWrapper.style.display = 'none';
                    chartBtn.textContent = 'Show All-Time Chart';
                    return;
                }
                chartWrapper.style.display = 'block';
                chartBtn.textContent = 'Hide All-Time Chart';
                renderAllSitesChart(sortedSites, chartCanvas.getContext('2d'));
            };
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

function renderAllSitesChart(sites, ctx) {
    if (!ctx) {
        console.warn('All-sites chart context missing');
        return;
    }

    const topSites = sites.slice(0, 10);
    const labels = topSites.map(([site]) => site);
    const dataValues = topSites.map(([, seconds]) => Math.round(seconds / 60)); // minutes
    const isDark = document.body.dataset.theme === 'dark';
    const legendColor = isDark ? '#ffffff' : '#1f2a3d';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
    const borderColor = isDark ? '#274472' : '#d8e0ea';
    const textColor = legendColor;

    if (allSitesChartInstance) {
        allSitesChartInstance.destroy();
    }

    allSitesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Minutes',
                data: dataValues,
                backgroundColor: labels.map((_, i) => ['#48bb78', '#ed8936', '#e53e3e', '#4299e1', '#9f7aea', '#4fd1c5', '#f6ad55', '#fc8181', '#63b3ed', '#b794f4'][i % 10]),
                borderColor: borderColor,
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                y: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: {
                    labels: { color: legendColor }
                },
                tooltip: {
                    backgroundColor: isDark ? '#1f2d4a' : '#ffffff',
                    borderColor: borderColor,
                    borderWidth: 1,
                    titleColor: legendColor,
                    bodyColor: legendColor
                }
            },
            animation: {
                duration: 600,
                easing: 'easeOutQuart'
            }
        }
    });
}
