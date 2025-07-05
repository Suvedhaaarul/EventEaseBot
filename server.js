const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// ENV variables
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const SERVER_PREFIX = process.env.SERVER_PREFIX;
const AUDIENCE_ID = process.env.AUDIENCE_ID;
const TAG_NAME = process.env.TAG_NAME;
const STATIC_USER_EMAIL = process.env.STATIC_USER_EMAIL;

const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;

// Webhook endpoint for Dialogflow
app.post('/webhook', (req, res) => {
  const parameters = req.body.queryResult.parameters;

  const email = STATIC_USER_EMAIL || 'test@example.com';
  const product = parameters.product_name || 'our webinar';

  // Respond immediately to Dialogflow
  res.json({
    fulfillmentText: `🎉 You're being registered for ${product}. Please check your email shortly!`
  });

  // 👉 Mailchimp subscription
  const mailchimpData = {
    email_address: email,
    status: 'subscribed',
    tags: [TAG_NAME]
  };

  axios.post(
    `https://${SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`,
    mailchimpData,
    {
      headers: {
        Authorization: `apikey ${MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  )
  .then(() => console.log(`✅ Registered in Mailchimp: ${email}`))
  .catch((error) => {
    const msg = error?.response?.data?.detail || error.message;
    console.error(`❌ Mailchimp error: ${msg}`);
  });

  // 👉 HubSpot contact creation
  const hubspotData = {
    properties: {
      email: email,
      firstname: 'Webinar',
      lastname: product || 'User',
      lifecyclestage: 'lead'
    }
  };

  axios.post('https://api.hubapi.com/crm/v3/objects/contacts', hubspotData, {
    headers: {
      Authorization: `Bearer ${HUBSPOT_API_KEY}`,
      'Content-Type': 'application/json'
    }
  })
  .then(() => console.log(`✅ HubSpot contact created: ${email}`))
  .catch((error) => {
    const msg = error?.response?.data?.message || error.message;
    console.error(`❌ HubSpot error: ${msg}`);
  });
});

// Optional: root test route
app.get('/', (req, res) => {
  res.send('✅ EventEase Webhook is running');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
