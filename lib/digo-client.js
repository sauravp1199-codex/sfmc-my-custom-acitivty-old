'use strict';

const axios = require('axios');
const logger = require('./logger');

class ProviderRequestError extends Error {
  constructor(message, statusCode, details) {
    super(message);
    this.name = 'ProviderRequestError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

function getConfig() {
  return {
    url: process.env.DIGO_API_URL || 'https://engage-api.digo.link/notify',
    xAuthorization: process.env.DIGO_X_AUTHORIZATION,
    bearerToken: process.env.DIGO_BEARER_TOKEN,
    timeout: Number(process.env.DIGO_HTTP_TIMEOUT_MS || 15000),
    retryAttempts: Number(process.env.DIGO_RETRY_ATTEMPTS || 3),
    retryBackoffMs: Number(process.env.DIGO_RETRY_BACKOFF_MS || 500),
    stubResponses: process.env.DIGO_STUB_MODE === 'true'
  };
}

function buildHeaders(config) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (config.xAuthorization) {
    headers['X-Authorization'] = config.xAuthorization;
  }
  if (config.bearerToken) {
    headers.Authorization = `Bearer ${config.bearerToken}`;
  }
  return headers;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendPayloadWithRetry(payload, options = {}) {
  const config = getConfig();
  const attempts = options.retryAttempts || config.retryAttempts;
  const backoffMs = options.retryBackoffMs || config.retryBackoffMs;
  const client = options.httpClient || axios;
  const headers = { ...buildHeaders(config), ...(options.headers || {}) };

  if (config.stubResponses) {
    logger.info('DIGO_STUB_MODE enabled, skipping outbound request.', { payloadSize: JSON.stringify(payload).length });
    return {
      status: 200,
      data: {
        stubbed: true,
        message: 'Stub mode enabled - payload not sent.',
        echoedPayload: payload
      }
    };
  }

  let attempt = 0;
  let lastError;

  while (attempt < attempts) {
    attempt += 1;
    try {
      logger.info('Sending payload to DIGO provider.', { attempt, attempts });
      const response = await client.post(config.url, payload, {
        headers,
        timeout: config.timeout
      });

      if (response.status >= 200 && response.status < 300) {
        logger.info('Provider call succeeded.', { status: response.status });
        return response;
      }

      lastError = new ProviderRequestError('Unexpected provider response status.', response.status, {
        responseBody: response.data
      });
    } catch (error) {
      const status = error.response ? error.response.status : undefined;
      const shouldRetry = !status || status >= 500;
      const details = {
        status,
        message: error.message,
        responseBody: error.response ? error.response.data : undefined
      };
      lastError = new ProviderRequestError('Failed to send payload to provider.', status, details);
      logger.warn('Provider call failed.', { attempt, attempts, details });
      if (!shouldRetry || attempt >= attempts) {
        break;
      }
      const waitMs = backoffMs * Math.pow(2, attempt - 1);
      logger.info('Retrying provider call after backoff.', { waitMs });
      await delay(waitMs);
    }
  }

  throw lastError;
}

module.exports = {
  sendPayloadWithRetry,
  ProviderRequestError,
  getConfig
};
