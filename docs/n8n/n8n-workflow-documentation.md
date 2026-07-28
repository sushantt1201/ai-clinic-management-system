People’s Clinic — n8n Workflow Documentation
Project Overview
People’s Clinic is an AI-powered healthcare management platform developed to connect patients, doctors, and clinic administrators through a single digital system.
The application uses a React frontend, Node.js and Express backend, MongoDB Atlas, Cloudinary, Razorpay test mode, Google Sheets, Google Calendar, Groq AI, and n8n.
n8n acts as the automation layer between the backend application and external services. It handles appointment booking, appointment retrieval, cancellation, rescheduling, AI-based medical-report summarization, and clinic-specific chatbot conversations.
The following six workflows form the core automation architecture of the project:
1.	AI Appointment Booking Agent
2.	Appointment Enquiry and Synchronization
3.	Appointment Cancellation
4.	Appointment Rescheduling
5.	AI Medical Report Summary
6.	People’s Clinic AI Assistant
________________________________________
Workflow 1: AI Appointment Booking Agent
Workflow Name
AI Appointment Booking Agent
Purpose
The AI Appointment Booking Agent confirms a patient’s appointment after the patient has completed email verification and payment.
The workflow receives verified booking information from the Express backend. It stores the appointment in Google Sheets, creates a Google Calendar event, and returns the final booking result.
The workflow ensures that only verified and paid appointments are added to the clinic schedule.
Trigger
The workflow starts through an n8n Webhook node.
The backend calls this webhook after successful Razorpay payment-signature verification.
Example webhook path:
/webhook/appointment
Input Data
The workflow receives booking information in JSON format.
Example:
{
  "name": "Rahul Kumar",
  "email": "rahul@example.com",
  "phone": "+919876543210",
  "doctor": "dr-ananya-sharma",
  "doctor_name": "Dr. Ananya Sharma",
  "fee": 400,
  "date": "2026-08-10",
  "time": "10:00 AM",
  "source": "website-booking-form",
  "otp_verified_at": "2026-08-01T10:30:00.000Z",
  "payment_status": "paid",
  "payment_id": "pay_example123",
  "booking_status": "confirmed",
  "booking_id": "ID-17855802001234"
}
Workflow Processing
The workflow performs the following operations:
1.	Receives the confirmed appointment request from the backend.
2.	Extracts the patient, doctor, payment, date, and time information.
3.	Validates the required fields.
4.	Checks whether the payment status is marked as paid.
5.	Formats the appointment information for Google Sheets.
6.	Stores the confirmed appointment in the appointment spreadsheet.
7.	Creates a Google Calendar event for the doctor’s schedule.
8.	Stores the Calendar event identifier when available.
9.	Prepares a structured booking response.
10.	Returns the booking confirmation to the backend.
Appointment Data Stored
The appointment record contains information such as:
•	Booking ID
•	Patient name
•	Email address
•	Phone number
•	Doctor name
•	Appointment date
•	Appointment time
•	Consultation fee
•	Payment status
•	Payment ID
•	Booking status
•	Calendar event ID
•	Booking source
•	Creation timestamp
Google Sheets Integration
Google Sheets acts as the operational appointment database for the n8n booking workflows.
Each successfully confirmed appointment is added as a new row.
The unique booking ID is used to identify the appointment during enquiry, cancellation, rescheduling, and dashboard synchronization.
Google Calendar Integration
After the appointment is stored, the workflow creates an event in Google Calendar.
The Calendar event contains:
•	Patient name
•	Doctor name
•	Appointment date
•	Appointment time
•	Booking ID
•	Patient contact details
The event helps doctors view confirmed visits from their Google Calendar.
Output
A successful workflow execution returns a response similar to:
{
  "success": true,
  "message": "Appointment booked successfully",
  "booking_id": "ID-17855802001234",
  "booking_status": "confirmed"
}
Validation Rules
The application validates most booking rules before calling the workflow.
These rules include:
•	A valid doctor must be selected.
•	Patient name must not be empty.
•	Email address must be valid.
•	Phone number must follow the Indian phone-number format.
•	Appointment date cannot be in the past.
•	Weekend appointments are not allowed.
•	Appointment time must match a valid 15-minute clinic slot.
•	The selected doctor, date, and time must be available.
•	Email OTP verification must be completed.
•	Razorpay payment verification must succeed.
Error Handling
The workflow returns a controlled error when:
•	Required booking information is missing.
•	Google Sheets cannot be updated.
•	Google Calendar event creation fails.
•	The webhook receives invalid data.
•	An integration service is temporarily unavailable.
The backend uses a timeout while waiting for the workflow. If n8n takes too long, the patient receives a clear message indicating that the payment is safe and booking confirmation can be retried without making another payment.
Security
Payment verification is not performed inside the browser.
The Express backend validates the Razorpay order ID, payment ID, and signature before calling this workflow. This prevents a user from directly marking an unpaid appointment as confirmed.
Workflow Result
The final result is a confirmed appointment that is available in:
•	Google Sheets
•	Google Calendar
•	Patient dashboard
•	Doctor dashboard
•	Appointment enquiry workflow
________________________________________
Workflow 2: Appointment Enquiry and Synchronization
Workflow Name
Appointment Enquiry and Synchronization
Purpose
This workflow retrieves appointment information from Google Sheets and returns it to the application.
It supports several operations:
•	Patient appointment synchronization
•	Doctor appointment synchronization
•	Administrator appointment access
•	Appointment availability checking
•	Rescheduling availability checking
The workflow allows the same appointment data source to be used across multiple parts of the system.
Trigger
The workflow starts through an n8n Webhook node.
Example webhook path:
/webhook/patient-appointments
Input Data
The input depends on the requesting user or operation.
Patient Request
{
  "role": "patient",
  "email": "patient@example.com"
}
Doctor Request
{
  "role": "doctor",
  "doctor_name": "Dr. Ananya Sharma",
  "doctor_email": "doctor@example.com"
}
Administrator or Availability Request
{
  "role": "admin"
}
Workflow Processing
The workflow performs the following operations:
1.	Receives the request from the Express backend.
2.	Reads appointment records from Google Sheets.
3.	Identifies the requester’s role.
4.	Filters the appointment rows according to the request.
5.	Normalizes Google Sheets column names.
6.	Removes unrelated appointment records.
7.	Prepares a structured array of matching appointments.
8.	Returns the appointment list to the backend.
Patient Synchronization
For patient requests, the workflow filters appointments using the patient’s authenticated email address.
This allows a patient to view bookings made through the public booking form, even when the appointment was originally created before the patient logged into the dashboard.
Patients can view:
•	Booking ID
•	Doctor name
•	Appointment date
•	Appointment time
•	Appointment status
•	Payment status
•	Consultation fee
Doctor Synchronization
For doctor requests, the workflow returns appointments connected to the doctor or the shared clinic doctor schedule.
Doctors can view:
•	Daily appointments
•	Upcoming appointments
•	Monthly appointment calendar
•	Patient names
•	Appointment times
•	Booking references
•	Booking status
Administrator and Availability Access
An administrator or internal backend request may retrieve all appointment records.
The backend uses this data to:
•	Check whether a slot is already occupied.
•	Find available appointment times.
•	Validate rescheduling requests.
•	Prevent duplicate booking.
•	Generate administrative appointment views.
Output
Example response:
{
  "success": true,
  "appointments": [
    {
      "booking_id": "ID-17855802001234",
      "patient_name": "Rahul Kumar",
      "email": "rahul@example.com",
      "doctor_name": "Dr. Ananya Sharma",
      "appointment_date": "2026-08-10",
      "appointment_time": "10:00 AM",
      "booking_status": "confirmed",
      "payment_status": "paid"
    }
  ]
}
Appointment Status Handling
The workflow may return appointment states such as:
•	Confirmed
•	Cancelled
•	Rescheduled
•	Visited
•	Completed
When a doctor completes a consultation, the backend can mark the corresponding patient appointment as visited while presenting it in the patient dashboard.
Conditional Logic
The workflow applies filtering based on role.
Request received
        |
        v
