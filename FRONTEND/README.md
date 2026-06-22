# Consolidated Billing System (CBS) — Frontend

Frontend-only React app for UPPCL's Consolidated Billing System. Built with React, Vite, React Router, Tailwind CSS, and Recharts. All data is mock JSON in `src/data/mockData.js` — there is no backend, API, database, or authentication logic.

## Setup

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

## Login

There's no real authentication — pick a role on the login screen and enter any username/password to enter that role's dashboard.

- **Admin** → approvals, audit logs, user management
- **Uploader** → upload daily transaction data
- **Report User** → search & view consolidated reports

## Project structure

```
src/
  components/
    ui/        Reusable primitives (Button, Card, Input, Badge, DataTable, StatCard)
    layout/    Navbar, Sidebar
    dashboard/ Charts, live analytics widget
  layouts/     MainLayout (navbar + sidebar + routed page)
  pages/       Login + role-specific pages (admin/uploader/reportuser)
  context/     AuthContext (mock session, role-based)
  data/        mockData.js (all mock JSON), format.js
  hooks/       useLiveCollectionData (simulated real-time ticker)
```

## Notes

- The "shadcn/ui" primitives in `src/components/ui` are hand-built Tailwind components in the same visual style, since the shadcn CLI requires network access to fetch component source at generation time. Swap in real shadcn/ui components by running `npx shadcn@latest add <component>` if you want CLI-managed versions.
- The Real-Time Analysis widget on every dashboard updates every 4 seconds using local React state (`useLiveCollectionData`) — there's no websocket or polling against a server.
- Charts (`Charts.jsx`) use Recharts and read from mock data; replace the data source with a real API later without changing chart markup.
