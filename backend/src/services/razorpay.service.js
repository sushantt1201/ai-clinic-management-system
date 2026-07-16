import crypto from 'node:crypto';

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) throw new Error('Razorpay test credentials are missing');
  return { keyId, keySecret };
}

export async function createPaymentOrder({ amountInr, receipt, notes }) {
  const { keyId, keySecret } = credentials();
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST', headers: { authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`, 'content-type': 'application/json' },
    body: JSON.stringify({ amount: amountInr * 100, currency: 'INR', receipt, notes }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.description || 'Razorpay could not create the test order');
  return { ...data, keyId };
}

export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const { keySecret } = credentials();
  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature || '').padEnd(expected.length).slice(0, expected.length)));
}
