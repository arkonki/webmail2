# Modern Webmail Client - Deployment Guide

This guide provides step-by-step instructions for deploying the Modern Webmail Client application on a server running Apache. We will use PM2 to manage the Node.js backend server and configure Apache as a reverse proxy to serve both the frontend application and the backend API.

## 0. Environment Configuration (Crucial!)

This application uses environment variables for critical security keys. You must configure them before running the server.

1.  **Create a `.env` file**: In the root of the project, create a file named `.env`. You can do this by copying the example file:
    ```bash
    cp .env.example .env
    ```

2.  **Generate Production Keys**: The `.env` file comes with pre-filled keys for development. **For a production deployment, you MUST replace these with your own unique, secure keys.** You can generate strong keys using `openssl` in your terminal:

    ```bash
    # For JWT_SECRET
    openssl rand -hex 32

    # For ENCRYPTION_KEY
    openssl rand -hex 32
    ```

    Copy the generated values into your `.env` file. On a production server, it's even better to set these as system environment variables directly, rather than using a `.env` file.

## 1. Prerequisites

Before you begin, ensure you have the following installed on your server (e.g., a Debian-based Linux distribution like Ubuntu):

-   **Node.js**: Version 18.x or later is recommended.
-   **npm** (or yarn/pnpm)
-   **Apache2**: A running Apache web server.
-   **PM2**: A production process manager for Node.js. Install it globally:
    ```bash
    sudo npm install pm2 -g
    ```
-   **Git**: For cloning the repository.
-   **tsx**: This project uses `tsx` to run the TypeScript server directly. `npm install` will install it locally from `devDependencies`.

## 2. Deployment Steps

### Step 1: Get the Code and Build the Application

1.  **Clone the repository** to a suitable directory on your server. A common location is `/var/www/`.

    ```bash
    # Replace <your-repository-url> with the actual URL
    git clone <your-repository-url> /var/www/webmail-client
    cd /var/www/webmail-client
    ```

2.  **Install dependencies**. This will install all necessary packages from `package.json`.

    ```bash
    npm install
    ```

3.  **Build the frontend application**. This command compiles the React frontend into static files ready for production.

    ```bash
    npm run build
    ```

    This will create a `dist` directory in your project root, containing the `index.html`, JavaScript, and CSS files to be served.

### Step 2: Start the Backend Server with PM2

We will use PM2 to run the Express backend server (`server/index.ts`) as a persistent background service that will automatically restart if it crashes or the server reboots.

1.  **Start the server**: From your project's root directory (`/var/www/webmail-client`), run the following command:

    ```bash
    pm2 start server/index.ts --interpreter ./node_modules/.bin/tsx --name webmail-backend
    ```

    -   `--interpreter ./node_modules/.bin/tsx`: Tells PM2 to use the locally installed `tsx` to execute the TypeScript file.
    -   `--name webmail-backend`: Assigns a convenient name to the process for easy management.

2.  **Verify the server is running**: You can check the status and logs of your backend process.

    ```bash
    pm2 list
    # or view live logs
    pm2 logs webmail-backend
    ```

3.  **Enable PM2 to start on server reboot**: This is crucial for production.

    ```bash
    pm2 startup
    ```

    PM2 will output a command that you need to copy and execute. This command will configure a system service for PM2.

4.  **Save the current process list**: After starting your app, save the process list so PM2 can resurrect it after a reboot.

    ```bash
    pm2 save
    ```

### Step 3: Configure Apache as a Reverse Proxy

We will configure Apache to do two things:
1.  Serve the static frontend files from the `dist` directory.
2.  Forward all API requests (i.e., `/api/*`) to our backend Node.js server running on port 3001.
3.  Proxy WebSocket connections for future use.

1.  **Enable necessary Apache modules**: These modules are required for reverse proxying.

    ```bash
    sudo a2enmod proxy proxy_http proxy_wstunnel rewrite
    ```

2.  **Create an Apache VirtualHost configuration file**: Replace `your-domain.com` with your actual domain or server IP address.

    ```bash
    sudo nano /etc/apache2/sites-available/your-domain.com.conf
    ```

