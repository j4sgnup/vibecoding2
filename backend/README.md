
# ACM PoC Backend

This directory contains the Node.js, Express, and MongoDB backend for the Account Management Proof-of-Concept application.

## First-Time Setup

1.  **Install Dependencies:**
    Navigate to this directory in your terminal and run:
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Create a `.env` file in this directory (`acm-poc-backend/.env`). This file is required to store your database connection string and API keys. Copy the contents of `.env.example` (if provided) or create it from scratch with the following variables:

    ```
    MONGO_URI="your_mongodb_connection_string"
    GEMINI_API_KEY="your_google_gemini_api_key"
    TWILIO_ACCOUNT_SID="your_twilio_account_sid"
    TWILIO_AUTH_TOKEN="your_twilio_auth_token"
    TWILIO_PHONE_NUMBER="your_twilio_whatsapp_enabled_phone_number"
    RECIPIENT_PHONE_NUMBER="whatsapp:the_number_to_receive_alerts"
    ```

## Seeding the Database

To populate the database with realistic sample data, run the master seed script. This will erase all existing data and create new organizations, users, and audit logs.

> **:warning: Important:** This is a destructive operation. It will delete all data in the `organizations`, `users`, `serviceaccesslogs`, and `auditlogs` collections before running.

```bash
npm run seed
```

This single command will run both seed scripts in the correct order, ensuring the database is set up correctly.

## Running the Application

To start the backend server in development mode (which will automatically restart on file changes), run:

```bash
npm run dev
```

The server will start on `http://localhost:3001`.
