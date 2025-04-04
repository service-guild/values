# React PWA Migration Plan for Values Exercise App

**Goal:** Convert the existing Vanilla JS/TS application into a React-based Progressive Web App (PWA) using Vite, TypeScript, and Tailwind CSS, managed by Bun and **tested with Vitest/jsdom**. It should retain `localStorage` persistence, implement responsive UI (desktop columns with drag-and-drop, mobile "flashcard" style), and follow modern React best practices, using Zustand for state management.

---

## Phase 1: Project Setup & Foundational Structure

1.  **Initialize New Project with Vite (using Bun):**
    - Use `bun create vite values-react-app --template react-swc-ts`.
    - `cd values-react-app`
    - `bun install` (To install dependencies initially)
2.  **Install Core Dependencies (using Bun):**
    - `bun add react-router-dom` (for handling "parts" as routes)
    - `bun add -d tailwindcss postcss autoprefixer` (for styling, `-d` for dev dependency)
    - `bun add @dnd-kit/core @dnd-kit/sortable` (for desktop drag-and-drop)
3.  **Configure Tailwind CSS:**
    - `bunx tailwindcss init -p`
    - Configure `tailwind.config.js`: Update `content` array (`'./index.html', './src/**/*.{js,ts,jsx,tsx}'`).
    - Create `src/index.css`: Add Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`).
    - Import `src/index.css` in `src/main.tsx`.
4.  **Basic App Structure & Routing:**
    - Clean up default Vite template files in `src`.
    - Set up basic routing in `src/App.tsx` using `react-router-dom` (e.g., `/part1`, `/part2`, `/review`).
    - Create placeholder component files for views (e.g., `src/views/Part1View.tsx`).
5.  **ESLint/Prettier Setup:**
    - Configure ESLint/Prettier for React/TSX (e.g., `eslint-plugin-react`, `eslint-plugin-react-hooks`, `@typescript-eslint/recommended`).
    - Add `prettier-plugin-tailwindcss` (`bun add -d prettier-plugin-tailwindcss`).
    - Update `.eslintignore` and `.prettierignore` to include `dist/`.

---

## Phase 2: State Management & Core Logic

1.  **Define `AppState` Interface:**
    - Reuse or adapt the existing interface from `index.ts`.
2.  **Implement State Management (Zustand):**
    - Install Zustand: `bun add zustand`.
    - Create store file: `src/store/appStore.ts`.
    - Define store using `create` from Zustand and the `AppState` interface.
    - Define state properties and update functions (e.g., `setPart`, `moveCard`) within the store setup using `set`.
3.  **Port Value Definitions:**
    - Move `values.ts` data into `src`. Make definitions available to the state store (e.g., for initializing default state).

---

## Phase 3: Componentization & UI Implementation

1.  **Create Reusable Components:**
    - `ValueCard.tsx`
    - `Column.tsx` (Desktop)
    - `Button.tsx`
    - `Modal.tsx` (Add New Value)
    - `ValueDefinitionDisplay.tsx` (Review)
    - `StatementInput.tsx` (Part 4)
2.  **Implement Mobile Views (Parts 1-4 - Flashcard Style):**
    - Create `FlashcardSorter.tsx` component.
    - Integrate `FlashcardSorter` into view components (e.g., `Part1View`).
    - Display one unassigned card at a time (fetched from store).
    - Add category assignment buttons connected to store actions.
    - Implement the "Overview" component (category counts, tappable).
    - Use Tailwind responsive prefixes (`flex md:hidden`) to show only on mobile/small screens.
    - Implement necessary store actions for mobile interactions.
3.  **Implement Desktop Views (Parts 1-4):**
    - Target relevant view components (e.g., `Part1View`).
    - Build/reveal multi-column layouts using Tailwind CSS (`hidden md:flex`).
    - Integrate `@dnd-kit/core` / `@dnd-kit/sortable` for drag-and-drop. Connect drag events to call store actions.
4.  **Implement Review View (`ReviewView.tsx`):**
    - Display Core/Additional values and statements using Tailwind (data from store). Ensure responsiveness.
5.  **Implement Navigation & Transitions:**
    - Use `useNavigate` for route changes.
    - Implement validation logic within navigation handlers (checking store state) before calling store actions/navigating.
    - Implement skip logic (Part 2 -> Part 4) in handlers based on store state.

---

## Phase 4: Persistence, PWA, and Testing

1.  **Implement `localStorage` Persistence (Zustand Persist Middleware):**
    - Integrate `persist` middleware from `zustand/middleware` into the store setup.
    - Configure it to save the desired state parts to `localStorage`.
2.  **Configure PWA Features (`vite-plugin-pwa`):**
    - `bun add -d vite-plugin-pwa`.
    - Configure the plugin in `vite.config.ts`.
    - Define `manifest` options (name, icons, colors, etc.).
    - Choose a service worker strategy (e.g., `generateSW`).
    - Add icons to `public/`.
    - Test installation and basic offline behavior.
3.  **Setup & Configure Testing (Vitest, `jsdom`, `React Testing Library`):**
    - Install testing dependencies: `bun add -d vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event`.
    - Configure Vitest in `vite.config.ts` (or `vitest.config.ts`): specify `globals: true`, `environment: 'jsdom'`, and potentially a setup file for `@testing-library/jest-dom`.
    - Add test script to `package.json`: `"test": "vitest run"`.
    - Ensure test files (`*.test.tsx`) import from `vitest` instead of `bun:test`.
4.  **Update/Write Tests:**
    - Write unit tests for store actions/logic where feasible.
    - Write integration tests for components/views using React Testing Library. Mock the Zustand store or use testing utilities if needed to verify interactions with the store.
    - Use `bun run test` (or `vitest` directly) to run tests.

---

## Phase 5: Refinement & Deployment

1.  **Accessibility (A11y) Review:**
    - Semantic HTML, keyboard navigation, color contrast, ARIA attributes.
2.  **Performance Check:**
    - React DevTools profiler, Zustand selectors optimization if needed, bundle size.
3.  **Cross-Browser/Device Testing:**
    - Test on Chrome, Firefox, Safari, and mobile devices/simulators (iOS/Android).
4.  **Deployment:**
    - Build (`bun run build`).
    - Deploy `dist/` folder to a static host (Netlify, Vercel, Cloudflare Pages).
