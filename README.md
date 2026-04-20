# Serverless Task Manager (Zero-Cost Architecture)

**Course:** CSC11006 - Introduction to Cloud Computing Services  
**Institution:** VNU-HCMUS

This repository contains the local development setup for the **Serverless Task Manager** web application. The project is structured into two main directories: `frontend` and `backend`.

---

## 🛠 Prerequisites

Before running the project, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (Recommended: LTS version)
- A terminal (Command Prompt, PowerShell, or Terminal)

---

## 🚀 1. Running the Backend

The backend is a Node.js mock API designed to handle CRUD operations locally, simulating the behavior of serverless functions.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install the required dependencies:**
    The project uses Express, CORS, and AWS SDK for DynamoDB operations.
    ```bash
    npm install express cors @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
    npm install --save-dev nodemon
    ```
    *Note: If you already have a `package.json` file, simply run:*
    ```bash
    npm install
    ```

3.  **Start the local server:**
    Run the server in development mode (it will automatically reload on changes):
    ```bash
    npm run dev
    ```

4.  **API Endpoint:**
    The backend API will be accessible at: `http://localhost:3000`

---

## 💻 2. Running the Frontend

The frontend consists of static files (HTML, CSS, and Vanilla JavaScript).

1.  **Open a new, separate terminal** (keep the backend terminal running).
2.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

3.  **Start the static web server:**
    We use `npx serve` to host the static files.
    ```bash
    npx serve
    ```

4.  **Access the Application:**
    The terminal will output a local URL (e.g., `http://localhost:3000` or `http://localhost:3001` if port 3000 is occupied). `Ctrl + Click` the link to open the Task Manager in your browser.

---

## 📁 Project Structure
- `/backend`: Node.js API with DynamoDB integration.
- `/frontend`: Static web files (HTML/CSS/JS).