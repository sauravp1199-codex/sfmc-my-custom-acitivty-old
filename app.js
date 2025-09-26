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
const configJSON = require('./config-json');
const { v4: uuidv4 } = require('uuid');
const logger = require('./lib/logger');
const { ValidationError, validateExecuteRequest } = require('./lib/activity-validation');
const { buildDigoPayload } = require('./lib/digo-payload');
const { sendPayloadWithRetry, ProviderRequestError } = require('./lib/digo-client');

const app = express();
app.set('trust proxy', true);

const designSystemAssetsPath = path.join(
  __dirname,
  'node_modules/@salesforce-ux/design-system/assets'
);

// Configure Express
app.set('port', process.env.PORT || 3001);
app.use(bodyParser.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/assets', express.static(designSystemAssetsPath));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Attach a correlation id for every request so that logs are traceable.
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.set('X-Correlation-Id', correlationId);
  next();
});

app.get('/', (req, res) => {
  return res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  return res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/main.js', (req, res) => {
  return res.sendFile(path.join(__dirname, 'main.js'));
});

app.get('/main.js.map', (req, res) => {
  return res.sendFile(path.join(__dirname, 'main.js.map'));
});

// setup config.json route
app.get('/config.json', function (req, res) {
  // Journey Builder looks for config.json when the canvas loads.
  // We'll dynamically generate the config object with a function
  return res.status(200).json(configJSON(req));
});

function acknowledgeLifecycleEvent(routeName) {
  return (req, res) => {
    logger.info(`${routeName} lifecycle hook invoked.`, { correlationId: req.correlationId });
    try {
      if (req.body && Array.isArray(req.body.inArguments) && req.body.inArguments.length > 0) {
        validateExecuteRequest(req.body);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn(`${routeName} validation failed.`, { errors: error.details, correlationId: req.correlationId });
        return res.status(error.statusCode).json({
          status: 'invalid',
          message: error.message,
          details: error.details
        });
      }
      logger.error(`${routeName} unexpected error.`, { message: error.message, correlationId: req.correlationId });
      return res.status(500).json({ status: 'error', message: 'Unexpected error validating lifecycle request.' });
    }

    return res.status(200).json({ status: 'ok' });
  };
}

app.post('/save', acknowledgeLifecycleEvent('save'));
app.post('/publish', acknowledgeLifecycleEvent('publish'));
app.post('/validate', acknowledgeLifecycleEvent('validate'));
app.post('/stop', acknowledgeLifecycleEvent('stop'));

app.post('/executeV2', async (req, res) => {
  const correlationId = req.correlationId;
  logger.info('executeV2 invoked.', { correlationId });

  try {
    const validatedArgs = validateExecuteRequest(req.body);
    const providerPayload = buildDigoPayload(validatedArgs, {
      dataSetOverride: validatedArgs.rawArguments.dataSet
    });

    logger.debug('Prepared provider payload.', {
      correlationId,
      payloadPreview: { ...providerPayload, dataSet: `[${providerPayload.dataSet.length} recipients]` }
    });

    const providerResponse = await sendPayloadWithRetry(providerPayload, {
      headers: { 'X-Correlation-Id': correlationId }
    });

    return res.status(200).json({
      status: 'ok',
      transactionID: providerPayload.transactionID,
      providerStatus: providerResponse.status,
      providerResponse: providerResponse.data
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn('executeV2 validation failed.', { errors: error.details, correlationId });
      return res.status(error.statusCode).json({
        status: 'invalid',
        message: error.message,
        details: error.details
      });
    }

    if (error instanceof ProviderRequestError) {
      logger.error('executeV2 provider call failed.', {
        correlationId,
        details: error.details
      });
      const statusCode = error.statusCode && error.statusCode < 500 ? error.statusCode : 502;
      return res.status(statusCode).json({
        status: 'provider_error',
        message: error.message,
        details: error.details
      });
    }

    logger.error('executeV2 unexpected error.', { correlationId, message: error.message });
    return res.status(500).json({
      status: 'error',
      message: 'Unexpected error executing activity.'
    });
  }
});

const PORT = process.env.PORT || 3001;
app.get('/health', (req, res) => {
  res.send('Server is up and running');
});

app.listen(PORT, () => {
  logger.info(`Express is running at localhost: ${PORT}`);
});

module.exports = app;
