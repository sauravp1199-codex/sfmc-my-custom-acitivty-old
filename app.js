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
const { ValidationError, validateExecuteRequest, normalizeString } = require('./lib/activity-validation');
const { buildDigoPayload } = require('./lib/digo-payload');
const { sendPayloadWithRetry, ProviderRequestError } = require('./lib/digo-client');
const { sanitizeObject, sanitizeValue } = require('./lib/log-sanitizer');

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

let cachedActivityConfig = null;

// Attach a correlation id for every request so that logs are traceable.
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.set('X-Correlation-Id', correlationId);
  next();
});

function getPrimaryInArguments(body) {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const inArgumentsArray = Array.isArray(body.inArguments) ? body.inArguments : [];
  const [firstInArguments] = inArgumentsArray;

  if (firstInArguments && typeof firstInArguments === 'object' && !Array.isArray(firstInArguments)) {
    return firstInArguments;
  }

  return {};
}

function readLifecycleInArguments(body) {
  if (!body || typeof body !== 'object') {
    return { args: {}, present: false };
  }

  const inArgumentsArray =
    body.arguments &&
    body.arguments.execute &&
    Array.isArray(body.arguments.execute.inArguments)
      ? body.arguments.execute.inArguments
      : [];

  if (inArgumentsArray.length === 0) {
    return { args: {}, present: false };
  }

  const [first] = inArgumentsArray;
  if (first && typeof first === 'object' && !Array.isArray(first)) {
    return { args: first, present: true };
  }

  return { args: {}, present: false };
}

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

app.post('/save', (req, res) => {
  const correlationId = req.correlationId;
  const { args: inArguments, present } = readLifecycleInArguments(req.body);
  const messageCandidate =
    inArguments.messageText !== undefined ? inArguments.messageText : inArguments.message;
  const normalizedMessage = normalizeString(messageCandidate);
  const normalizedMobile = normalizeString(inArguments.mobilePhoneAttribute);
  const missingFields = [];
  if (normalizedMessage === '') missingFields.push('message');
  if (normalizedMobile === '') missingFields.push('mobilePhoneAttribute');

  logger.info('save lifecycle hook invoked', {
    correlationId,
    status: 'received',
    inArgumentsPresent: present,
    fieldsPresent: {
      message: normalizedMessage !== '',
      mobilePhoneAttribute: normalizedMobile !== ''
    }
  });

  if (missingFields.length > 0) {
    logger.warn('save validation snapshot', { correlationId, missingFields });
    return res.status(400).json({ ok: false, missing: missingFields });
  }

  cachedActivityConfig = inArguments;
  logger.info('save lifecycle config persisted', {
    correlationId,
    snapshot: sanitizeObject(inArguments)
  });

  return res.json({ ok: true });
});

app.post('/validate', (req, res) => {
  const correlationId = req.correlationId;
  const { args: inArguments, present } = readLifecycleInArguments(req.body);
  const messageCandidate =
    inArguments.messageText !== undefined ? inArguments.messageText : inArguments.message;
  const normalizedMessage = normalizeString(messageCandidate);
  const normalizedMobile = normalizeString(inArguments.mobilePhoneAttribute);
  const missingFields = [];
  if (normalizedMessage === '') missingFields.push('message');
  if (normalizedMobile === '') missingFields.push('mobilePhoneAttribute');

  logger.info('validate lifecycle hook invoked', {
    correlationId,
    status: 'received',
    inArgumentsPresent: present,
    fieldsPresent: {
      message: normalizedMessage !== '',
      mobilePhoneAttribute: normalizedMobile !== ''
    }
  });

  if (missingFields.length > 0) {
    logger.warn('validate validation snapshot', { correlationId, missingFields });
    return res.status(400).json({ ok: false, missing: missingFields });
  }

  return res.json({ ok: true });
});

app.post('/publish', (req, res) => {
  const correlationId = req.correlationId;
  const persistedConfig = cachedActivityConfig || {};
  const normalizedMessage = normalizeString(persistedConfig.message);
  const normalizedMobile = normalizeString(persistedConfig.mobilePhoneAttribute);
  const missingFields = [];
  if (normalizedMessage === '') missingFields.push('message');
  if (normalizedMobile === '') missingFields.push('mobilePhoneAttribute');

  logger.info('publish lifecycle hook invoked', {
    correlationId,
    status: missingFields.length ? 'not_ready' : 'ready',
    inArgumentsPresent: missingFields.length === 0
  });

  if (missingFields.length > 0) {
    logger.warn('publish validation snapshot', { correlationId, missingFields });
    return res.status(400).json({ ok: false, missing: missingFields });
  }

  return res.json({ ok: true });
});

