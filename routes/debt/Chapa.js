const express = require('express')
const app = express()
const stripe = require('stripe')('sk_test_51P9SqYP5P49FplSBplYLEhYgCjvPuepbNaIGuShGTIzJ2bfTMhfV1PMUK2ueQZgixIb5oJqil0tmA69YBFTcLMg400nW3HRvMn');
// This example sets up an endpoint using the Express framework.
// Watch this video to get started: https://youtu.be/rPR2aJ6XnAc.
app.post('/payment-sheet', async (req, res) => {
  // Use an existing Customer ID if this is a returning customer.
  const customer = await stripe.customers.create();
  const ephemeralKey = await stripe.ephemeralKeys.create(
    {customer: customer.id},
    {apiVersion: '2024-04-10'}
  );
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1099,
    currency: 'usd',
    customer: customer.id,
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter
    // is optional because Stripe enables its functionality by default.
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
});
module.exports = app