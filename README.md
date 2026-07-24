# Customer-360-Attribute-Advisor
Ask about attribute availability, business definitions, calculation logic, update frequency, data latency, or enumerated values. Answers are grounded exclusively in the Customer 360 Attribute Dictionary.

## Quick start

## MacOS

### 1.1 Prerequisites

Before starting, make sure:

- Node.js 22.13 or later is installed.
- Codex Desktop or Codex CLI is installed and signed in.
- The 'Friday' folder has been downloaded with the following structure:
```text
Friday/
├── customer-360-advisor-app/
└── customer-360-attribute-advisor/
```

### 1.2 Install Dependencies

Open Terminal and navigate to the UI folder:
```bash
cd Friday/customer-360-advisor-app
npm install
```
This step is required only the first time.

### 1.3 Terminal 1: Start the Agent

```bash
cd Friday/customer-360-advisor-app
npm run agent
```
Keep this Terminal window open.

### 1.4 Terminal 2: Start the Web App

Open another Terminal window:
```bash
cd Friday/customer-360-advisor-app
npm run dev
```
Keep this Terminal window open.

### 1.5 Browser: Open the Web App

Open the Local URL displayed in Terminal:
http://localhost:3000/

### 1.6 Stop the Application

Press Control + C in both Terminal windows.

#### 1.7Network Note:

The Agent requires access to Codex services. Users must ensure that their network environment can access the required OpenAI services and comply with applicable organizational and local network policies.
