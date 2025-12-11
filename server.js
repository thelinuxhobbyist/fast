require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3000;
const stripe = new Stripe(process.env.STRIPE_SECRET || '', { apiVersion: '2022-11-15' });

// Simple file-backed storage for payment records
const storageDir = path.join(__dirname, 'storage');
const paymentsFile = path.join(storageDir, 'payments.json');
if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir);
if (!fs.existsSync(paymentsFile)) fs.writeFileSync(paymentsFile, '[]');

function readPayments(){
  try { return JSON.parse(fs.readFileSync(paymentsFile)); } catch(e){ return []; }
}
function writePayments(list){ fs.writeFileSync(paymentsFile, JSON.stringify(list, null, 2)); }
function addPayment(record){ const list = readPayments(); list.push(record); writePayments(list); }
function hasPayment(id){ return readPayments().some(p => p.id === id); }

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname)));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Raw body for webhook signature verification
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    addPayment({ id: pi.id, email: (pi.receipt_email||''), metadata: pi.metadata || {}, timestamp: Date.now() });
    console.log('Stored succeeded payment intent', pi.id);
  }
  res.json({ received: true });
});

// GET /success?payment_intent=pi_xxx OR ?session_id=cs_test_xxx
app.get('/success', async (req, res) => {
  const payment_intent = req.query.payment_intent;
  const session_id = req.query.session_id;
  try {
    let pi;
    if (payment_intent) {
      pi = await stripe.paymentIntents.retrieve(payment_intent);
    } else if (session_id) {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session && session.payment_intent) {
        pi = await stripe.paymentIntents.retrieve(session.payment_intent);
      }
    }

    if (!pi) {
      return res.status(400).send('Payment not found.');
    }

    // Primary server-side checks
    if (pi.status !== 'succeeded' && !hasPayment(pi.id)) {
      return res.status(400).send('Payment not completed.');
    }

    // Optional: check metadata to ensure this payment belongs to our site
    if (process.env.SITE_IDENTIFIER && pi.metadata && pi.metadata.site && pi.metadata.site !== process.env.SITE_IDENTIFIER) {
      return res.status(400).send('Payment does not belong to this site.');
    }

    // prefill some values if available
    const prefill = { email: pi.receipt_email || (pi.charges && pi.charges.data[0] && pi.charges.data[0].billing_details && pi.charges.data[0].billing_details.email) || '' };

    res.render('success', { payment_intent: pi.id, prefill });
  } catch (err) {
    console.error('Error in /success', err && err.message);
    res.status(500).send('Server error verifying payment.');
  }
});

// POST /success - receive form, re-verify payment and forward to Formspree
app.post('/success', async (req, res) => {
  const payment_intent = req.body.payment_intent || req.query.payment_intent;
  if (!payment_intent) return res.status(400).send('Missing payment identifier.');
  try {
    const pi = await stripe.paymentIntents.retrieve(payment_intent);
    if (!pi || pi.status !== 'succeeded') return res.status(400).send('Payment not completed.');

    // Optionally store that we've accepted the form for this payment
    if (!hasPayment(pi.id)) addPayment({ id: pi.id, email: (pi.receipt_email||''), metadata: pi.metadata || {}, acceptedAt: Date.now() });

    // Forward the form to Formspree so the user's configured workflow still receives it
    const endpoint = process.env.FORMSPREE_ENDPOINT;
    if (!endpoint) return res.status(500).send('Formspree endpoint not configured.');

    // Build form data
    const formData = new URLSearchParams();
    Object.keys(req.body).forEach(k => {
      formData.append(k, req.body[k]);
    });
    // ensure at least subject/payment id included
    formData.append('_subject', `Project Inquiry (payment: ${pi.id})`);

    const forwardRes = await fetch(endpoint, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
    if (!forwardRes.ok) {
      const txt = await forwardRes.text();
      console.error('Formspree forwarding failed', forwardRes.status, txt);
      return res.status(502).send('Failed to forward form.');
    }

    // On success, respond with a small success page
    res.send('<!doctype html><html><head><meta charset="utf-8"><title>Thanks</title></head><body><h2>Thanks — we received your details</h2><p>We have your submission and will follow up soon.</p><p><a href="/">Return home</a></p></body></html>');
  } catch (err) {
    console.error('Error accepting form', err && err.message);
    res.status(500).send('Server error processing form.');
  }
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