Check requested role
   /       |       \
Patient  Doctor   Admin
   |       |        |
Filter   Filter    Return
by email by doctor all rows
Error Handling
The workflow handles situations such as:
•	Missing email address for patient requests
•	Missing doctor information for doctor requests
•	Empty Google Sheets result
•	Google Sheets API failure
•	Invalid role value
•	Temporarily unavailable n8n instance
When no matching appointments are found, the workflow returns an empty appointment array instead of an application error.
Example:
{
  "success": true,
  "appointments": []
}
Security
The backend determines the authenticated user’s role and email address.
The frontend does not directly decide which patient or doctor records are returned. This reduces the risk of one user requesting another user’s appointment information.
Workflow Result
The workflow provides one shared appointment source for:
•	Patient dashboards
•	Doctor dashboards
•	Booking validation
•	Cancellation validation
•	Rescheduling validation
•	Availability calculation
________________________________________
Workflow 3: Appointment Cancellation
Workflow Name
Appointment Cancellation
Purpose
The Appointment Cancellation workflow allows an authenticated patient to cancel a confirmed appointment.
The workflow finds the exact appointment using the booking ID and patient email, updates its status in Google Sheets, records cancellation information, and attempts to remove the corresponding Google Calendar event.
Trigger
The workflow starts through an n8n Webhook node.
Example webhook path:
/webhook/cancel-appointment
Input Data
Example:
{
  "bookingID": "ID-17855802001234",
  "email": "patient@example.com",
  "reason": "Unable to attend the appointment"
}
The authenticated patient email is supplied by the backend.
Workflow Processing
The workflow performs the following operations:
1.	Receives the booking ID and patient email.
2.	Reads appointment data from Google Sheets.
3.	Searches for the exact matching appointment.
4.	Verifies that the appointment belongs to the requesting patient.
5.	Checks the current appointment status.
6.	Rejects invalid or already completed appointments.
7.	Updates the booking status to cancelled.
8.	Stores the cancellation reason when supplied.
9.	Stores the cancellation timestamp.
10.	Retrieves the stored Google Calendar event ID.
11.	Attempts to delete the Calendar event.
12.	Returns a cancellation result to the backend.
Matching Logic
The workflow uses both:
•	Booking ID
•	Patient email
This prevents one patient from cancelling another patient’s appointment by using only a booking reference.
Google Sheets Update
The matching appointment row is updated with information such as:
Booking Status: Cancelled
Cancellation Reason: Unable to attend
Cancelled At: Current date and time
The original appointment record is not deleted. Keeping the row provides a history of the appointment and its final status.
Google Calendar Handling
When the appointment contains a valid Calendar event ID, the workflow attempts to delete the corresponding event.
If the Calendar event is already missing, the Google Sheets cancellation can still succeed.
This prevents a missing Calendar event from blocking the entire cancellation operation.
Output
Example successful response:
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "booking_id": "ID-17855802001234",
  "booking_status": "cancelled"
}
Validation Rules
The workflow or backend validates that:
•	Booking ID follows the expected format.
•	Patient email is available.
•	A matching appointment exists.
•	The appointment belongs to the authenticated patient.
•	The appointment is not already cancelled.
•	The appointment is not completed or visited.
Conditional Branching
Find matching booking
        |
   Booking found?
     /       \
   No         Yes
   |           |
