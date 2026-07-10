# AI Clinic Management System

A full-stack clinic platform for patients, doctors, and administrators, with AI-assisted appointment workflows through n8n, Vapi, Google Calendar, and WhatsApp.

## Applications

- `frontend`: React and Vite client, intended for Vercel
- `backend`: Node.js and Express API, intended for Render
- `docs`: architecture and project documentation

## Local development

1. Copy each `.env.example` file to `.env` in the same directory.
2. Add your MongoDB Atlas connection string to `backend/.env` as `MONGODB_URI`.
3. Install dependencies with `npm install` from the project root.
4. Verify MongoDB with `npm run db:check --workspace backend`.
5. Run both applications with `npm run dev`.

The frontend runs on `http://localhost:5173` and the API on `http://localhost:5000` by default.

## Security

Never commit real credentials. Keep database URLs, signing secrets, webhook URLs, and third-party tokens in local environment files and deployment environment settings.
