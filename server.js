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

// Webhook endpoint
app.post('/webhook', (req, res) => {
  const parameters = req.body.queryResult.parameters;

  const email = STATIC_USER_EMAIL || 'test@example.com';
  const product = parameters.product_name || 'our webinar';

  // Respond immediately to Dialogflow
  res.json({
    fulfillmentText: `🎉 You're being registered for ${product}. Please check your email shortly!`
  });

  // Register in Mailchimp
  const data = {
    email_address: email,
    status: 'subscribed',
    tags: [TAG_NAME]
  };

  axios.post(
    `https://${SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`,
    data,
    {
      headers: {
        Authorization: `apikey ${MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  )
  .then(() => console.log(`✅ Registered ${email}`))
  .catch((error) => {
    const msg = error?.response?.data?.detail || error.message;
    console.error(`❌ Mailchimp error: ${msg}`);
  });
});

app.get('/', (req, res) => {
  res.send('✅ EventEase Webhook is running');
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