Return       Check current
error         status
               |
        Can be cancelled?
          /          \
        No            Yes
        |              |
     Return error    Update row
                         |
                         v
                Delete Calendar event
Error Handling
The workflow returns a controlled response when:
•	The booking ID is invalid.
•	No matching appointment is found.
•	The email does not match the appointment.
•	The appointment has already been cancelled.
•	The appointment is completed.
•	Google Sheets cannot be updated.
Calendar deletion failure is handled separately so that the booking status can still be updated when appropriate.
Security
The cancellation endpoint is protected by backend authentication.
The backend uses the logged-in patient’s email rather than trusting an arbitrary email entered in the browser.
Workflow Result
After successful execution:
•	The appointment remains available in the historical record.
•	Its status becomes cancelled.
•	The patient dashboard reflects the updated status.
•	The slot can become available for another booking.
•	The Google Calendar event is removed when possible.
________________________________________
Workflow 4: Appointment Rescheduling
Workflow Name
Appointment Rescheduling
Purpose
The Appointment Rescheduling workflow allows an authenticated patient to move an existing appointment to a different date and time.
Before the workflow is called, the backend checks the doctor’s live schedule and verifies that the requested slot is available.
The workflow updates the appointment record and synchronizes the change with Google Calendar.
Trigger
The workflow starts through an n8n Webhook node.
Example webhook path:
/webhook/reschedule-appointment
Input Data
Example:
{
  "bookingID": "ID-17855802001234",
  "email": "patient@example.com",
  "date": "2026-08-12",
  "time": "11:15 AM"
}
Workflow Processing
The workflow performs the following operations:
1.	Receives the booking ID, patient email, new date, and new time.
2.	Finds the existing appointment in Google Sheets.
3.	Verifies that the appointment belongs to the requesting patient.
4.	Checks the current appointment status.
5.	Validates the requested date.
6.	Validates the requested time.
7.	Confirms that the appointment can be rescheduled.
8.	Updates the date and time in Google Sheets.
9.	Updates the booking status when required.
10.	Updates or recreates the Google Calendar event.
11.	Returns the final appointment details to the backend.
Availability Checking
Before calling the workflow, the backend retrieves the live appointment schedule through the Appointment Enquiry workflow.
It removes the patient’s current booking from the occupied-slot calculation and checks whether the selected new slot is available.
The availability is checked again before the final rescheduling request is submitted. This reduces the possibility of two patients selecting the same slot at nearly the same time.
Clinic Rules
The following clinic rules apply:
•	Past dates are not allowed.
•	Saturday and Sunday are not allowed.
•	Slots use 15-minute intervals.
•	Morning appointments are available between 9:00 AM and 12:00 PM.
•	Afternoon appointments are available between 3:00 PM and 5:00 PM.
•	The selected doctor must be available.
•	Cancelled, visited, and completed appointments do not block future availability.
Google Sheets Update
The original appointment row is updated rather than creating a completely unrelated booking record.
Updated information may include:
•	New appointment date
•	New appointment time
•	Rescheduling timestamp
•	Updated booking status
•	Updated Calendar event ID
Google Calendar Integration
The workflow attempts to update the existing Calendar event.
When direct updating is not possible, the previous event can be removed and a new event can be created using the updated date and time.
Output
Example:
{
  "success": true,
  "message": "Appointment rescheduled successfully",
  "booking_id": "ID-17855802001234",
  "date": "2026-08-12",
  "time": "11:15 AM"
}
Alternative Slot Response
If the selected slot has just been booked by another patient, the system returns a conflict response.
Example:
{
  "success": false,
  "message": "That slot was just booked. Choose another available time.",
  "availableSlots": [
    "11:30 AM",
    "11:45 AM",
    "3:00 PM"
  ]
}
Conditional Branching
Receive new date and time
          |
          v
