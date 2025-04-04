# Values Exercise PWA Migration - Development Guide (Adapted for Gemini)

## Project Overview

Migrate the existing Vanilla JS/TS Values Exercise application into a modern, responsive React-based Progressive Web App (PWA). Key technologies include React, TypeScript, Vite, Bun, Tailwind CSS, **Zustand for state management**, and `localStorage` for persistence. The app will feature a multi-column drag-and-drop interface for desktop and a touch-friendly "flashcard" interface for mobile. **Testing will be performed using Vitest with the jsdom environment.**

This guide outlines the process and conventions Gemini will follow during this migration.

## Context & Memory Management

Since Gemini doesn't have persistent memory files like `memory.md` or a `/compact` command, context will be maintained by:

1.  **Reviewing `PLAN.md`:** Refer back to `PLAN.md` at the start of new interactions or when resuming work to understand the overall strategy and current phase.
2.  **Reviewing Conversation History:** Utilize the recent conversation history to recall specific decisions, code changes, and the immediate next steps discussed.
3.  **Summarizing Progress:** In messages, especially after completing steps or phases, summarize the work accomplished, mention files modified (based on tool usage), confirm the current status according to `PLAN.md`, and state the next planned steps.
4.  **Highlighting Key Decisions:** Explicitly mention key technical or architectural decisions made during the conversation for future reference.

## Task Planning and Execution (Based on `PLAN.md`)

Our primary planning document is `PLAN.md`. When tackling steps or phases outlined there:

1.  **Reference `PLAN.md`:** State which phase and step(s) from `PLAN.md` are currently being worked on.
2.  **Pre-computation/Pre-analysis (Implicit Workplan):** Before executing a step (especially coding steps), internally (or explicitly state if complex):
    - **Goal:** Define what the specific step aims to achieve.
    - **Files/Components Involved:** Identify the primary files or conceptual components expected to be modified or created.
    - **Approach/Checklist:** Outline the sub-tasks required for the step.
    - **Verification:** Mention how the step's success can be confirmed (e.g., "We can test this by running the dev server...", "We can verify this by running `bun test`...").
    - **Questions/Assumptions:** If ambiguity is encountered or an assumption must be made (especially for non-blocking issues), state the assumption and proceed, flagging it for potential review. Blocking issues will be raised directly.
3.  **Execution:** Use the available tools (reading files, editing files, running commands) to perform the implementation tasks.
4.  **Status Updates:** Confirm completion of steps/phases from `PLAN.md`.

## Build/Test/Lint Commands (for `values-react-app` directory)

- **Start Dev Server:** `bun run dev`
- **Run Tests:** `bun run test` (or `bunx vitest`)
- **Build for Production:** `bun run build`
- _(Lint commands depend on specific ESLint setup, typically `bun run lint` if configured in `package.json`)_

## Testing Approach

- **Runner:** Use **Vitest** (via `bun run test` or `bunx vitest`).
- **Framework:** Utilize React Testing Library (`@testing-library/react`, `@testing-library/user-event`). Use Vitest's Jest-compatible APIs (`describe`, `it`, `expect`, etc.).
- **Environment:** Configured **jsdom** environment via Vitest config.
- **Focus:** Test component behavior, rendering based on state/props, user interactions. Unit test complex logic (**Zustand store actions**) thoroughly. Use testing utilities/mocks for store interaction in component tests.
- **Structure:** Colocated tests (`ComponentName.test.tsx`). Use `describe` blocks for logical grouping.

## Code Style Guidelines (Summary)

- **Naming:** `camelCase` for variables/functions, `PascalCase` for components/types.
- **Imports:** Standard grouping (React, libraries, project files).
- **Components:** Functional components with hooks.
- **State Management:** Use **Zustand** (per `PLAN.md`).
- **Styling:** Tailwind CSS utility-first approach.
- **Testing:** Follow React Testing Library best practices. Use `data-testid` where appropriate.

## Current Development Focus

Refer to the latest conversation summary or `PLAN.md` status check.