3.  **Add the following configuration** to the file. Make sure to replace `your-domain.com` and `/var/www/webmail-client` with your actual values.

    ```apache
    <VirtualHost *:80>
        ServerName your-domain.com

        # Path to the built frontend files
        DocumentRoot /var/www/webmail-client/dist

        # Configuration for the frontend static files and routing
        <Directory /var/www/webmail-client/dist>
            Options Indexes FollowSymLinks
            AllowOverride All
            Require all granted
            # This allows React Router to handle all routes
            FallbackResource /index.html
        </Directory>

        # --- API Reverse Proxy ---
        # Forward requests for /api/* to the Node.js backend server
        ProxyPreserveHost On
        ProxyPass /api/ http://127.0.0.1:3001/api/
        ProxyPassReverse /api/ http://127.0.0.1:3001/api/

        # --- WebSocket Reverse Proxy (for future use) ---
        # This section is for proxying WebSocket connections if you add them later.
        # For example, if your WebSocket server is at /socket.io/
        RewriteEngine On
        RewriteCond %{HTTP:Upgrade} =websocket [NC]
        RewriteRule /(.*) ws://127.0.0.1:3001/$1 [P,L]

        # Error logging
        ErrorLog ${APACHE_LOG_DIR}/your-domain.com-error.log
        CustomLog ${APACHE_LOG_DIR}/your-domain.com-access.log combined
    </VirtualHost>
    ```

4.  **Enable the new site configuration and restart Apache**:

    ```bash
    # Enable the new site configuration
    sudo a2ensite your-domain.com.conf

    # Disable the default Apache site if it's enabled
    sudo a2dissite 000-default.conf

    # Test the configuration for syntax errors
    sudo apache2ctl configtest

    # If the syntax is OK, restart Apache to apply the changes
    sudo systemctl restart apache2
    ```

Your application should now be live and accessible at `http://your-domain.com`.

## 4. Setting Up SSL with Let's Encrypt (Recommended)

For a production environment, it is highly recommended to secure your site with HTTPS. You can get a free SSL certificate from Let's Encrypt using the Certbot tool.

1.  **Install Certbot for Apache**:

    ```bash
    sudo apt update
    sudo apt install certbot python3-certbot-apache
    ```

2.  **Run Certbot**: It will automatically detect your domain from the Apache configuration, obtain a certificate, and configure Apache for SSL (HTTPS).

    ```bash
    sudo certbot --apache
    ```

Follow the on-screen prompts. Certbot will also set up a cron job for automatic certificate renewal. After it's done, your site will be secure and available at `https://your-domain.com`.

## 5. Deployment on Shared Hosting (FreeBSD, No Sudo Access)

Deploying on a shared hosting environment where you do not have `sudo` access requires a different approach, as you cannot install system-wide software or modify the main Apache configuration. The best method is to use the tools provided by your hosting provider, often through a control panel like **cPanel**.

### Step 1: Upload Your Project Files

1.  On your local machine, run the build command to generate the frontend assets:
    ```bash
    npm run build
    ```
2.  Upload the **entire project directory** (including `node_modules`, `dist`, `server`, `package.json`, etc.) to your server using an FTP client or the control panel's File Manager. A common location is inside your `public_html` directory or a subdirectory for your domain.

### Step 2: Set Up the Node.js Application in cPanel

Most modern shared hosting providers have a dedicated tool for running Node.js applications.

1.  Log in to your cPanel account.
2.  Find and open the **"Setup Node.js App"** tool.
3.  Click **"Create Application"**.
4.  Fill out the form:
    *   **Node.js version**: Select the newest version available (e.g., 18.x or 20.x).
    *   **Application mode**: Set to "production".
    *   **Application root**: Browse and select the root directory of your project (e.g., `/home/youruser/public_html/webmail-client`).
    *   **Application startup file**: Enter `server/index.ts`.
    *   **Application URL**: Select the domain or subdomain you want to use.
5.  Click **"Create"**. The system will start your application on a private port and automatically configure Apache to proxy requests from your public URL to your app.

### Step 3: Install Dependencies

1.  After the application is created, the control panel will show its details.
2.  Find and click the **"NPM Install"** button. This will execute `npm install` on the server, ensuring all dependencies are correctly installed for the server's environment.
3.  Click **"Restart"** at the top of the page to restart your application with the new dependencies.

### Step 4: Configure `.htaccess` for Client-Side Routing

The cPanel setup automatically handles proxying the `/api/` routes to your backend. However, you need to ensure the frontend's client-side routing works correctly.

1.  Using the File Manager in cPanel, navigate to the `dist` folder inside your project directory.
2.  Create or edit the `.htaccess` file in the `dist` folder.
3.  Add the following content:

    ```apache
    <IfModule mod_rewrite.c>
      RewriteEngine On
      # Don't rewrite files or directories that exist
      RewriteCond %{REQUEST_FILENAME} -f [OR]
      RewriteCond %{REQUEST_FILENAME} -d
      RewriteRule ^ - [L]
      # Rewrite everything else to index.html to allow React Router to handle it
      RewriteRule ^ index.html [L]
    </IfModule>
    ```

This configuration ensures that any direct navigation to a URL like `your-domain.com/settings` is handled by your React application's `index.html` file, allowing React Router to manage the view. Your application should now be fully functional on your shared hosting account.
