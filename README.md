# AI Clinic Management System

A full-stack clinic platform for patients, doctors, and administrators, with AI-assisted appointment workflows through n8n, Vapi, Google Calendar, and WhatsApp.

## Applications

- `frontend`: React and Vite client, intended for Vercel
- `backend`: Node.js and Express API, intended for Render
- `docs`: architecture and project documentation

## Local development

1. Create `backend/.env` with `NODE_ENV`, `PORT`, `CLIENT_URL`, `MONGODB_URI`, and a random `JWT_SECRET` containing at least 32 characters.
2. Create `frontend/.env` with `VITE_API_URL`.
3. Install dependencies with `npm install` from the project root.
4. Verify MongoDB with `npm run db:check --workspace backend`.
5. Verify authentication with `npm run auth:check --workspace backend`.
6. Run both applications with `npm run dev`.

The frontend runs on `http://localhost:5173` and the API on `http://localhost:5000` by default.

## Security

Never commit real credentials. Keep database URLs, signing secrets, webhook URLs, and third-party tokens in local environment files and deployment environment settings.
