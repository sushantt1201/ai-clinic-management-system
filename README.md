# People’s Clinic — AI-Powered Clinic Management System

People’s Clinic is a modular, AI-powered full-stack healthcare platform for patients, doctors, and clinic administrators. It combines a responsive public website, secure role-based accounts, appointment and payment automation, digital health records, medication tracking, clinical consultation tools, and an AI clinic assistant in one connected system.

The application uses React and Vite for the frontend, Node.js and Express for the REST API, MongoDB Atlas for application data, Cloudinary for uploaded medical documents, and n8n for clinic automation. Google Sheets and Google Calendar support the appointment workflow, while Razorpay test mode, Brevo, Groq, PDF parsing, and OCR provide payment, email, AI, and document-processing capabilities. The frontend is deployed on Vercel, while the API and self-hosted n8n instance run on Render.

## What the Project Solves

Traditional clinic processes are often divided between phone calls, paper records, messaging applications, spreadsheets, and disconnected scheduling tools. This can cause appointment delays, repeated administrative work, and difficulty accessing patient information.

People’s Clinic provides a common portal where:

- Patients can explore clinic services, request appointments, and access their healthcare dashboard.
- Doctors can manage their clinical workspace and view scheduled patient visits.
- Administrators can approve doctors, manage users, and monitor clinic activity.
- Appointment booking, enquiry, cancellation, and rescheduling can be automated through n8n.
- Doctors can review appointment and patient information, prepare prescriptions, and share structured consultation instructions.
- Patients can upload medical reports, receive AI-generated summaries, and manage medicine schedules.
- An AI assistant can answer clinic-specific questions while refusing unrelated requests.

## Features Implemented

### Responsive Clinic Website

- Modern, responsive People’s Clinic landing page.
- Sticky navigation with transparent and scrolled states.
- Clinic timings, services, doctors, statistics, health insights, newsletter, map, and contact sections.
- Section-aware navigation for Home, About, Services, and Doctors.
- Mobile-friendly layout and reusable React components.
- A professional form-based appointment experience integrated with the payment and automation workflow.

### Appointment Request Interface

- Appointment form for name, email, phone number, date, time, and doctor selection.
- Three selectable doctors in the current frontend interface.
- Field-level validation with clear error messages.
- Past-date prevention.
- Form reset when a user leaves the appointment form without completing it.
- Guest appointment booking without requiring a patient account.
- Email OTP verification before payment.
- Doctor-specific fees of ₹400, ₹500, and ₹600.
- Razorpay test-mode checkout and server-side payment-signature verification.
- Booking confirmation through n8n after successful payment.
- Downloadable PDF appointment confirmation containing the booking details and reference ID.
- Confirmed Google Sheets appointments are synchronized into the patient dashboard by email.
- Patients can cancel confirmed appointments from their dashboard.
- Patients can reschedule appointments through a dedicated slot-selection dialog.
- Rescheduling checks the selected doctor’s live Google Sheets schedule, prevents weekend bookings, excludes occupied slots, and revalidates availability before submission.
- Cancellation updates only the matching booking’s status, cancellation reason, and timestamp while also attempting to remove its Google Calendar event.

### Authentication and Account Security

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

### Patient Dashboard

- Patient-specific protected dashboard.
- Email-based synchronization of confirmed Google Sheets appointments.
- All-visits count, upcoming-appointment list, and monthly appointment calendar.
- Separate visual states for previous and upcoming visits.
- Appointment cancellation and rescheduling controls.
- Health records, prescriptions, medication schedules, health summaries, and billing interfaces.
- Multiple medical-report uploads in PDF, JPG, PNG, and WebP formats, up to 15 MB per file.
- Automatic document-title and report-type detection.
- Text extraction from digital PDFs with `pdf-parse`.
- OCR extraction from scanned documents and images with Tesseract.js.
- Asynchronous AI summaries with key findings and structured, printable summary output.
- Patient-controlled, one-time sharing of completed summaries with a doctor.
- Original-document access, summary PDF download, and uploaded-record removal.
- Manual medicine creation and editable medicine schedules.
- Doctor-created prescriptions automatically converted into patient medication schedules.
- Morning, afternoon, evening, and night dosage tracking.
- Taken/missed dose history and seven-day medication-adherence visualization.
- Profile settings and password management.
- Profile-image selection, preview, change, and removal controls.
- Stalled summary jobs recover automatically, with bounded upload, download, OCR, n8n, and overall processing timeouts.

### Doctor Dashboard

- Doctor-specific protected workspace.
- Approval-pending screen for unapproved doctor accounts.
- Live appointment synchronization through the shared doctor account.
- Daily appointment schedule populated from confirmed clinic bookings.
- Interactive monthly calendar with previous and next month navigation.
- Highlighted appointment dates with daily booking counts and expandable patient, time, and booking-reference details.
- Today’s appointments ordered by visit time.
- Searchable patient and appointment lists.
- Booking-specific consultation workspace.
- Clinical notes, recommended tests, structured medicines, follow-up date, and next-visit time.
- Draft, sent, and completed consultation states.
- Prescription and visit instructions synchronized to the matching patient account.
- Access to AI summaries that patients explicitly share.
- Weekly appointment analytics.
- Shared clinic calendar and patient progress interface.
- Profile settings and password management.
- Profile-image selection, preview, change, and removal controls.

