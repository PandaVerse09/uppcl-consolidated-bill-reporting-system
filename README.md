# Consolidated Billing System

Full-stack Consolidated Billing System for daily division-wise payment reporting. The application supports uploader data entry, admin review and report publication, report-user search/download, audit logs, and role-based access.

## Tech Stack

- Backend: Node.js, Express, MongoDB, Mongoose
- Frontend: React, Vite, Tailwind CSS, React Router
- Exports: PDFKit for PDF reports, ExcelJS for Excel reports
- Auth: JWT stored in an HTTP-only cookie

## Project Structure

```text
BACKEND/
  src/
    controllers/   Request handlers
    middleware/    Auth and error handling
    models/        Mongoose schemas
    routes/        Express routes
    services/      Report and audit helpers
  scripts/         Admin seed script

FRONTEND/
  src/
    components/    Shared UI and layout components
    context/       Auth context
    data/          Formatting helpers
    hooks/         Report loading hook
    pages/         Role-based screens
```

## Workflow

1. Uploaders save payment data for their assigned division and date.
2. Uploaders must fill missing back dates before uploading a later date.
3. Before a report is published, uploaders can edit the same date freely.
4. Admins publish a report for a selected date from the admin dashboard.
5. After publication, any uploader change for that date becomes a pending change request.
6. Admin approval applies the change, supersedes the old approved submission when needed, and regenerates the report.
7. Report users can view, search, and export published reports.

## Backend Setup

```bash
cd BACKEND
npm install
copy .env.example .env
npm run seed:admin
npm run dev
```

Update `BACKEND/.env` before running:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/uppcl-cbs
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@uppcl.in
ADMIN_PASSWORD=change-this-password
```

The backend API runs at:

```text
http://localhost:5000/api/v1
```

## Frontend Setup

```bash
cd FRONTEND
npm install
copy .env.example .env
npm run dev
```

Update `FRONTEND/.env` if the backend URL changes:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

The frontend usually runs at:

```text
http://localhost:5173
```

## Useful Scripts

Backend:

```bash
npm run dev
npm start
npm run seed:admin
```

Frontend:

```bash
npm run dev
npm run build
npm run preview
```

## Main API Areas

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET /api/v1/users`
- `POST /api/v1/users`
- `DELETE /api/v1/users/:id`
- `GET /api/v1/uploads`
- `POST /api/v1/uploads`
- `PUT /api/v1/uploads/:id`
- `GET /api/v1/admin/pending`
- `POST /api/v1/admin/reports/:date/publish`
- `PATCH /api/v1/admin/uploads/:id/approve`
- `PATCH /api/v1/admin/uploads/:id/reject`
- `GET /api/v1/reports`
- `GET /api/v1/reports/:date/export/pdf`
- `GET /api/v1/reports/:date/export/excel`

## Production Notes

- Use a strong `JWT_SECRET`.
- Do not commit real `.env` files.
- Ensure MongoDB is running before starting the backend.
- Set `FRONTEND_URL` to the deployed frontend origin so cookie-based auth works with CORS.
- Run `npm run build` in `FRONTEND` before deployment.

## Contributors

**Utkarsh Aryan Mishra**

- Backend development
- Database design
- API development
- Business logic

**Ajruddin Ali**

- Frontend development
- User interface implementation
- Client-side features