Validate date and clinic hours
          |
          v
Check doctor availability
       /       \
Unavailable   Available
    |             |
Return open     Update Google
slots           Sheets
                    |
                    v
             Update Calendar
Error Handling
The workflow handles:
•	Invalid booking ID
•	Missing appointment
•	Patient ownership mismatch
•	Past date
•	Weekend date
•	Invalid clinic time
•	Occupied slot
•	Cancelled appointment
•	Completed appointment
•	Google Sheets update failure
•	Google Calendar update failure
Security
The route is available only to authenticated users.
The backend provides the patient’s authenticated email address and checks availability before forwarding the request.
Workflow Result
After successful rescheduling:
•	The existing booking ID remains unchanged.
•	The Google Sheets record contains the new date and time.
•	Google Calendar reflects the new schedule.
•	Patient and doctor dashboards receive the updated appointment.
•	The previous slot becomes available.
________________________________________
Workflow 5: AI Medical Report Summary
Workflow Name
AI Medical Report Summary
Purpose
The AI Medical Report Summary workflow generates a structured summary from text extracted from a patient’s uploaded medical report.
The workflow is designed to assist patients and doctors in reviewing report information. It does not diagnose diseases, prescribe medicines, or replace medical professionals.
Trigger
The workflow starts through an n8n Webhook node.
Example webhook path:
/webhook/medical-report-summary
Input Data
Example:
{
  "reportId": "66ab1234example",
  "title": "Complete Blood Count",
  "reportType": "lab-report",
  "mimeType": "application/pdf",
  "fileName": "cbc-report.pdf",
  "fileUrl": "https://cloudinary.example/report.pdf",
  "extractionMethod": "pdf-text",
  "textWasShortened": false,
  "reportText": "Extracted report text is provided here."
}
Processing Before the Workflow
The backend performs file handling before calling n8n.
The backend:
1.	Validates the uploaded file type.
2.	Validates that the file is smaller than 15 MB.
3.	Uploads the original document to Cloudinary.
4.	Attempts to extract text from digital PDFs.
5.	Uses Tesseract OCR when a PDF contains insufficient text.
6.	Uses OCR directly for JPG, PNG, and WebP files.
7.	Normalizes the extracted text.
8.	Splits large reports into smaller sections.
9.	Sends each section to the n8n summary workflow.
Workflow Processing
The workflow performs the following operations:
1.	Receives report metadata and extracted text.
2.	Checks whether the report text is available.
3.	Builds a structured medical-summary instruction.
4.	Sends the content to the configured Groq AI model.
5.	Requests a concise and factual report summary.
6.	Extracts key findings from the AI response.
7.	Formats the final output.
8.	Returns the summary to the Express backend.
Expected Summary Content
The generated response may contain:
•	Report overview
•	Report type
•	Important measurements
•	Values shown outside reference ranges
•	Important observations
•	Areas requiring doctor review
•	Questions the patient may discuss with a doctor
•	A medical safety disclaimer
Output
Example:
{
  "success": true,
  "summary": "The uploaded report contains the results of a complete blood count. The report should be reviewed by a qualified doctor, particularly the values marked outside the laboratory reference range.",
  "keyFindings": [
    "Haemoglobin value is marked below the listed reference range.",
    "White blood cell count is within the displayed reference range.",
    "Doctor review is recommended."
  ]
}
AI Safety Instructions
The workflow instructs the model to:
•	Summarize only the supplied report.
•	Avoid medical diagnosis.
•	Avoid prescribing medicines.
•	Avoid suggesting treatment.
•	Avoid adding unsupported facts.
•	Clearly identify uncertain or unreadable information.
•	Preserve important measurements.
•	Recommend qualified doctor review.
•	Treat the output as informational assistance.
Long Report Processing
Large reports are divided into sections by the backend.
Each section is summarized separately. The section summaries are then sent for consolidation into one final, non-repetitive summary.
This prevents long documents from exceeding AI context or webhook payload limits.
Background Processing
Report summarization runs asynchronously.
The patient does not need to keep the upload request open while OCR and AI processing are completed.
The report may have one of the following summary states:
•	Pending
•	Ready
•	Failed
Retry and Recovery
If processing fails, the patient can select the retry-summary option.
Jobs that remain pending for too long are automatically marked as interrupted. This prevents a report from remaining permanently stuck in a loading state.
Patient-Controlled Sharing
A completed summary is not automatically visible to a doctor.
The patient must explicitly share it.
A doctor can retrieve only reports that:
•	Belong to the matching patient
•	Have completed AI processing
•	Have been explicitly shared by the patient
Error Handling
The workflow and backend handle:
•	Unsupported file type
•	Oversized document
•	Invalid file data
•	Password-protected or damaged PDF
•	Empty PDF text
•	Unclear scanned image
•	OCR timeout
•	Report download timeout
•	n8n timeout
•	AI timeout
•	Empty AI response
•	Excessive payload size
•	Interrupted background processing
Security
The report endpoints are available only to authenticated patient accounts.
The original document is stored in Cloudinary, while report metadata, summary status, AI output, and sharing state are stored in MongoDB.
Workflow Result
After successful execution:
•	The patient sees a structured summary.
•	Important findings are displayed separately.
•	The patient can download or print the summary.
•	The patient can share it with a doctor.
•	The doctor can use it as supporting information during consultation.
________________________________________
Workflow 6: People’s Clinic AI Assistant
Workflow Name
People’s Clinic AI Assistant
Purpose
The People’s Clinic AI Assistant answers questions related to the clinic and its services.
It helps website visitors and patients understand:
•	Clinic timings
•	Doctors
•	Services
•	Appointment booking
•	Cancellation
•	Rescheduling
•	Payment process
•	Refund information
•	Medical-report uploads
•	Specialist selection
•	Directions and contact information
The assistant is intentionally restricted to People’s Clinic topics.
Trigger
The workflow starts through an n8n Webhook node.
Example webhook path:
/webhook/clinic-ai-assistant
Input Data
Example:
{
  "message": "Which doctor should I choose for a heart-related consultation?",
  "sessionId": "session_abc123456",
  "source": "peoples-clinic-web"
}
Workflow Processing
The workflow performs the following operations:
1.	Receives the user message.
2.	Receives the chat session identifier.
3.	Validates that the message is not empty.
4.	Loads or maintains conversation context.
5.	Applies the People’s Clinic system instructions.
6.	Sends the message to Groq AI.
7.	Checks the generated answer.
8.	Returns the response to the Express backend.
9.	Displays the answer in the React chatbot interface.
Conversation Memory
The workflow uses a session identifier to maintain conversational continuity.
For example:
User: What are the clinic timings?
Assistant: The clinic is open during the listed weekday hours.

