import { CheckCircle2, CreditCard, LoaderCircle, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { apiRequest } from '../../services/api.js';
import './BookingCheckout.css';

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Payment checkout could not load'));
    document.head.appendChild(script);
  });
}

export default function BookingCheckout({ booking, onClose }) {
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState('otp');
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);

  async function confirmPaidBooking(result) {
    setStage('working');
    setMessage('Confirming payment and booking your appointment…');
    try {
      const verified = await apiRequest(`/appointments/${booking.appointmentId}/payment/verify`, {
        method: 'POST', body: JSON.stringify(result),
      });
      setConfirmation(verified.appointment);
      setStage('success');
      setMessage('');
    } catch (error) {
      setStage('confirmation-error');
      setMessage(error.message);
    }
  }

  function openPaymentCheckout(payment) {
    setStage('payment');
    setMessage('');
    const checkout = new window.Razorpay({
      key: payment.order.keyId,
      amount: payment.order.amount,
      currency: payment.order.currency,
      name: "People's Clinic",
      description: `${payment.appointment.doctorName} consultation`,
      order_id: payment.order.id,
      prefill: { name: booking.request.name, email: booking.request.email, contact: booking.request.phone },
      notes: { bookingId: booking.bookingId },
      theme: { color: '#0785a8' },
      handler: async (result) => {
        setPaymentResult(result);
        await confirmPaidBooking(result);
      },
      modal: {
        ondismiss: () => {
          setStage('payment');
          setMessage('Payment was not completed. Your slot is not confirmed.');
        },
      },
    });
    checkout.open();
  }

  async function verifyOtp(event) {
    event.preventDefault();
    setStage('working');
    setMessage('Verifying your email…');
    try {
      await apiRequest(`/appointments/${booking.appointmentId}/otp/verify`, {
        method: 'POST', body: JSON.stringify({ code: otp }),
      });
      const payment = await apiRequest(`/appointments/${booking.appointmentId}/payment/order`, {
        method: 'POST', body: '{}',
      });
      await loadRazorpay();
      setPaymentDetails(payment);
      openPaymentCheckout(payment);
    } catch (error) {
      setStage('otp');
      setMessage(error.message);
    }
  }

  return <div className="booking-flow" role="dialog" aria-modal="true" aria-labelledby="booking-flow-title">
    <div className="booking-flow__card">
      <button className="booking-flow__close" onClick={onClose} aria-label="Close booking"><X /></button>
      {stage === 'success' ? <div className="booking-flow__success">
        <CheckCircle2 /><h2 id="booking-flow-title">Appointment confirmed</h2>
        <p>Your booking has been added to the clinic system.</p>
        <dl><div><dt>Booking ID</dt><dd>{confirmation?.bookingId || booking.bookingId}</dd></div><div><dt>Doctor</dt><dd>{booking.doctorName}</dd></div><div><dt>Date and time</dt><dd>{booking.request.appointmentDate} · {booking.request.appointmentTime}</dd></div></dl>
        <button onClick={onClose}>Done</button>
      </div> : <>
        <span className="booking-flow__icon"><ShieldCheck /></span>
        <p className="booking-flow__eyebrow">Secure appointment checkout</p>
        <h2 id="booking-flow-title">Verify before payment</h2>
        <div className="booking-flow__details"><span><b>{booking.request.name}</b><small>{booking.request.email}</small></span><span><b>{booking.doctorName}</b><small>{booking.request.appointmentDate} · {booking.request.appointmentTime}</small></span><strong>₹{booking.feeInr}</strong></div>
        {paymentResult && stage === 'confirmation-error'
          ? <button className="booking-flow__retry" type="button" onClick={() => confirmPaidBooking(paymentResult)}><CreditCard />Retry booking confirmation</button>
          : paymentDetails && stage === 'payment'
          ? <button className="booking-flow__retry" type="button" onClick={() => openPaymentCheckout(paymentDetails)}><CreditCard />Retry payment ₹{booking.feeInr}</button>
          : <form onSubmit={verifyOtp}><label htmlFor="booking-otp">Email verification code</label><input id="booking-otp" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" placeholder="Enter 6-digit OTP" required disabled={stage === 'working'} /><button disabled={stage === 'working'}>{stage === 'working' ? <><LoaderCircle className="spin" />Please wait</> : <><CreditCard />Verify and pay ₹{booking.feeInr}</>}</button></form>}
        {message && <p className={`booking-flow__message ${stage === 'confirmation-error' ? 'error' : ''}`}>{message}</p>}
        <small className="booking-flow__safe">Test payments are securely processed by Razorpay.</small>
      </>}
    </div>
  </div>;
}
