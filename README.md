
# Account Management Portal - Proof of Concept


This repository contains the source code for the Account Management Proof-of-Concept (PoC), a full-stack application designed to showcase an intelligent, AI-enhanced platform for managing organizations and their users. The project is now organized into a `backend/` (Node.js/Express) and `frontend/` (React/Vite) folder, with modern deployment scripts for local and Azure App Service deployment.

---

## 1. Prerequisites

Before you begin, ensure you have the following software installed on your system:

*   **Node.js:** Version 18.x or higher. You can download it from [nodejs.org](https://nodejs.org/).
*   **npm:** Node Package Manager, which comes bundled with Node.js.
*   **Git:** For cloning the repository. You can get it from [git-scm.com](https://git-scm.com/).
*   **MongoDB:** A running instance of MongoDB. You can install it locally or use a free cloud-hosted service like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

---

## 2. Installation and Setup

Follow these steps to get the application running on your local machine.

### Step 1: Clone the Repository

Open your terminal and clone this repository to your desired location:

```bash
git clone <repository_url>
cd vibe-coding
```


### Step 2: Install Dependencies (Frontend & Backend)

Install dependencies for both frontend and backend:

```bash
cd frontend
npm install
cd ../backend
npm install
cd ..
```

### Step 3: Configure Backend Environment

In the `backend` directory, create a file named `.env` with your secret keys and connection strings:

```env
# Your MongoDB connection string
MONGO_URI="mongodb://localhost:27017/acm-poc"

# Google Gemini API Key for AI features
GEMINI_API_KEY="your_google_gemini_api_key"

# Twilio credentials for WhatsApp alerts
TWILIO_ACCOUNT_SID="your_twilio_account_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="your_twilio_whatsapp_enabled_phone_number"

# The number that will receive alerts (must be in 'whatsapp:<E.164_format>' format)
RECIPIENT_PHONE_NUMBER="whatsapp:+14155238886"
```

---

## 3. Local Development & Deployment

### Quick Start (Recommended)

From the project root, run:

```bash
sh deploy-local.sh
```

This will:
- Build and deploy the frontend to the `public/` folder
- Build and deploy the backend to the `dist/` folder
- Install root dependencies and start the backend server


### Advanced: Hot-Reloading Frontend Development

For rapid frontend development with hot-reloading, you can run the Vite dev server. API requests from the frontend will be proxied to the backend.

1. In `frontend/vite.config.ts`, ensure you have a proxy set up for API calls:

```ts
// vite.config.ts
export default defineConfig({
    // ...existing config...
    server: {
        proxy: {
            '/api': 'http://localhost:3001',
        },
    },
});
```

2. In one terminal, start the backend:

```bash
cd backend
npm run dev
```

3. In another terminal, start the frontend dev server:

```bash
cd frontend
npm run dev
```

* The frontend will be available at http://localhost:5173 and will proxy API requests to the backend at http://localhost:3001.

* For production-like testing, use `sh deploy-local.sh` as described above.

---

## 4. Azure App Service Deployment

1. Push your code to your remote repository.
2. In the Azure Portal, set the App Service **Startup Command** to:
    ```
    sh deploy.sh
    ```
3. Deploy using the Azure App Service extension in VS Code or Deployment Center in the portal.
4. Azure will run your `deploy.sh` script, which builds and deploys both frontend and backend.

---

## 5. Project Structure

```
frontend/   # React/Vite frontend source code
backend/    # Node.js/Express backend source code
public/     # Static frontend build output (served by backend)
dist/       # Backend build output
scripts/    # Shared scripts (e.g., inject-build-date.js)
deploy.sh   # Root deploy script for Azure and local
deploy-local.sh # Local deploy script
```

---

## 6. Notes

- All build artifacts and sensitive files are ignored via `.gitignore`.
- For troubleshooting Azure deployments, use the Log Stream in the Azure portal.

---


### Seeding the Database

From the `backend` directory, run the master seed script to populate your database with sample data:

> **:warning: Important:** This command will **delete all existing data** in the database to ensure a clean slate.

```bash
cd backend
npm run seed
```

---

## Running Locally (Ports)

* Frontend (Vite): http://localhost:5173
* Backend (Express): http://localhost:3001

The backend serves the built frontend from the `public/` folder in production.

---

## Triggering a Redeploy on Azure

- If you are using **continuous deployment** (Deployment Center connected to a GitHub/Azure repo), a redeploy happens automatically when you push to the configured branch.
- To manually force a redeploy from your repo, use the **Sync** button in the Azure Portal’s Deployment Center.
- If you are deploying directly from VS Code, use the **Deploy to Web App…** command in the Azure sidebar to upload your current local code and trigger the deploy script.



## 3. Post-Installation Verification Tests

After installation, perform these simple checks to ensure all core functionalities are working correctly.

### Test 1: Verify Basic Application Functionality

1.  Open the application in your browser.
2.  You should see the **Dashboard** with a list of organizations on the left.
3.  Click on an organization name (e.g., the first one in the list).
4.  **Expected Result:** The main panel should update to show the "Onboarding Status" and "Other Insights" for that organization. This confirms the frontend is successfully fetching data from the backend.

### Test 2: Verify AI-Powered Search

1.  In the left-hand navigation menu, click on **Audit Trail**.
2.  In the "Natural Language Query" search box, type the following and press search:
    `Show me all failed logins for Security Sam`
3.  **Expected Result:** The table should update to show a single audit log entry for a failed login by "Security Sam" from "Mumbai, India". An AI icon should appear next to the "Search Results" title, indicating the AI successfully processed the query.

### Test 3: Verify AI-Generated Insights

1.  Navigate back to the **Dashboard**.
2.  Select any organization.
3.  Look for the **"AI-Generated Summary"** card.
4.  **Expected Result:** The card should display a concise, one-sentence insight about the selected organization. This confirms the AI insight generation is working.

### Test 4: Verify Alerting and Simulation

This test confirms that event simulation and Twilio notifications are working end-to-end.

1.  **Configure an Alert:**
    *   Go to the **Audit Trail** page.
    *   Search for any event (e.g., type `role modified` in the search bar).
    *   In the results table, find any row and click the **Create Alert** button in the "Alerts" column.
    *   Enter your personal WhatsApp-enabled phone number (in the format `+1234567890`) and click **Confirm**.

2.  **Simulate the Event:**
    *   Navigate to **Settings** > **Go to Simulation Page**.
    *   From the "Organization" dropdown, select the *same organization* for which you just created the alert.
    *   From the "Action" dropdown, select the *same action* (e.g., "Role Modified").
    *   Click **Run Simulation**.

3.  **Expected Result:** You should see a success message on the screen, and within a few moments, you should receive a **WhatsApp message** on your phone from your Twilio number, notifying you of the simulated event.
  [**Note:** Currently Twilio is on trial mode, and needs reconnect to a whatsapp enabled phone every 24 hrs, so there could be some prerequisite tasks before this functionality works as expected.]
