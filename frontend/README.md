# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


Welcome to the project! This document outlines the fundamental architectural setup completed during **Phase 1**, focusing on routing infrastructure, global state management, and an advanced, dual-engine styling configuration combining Sass Modules and Tailwind CSS v4.

---

## 🛠️ Phase 1: Environment Creation

### 1. 🧭 Routing Architecture (`react-router-dom`)

We have established a robust, scalable routing ecosystem designed to handle code-splitting and layout nesting efficiently.

* **Declarative Routing:** Configured using the modern `createBrowserRouter` API inside `src/router/Router.jsx` for optimal performance and data-fetching capabilities.
* **Layout Isolation:** Implemented a centralized `MainLayout.jsx` wrapper component (located under `src/components/Layout/MainLayout/`) to manage global UI view containers, persistent structural sections, and seamless layout transitions without redundant component re-renders.
* **Boundary Catching:** Integrated error-handling paradigms to gracefully capture routing issues or application runtime crashes.

### 2. 🧠 Centralized State Management (React Context API)

To avoid deep prop-drilling across deep component trees, core application states have been elevated to a custom global React Context layer.

* **Feature Scope:** Configured inside `src/context/Context.jsx` to build out standard global states (e.g., user sessions, authentication tokens, global UI view behaviors, or dynamic theme state toggles).
* **Optimized Access:** Packaged custom context providers and consumer access validation mechanisms directly within the state module layer for clean hooks integration.

### 3. 🎨 Advanced Hybrid Styling Engine (Sass Modules + Tailwind CSS v4)

This project leverages a hybrid styling strategy, exploiting the localized, encapsulated architecture of **Sass Modules (`.module.scss`)** alongside the atomic global utility velocity of **Tailwind CSS v4**.

#### Why the Hybrid Approach?

* **Tailwind CSS v4:** Acts as our utility-first backbone for rapidly engineering components, building layouts, handling responsive breakpoints (`md:`, `lg:`), and maintaining immediate UI consistency directly within TSX/JSX tokens.
* **Sass Modules:** Employed for complex layout mechanics, macro-layout styling, custom micro-interactions, heavy multi-layered background animations, or pseudo-element configurations. By isolating these styles into components via modules (like `MainLayout.module.scss`), we eliminate style leakage across views.

#### Compilation Workflow

1. The Vite compiler plugin (`@tailwindcss/vite`) handles the real-time parsing of global utility classes.
2. The main CSS entry point (`src/index.css`) serves as the base stylesheet compiling Tailwind primitives.
3. Component-specific styles leverage localized Scss processing natively compiled through Vite's built-in styles processing layer.

---

## 📂 Architecture & Directory Layout

The environment is structured to cleanly separate business logic from UI styling and rendering layers:

```text
frontend/
├── public/                     # Static assets (favicons, public metadata)
├── src/
│   ├── assets/                 # Reusable structural media files (images, svgs, fonts)
│   ├── components/             # Reusable UI presentation layers
│   │   ├── Dashborad/          # Isolated Dashboard domain UI view logic
│   │   ├── Layout/
│   │   │   └── MainLayout/
│   │   │       ├── MainLayout.jsx          # Structural view wrapper
│   │   │       └── MainLayout.module.scss  # Scoped Sass Layout Module
│   │   └── UI/                 # Atomic design design components (buttons, badges)
│   ├── context/
│   │   └── Context.jsx         # React Context Global State Management
│   ├── pages/                  # Top-level view configurations (routed components)
│   ├── router/
│   │   └── Router.jsx          # Main client-side routing definitions
│   ├── App.css                 # Local root application style adjustments
│   ├── App.jsx                 # Context, Router routing runtime layout layer
│   ├── index.css               # Base CSS stylesheet handling global Tailwind v4 direct lines
│   └── main.jsx                # DOM bootstrapping and React app initialization mount
├── eslint.config.js            # Linter rules and code quality syntax configuration
├── index.html                  # Single Page Application core HTML frame template
├── package.json                # Project dependencies, script workflows, configuration manifests
└── vite.config.js              # Advanced bundler processing instructions and compiler plugins

```

---

## 🧪 Implementation Sign-off Reference

### Global Stylesheet Entry (`src/index.css`)

```css
/* Core Tailwind v4 Layer Injection */
@import "tailwindcss";

/* Custom Tailwind v4 Theme Variables Integration */
@theme {
  --color-brand-primary: #0f172a;
  --color-brand-accent: #3b82f6;
  --font-custom-display: "Inter", sans-serif;
}

```

### Main Application Bootstrapping (`src/App.jsx`)

```jsx
import { RouterProvider } from "react-router-dom";
import { router } from "./router/Router";
import { ContextProvider } from "./context/Context";
import "./App.css";

function App() {
  return (
    <ContextProvider>
      <RouterProvider router={router} />
    </ContextProvider>
  );
}

export default App;

```

---

## 🚀 Local Development Verification

To run the unified compilation pipeline (Sass modules processing + Tailwind v4 engines driven simultaneously under Vite), fire up the development server inside the frontend folder:

```bash
# Navigate to frontend directory if root
cd frontend

# Install environment assets
npm install

# Initialize Vite real-time compilation hot reload
npm run dev

```