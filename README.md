# FocusTracker 🎯

FocusTracker is a Chrome Extension designed to boost productivity by combining a Pomodoro-style timer with detailed website usage analytics. It helps you stay focused during work sprints and gives you insights into how you spend your time online.

## Features

- **⏱️ Focus Timer**: A classic 25-minute countdown timer to keep you on task.
- **📊 Dual Tracking System**:
  - **Global Tracking**: Monitors your website usage continuously to give you a complete picture of your browsing habits.
  - **Session Tracking**: Specifically tracks which sites you visit *during* a focus session.
- **📈 Analytics Dashboard**: 
  - Visual charts (Pie & Bar) showing time distribution.
  - Detailed lists of visited sites.
  - "All-Time" stats to track long-term habits.
- **🌓 Dark Mode**: Fully supported dark theme for both the popup and the dashboard, persistent across sessions.
- **🔒 Privacy First**: All data is stored locally in your browser (`chrome.storage.local`). No data is sent to external servers.

## Installation

1.  Clone or download this repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the directory where you cloned this project.
6.  The **FocusTracker** icon should appear in your toolbar.

## Usage

1.  **Start a Session**: Click the extension icon and hit "Start Focus". The timer will begin, and site tracking for the session will accelerate.
2.  **View Reports**: Click "View Reports" in the popup or "Finish Session" to open the Dashboard.
3.  **Toggle Theme**: Use the toggle button (🌓) in the popup to switch between Light and Dark modes.

## Development

This project uses vanilla JavaScript, HTML, and CSS. No build steps are required.
- **`background.js`**: Handles the timer logic and data tracking.
- **`popup.js`**: Manages the extension popup UI.
- **`dashboard.js`**: Renders the analytics and charts.
