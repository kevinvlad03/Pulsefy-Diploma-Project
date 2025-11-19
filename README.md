# Pulsefy

Pulsefy is an experimental music experience built with React, Vite, and Tailwind CSS. It showcases a landing page, AI-driven recommendation flows, a streaming dashboard, and an admin lab for testing bold ideas in one cohesive interface.

## Getting Started

1. Install dependencies with `npm install`.
2. Run `npm run dev` and open the printed local URL.
3. Use `npm run build` to create a production bundle, `npm run preview` to inspect it, and `npm run lint` for static analysis.

## Tech Stack

- React 18 + TypeScript
- Vite with SWC
- Tailwind CSS with shadcn/ui components
- React Router and TanStack Query for routing and data

## Project Structure

- `src/pages` – route-level experiences such as Landing, Dashboard, AI Generator, AI Recommendations, Player, Admin, and Test Lab.
- `src/components` – shared layout primitives and reusable UI.
- `src/lib`, `src/hooks`, and `src/assets` – supporting logic, custom hooks, and static assets.
