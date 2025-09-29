// ****************
// *
// *
// app.js
// *
// SERVER SIDE IMPLEMENTATION
// *
// *
// ****************

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios')
var http = require('https');
var request = require('request');
const app = express();
const configJSON = require('./config-json');
const uuid = require('uuid');

const designSystemAssetsPath = path.join(
  __dirname,
  'node_modules/@salesforce-ux/design-system/assets'
);

let logger = (label, item) => {
  const debug = true
  if (debug) {
    console.log(label)
    console.log(item)
  }
}

// Configure Express
app.set('port', process.env.PORT || 3001);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')))
app.use('/assets', express.static(designSystemAssetsPath));

app.get('/', (req, res) => {
  return res.sendFile(path.join(__dirname, 'index.html'))
})

app.get('/index.html', (req, res) => {
  return res.sendFile(path.join(__dirname, 'index.html'))
})

app.get('/main.js', (req, res) => {
  return res.sendFile(path.join(__dirname, 'main.js'))
})

app.get('/main.js.map', (req, res) => {
  return res.sendFile(path.join(__dirname, 'main.js.map'))
})

// setup config.json route
app.get('/config.json', function (req, res) {
  // Journey Builder looks for config.json when the canvas loads.
  // We'll dynamically generate the config object with a function
  return res.status(200).json(configJSON(req));
});

/**
 * Called when a journey is saving the activity.
 * @return {[type]}     [description]
 * 200 - Return a 200 iff the configuraiton is valid.
 * 30x - Return if the configuration is invalid (this will block the publish phase)
 * 40x - Return if the configuration is invalid (this will block the publish phase)
 * 50x - Return if the configuration is invalid (this will block the publish phase)
 */
app.post('/save', function (req, res) {
  console.log('debug: /save');
  return res.status(200).json({});
});

/**
 * Called when a Journey has been published.
 * This is when a journey is being activiated and eligible for contacts
 * to be processed.
 * @return {[type]}     [description]
 * 200 - Return a 200 iff the configuraiton is valid.
 * 30x - Return if the configuration is invalid (this will block the publish phase)
 * 40x - Return if the configuration is invalid (this will block the publish phase)
 * 50x - Return if the configuration is invalid (this will block the publish phase)
 */
app.post('/publish', function (req, res) {
  console.log('debug: /publish');
  return res.status(200).json({});
});


/**
 * Called when Journey Builder wants you to validate the configuration
 * to ensure the configuration is valid.
 * @return {[type]}
 * 200 - Return a 200 iff the configuraiton is valid.
 * 30x - Return if the configuration is invalid (this will block the publish phase)
 * 40x - Return if the configuration is invalid (this will block the publish phase)
 * 50x - Return if the configuration is invalid (this will block the publish phase)
 */
app.post('/validate', function (req, res) {
  console.log('debug: /validate');
  return res.status(200).json({});
});

/**
 * Called when a Journey is stopped.
 * @return {[type]}
 */
app.post('/stop', function (req, res) {
  console.log('debug: /stop');
  return res.status(200).json({});
});


{
  inArguments: [
    {
      message: 'Thank you for your purchase!',
      firstNameAttribute: '{{Contact.Attribute.MyDE.FirstName}}',
      mobilePhoneAttribute: '{{Contact.Attribute.MyDE.mobile}}'
    }
  ];
}

app.post('/executeV2', async (req, res) => {
  try {
    // Logging the request body
    console.log('req.body', req.body);
    const transactionID = uuid.v4();

    if (Object.keys(req.body.inArguments[0]).length > 0) {
      console.log('Preparing payload and making request to URL...');
      const contactKey = req.body.keyValue;
      // const transactionID = req.body.inArguments[0].transactionID;
      const campaignName = req.body.inArguments[0].campaignName;
      const tiny = req.body.inArguments[0].tiny;
      const PE_ID = req.body.inArguments[0].PE_ID;
      const TEMPLATE_ID = req.body.inArguments[0].TEMPLATE_ID;
      const TELEMARKETER_ID = req.body.inArguments[0].TELEMARKETER_ID;
      const message = req.body.inArguments[0].message;


      // Constructing the payload for the cURL request
      const payload = {
        transactionID: transactionID,
        campaignName: campaignName,
        oa: "TACMPN",
        channel: "sms",
        tiny: tiny,
        tlv: {
          PE_ID: PE_ID,
          TEMPLATE_ID: TEMPLATE_ID,
          TELEMARKETER_ID: TELEMARKETER_ID
        },
        dataSet: [
          {
            msisdn: "917218980233",
            message: message
          },
          {
            msisdn: "918208182849",
            message: message
          },
          {
            msisdn: "918010843817",
            message: message
          },
          {
            msisdn: "919545569352",
            message: message
          },
          {
            msisdn: "919769531784",
            message: message
          },
          {
            msisdn: "918826945805",
            message: message
          },
          {
            msisdn: "919922492150",
            message: message
          },
          {
            msisdn: "917397919560",
            message: message
          }
        ]
      };

      // Sending the payload to the provided URL using request module
      request({
        method: 'POST',
        url: 'https://engage-api.digo.link/notify',
        headers: {
          'X-Authorization': 'Basic dGNsLXRhdGFtb3RybXRlbmdhcGlwcmVmZW50aW5kb210bHZwcm9tbzpkU1dOelhhZg==',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NTU1ZGVmMGE0OTE1YzQ2Yzg5MDk5MmIiLCJmaXJzdE5hbWUiOiJUQVRBIiwibGFzdE5hbWUiOiJNT1RPUlMgTElNSVRFRCIsImVtYWlsIjoiVGF0YV9tb3RvcnMiLCJyb2xlIjoidXNlciIsIm9yZ0lkIjoiNjU0ODg3N2NlZmYxMzEyNzhkZjZjM2MzIiwiaWF0IjoxNzAwMTI2NDg4fQ.C0eCpKOYgamfqcAO4Xu8fHm4zZdJFlWncXfX7Ddya6c'
        },
        json: payload
      }, (error, response, body) => {
        if (error) {
          return res.status(500).json({ errorMessage: error.message });
        }

        console.log('API Response:', body); // Log the response from the API
        return res.status(200).json({
          message: body, // Modify the response message as needed

        });
      });
    } else {
      return res.status(500).json({
        errorMessage: 'req.body.urlString did not exist'
      });
    }
  } catch (errorMessage) {
    return res.status(500).json({ errorMessage });
  }
});

const PORT = process.env.PORT || 3001;
app.get('/health', (req, res) => {
  res.send('Server is up and running');
});

app.listen(PORT, () => {
  console.log(`Express is running at localhost: ${PORT}`)
});
