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
const {
  ValidationError,
  validateExecuteRequest,
  validateLifecycleRequest
} = require('./lib/activity-validation');
const {
  applyLifecycleStaticTestData,
  applyExecuteStaticTestData
} = require('./lib/static-test-data');
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
app.use('/images', express.static(path.join(__dirname, 'image')));

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

function mergeInArgumentsFromRequest(body) {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const directInArguments = Array.isArray(body.inArguments) ? body.inArguments : [];
  const nestedInArguments =
    body.arguments &&
    body.arguments.execute &&
    Array.isArray(body.arguments.execute.inArguments)
      ? body.arguments.execute.inArguments
      : [];

  const source = directInArguments.length > 0 ? directInArguments : nestedInArguments;

  return source.reduce((acc, current) => {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return acc;
    }

    return Object.assign(acc, current);
  }, {});
}

function acknowledgeLifecycleEvent(routeName) {
  return (req, res) => {
    logger.info(`${routeName} lifecycle hook invoked.`, { correlationId: req.correlationId });

    const staticDataApplied = applyLifecycleStaticTestData(req);
    if (staticDataApplied) {
      logger.debug(`${routeName} lifecycle static test data merged into request body.`, {
        correlationId: req.correlationId
      });
    }

    logger.debug(`${routeName} lifecycle payload received.`, {
      correlationId: req.correlationId,
      requestBody: req.body
    });

    if (routeName === 'save') {
      const mergedInArguments = mergeInArgumentsFromRequest(req.body);
      if (Object.keys(mergedInArguments).length > 0) {
        logger.info('Save lifecycle received inArguments.', {
          correlationId: req.correlationId,
          inArgumentKeys: Object.keys(mergedInArguments)
        });

        const { masked: maskedInArguments, unresolvedFields } = inspectJourneyData(mergedInArguments);

        if (Object.keys(maskedInArguments).length > 0) {
          logger.info('Save lifecycle inArguments preview.', {
            correlationId: req.correlationId,
            inArgumentsPreview: maskedInArguments
          });
        }

        if (Array.isArray(unresolvedFields) && unresolvedFields.length > 0) {
          logger.warn('Save lifecycle unresolved journey data fields detected.', {
            correlationId: req.correlationId,
            unresolvedFields
          });
        }
      } else {
        logger.warn('Save lifecycle received without inArguments.', { correlationId: req.correlationId });
      }
    }
    try {
      const lifecycleArgs = req.body?.arguments?.execute;

      if (
        lifecycleArgs &&
        Array.isArray(lifecycleArgs.inArguments) &&
        lifecycleArgs.inArguments.length > 0
      ) {
        validateLifecycleRequest(lifecycleArgs);
        logger.debug(`${routeName} lifecycle execute arguments validated successfully.`, {
          correlationId: req.correlationId
        });
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

function acknowledgeLifecycleHealth(routeName) {
  return (req, res) => {
    logger.info(`${routeName} lifecycle health check invoked.`, { correlationId: req.correlationId });

    return res.status(200).json({
      status: 'ok',
      message: `${routeName} endpoint is reachable. Use POST for lifecycle payloads.`
    });
  };
}

app.get('/save', acknowledgeLifecycleHealth('save'));
app.head('/save', acknowledgeLifecycleHealth('save'));
app.post('/save', acknowledgeLifecycleEvent('save'));

app.get('/publish', acknowledgeLifecycleHealth('publish'));
app.head('/publish', acknowledgeLifecycleHealth('publish'));
app.post('/publish', acknowledgeLifecycleEvent('publish'));

app.get('/validate', acknowledgeLifecycleHealth('validate'));
app.head('/validate', acknowledgeLifecycleHealth('validate'));
app.post('/validate', acknowledgeLifecycleEvent('validate'));

app.get('/stop', acknowledgeLifecycleHealth('stop'));
app.head('/stop', acknowledgeLifecycleHealth('stop'));
app.post('/stop', acknowledgeLifecycleEvent('stop'));

function maskPhoneValue(value) {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  if (trimmed.length <= 4) {
    return trimmed ? `***${trimmed.slice(-4)}` : '';
  }
  const visible = trimmed.slice(-4);
  return `${'*'.repeat(trimmed.length - 4)}${visible}`;
}

function maskEmailValue(value) {
  if (typeof value !== 'string') {
    return value;
  }
  const parts = value.split('@');
  if (parts.length !== 2) {
    return value;
  }
  const [local, domain] = parts;
  if (local.length <= 1) {
    return `*@${domain}`;
  }
  return `${local[0]}***@${domain}`;
}

function maskJourneyValue(key, value) {
  if (typeof value !== 'string') {
    return value;
  }

  const lowerKey = key.toLowerCase();

  if (lowerKey.includes('phone') || lowerKey.includes('msisdn')) {
    return maskPhoneValue(value);
  }

  if (lowerKey.includes('email')) {
    return maskEmailValue(value);
  }

  if (lowerKey.includes('contact')) {
    return '[MASKED_CONTACT]';
  }

  return value;
}

function inspectJourneyData(rawArguments) {
  if (!rawArguments || typeof rawArguments !== 'object' || Array.isArray(rawArguments)) {
    return { masked: {}, unresolvedFields: [] };
  }

  const masked = {};
  const unresolvedFields = [];

  Object.entries(rawArguments).forEach(([key, value]) => {
    if (typeof value !== 'string') {
      masked[key] = value;
      return;
    }

    const trimmed = value.trim();

    if (trimmed === '') {
      masked[key] = '';
      return;
    }

    if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
      unresolvedFields.push(key);
      masked[key] = '[UNRESOLVED_TOKEN]';
      return;
    }

    masked[key] = maskJourneyValue(key, trimmed);
  });

  return { masked, unresolvedFields };
}

app.get('/execute', (req, res) => {
  logger.info('execute health check invoked.', { correlationId: req.correlationId });

  return res.status(200).json({
    status: 'ok',
    message: 'execute endpoint is reachable. Use POST for activity execution.'
  });
});

app.head('/execute', (req, res) => {
  logger.info('execute health check (HEAD) invoked.', { correlationId: req.correlationId });

  return res.status(200).json({
    status: 'ok',
    message: 'execute endpoint is reachable. Use POST for activity execution.'
  });
});

app.post('/execute', async (req, res) => {
  const correlationId = req.correlationId;
  logger.info('execute invoked.', { correlationId });

  const staticDataApplied = applyExecuteStaticTestData(req);
  if (staticDataApplied) {
    logger.debug('execute static test data merged into request body.', { correlationId });
  }

  logger.debug('execute request payload received.', {
    correlationId,
    requestBody: req.body
  });

  const mergedInArguments = mergeInArgumentsFromRequest(req.body);
  const expectedKeys = ['campaignName', 'messageBody', 'recipientTo'];
  const normalizedPreview = {
    campaignName: mergedInArguments.campaignName || '',
    messageBody:
      mergedInArguments.messageBody ||
      mergedInArguments.messageText ||
      mergedInArguments.message ||
      '',
    recipientTo:
      mergedInArguments.recipientTo ||
      mergedInArguments.mobilePhone ||
      mergedInArguments.mobile ||
      mergedInArguments.mobilePhoneAttribute ||
      '',
    mediaUrl: mergedInArguments.mediaUrl || '',
    buttonLabel: mergedInArguments.buttonLabel || '',
    contactKey:
      mergedInArguments.contactKey ||
      mergedInArguments.ContactKey ||
      mergedInArguments.contactId ||
      '',
    journeyId: mergedInArguments.journeyId || mergedInArguments.definitionId || '',
    activityId: mergedInArguments.activityId || ''
  };

  const missingInArgumentKeys = expectedKeys.filter((key) => {
    const value = normalizedPreview[key] || '';
    return typeof value !== 'string' ? false : value.trim() === '';
  });

  if (missingInArgumentKeys.length > 0) {
    logger.warn('execute missing expected inArguments.', {
      correlationId,
      missingInArgumentKeys
    });
  }

  try {
    const validatedArgs = validateExecuteRequest(req.body);
    normalizedPreview.campaignName = validatedArgs.campaignName || normalizedPreview.campaignName;
    normalizedPreview.messageBody = validatedArgs.messageBody || normalizedPreview.messageBody;
    normalizedPreview.recipientTo = validatedArgs.recipientTo || normalizedPreview.recipientTo;
    normalizedPreview.mediaUrl = validatedArgs.mediaUrl || normalizedPreview.mediaUrl;
    normalizedPreview.buttonLabel = validatedArgs.buttonLabel || normalizedPreview.buttonLabel;
    if (validatedArgs.rawArguments && typeof validatedArgs.rawArguments === 'object') {
      const rawArgs = validatedArgs.rawArguments;
      if (rawArgs.contactKey || rawArgs.ContactKey || rawArgs.contactId) {
        normalizedPreview.contactKey =
          rawArgs.contactKey || rawArgs.ContactKey || rawArgs.contactId || normalizedPreview.contactKey;
      }
      if (rawArgs.journeyId || rawArgs.definitionId) {
        normalizedPreview.journeyId = rawArgs.journeyId || rawArgs.definitionId || normalizedPreview.journeyId;
      }
      if (rawArgs.activityId) {
        normalizedPreview.activityId = rawArgs.activityId || normalizedPreview.activityId;
      }
    }
    logger.debug('execute request payload validated.', {
      correlationId,
      validationResult: {
        campaignName: validatedArgs.campaignName,
        messageBody: validatedArgs.messageBody,
        recipientTo: validatedArgs.recipientTo,
        mediaUrl: validatedArgs.mediaUrl,
        buttonLabel: validatedArgs.buttonLabel,
        rawArguments: validatedArgs.rawArguments
      }
    });

    const { masked: rawArgumentsPreview, unresolvedFields } = inspectJourneyData(validatedArgs.rawArguments);

    if (unresolvedFields.length > 0) {
      logger.warn('execute unresolved journey data fields detected.', {
        correlationId,
        unresolvedFields
      });
      throw new ValidationError(
        `Unresolved journey data fields detected: ${unresolvedFields.join(', ')}`,
        unresolvedFields.map((field) => `Unresolved field: ${field}`)
      );
    }
    const journeyDataLog = {
      correlationId,
      journeyData: rawArgumentsPreview
    };

    if (unresolvedFields.length > 0) {
      journeyDataLog.unresolvedFields = unresolvedFields;
    }

    logger.info('execute journey data inspection.', journeyDataLog);
    logger.info('execute data extension payload received.', {
      correlationId,
      dataExtensionPayload: validatedArgs.rawArguments
    });

    const providerPayload = buildDigoPayload(validatedArgs, req.body);
    logger.debug('execute resolved values.', {
      correlationId,
      resolved: {
        campaignName: validatedArgs.campaignName,
        messageBody: validatedArgs.messageBody,
        recipientTo: maskPhoneValue(validatedArgs.recipientTo),
        mediaUrl: validatedArgs.mediaUrl || validatedArgs.rawArguments.mediaUrl,
        buttonLabel: validatedArgs.buttonLabel || validatedArgs.rawArguments.buttonLabel
      }
    });
    const payloadPreview = {
      ...providerPayload,
      inArguments: providerPayload.inArguments.map((entry) => {
        if (entry.recipientTo) {
          return { recipientTo: maskPhoneValue(entry.recipientTo) };
        }
        return entry;
      })
    };

    logger.debug('Prepared provider payload.', {
      correlationId,
      payloadPreview
    });

    logger.debug('execute provider payload built.', {
      correlationId,
      payload: providerPayload
    });

    const providerResponse = await sendPayloadWithRetry(providerPayload, {
      headers: { 'X-Correlation-Id': correlationId },
      correlationId
    });

    logger.info('execute provider response received.', {
      correlationId,
      providerStatus: providerResponse.status,
      providerResponse: providerResponse.data
    });

    const resolvedPreviewLog = {
      ...normalizedPreview,
      recipientTo: maskPhoneValue(normalizedPreview.recipientTo)
    };

    logger.info('execute resolved inArguments.', {
      correlationId,
      resolvedInArguments: resolvedPreviewLog
    });

    return res.status(200).json({
      status: 'ok',
      providerStatus: providerResponse.status,
      providerResponse: providerResponse.data
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn('execute validation failed.', { errors: error.details, correlationId });
      return res.status(error.statusCode).json({
        status: 'invalid',
        message: error.message,
        details: error.details
      });
    }

    if (error instanceof ProviderRequestError) {
      logger.error('execute provider call failed.', {
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

    logger.error('execute unexpected error.', { correlationId, message: error.message });
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
