# Modern Webmail Client - Full Stack

This is a full-stack webmail client featuring a modern React frontend and a powerful Node.js backend built with Fastify. It connects to any standard IMAP/SMTP mail server and provides a user experience similar to services like Gmail, with features like real-time updates, background job processing, and a local database cache for performance.

**Note:** The core mail functionality (login, viewing folders/messages) is connected to a real PostgreSQL database. However, features like **Contacts, Labels, and most Settings** are currently implemented with a stateful **in-memory mock backend**. This means they are fully functional for a single session but will reset when the server restarts.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Features](#features)
- [System Requirements](#1-system-requirements)
- [Configuration (.env)](#2-configuration)
- [Local Development Setup](#3-local-development-setup)
- [Production Deployment Guide (Apache 2.4)](#4-production-deployment-guide-apache-24)
  - [Step 1: Server Preparation](#step-1-server-preparation)
  - [Step 2: Database & Redis Setup](#step-2-database--redis-setup)
  - [Step 3: Application Setup](#step-3-application-setup)
  - [Step 4: Process Management with PM2](#step-4-process-management-with-pm2)
  - [Step 5: Configure Apache as a Reverse Proxy](#step-5-configure-apache-as-a-reverse-proxy)
  - [Step 6: Secure with SSL (Let's Encrypt)](#step-6-secure-with-ssl-lets-encrypt)

## Architecture Overview

The application is a monolith but is structured into three distinct, cooperating parts:

1.  **React Frontend**: The user interface located in the root directory. In production, this is built into a set of static files (`dist/`).
2.  **Fastify API Server**: The backend server located in `server/`. It handles all API requests (REST endpoints) and WebSocket connections for real-time communication.
3.  **BullMQ Workers**: Background processes, also in `server/`, that connect to a Redis queue. They are responsible for long-running tasks like sending emails and syncing the mailbox, ensuring the API server remains responsive.

## Features

-   **Frontend**:
    -   Responsive UI built with React and Tailwind CSS.
    -   Real-time updates via WebSockets.
    -   Client-side caching and offline support via Service Worker (PWA).
    -   Full-featured email composition, contact management, and settings.
-   **Backend**:
    -   High-performance Fastify server written in TypeScript.
    -   **IMAP/SMTP Integration**: Uses `imapflow` for robust IMAP communication (including IDLE for push notifications) and `nodemailer` for SMTP.
    -   **PostgreSQL Database**: Caches mailbox data for fast access using the `pg` driver.
    -   **Background Jobs**: Uses Redis and BullMQ for handling long-running tasks.
    -   **Security**: Encrypts stored mail credentials (AES-GCM), uses JWT for session management, and sanitizes HTML content.

---

## 1. System Requirements

Before you begin, ensure you have the following installed on your development machine or production server:

-   **OS**: A Linux distribution is recommended (guide uses Ubuntu 22.04).
-   **Node.js**: Version 20.x or later.
-   **npm** (or yarn/pnpm).
-   **PostgreSQL**: Version 14 or later.
-   **Redis**: Version 6 or later.
-   **Git**: For cloning the repository.
-   **PM2** (for production): `sudo npm install pm2 -g`
-   **Apache 2.4** (for production reverse proxy).

---

## 2. Configuration

The backend requires environment variables for database connections, Redis, and security keys.

1.  Copy the example file:
    ```bash
    cp server/.env.example server/.env
    ```
2.  **Edit `server/.env`** with your configuration.

| Variable              | Description                                                                                             | Example                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`        | **Required.** Your full PostgreSQL connection string.                                                   | `postgresql://user:password@localhost:5432/webmail?schema=public`  |
| `REDIS_URL`           | Your Redis connection string. **Provide either this or `REDIS_SOCKET_PATH`**.                           | `redis://localhost:6379`                                           |
| `REDIS_SOCKET_PATH`   | The path to a local Redis Unix socket.                                                                  | `/var/run/redis/redis-server.sock`                                 |
| `JWT_SECRET`          | **Required.** A long, random string for signing JSON Web Tokens.                                        | `openssl rand -hex 32`                                             |
| `ENCRYPTION_KEY`      | **Required.** A 64-character hex string (32 bytes) for encrypting mail credentials.                     | `openssl rand -hex 32`                                             |
| `HOST`                | The host address for the Fastify server to listen on.                                                   | `0.0.0.0`                                                          |
| `PORT`                | The port for the Fastify server.                                                                        | `3001`                                                             |

---

## 3. Local Development Setup

### Step 1: Clone and Install

```bash
git clone <your-repository-url> webmail-client
cd webmail-client
npm install
```

### Step 2: Configure Environment

-   Create and fill out your `server/.env` file as described in the [Configuration](#2-configuration) section above. Use your local database and Redis details.

### Step 3: Set Up the Database

1.  Make sure your PostgreSQL server is running. Create a new database and user for the application.
2.  A database schema is not provided in this repository, but the application expects tables for `User`, `Account`, `Folder`, `Email`, and `Attachment`. You will need to create these manually. The login process will automatically create default folders for a new user.

### Step 4: Run the Application

This project has three main components. Open three separate terminals and run the following commands:

1.  **Terminal 1: Start Frontend (Vite)**
    ```bash
    npm run dev
    ```
    This starts the React development server, typically on `http://localhost:5173`.

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

---

## 4. Production Deployment Guide (Apache 2.4)

This guide covers deploying on a fresh Ubuntu 22.04 server with Apache 2.4 as a reverse proxy.

### Step 1: Server Preparation

1.  **Update System**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```
2.  **Install Node.js (via NodeSource)**
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    ```
3.  **Install PostgreSQL, Redis, and Apache**
    ```bash
    sudo apt install -y postgresql postgresql-contrib redis-server apache2
    ```
4.  **Install PM2 Globally**
    ```bash
    sudo npm install pm2 -g
    ```
5.  **Enable Required Apache Modules**
    ```bash
    sudo a2enmod proxy proxy_http proxy_wstunnel rewrite
    sudo systemctl restart apache2
    ```
6.  **Configure Firewall**
    ```bash
    sudo ufw allow 'Apache Full' # Allows HTTP and HTTPS
    sudo ufw allow OpenSSH
    sudo ufw enable
    ```

### Step 2: Database & Redis Setup

1.  **Secure PostgreSQL**
    -   Log in to PostgreSQL: `sudo -u postgres psql`
    -   Set a password for the `postgres` user: `\password postgres`
    -   Create a dedicated user and database for the app:
        ```sql
        CREATE DATABASE webmail;
        CREATE USER webmail_user WITH PASSWORD 'your_strong_password';
        GRANT ALL PRIVILEGES ON DATABASE webmail TO webmail_user;
        \q
        ```
2.  **Initialize Database Schema**
    -  You will need to manually create the required tables for `User`, `Account`, `Folder`, etc., as no schema script is provided.

3.  **Verify Redis**
    -   Check that Redis is running: `sudo systemctl status redis-server`. It should be active. By default, it listens only on localhost, which is secure.

### Step 3: Application Setup

1.  **Clone Repository**
    ```bash
    git clone <your-repository-url> /var/www/webmail-client
    cd /var/www/webmail-client
    ```
2.  **Set Permissions**
    ```bash
    # Replace 'your_user' with your non-root username
    sudo chown -R your_user:your_user /var/www/webmail-client
    ```
3.  **Install Dependencies for Production**
    ```bash
    npm install --omit=dev
    ```
4.  **Create Production Environment File**
    -   `cp server/.env.example server/.env`
    -   Edit `server/.env` with your **production** database credentials and **new, strong secrets**.

5.  **Build the Application**
    ```bash
    npm run build
    ```
    This creates the static frontend in `dist/` and the compiled backend in `server/dist/`.

### Step 4: Process Management with PM2

1.  **Start the Application**
    -   The `ecosystem.config.cjs` file is configured to run both the API server and the worker.
    ```bash
    npm start
    ```
2.  **Verify Processes**
    ```bash
    pm2 list
    ```
    You should see both `webmail-api` and `webmail-worker` online.

3.  **Enable PM2 Startup on Boot**
    ```bash
    pm2 startup
    # (Follow the command's instructions, which will look like: sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u your_user --hp /home/your_user)
    pm2 save
    ```

### Step 5: Configure Apache as a Reverse Proxy

1.  **Disable Default Apache Site**
    ```bash
    sudo a2dissite 000-default.conf
    ```
2.  **Create Apache Configuration File**
    ```bash
    sudo nano /etc/apache2/sites-available/your-domain.com.conf
    ```
3.  **Paste and Edit the Following Configuration**:
    ```apache
    <VirtualHost *:80>
        ServerName your-domain.com
        ServerAdmin webmaster@localhost

        # Redirect all HTTP traffic to HTTPS
        Redirect permanent / https://your-domain.com/
    </VirtualHost>

    <VirtualHost *:443>
        ServerName your-domain.com
        ServerAdmin webmaster@localhost

        # SSL Configuration will be added by Certbot later
        # SSLEngine on
        # SSLCertificateFile ...
        # SSLCertificateKeyFile ...
        
        DocumentRoot /var/www/webmail-client/dist
        
        # Rule to handle WebSocket connections for the /socket path
        RewriteEngine On
        RewriteCond %{HTTP:Upgrade} websocket [NC]
        RewriteCond %{HTTP:Connection} upgrade [NC]
        RewriteRule ^/?socket/?(.*) "ws://127.0.0.1:3001/socket/$1" [P,L]

        # Rule to proxy all /api requests to the backend Node.js server
        ProxyPass /api/ http://127.0.0.1:3001/api/
        ProxyPassReverse /api/ http://127.0.0.1:3001/api/

        # Rule for the React frontend: serve static files if they exist,
        # otherwise, fall back to index.html for client-side routing.
        <Directory /var/www/webmail-client/dist>
            Options Indexes FollowSymLinks
            AllowOverride All
            Require all granted
        </Directory>
        
        <Location />
            RewriteEngine on
            RewriteCond %{REQUEST_FILENAME} !-f
            RewriteCond %{REQUEST_FILENAME} !-d
            RewriteRule . /index.html [L]
        </Location>

        ErrorLog ${APACHE_LOG_DIR}/your-domain.com-error.log
        CustomLog ${APACHE_LOG_DIR}/your-domain.com-access.log combined
    </VirtualHost>
    ```
4.  **Enable the Site and Restart Apache**
    ```bash
    sudo a2ensite your-domain.com.conf
    sudo systemctl reload apache2
    ```
    Your site should now be accessible over HTTP (though it will redirect to a non-existent HTTPS site).

### Step 6: Secure with SSL (Let's Encrypt)

1.  **Install Certbot for Apache**
    ```bash
    sudo apt install certbot python3-certbot-apache
    ```
2.  **Obtain and Install SSL Certificate**
    ```bash
    # Replace with your domain
    sudo certbot --apache -d your-domain.com
    ```
    Follow the on-screen prompts. Certbot will automatically find your VirtualHost, obtain a certificate, and modify your Apache configuration file to enable HTTPS. It will also set up a cron job for automatic renewal.

3.  **Final Restart**
    ```bash
    sudo systemctl restart apache2
    ```

Your application is now fully deployed and accessible at `https://your-domain.com`.