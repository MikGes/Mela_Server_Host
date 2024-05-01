const express = require('express');
const app = express();
const stripe = require('stripe')('sk_test_51P9SqYP5P49FplSBplYLEhYgCjvPuepbNaIGuShGTIzJ2bfTMhfV1PMUK2ueQZgixIb5oJqil0tmA69YBFTcLMg400nW3HRvMn');

app.use(express.json());

app.post('/payment-sheet', async (req, res) => {
  try {
    const { birr,customerEmail,
      customerName,providerName,providerEmail } = req.body;
    // Create a new customer with the provided email and full name
    const customer = await stripe.customers.create({
      email: customerEmail?customerEmail:providerEmail,
      name: customerName?customerName:providerName,
    });

    // Generate an ephemeral key for the customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2024-04-10' }
    );

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: birr,
      currency: 'inr',
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: 'pk_test_51P9SqYP5P49FplSBdpZKFxu1NYhffH2BlvMkoDXjq0HQjHgNUxejNnIiAMR4pMXuDYlPyeO3E6QIgod6AChfsEVZ00NGpB279b'
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;
