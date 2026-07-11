# People’s Clinic — AI Clinic Management System

People’s Clinic is a full-stack clinic management platform designed for patients, doctors, and administrators. It combines everyday clinic operations with secure role-based access and AI-assisted appointment booking in one connected system.

## What It Solves

Clinic information is often divided between phone calls, paper records, messaging applications, and separate scheduling tools. This creates delays for patients and repetitive administrative work for clinic staff.

People’s Clinic provides a common platform where:

- Patients can access clinic services and manage their care journey.
- Doctors can work with appointments and patient information.
- Administrators can manage clinic operations through protected access.
- Appointments can be requested through a standard form or an AI calling experience.
- Authentication and patient data are handled by a dedicated backend rather than only automation workflows.

## Current Features

### Clinic Website

- Responsive People’s Clinic landing page
- Transparent navigation that changes when scrolling
- Clinic hours and contact information
- About, services, doctors, health insights, newsletter, and contact sections
- Form-based appointment request interface
- AI call appointment interface
- Separate patient, doctor, and administrator login options

### Authentication Backend

- Patient registration
- Email or phone login
- Secure bcrypt password hashing
- HTTP-only authentication cookies
- Login, logout, and profile routes
- Duplicate-account protection
- Input validation
- Patient, doctor, and administrator role protection
- Authentication rate limiting
- MongoDB database connection
- Automated disposable authentication test

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS
- Lucide React icons

### Backend

- Node.js
- Express
- MongoDB Atlas
- Mongoose
- JSON Web Tokens
- bcrypt
- Zod validation
- Helmet, CORS, cookie-parser, and Express rate limiting

### Planned Integration and Deployment

- Vapi for conversational appointment calls
- n8n for clinic automation workflows
- Vercel for the frontend
- Render for the backend

## System Flow

1. A user opens the People’s Clinic web application.
2. The user can explore clinic information or request an appointment by form or AI call.
3. Patient, doctor, and administrator accounts enter through their respective protected login flows.
4. The React frontend communicates with the Express API.
5. The backend validates requests, manages authentication, applies role protection, and communicates with MongoDB.
6. Each authenticated role will access its own clinic dashboard and permitted information.

## Project Structure

```text
ai-clinic-management-system/
├── backend/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── scripts/
│       ├── app.js
│       └── server.js
├── frontend/
│   ├── public/
│   │   └── images/
│   └── src/
│       ├── components/
│       │   ├── About/
│       │   ├── Doctors/
│       │   ├── Footer/
│       │   ├── Header/
│       │   ├── Hero/
│       │   ├── News/
│       │   ├── Newsletter/
│       │   ├── Services/
│       │   └── Stats/
│       ├── pages/
│       ├── App.jsx
│       └── main.jsx
├── docs/
├── .gitignore
├── package.json
└── README.md
```
