# Modern Webmail Client - Frontend Demonstration

This is a high-fidelity frontend demonstration of a modern webmail client, built with React and Tailwind CSS. It provides a user experience similar to services like Gmail, with features like conversation view, contact management, labels, folders, and settings.

**Note:** This is a **frontend-only** application. There is no backend server. All data is mocked and persisted in your browser's `localStorage` to simulate a real-world experience without needing a server or database.

## Table of Contents

- [Features](#features)
- [Live Demo & Screenshots](#live-demo--screenshots)
- [Technology Stack](#technology-stack)
- [Local Development Setup](#local-development-setup)

## Features

-   **Responsive UI**: A clean, modern interface that works on all screen sizes.
-   **State Management**: Centralized state management with React Context for a predictable application state.
-   **Local Persistence**: All changes (read/unread status, deletions, new contacts) are saved to `localStorage`.
-   **Rich Email Composition**: A WYSIWYG editor for composing emails.
-   **Conversation View**: Emails are grouped by conversation for easy following.
-   **Email Actions**: Archive, delete, mark as spam, snooze, and apply labels.
-   **Drag & Drop**: Move emails to folders or apply labels by dragging them.
-   **Contact Management**: Create, edit, delete contacts and organize them into groups.
-   **Comprehensive Settings**: Customize display density, signature, rules, and more.
-   **Progressive Web App (PWA)**: Includes a service worker for basic offline capabilities.

## Live Demo & Screenshots

*(Placeholder for you to add a link to a live deployment and screenshots)*

## Technology Stack

-   **React 19**: For building the user interface.
-   **TypeScript**: For type safety and improved developer experience.
-   **Tailwind CSS**: For utility-first styling.
-   **Vite**: For a fast and modern frontend build tool.
-   **React Window**: For efficiently rendering long lists of emails.
-   **DOMPurify**: For sanitizing HTML email content to prevent XSS attacks.

---

## Local Development Setup

### System Requirements

-   **Node.js**: Version 20.x or later.
-   **npm** (or yarn/pnpm).

### Step 1: Clone and Install

```bash
git clone <your-repository-url> webmail-client
cd webmail-client
npm install
```

### Step 2: Run the Application

Open a terminal and run the following command:

```bash
npm run dev
```

This starts the Vite development server, typically on `http://localhost:5173`. You can now access the application in your browser. Since there is no backend, you can enter any non-empty email and password to "log in" and explore the application.
