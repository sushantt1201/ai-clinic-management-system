# Architecture

The React client calls the Express API. The API will use MongoDB Atlas as the primary datastore and connect to existing n8n workflows for appointment automation. Vapi, Google Calendar, and WhatsApp remain behind the n8n integration boundary until their application services are implemented.

## Planned roles

- Patient
- Doctor
- Administrator

## Delivery order

1. Project foundation
2. Authentication and authorization
3. Public clinic website
4. Appointment management
5. Role-specific dashboards
6. n8n and AI integrations
7. Payments, reporting, and production hardening

