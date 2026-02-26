# Watcard Tracker

A comprehensive tool for tracking your Watcard transactions and managing your account balance. This project includes both a Next.js dashboard and a browser extension for seamless transaction monitoring.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Setup Instructions](#setup-instructions)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Support](#support)

## Overview

Watcard Tracker helps you monitor your University of Waterloo Watcard account activity in real-time. It consists of two main components:

1. **Dashboard** - A modern web interface built with Next.js for viewing detailed transaction history and analytics
2. **Browser Extension** - A lightweight extension that provides quick access to your Watcard information while browsing

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (v8 or higher) - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)
- A modern web browser (Chrome, Edge, or Firefox)

## Installation

### Step 1: Clone the Repository

Open your terminal and run the following command to download the repository:

```bash
git clone https://github.com/Mr-Methodical/Watcard_Tracker.git
cd Watcard_Tracker
```

Or if you have a ZIP file, extract it and navigate to the folder:

```bash
cd Watcard_Tracker
```

### Step 2: Install Dashboard Dependencies

Navigate to the dashboard directory and install the required packages:

```bash
cd dashboard
npm install
```

This will install all necessary dependencies for the Next.js application.

## Setup Instructions

### Dashboard Setup

1. **Install Dependencies** (if not already done):
   ```bash
   cd dashboard
   npm install
   ```

2. **Configure Environment Variables** (if needed):
   Create a `.env.local` file in the `dashboard` directory with any required configuration variables.

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   
   The dashboard will be available at `http://localhost:3000`

4. **Build for Production** (optional):
   ```bash
   npm run build
   npm start
   ```

### Browser Extension Setup

1. **Navigate to the Extension Folder**:
   ```bash
   cd extension
   ```

2. **Load the Extension in Your Browser**:

   **For Chrome/Edge:**
   - Open `chrome://extensions/` (or `edge://extensions/` for Edge)
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `extension` folder from this project
   - The extension will appear in your toolbar

   **For Firefox:**
   - Open `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the `extension` folder

## How It Works

### Full System Workflow

1. **User Authentication**:
   - Access your Watcard account at: https://secure.touchnet.net/C22566_oneweb/TransactionHistory/Transactions
   - Log in with your University of Waterloo credentials (WatIAM)

2. **Data Retrieval**:
   - The browser extension captures transaction data from the Watcard system
   - Data is securely stored and synced with the dashboard

3. **Dashboard Features**:
   - View complete transaction history
   - Monitor your balance in real-time
   - Analyze spending patterns and trends
   - Filter transactions by date, category, or amount
   - Export transaction reports

4. **Browser Extension Features**:
   - Quick balance overview in your browser toolbar
   - One-click access to the Watcard portal
   - Recent transaction notifications
   - Lightweight and non-intrusive

### Data Flow

```
Watcard Account
       ↓
[https://secure.touchnet.net/C22566_oneweb/TransactionHistory/Transactions]
       ↓
Browser Extension (Capture & Process)
       ↓
Local Storage / Backend
       ↓
Dashboard (Visualize & Analyze)
```

## Project Structure

```
Watcard_Tracker/
├── dashboard/                 # Next.js web application
│   ├── app/
│   │   ├── layout.tsx        # App layout component
│   │   ├── page.tsx          # Home page
│   │   └── globals.css       # Global styles
│   ├── public/               # Static assets
│   ├── package.json          # Dependencies and scripts
│   ├── tsconfig.json         # TypeScript configuration
│   └── next.config.ts        # Next.js configuration
│
├── extension/                 # Browser extension
│   ├── manifest.json         # Extension metadata
│   ├── popup.html            # Extension popup UI
│   ├── popup.js              # Popup functionality
│   └── content.js            # Content script
│
├── plan.md                    # Project planning document
└── README.md                  # This file
```

## Usage

### Accessing Your Watcard Account

Your official Watcard transaction history is available at:
**https://secure.touchnet.net/C22566_oneweb/TransactionHistory/Transactions**

Steps:
1. Navigate to the link above
2. Log in with your University of Waterloo credentials
3. View your complete transaction history and balance information
4. Use the Watcard Tracker dashboard for enhanced analysis and insights

### Using the Dashboard

1. Open your browser and go to `http://localhost:3000`
2. View your transaction history and account statistics
3. Filter and search transactions as needed
4. Export or print reports for record-keeping

### Using the Browser Extension

1. Click the Watcard Tracker icon in your browser toolbar
2. View your balance and recent transactions
3. Click "View Full History" to open the dashboard
4. Click "Open Watcard Account" to access the official portal

## Troubleshooting

### Dashboard Won't Start
- Ensure Node.js is installed: `node --version`
- Try deleting `node_modules` and reinstalling: `npm install`
- Check if port 3000 is already in use

### Extension Not Loading
- Verify you're in the correct directory (`extension/`)
- Ensure `manifest.json` exists and is valid
- Try reloading the extension in your browser
- Check the browser console for error messages

### Authentication Issues
- Clear your browser cookies and cache
- Log out and log back in at the Watcard portal
- Ensure you're using the correct University credentials

## Support & Resources

- **Watcard Official Portal**: https://secure.touchnet.net/C22566_oneweb/TransactionHistory/Transactions
- **University of Waterloo**: https://uwaterloo.ca
- **Next.js Documentation**: https://nextjs.org/docs

## License

This project is for personal use. Please refer to the University of Waterloo's policies regarding third-party applications.

## Contributing

To contribute improvements:
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m "Add feature"`
4. Push to your branch: `git push origin feature-name`
5. Submit a pull request

---

**Last Updated**: February 26, 2026

For more information or issues, please check the project repository or contact the development team.
