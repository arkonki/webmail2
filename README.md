# Modern Webmail Client - Full Stack

This is a full-stack webmail client featuring a modern React frontend and a powerful Node.js backend built with Fastify. It connects to any standard IMAP/SMTP mail server and provides a user experience similar to services like Gmail, with features like real-time updates, background job processing, and a local database cache for performance.

## Features

- **Frontend**:
    -   Responsive UI built with React and Tailwind CSS.
    -   Real-time updates via WebSockets.
    -   Client-side caching and offline support via Service Worker.
    -   Full-featured email composition, contact management, and settings.
- **Backend**:
    -   High-performance Fastify server written in TypeScript.
    -   **IMAP/SMTP Integration**: Uses `imapflow` for robust IMAP communication (including IDLE for push notifications) and `nodemailer` for SMTP.
    -   **PostgreSQL Database**: Caches mailbox data for fast access using Prisma ORM.
    -   **Full-Text Search**: Leverages PostgreSQL's trigram indexing for efficient searching.
    -   **Background Jobs**: Uses Redis and BullMQ for handling long-running tasks like mailbox synchronization and sending emails.
    -   **Security**: Encrypts stored mail credentials (AES-GCM), uses JWT for session management, and sanitizes HTML content.
- **Tooling**:
    -   **PM2**: Production process management for the server and workers.
    -   **Prisma Migrations**: For easy database schema management.
    -   **OpenAPI/Swagger**: Automatic API documentation.

## 1. Prerequisites

Before you begin, ensure you have the following installed on your development machine or server:

-   **Node.js**: Version 18.x or later.
-   **npm** (or yarn/pnpm).
-   **PostgreSQL**: A running PostgreSQL server.
-   **Redis**: A running Redis server.
-   **Git**: For cloning the repository.
-   **PM2** (for production):
    ```bash
    sudo npm install pm2 -g
    ```

## 2. Local Development Setup

### Step 1: Clone and Install

1.  Clone the repository and navigate into the project directory.
    ```bash
    git clone <your-repository-url> webmail-client
    cd webmail-client
    ```
2.  Install all dependencies.
    ```bash
    npm install
    ```

### Step 2: Configure Environment Variables

1.  The backend requires environment variables for database connections, Redis, and security keys. Copy the example file:
    ```bash
    cp server/.env.example server/.env
    ```
2.  **Edit `server/.env`** with your local configuration:
    -   `DATABASE_URL`: Your PostgreSQL connection string.
        ```
        DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
        ```
    -   `REDIS_URL`: Your Redis connection string.
        ```
        REDIS_URL="redis://HOST:PORT"
        ```
    -   `JWT_SECRET` & `ENCRYPTION_KEY`: Generate strong, unique secrets for these.
        ```bash
        # Run these in your terminal and copy the output
        openssl rand -hex 32
        ```

### Step 3: Set Up the Database

1.  Run the Prisma migration command to create the necessary tables in your PostgreSQL database.
    ```bash
    npm run prisma:migrate
    ```
2.  (Optional) Generate the Prisma client based on your schema. This is often done automatically by the migrate command.
    ```bash
    npm run prisma:generate
    ```

### Step 4: Run the Application

This project has three main components that need to run concurrently for development: the Vite frontend server, the Fastify API server, and the BullMQ worker process.

Open three separate terminal windows in the project root and run the following commands:

1.  **Terminal 1: Start Frontend (Vite)**
    ```bash
    npm run dev
    ```
    This will start the React development server, typically on `http://localhost:5173`.

2.  **Terminal 2: Start Backend API (Fastify)**
    ```bash
    npm run dev:server
    ```
    This starts the API server with hot-reloading on `http://localhost:3001`.

3.  **Terminal 3: Start Background Worker (BullMQ)**
    ```bash
    npm run dev:worker
    ```
    This starts the worker process that listens for and handles jobs from the Redis queue.

You can now access the application at `http://localhost:5173`.

## 3. Production Deployment

This guide covers deploying on a Linux server (e.g., Ubuntu) with Apache as a reverse proxy.

### Step 1: Build the Application

1.  On your server, pull the latest code and install dependencies.
    ```bash
    git pull
    npm install
    ```
2.  Build both the frontend and backend.
    ```bash
    npm run build
    ```
    This compiles the React app into the `dist/` directory and the TypeScript server into the `server/dist/` directory.

### Step 2: Configure Environment

-   Ensure your production server has the necessary environment variables set (either in `server/.env` or as system environment variables). **Use different, stronger secrets for production.**
-   Run database migrations against your production database:
    ```bash
    npm run prisma:migrate
    ```
    *Note: In production, you might use `prisma migrate deploy` instead of `dev`.*

### Step 3: Run with PM2

The `ecosystem.config.cjs` file is configured to run both the main API server and the background worker.

1.  Start the application using PM2:
    ```bash
    npm start
    ```
2.  Verify the processes are running:
    ```bash
    pm2 list
    ```
3.  Set up PM2 to start automatically on server reboot:
    ```bash
    pm2 startup
    # (Follow the instructions provided by the command)
    pm2 save
    ```

### Step 4: Configure Apache as a Reverse Proxy

Configure Apache to serve the static frontend and proxy API/WebSocket requests to the Fastify server.

1.  Enable necessary Apache modules:
    ```bash
    sudo a2enmod proxy proxy_http proxy_wstunnel rewrite
    ```
2.  Create a VirtualHost configuration file at `/etc/apache2/sites-available/your-domain.com.conf`.

    ```apache
    <VirtualHost *:80>
        ServerName your-domain.com

        # Path to the built frontend files
        DocumentRoot /var/www/webmail-client/dist

        <Directory /var/www/webmail-client/dist>
            Options Indexes FollowSymLinks
            AllowOverride All
            Require all granted
            # Let React Router handle routing
            FallbackResource /index.html
        </Directory>

        # --- WebSocket Proxy ---
        RewriteEngine On
        RewriteCond %{HTTP:Upgrade} =websocket [NC]
        RewriteRule ^/socket/?(.*) "ws://127.0.0.1:3001/socket/$1" [P,L]

        # --- API Reverse Proxy ---
        ProxyPass /api/ http://127.0.0.1:3001/api/
        ProxyPassReverse /api/ http://127.0.0.1:3001/api/

        ErrorLog ${APACHE_LOG_DIR}/your-domain-error.log
        CustomLog ${APACHE_LOG_DIR}/your-domain-access.log combined
    </VirtualHost>
    ```

3.  Enable the site and restart Apache:
    ```bash
    sudo a2ensite your-domain.com.conf
    sudo systemctl restart apache2
    ```

4.  **(Recommended)** Secure your site with a free SSL certificate from Let's Encrypt using `certbot`.
    ```bash
    sudo apt install certbot python3-certbot-apache
    sudo certbot --apache
    ```
