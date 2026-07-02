# UPPCL Consolidated Billing System
## Kubernetes Deployment & Unified POST API Refactoring Documentation
**Date:** July 2, 2026  
**Author:** AI Pair Programmer (Antigravity)

---

### 1. Executive Summary

This document explains the technical updates performed on the UPPCL Consolidated Billing System backend and frontend architectures. The application has been refactored to meet production-level deployment requirements, specifically targeting Kubernetes orchestration and strict networking/security standards (e.g. cloud firewalls and gateways that only allow HTTP POST requests).

Key achievements include:
- **Kubernetes Probes Integration**: Configured HTTP Liveness (`/healthz`) and Readiness (`/readyz`) endpoints to monitor application state and database connectivity.
- **Graceful Lifecycle Management**: Implemented handlers for `SIGTERM` and `SIGINT` to safely drain connection pools before container termination.
- **MongoDB Connection Resiliency**: Configured an asynchronous connection retry wrapper with automatic reconnect hooks to prevent initial startup crashes.
- **Unified POST Protocol**: Converted all application routes and queries (GET, PUT, PATCH, DELETE) to use HTTP `POST` requests, transferring parameters via JSON request bodies.
- **Transparent Frontend API Wrapper**: Refactored the frontend client wrapper to translate standard actions into POST requests without having to edit individual React components.
- **Monolithic Frontend Asset Hosting**: Configured the Express backend to host frontend assets statically and provide fallback routing for single-page routing.

---

### 2. Kubernetes Production Readiness

#### 2.1 Health Check Probes
Kubernetes requires containers to report their health state. We implemented separate endpoints to distinguish between startup/process health and system readiness:
1. **Liveness Probe (`GET /healthz`)**: Verifies that the Node.js Express server is responsive and accepting connections. If this fails, Kubernetes restarts the pod container.
2. **Readiness Probe (`GET /readyz`)**: Verifies that the database is active by checking Mongoose's connection state (`mongoose.connection.readyState === 1`). If the database becomes disconnected, this endpoint returns `503 Service Unavailable`, and Kubernetes stops routing user traffic to the affected pod until the database recovers.

#### 2.2 Resilient Database Connectivity
In a Kubernetes environment, application containers may start up before database clusters are ready. Previously, a connection failure would crash the backend process.
- **Startup Connection Retries**: The database initialization is wrapped in a loop that retries connection up to 5 times at 5-second intervals.
- **Non-blocking Startup**: The HTTP server starts listening *before* the database connection is resolved. This allows Kubernetes liveness checks to pass immediately while the database resolves.
- **Auto-Reconnection**: Added events (`connected`, `error`, `disconnected`) to monitor Mongoose states.

#### 2.3 Graceful Process Termination
When Kubernetes terminates a pod (e.g., during scale-down or rolling updates), it issues a `SIGTERM` signal.
- The server interceptor catches `SIGTERM` and `SIGINT`.
- It stops accepting new requests using `server.close()`, allowing active connections to drain naturally.
- It cleanly disconnects from MongoDB before exiting.
- A 10-second safety timeout executes a forced exit in case of hanging sockets.

---

### 3. Unified POST API Transition

To comply with network security gateways that restrict non-POST methods, all API operations were refactored to HTTP `POST`.

#### 3.1 Backend Route Refactoring
All backend routers were modified to bind actions to `POST` methods:
- **Auth Routes**: Changed `GET /me` (fetch current user profile) to `POST /me`.
- **User Routes**:
  - `GET /` (list users) moved to `POST /list`.
  - `PATCH /:id/status` (update status) moved to `POST /:id/status`.
  - `DELETE /:id` (delete user) moved to `POST /:id/delete`.
- **Upload Routes**:
  - `GET /` (list uploads) moved to `POST /list`.
  - `PUT /:id` (update upload) moved to `POST /:id`.
- **Admin Routes**:
  - `GET /pending` (pending submissions) moved to `POST /pending`.
  - `PATCH /uploads/:id/approve` moved to `POST /uploads/:id/approve`.
  - `PATCH /uploads/:id/reject` moved to `POST /uploads/:id/reject`.
- **Report Routes**:
  - `GET /` (list published reports) moved to `POST /list`.
  - `GET /:date` (detail report) moved to `POST /:date`.
  - `GET /:date/export/pdf` moved to `POST /:date/export/pdf`.
  - `GET /:date/export/excel` moved to `POST /:date/export/excel`.
- **Audit Routes**:
  - `GET /` (list audit logs) moved to `POST /list`.

#### 3.2 Controller Parameter Adaptations
Because query parameters (like division filter or date ranges) are now received in the HTTP request body instead of the URL string, all backend controller logic was updated to search both `req.query` and `req.body` using a fallback merger pattern:
```javascript
const query = { ...req.query, ...req.body };
```
This ensures the backend is completely backward-compatible and retrieves values correctly from POST bodies.

---

### 4. Frontend Client Adapter

To avoid modifying 20+ React components, we updated the central frontend client wrapper `FRONTEND/src/services/api.js` to map all client requests to `POST` and translate routes dynamically:

1. **Path Mapping**:
   - `get('/users')` -> `POST /users/list`
   - `get('/uploads')` -> `POST /uploads/list`
   - `get('/reports')` -> `POST /reports/list`
   - `get('/audit')` -> `POST /audit/list`
   - `delete('/users/:id')` -> `POST /users/:id/delete`
2. **Method Translation**:
   - Maps `.get`, `.put`, `.patch`, `.delete` directly to HTTP `POST` requests.
3. **Download Helper**:
   - The `.download` helper parses any inline query parameters (like `?division=A`) from the path, puts them into a JSON body payload, and executes a `POST` request to retrieve the binary file stream.

---

### 5. Backend Static Frontend Hosting & Fallback

To simplify deployments down to a single container (eliminating the need for a separate Nginx container or complex CORS routing):
- **Static Assets Serving**: Express serves static assets from `BACKEND/dist` using `express.static`.
- **Splat Fallback routing**: Registered a version-independent Express middleware that catches any non-API GET requests and returns `dist/index.html`. This allows client-side React Router navigation to function properly when accessing routes directly via URL.

---

### 6. Summary of Changed Files

| File Path | Description of Changes |
|---|---|
| **[BACKEND/server.js](file:///d:/UPPCL%20Project/BACKEND/server.js)** | Implemented DB retries, graceful shutdown handler, and connection observers. |
| **[BACKEND/src/app.js](file:///d:/UPPCL%20Project/BACKEND/src/app.js)** | Added static hosting of frontend assets, fallback middleware routing, and liveness/readiness probes. |
| **[FRONTEND/src/services/api.js](file:///d:/UPPCL%20Project/FRONTEND/src/services/api.js)** | Updated HTTP wrapper methods (`get`, `post`, `put`, `patch`, `delete`, `download`) to use `POST` and translate URLs. |
| **[BACKEND/src/routes/*.routes.js](file:///d:/UPPCL%20Project/BACKEND/src/routes/)** | Updated all route registrations to listen on `POST` methods with revised paths. |
| **[BACKEND/src/controllers/*.controller.js](file:///d:/UPPCL%20Project/BACKEND/src/controllers/)** | Updated controller files to parse parameters from both `req.query` and `req.body`. |