### Administrator Dashboard

- Protected administrator login and dashboard.
- Clinic account summary.
- Pending doctor approval list.
- Doctor approval controls.
- Live patient, doctor, administrator, and pending-approval counts.
- Searchable user directories with account status and last-login information.
- Administrator-account creation from the protected dashboard.
- Clinic performance, role statistics, and activity analytics interfaces.
- Profile settings and password management.
- Profile-image selection, preview, change, and removal controls.

### AI Clinic Assistant Interface

- Dedicated healthcare chatbot interface accessible from the website menu.
- Connected to the deployed n8n AI-agent webhook with conversation memory.
- Restricted to People’s Clinic services, doctors, appointments, billing, refunds, timings, directions, and related hospital queries.
- Requests a booking ID only when appointment, cancellation, rescheduling, payment, receipt, or refund information must be checked.
- Provides a professional out-of-scope response instead of answering unrelated questions.
- Includes in-chat quick actions for booking, clinic services, refunds, and specialist guidance.
- Provides a doctor-selection guide for general medicine, dental care, cardiology, diet, and lifestyle consultations.
- Includes clear emergency and medical-diagnosis safety guidance.
- Responsive chat layout for desktop and mobile devices.

### n8n Clinic Automation Workflows

The following workflows have been moved from the local Docker n8n instance to the deployed n8n instance:

- AI Appointment Booking Agent.
- Appointment Enquiry.
- Delete Booking Event.
- Reschedule Appointment.
- People’s Clinic AI Assistant.
- Patient and doctor appointment synchronization.

These workflows include Google Sheets, Google Calendar, validation, weekend handling, working-hour checks, duplicate-booking checks, payment-aware booking confirmation, email notification, and webhook responses. Booking, patient synchronization, cancellation, and rescheduling are published and connected to the backend. Cancellation remains reliable when a stored calendar event is missing, while rescheduling validates live doctor availability before updating the booking.

### AI Medical-Report Processing

- Cloudinary-backed storage for patient-uploaded PDFs and medical images.
- Server-side validation for supported file types and maximum upload size.
- Direct text extraction from machine-readable PDF reports.
- Tesseract.js OCR fallback for scanned PDFs and JPG, PNG, or WebP images.
- n8n-based medical-summary workflow with structured response normalization.
- Highlighted overview, important measurements, abnormal findings, and follow-up questions.
- Background processing so uploads are accepted without holding the browser request open.
- Retry support, stale-job recovery, and separate timeouts for network download, OCR, AI workflow, and complete summary processing.
- MongoDB persistence for summary status, extracted findings, storage metadata, and doctor-sharing state.

## Work in Progress

- Completing production verification of Google Sheets and Google Calendar writes after payment.
- Completing end-to-end production verification of appointment enquiry with deployed webhook URLs.
- Replacing the remaining dashboard demonstration data with live backend data.
- Persisting profile images through backend storage instead of individual browser storage.
- Completing suggested-slot selection when the requested appointment is unavailable.
- Adding automatic refund handling when payment succeeds but booking confirmation fails.

## Technology Stack

### Frontend

- React — component-based landing page, authentication, dashboards, booking checkout, consultation workspace, medication management, and AI assistant.
- React DOM — client-side application rendering.
- Vite — local development server and optimized production bundling.
- JavaScript (ES modules) — application logic and API integration.
- Modern CSS — responsive layouts, role-specific dashboard themes, modals, calendars, charts, and printable clinical views.
- Lucide React — consistent interface icons.
- Browser APIs — PDF generation, file reading, local UI state, print views, and Razorpay checkout integration.

### Backend

- Node.js — server runtime using native ES modules and Fetch API.
- Express.js — versioned REST API for authentication, appointments, consultations, reports, medications, administration, and the AI assistant.
- MongoDB Atlas and Mongoose — persistent users, OTP records, consultations, medications, medical reports, and account metadata.
- JSON Web Tokens — signed authentication sessions and stateless booking-stage tokens.
- bcryptjs — password hashing.
- Zod — registration and authentication request validation.
- Cookie Parser — HTTP-only session-cookie handling.
- Helmet — secure HTTP response headers.
- CORS — controlled communication between the Vercel frontend and Render API.
- Express Rate Limit — protection for authentication, OTP, and booking endpoints.
- Morgan — HTTP request logging.
- pdf-parse — text extraction from machine-readable PDF reports.
- Tesseract.js — OCR for scanned reports and image uploads.
- Node Crypto — OTP hashing, Razorpay signature verification, Cloudinary signatures, and secure tokens.

### Automation and Integrations

