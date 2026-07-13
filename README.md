# 🏥 People’s Clinic — AI-Powered Clinic Management System

People’s Clinic is an AI-powered full-stack healthcare platform built for patients, doctors, and clinic administrators. It combines a responsive public clinic website, secure role-based authentication, dedicated dashboards, appointment automation, and AI-assisted patient support in one connected system.

The project uses React and Vite for the frontend, Node.js and Express for the backend, MongoDB Atlas for data storage, and n8n for appointment workflows. The frontend and backend are deployed separately on Vercel and Render.

## ✨ What the Project Solves

Traditional clinic processes are often divided between phone calls, paper records, messaging applications, spreadsheets, and disconnected scheduling tools. This can cause appointment delays, repeated administrative work, and difficulty accessing patient information.

People’s Clinic provides a common portal where:

- Patients can explore clinic services, request appointments, and access their healthcare dashboard.
- Doctors can manage their clinical workspace and view scheduled patient visits.
- Administrators can approve doctors, manage users, and monitor clinic activity.
- Appointment booking, enquiry, cancellation, and rescheduling can be automated through n8n.
- An AI assistant interface can answer clinic-related questions and guide patients.

## ✅ Features Implemented

### 🌐 Responsive Clinic Website

- Modern, responsive People’s Clinic landing page.
- Sticky navigation with transparent and scrolled states.
- Clinic timings, services, doctors, statistics, health insights, newsletter, map, and contact sections.
- Section-aware navigation for Home, About, Services, and Doctors.
- Mobile-friendly layout and reusable React components.
- Form-based and AI-agent appointment options.

### 📅 Appointment Request Interface

- Appointment form for name, email, phone number, date, time, and doctor selection.
- Three selectable doctors in the current frontend interface.
- Field-level validation with clear error messages.
- Past-date prevention.
- Form reset when a user leaves the appointment form without completing it.
- Frontend prepared to send validated appointment data to an n8n webhook.

### 🔐 Authentication and Account Security

- Separate patient, doctor, and administrator login experiences.
- Patient and doctor registration.
- Email OTP verification during registration.
- Email-or-phone login.
- Google Sign-In for supported account flows.
- Forgot-password and password-reset functionality.
- Secure bcrypt password hashing.
- HTTP-only authentication cookies.
- JSON Web Token session handling.
- Duplicate-account protection.
- Input validation using Zod.
- Authentication rate limiting.
- Role-based route protection for patients, doctors, and administrators.
- Doctor approval status and administrator-controlled doctor approval.

### 👤 Patient Dashboard

- Patient-specific protected dashboard.
- Upcoming appointments overview.
- Prescriptions, health records, and billing summary cards.
- Health activity chart and wellness score.
- Recent reports, prescriptions, and consultation receipts interface.
- Profile settings and password management.
- Profile-image selection, preview, change, and removal controls.

### 🩺 Doctor Dashboard

- Doctor-specific protected workspace.
- Approval-pending screen for unapproved doctor accounts.
- Daily appointment schedule.
- Patient visit status and consultation overview.
- Weekly appointment analytics.
- Clinic calendar and patient progress interface.
- Profile settings and password management.
- Profile-image selection, preview, change, and removal controls.

### 🛡️ Administrator Dashboard

- Protected administrator login and dashboard.
- Clinic account summary.
- Pending doctor approval list.
- Doctor approval controls.
- User and clinic performance interface.
- Role statistics and activity analytics.
- Profile settings and password management.
- Profile-image selection, preview, change, and removal controls.

### 🤖 AI Clinic Assistant Interface

- Dedicated healthcare chatbot interface accessible from the website menu.
- Designed to answer clinic timings, services, doctors, appointment, and general hospital queries.
- Prepared for connection to an n8n AI-agent webhook.
- Responsive chat layout for desktop and mobile devices.

### ⚙️ n8n Clinic Automation Workflows

The following workflows have been moved from the local Docker n8n instance to the deployed n8n instance:

- AI Appointment Booking Agent.
- Appointment Enquiry.
- Delete Booking Event.
- Reschedule Appointment.

These workflows include Google Sheets, Google Calendar, validation, weekend handling, working-hour checks, duplicate-booking checks, and webhook responses. They are currently saved but unpublished while deployed credentials and production webhooks are being configured and tested.

## 🚧 Work in Progress

- Reconnecting Google Sheets and Google Calendar credentials in deployed n8n.
- Testing all four n8n workflows with production webhook URLs.
- Connecting the homepage appointment form to the deployed booking workflow.
- Connecting the AI assistant interface to an n8n AI agent.
- Replacing dashboard demonstration data with live backend and appointment data.
- Persisting profile images through backend storage instead of individual browser storage.
- Completing appointment confirmation and suggested-slot handling.
- Adding payment verification before final appointment creation.
- Sending booking confirmation and invoice details by email.

## 🛠️ Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS
- Lucide React icons

### Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JSON Web Tokens
- bcryptjs
- Zod
- Nodemailer-compatible email workflow
- Helmet
- CORS
- Cookie Parser
- Express Rate Limit

### Automation and Integrations

- n8n
- Google Sheets
- Google Calendar
- Google Identity Services
- Email OTP verification
- Planned AI-agent integration
- Planned Razorpay test-mode payment integration

### Deployment

- Vercel — frontend
- Render — backend API
- Render — self-hosted n8n
- MongoDB Atlas — database

## 🌍 Live Deployment

- **Frontend:** https://ai-clinic-management-system-fronten.vercel.app
- **Backend API:** https://ai-clinic-management-api.onrender.com
- **n8n:** deployed separately on Render for clinic automation

The project currently uses free-tier services for development, demonstration, and placement purposes. Free Render services may take additional time to wake after inactivity.

## 🔄 System Flow

1. A visitor opens the People’s Clinic website.
2. The visitor explores services, doctors, clinic information, or the AI assistant.
3. A patient submits an appointment request through the form or AI-agent interface.
4. The frontend sends validated information to the appropriate backend or n8n webhook.
5. n8n checks appointment rules, Google Sheets records, and Google Calendar availability.
6. The system returns availability, rejection details, or suggested appointment slots.
7. After confirmation and payment verification, the appointment workflow creates the booking.
8. Booking information is returned to the application and sent to the patient by email.
9. Authenticated patients, doctors, and administrators access their respective protected dashboards.

## 📂 Project Structure

```text
ai-clinic-management-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Authentication, OTP, password and admin logic
│   │   ├── middleware/      # Authentication and error handling
│   │   ├── models/          # MongoDB user and OTP models
│   │   ├── routes/          # Authentication and administrator routes
│   │   ├── scripts/         # Database, authentication and admin utilities
│   │   ├── services/        # Email services
│   │   ├── utils/           # Tokens, OTP and application helpers
│   │   ├── validators/      # Request validation
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── images/          # Local website images and assets
│   ├── src/
│   │   ├── components/      # Reusable landing-page and authentication components
│   │   ├── pages/           # Home, authentication, dashboard and AI assistant pages
│   │   ├── services/        # Frontend API communication
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vercel.json
│   └── package.json
├── docs/
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Local Installation

### 1. Clone the Repository

```bash
git clone https://github.com/sushantt1201/ai-clinic-management-system.git
cd ai-clinic-management-system
```

### 2. Install Dependencies

```bash
npm install
npm install --prefix frontend
npm install --prefix backend
```

### 3. Configure Environment Variables

Create local `.env` files inside `frontend` and `backend` with the required development values. Environment files and environment examples are intentionally excluded from Git.

Important configuration includes:

- MongoDB connection URL.
- JWT and cookie configuration.
- Frontend and backend URLs.
- Google OAuth client ID.
- Email OTP credentials.
- Deployed n8n webhook URLs when integration is enabled.

Never commit environment files, passwords, API keys, database credentials, or OAuth secrets.

### 4. Start the Backend

```bash
cd backend
npm run dev
```

The local backend runs on `http://localhost:5000` by default.

### 5. Start the Frontend

Open a second terminal:

```bash
cd frontend
npm run dev
```

The local frontend runs on `http://localhost:5173` by default.

## 🧪 Available Verification Commands

### Frontend Production Build

```bash
cd frontend
npm run build
```

### Backend Source Check

```bash
cd backend
npm run build
```

### Database Connection Check

```bash
cd backend
npm run db:check
```

### Disposable Authentication Test

```bash
cd backend
npm run auth:check
```

## 🔮 Future Scope

- Complete live appointment management in all dashboards.
- AI-generated patient intake summaries for doctors.
- Intelligent healthcare FAQ and clinic knowledge assistant.
- Online Razorpay payment verification and automatic refund handling.
- Downloadable PDF appointment confirmation and invoice.
- Automated appointment reminders through email, SMS, or WhatsApp.
- Electronic prescriptions and patient medical records.
- Doctor notes, diagnoses, treatment plans, and follow-up recommendations.
- Live billing, receipts, reports, and clinic analytics.
- Persistent profile-image and document storage.
- Patient feedback and rating management.
- Multi-doctor scheduling and department management.
- Multi-clinic support.
- Improved audit logs, monitoring, backups, and production security.

## 🎓 Learning Outcomes

This project demonstrates:

- Component-based frontend development with React.
- REST API development using Node.js and Express.
- MongoDB data modelling with Mongoose.
- Secure authentication with HTTP-only cookies and role-based access.
- Email OTP and Google authentication integration.
- Responsive patient, doctor, and administrator interfaces.
- Workflow automation with n8n, Google Sheets, and Google Calendar.
- Separate frontend, backend, database, and automation deployments.
- Full-stack debugging across local and production environments.

## 👨‍💻 Author

**Sushant**

- GitHub: https://github.com/sushantt1201
- Repository: https://github.com/sushantt1201/ai-clinic-management-system
