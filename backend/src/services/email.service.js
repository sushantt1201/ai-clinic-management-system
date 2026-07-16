export async function sendOtpEmail({ email, code }) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.OTP_SENDER_EMAIL?.trim();
  if (!apiKey || !senderEmail) throw new Error('Brevo OTP email settings are missing');

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: "People's Clinic", email: senderEmail },
      to: [{ email }],
      subject: "Your People's Clinic verification code",
      htmlContent: `<div style="font-family:Arial,sans-serif;color:#123b52"><h2>Verify your email</h2><p>Your People's Clinic code is:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#087ca5">${code}</p><p>This code expires in 10 minutes. Do not share it.</p></div>`,
    }),
  });
  if (!response.ok) throw new Error(`Brevo rejected the email request (${response.status})`);
}

export async function sendAppointmentOtpEmail({ email, code, patientName, doctorName, date, time }) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.OTP_SENDER_EMAIL?.trim();
  if (!apiKey || !senderEmail) throw new Error('Brevo OTP email settings are missing');
  const result = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST', headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender: { name: "People's Clinic", email: senderEmail }, to: [{ email }],
      subject: "Verify your appointment request",
      htmlContent: `<div style="font-family:Arial;color:#123b52"><h2>Confirm your appointment</h2><p>Hello ${patientName}, use this code to continue:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#087ca5">${code}</p><p>${doctorName}<br>${date} at ${time}</p><p>The code expires in 10 minutes.</p></div>` }),
  });
  if (!result.ok) throw new Error(`Brevo rejected the appointment OTP (${result.status})`);
}