- n8n — modular booking, enquiry, cancellation, rescheduling, synchronization, chatbot, and medical-summary workflows.
- Google Sheets — appointment record and workflow data source.
- Google Calendar — doctor calendar-event creation, update, and cancellation.
- Google Identity Services — verified Google Sign-In.
- Brevo transactional email API — registration OTPs, appointment OTPs, password-reset codes, and booking notifications.
- Razorpay test mode — doctor-specific payment orders and server-side signature verification.
- Cloudinary — signed storage and delivery of uploaded medical records.
- Groq through n8n — clinic-restricted conversational assistant and AI-generated report summaries.
- n8n conversation memory — contextual chatbot conversations.

### Deployment

- Vercel — frontend
- Render — backend API
- Render — self-hosted n8n
- MongoDB Atlas — database
- Cloudinary — medical-document storage
- Google Sheets — appointment records
- Google Calendar — doctor scheduling

## Live Deployment

- Frontend: https://ai-clinic-management-system-fronten.vercel.app
- Backend API: https://ai-clinic-management-api.onrender.com
- Backend health check: https://ai-clinic-management-api.onrender.com/api/v1/health
- n8n: https://n8n-latest-0t91.onrender.com
- GitHub repository: https://github.com/sushantt1201/ai-clinic-management-system

The project currently uses free-tier services for development, demonstration, and placement purposes. Free Render services may take additional time to wake after inactivity.

## System Flow

1. A visitor opens the People’s Clinic website.
2. The visitor explores services, doctors, clinic information, or the AI assistant.
3. A patient submits an appointment request through the validated booking form.
4. The backend checks existing Google Sheets appointments through the deployed n8n workflow.
5. The system sends a verification code to the supplied email address.
6. After OTP verification, the backend creates a Razorpay test order for the selected doctor’s fee.
7. The backend verifies the successful payment signature and calls the booking-confirmation workflow.
8. n8n writes the confirmed appointment to Google Sheets, creates the calendar event, and emails the patient.
9. The frontend shows the booking reference and allows the patient to download appointment details as a PDF.
10. Authenticated patients can see appointments matching their email, cancel a booking, or select a validated open slot for rescheduling.
11. n8n synchronizes cancellation and rescheduling changes to Google Sheets and Google Calendar.
12. Doctors can synchronize confirmed visits and inspect highlighted appointment dates in the shared monthly calendar.
13. Patients can upload medical reports for asynchronous AI-generated summaries with automatic stale-job recovery.
14. The API stores the original document in Cloudinary, extracts PDF text or performs OCR, and sends the normalized content to the n8n medical-summary workflow.
15. Patients can download the structured summary and explicitly share it with their doctor.
16. Doctors can save consultation drafts, send prescriptions, generate patient medication schedules, and mark visits complete.
17. The AI assistant answers clinic-specific questions, offers specialist guidance, and securely requests a booking ID only when a private booking or refund lookup is required.

## Project Structure

```text
ai-clinic-management-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Auth, booking, reports, medicines, consultations and admin logic
│   │   ├── middleware/      # Authentication and error handling
│   │   ├── models/          # Users, OTPs, appointments, reports, medicines and consultations
│   │   ├── routes/          # Versioned REST API routes
│   │   ├── scripts/         # Database, authentication and admin utilities
│   │   ├── services/        # Email, payments, Cloudinary, OCR, AI summary and token services
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
├── .gitignore
├── package.json
└── README.md
```

## Local Installation

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
- Razorpay test key ID and secret.
- Booking-token signing secret.
- Cloudinary cloud name, API key, and API secret.
- n8n appointment, cancellation, rescheduling, assistant, and medical-summary webhook URLs.

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

## Available Verification Commands

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

## Future Scope

- Complete production synchronization of every remaining dashboard metric.
- AI-generated pre-consultation patient intake summaries combining bookings, reports, and history.
- Automatic refund handling for failed post-payment booking confirmation.
- Expanded branded invoice and receipt PDFs.
- Automated appointment reminders through email, SMS, or WhatsApp.
- Stronger handwritten-medical-document OCR and confidence scoring.
- Electronic prescription signing and immutable clinical audit history.
- Diagnosis, treatment-plan, and follow-up templates.
- Live billing, receipts, reports, and clinic analytics.
- Persistent profile-image and document storage.
- Patient feedback and rating management.
- Multi-doctor scheduling and department management.
- Multi-clinic support.
- Improved audit logs, monitoring, backups, and production security.

## Learning Outcomes

This project demonstrates:

- Component-based frontend development with React.
- REST API development using Node.js and Express.
- MongoDB data modelling with Mongoose.
- Secure authentication with HTTP-only cookies and role-based access.
- Email OTP and Google authentication integration.
- Responsive patient, doctor, and administrator interfaces.
- Workflow automation with n8n, Google Sheets, and Google Calendar.
- Secure payment verification and multi-stage booking orchestration.
- Cloud medical-document storage, PDF extraction, OCR, and AI summarization.
- Doctor-to-patient prescription synchronization and medication-adherence tracking.
- Separate frontend, backend, database, and automation deployments.
  

## Author

**Sushant Kumar Singh**

- GitHub: https://github.com/sushantt1201
- Repository: https://github.com/sushantt1201/ai-clinic-management-system