User: Can I book for Saturday?
Assistant: Weekend appointment booking is not available.
The assistant can understand that the second question is connected to the previous conversation.
Supported Topics
The chatbot can help with:
•	General medicine
•	Dental care
•	Cardiology
•	Diet and lifestyle consultations
•	Doctor selection
•	Clinic timings
•	Appointment charges
•	Booking procedure
•	Email OTP
•	Razorpay payment
•	Booking confirmation
•	Appointment PDF
•	Cancellation
•	Rescheduling
•	Refund-related information
•	Medical report upload
•	AI report summaries
•	Patient dashboard
•	Doctor dashboard
•	Clinic location and directions
Booking ID Rule
The assistant does not ask for a booking ID during ordinary clinic questions.
It requests a booking ID only when private booking information may need to be checked, such as:
•	Appointment status
•	Cancellation
•	Rescheduling
•	Payment status
•	Receipt
•	Refund
Out-of-Scope Handling
The chatbot refuses unrelated requests in a professional manner.
Example:
I’m designed to help with People’s Clinic services, doctors, appointments, payments, reports, and related healthcare queries. Please ask me something about the clinic.
It does not answer unrelated coding, entertainment, political, or general-knowledge questions.
Medical Safety
The assistant does not diagnose patients or prescribe medicines.
For health-related questions, it provides general clinic guidance and recommends consultation with a qualified healthcare professional.
For emergencies, it instructs users to contact emergency services or visit the nearest hospital.
Input Validation
The backend validates that:
•	The message contains at least two characters.
•	The message does not exceed 800 characters.
•	The session ID follows the required format.
•	The session ID contains between 8 and 100 valid characters.
Output
Example:
{
  "success": true,
  "answer": "For heart-related concerns, you can select the cardiology specialist shown on the People’s Clinic doctor list. For urgent chest pain or breathing difficulty, seek emergency medical care immediately."
}
Error Handling
The workflow and backend handle:
•	Empty messages
•	Excessively long messages
•	Invalid session IDs
•	n8n service unavailability
•	AI service failure
•	Empty AI response
•	Invalid webhook response
•	Chatbot timeout
The backend waits for a limited period. If the workflow takes too long, the user receives a temporary-unavailability message instead of an endless loading state.
Security and Privacy
The assistant does not automatically receive the patient’s complete medical record.
Private appointment details should be requested only when necessary, and the assistant asks for a booking reference only for booking-related operations.
Sensitive credentials and backend environment variables are never exposed to the chatbot.
Workflow Result
The workflow provides a responsive clinic assistant that:
•	Reduces repetitive enquiries
•	Explains clinic services
•	Helps patients choose a doctor
•	Guides users through booking and payment
•	Supports appointment-related queries
•	Refuses unrelated requests
•	Provides clear medical-safety guidance
________________________________________
Workflow Interaction Summary
The six workflows are connected through the Express backend.
Patient submits appointment request
                |
                v