app.post('/stop', (req, res) => {
  const correlationId = req.correlationId;
  logger.info('stop lifecycle hook invoked', { correlationId, status: 'received' });
  return res.json({ ok: true });
});

app.post('/executeV2', async (req, res) => {
  const correlationId = req.correlationId;
  const requestBody = req.body || {};
  const inArgumentsArray = Array.isArray(requestBody.inArguments) ? requestBody.inArguments : [];
  const primaryInArguments = getPrimaryInArguments(requestBody);
  const sanitizedRequestBody = sanitizeObject(requestBody);
  const sanitizedPrimaryArgs = sanitizeObject(primaryInArguments);

  logger.info('executeV2 received', {
    correlationId,
    inArgumentsPresent: inArgumentsArray.length > 0
  });
  logger.debug('executeV2.request.body', {
    correlationId,
    requestBody: sanitizedRequestBody
  });
  logger.debug('executeV2.inArguments', {
    correlationId,
    inArguments: sanitizedPrimaryArgs
  });
  const firstName =
    primaryInArguments.firstNameAttribute !== undefined
      ? primaryInArguments.firstNameAttribute
      : primaryInArguments.firstName;
  const mobileAttribute =
    primaryInArguments.mobilePhoneAttribute !== undefined
      ? primaryInArguments.mobilePhoneAttribute
      : primaryInArguments.mobilePhone || primaryInArguments.recipientMobile;
  const messageValue =
    primaryInArguments.messageText !== undefined
      ? primaryInArguments.messageText
      : primaryInArguments.message;

  const mappedValuesMobile =
    primaryInArguments &&
    typeof primaryInArguments.mappedValues === 'object' &&
    primaryInArguments.mappedValues !== null
      ? primaryInArguments.mappedValues.mobilePhone
      : undefined;

  const normalizedMessage = normalizeString(messageValue);
  const normalizedMobile = normalizeString(
    mappedValuesMobile !== undefined
      ? mappedValuesMobile
      : mobileAttribute || primaryInArguments.mobilePhone
  );

  logger.debug('executeV2.extract', {
    correlationId,
    extracted: {
      firstName: sanitizeValue('firstName', firstName),
      mobilePhone: sanitizeValue('mobilePhone', mobileAttribute),
      message: sanitizeValue('message', messageValue)
    }
  });

  const missingFields = [];
  if (normalizedMessage === '') missingFields.push('message');
  if (normalizedMobile === '') missingFields.push('mobilePhone');

  logger[missingFields.length > 0 ? 'warn' : 'info']('executeV2.validate.snapshot', {
    correlationId,
    missingFields,
    fieldsPresent: {
      message: normalizedMessage !== '',
      mobilePhone: normalizedMobile !== ''
    }
  });

  try {
    const validatedArgs = validateExecuteRequest(requestBody);
    logger.debug('executeV2.validation.result', {
      correlationId,
      validationResult: sanitizeObject({
        message: validatedArgs.message,
        recipientMobilePhone: validatedArgs.recipientMobilePhone,
        mappedValues: validatedArgs.mappedValues,
        rawArguments: validatedArgs.rawArguments
      })
    });

    const providerPayload = buildDigoPayload(validatedArgs);
    logger.debug('executeV2.resolved.values', {
      correlationId,
      resolved: {
        message: sanitizeValue('message', validatedArgs.message),
        mobilePhone: sanitizeValue('mobilePhone', providerPayload.message.recipient.address),
        firstName: sanitizeValue(
          'firstName',
          (validatedArgs.mappedValues && validatedArgs.mappedValues.firstName) ||
            validatedArgs.rawArguments.firstName ||
            validatedArgs.rawArguments.firstNameAttribute
        )
      }
    });
    logger.debug('executeV2.provider.payload.built', {
      correlationId,
      payload: sanitizeObject(providerPayload)
    });

    const providerResponse = await sendPayloadWithRetry(providerPayload, {
      headers: { 'X-Correlation-Id': correlationId },
      correlationId
    });

    logger.info('executeV2.provider.response', {
      correlationId,
      status: providerResponse.status,
      body: sanitizeObject(providerResponse.data)
    });

    return res.status(200).json({
      status: 'ok',
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
        details: sanitizeObject(error.details)
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