Appointment Enquiry Workflow
                |
                v
Backend OTP and Payment Verification
                |
                v
AI Appointment Booking Agent
        /               \
Google Sheets       Google Calendar
        |
        v
Patient and Doctor Dashboards
        |
   +----+----------------+
   |                     |
   v                     v
Cancellation        Rescheduling
Workflow             Workflow

Patient uploads medical report
                |
                v
Backend PDF Parsing or OCR
                |
                v
AI Medical Report Summary
                |
                v
Patient-controlled doctor sharing

Website visitor sends a message
                |
                v
People’s Clinic AI Assistant
                |
                v
Clinic-specific AI response
________________________________________
Common Error-Handling Strategy
The project uses several reliability mechanisms across workflows:
•	Required-field validation
•	IF and Switch conditions
•	Role-based access control
•	Duplicate-booking checks
•	Appointment ownership verification
•	Payment-signature verification
•	API timeouts
•	OCR timeouts
•	AI request timeouts
•	Background processing
•	Retry support
•	Stalled-job recovery
•	Safe Google Calendar failure handling
•	Structured webhook responses
•	Central backend error handling
•	HTTP request logging
________________________________________
Common Security Strategy
The workflows operate behind the Express backend.
The backend handles:
•	Authentication
•	Role authorization
•	Email OTP verification
•	Password hashing
•	HTTP-only cookies
•	JSON Web Tokens
•	Razorpay signature verification
•	Request validation
•	Rate limiting
•	Protected patient, doctor, and admin routes
The n8n workflow JSON exports must not contain:
•	API keys
•	Passwords
•	OAuth client secrets
•	Database credentials
•	Razorpay secrets
•	Email-service secrets
•	Private access tokens
All credentials must be configured separately inside n8n.

Conclusion
The People’s Clinic automation architecture uses six modular n8n workflows to manage appointment operations, synchronize healthcare schedules, process medical reports using AI, and support patients through a clinic-specific chatbot.
The workflows reduce manual appointment coordination, prevent duplicate bookings, synchronize Google Sheets and Google Calendar, assist doctors with patient-shared report summaries, and improve communication between patients and the clinic.
Each workflow performs a separate responsibility, making the system easier to test, maintain, demonstrate, and extend.

