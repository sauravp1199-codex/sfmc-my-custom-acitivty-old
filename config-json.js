// ****************
// *
// *
// config-json.js (AKA config.JSON)
// *
// APPLICATION EXTENSION THAT DEFINES YOUR CUSTOM ACTIVITY
// *
// *
// ****************

const { URL } = require('url');

function sanitizeProtocol(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value.split(',')[0].trim().replace(/:$/, '');
}

function pickFirstHeaderValue(req, headerName) {
  if (!req || typeof req.get !== 'function') {
    return '';
  }

  const headerValue = req.get(headerName);

  if (!headerValue || typeof headerValue !== 'string') {
    return '';
  }

  return headerValue.split(',')[0].trim();
}

function parseAbsoluteUrl(candidate) {
  if (!candidate || typeof candidate !== 'string') {
    return null;
  }

  try {
    return new URL(candidate);
  } catch (error) {
    return null;
  }
}

function resolveBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL.replace(/\/?$/, '');
  }

  if (!req || typeof req.get !== 'function') {
    return '';
  }

  const forwardedProto = sanitizeProtocol(pickFirstHeaderValue(req, 'x-forwarded-proto'));
  const forwardedHost = pickFirstHeaderValue(req, 'x-forwarded-host');
  const forwardedPort = pickFirstHeaderValue(req, 'x-forwarded-port');
  const directHost = pickFirstHeaderValue(req, 'host');
  const reqProtocol = sanitizeProtocol(req.protocol);

  let protocol = forwardedProto || reqProtocol || 'https';
  let host = forwardedHost || directHost;

  if (!host) {
    const originUrl = parseAbsoluteUrl(pickFirstHeaderValue(req, 'origin'));
    if (originUrl) {
      protocol = originUrl.protocol.replace(/:$/, '') || protocol;
      host = originUrl.host;
    }
  }

  if (!host) {
    const refererUrl = parseAbsoluteUrl(pickFirstHeaderValue(req, 'referer'));
    if (refererUrl) {
      protocol = refererUrl.protocol.replace(/:$/, '') || protocol;
      host = refererUrl.host;
    }
  }

  if (!host) {
    return '';
  }

  if (forwardedPort && !host.includes(':')) {
    host = `${host}:${forwardedPort}`;
  }

  return `${protocol}://${host}`.replace(/\/?$/, '');
}

function resolveApplicationExtensionId(req) {
  const envValue = process.env.APPLICATION_EXTENSION_ID;
  if (envValue) {
    return envValue;
  }

  if (req && typeof req.get === 'function') {
    const headerCandidates = [
      'x-application-extension-id',
      'x-application-key',
      'x-app-key'
    ];

    for (const headerName of headerCandidates) {
      const headerValue = req.get(headerName);
      if (headerValue && headerValue.trim()) {
        return headerValue.trim();
      }
    }
  }

  const queryValue = req?.query?.applicationExtensionId;
  if (typeof queryValue === 'string' && queryValue.trim()) {
    return queryValue.trim();
  }

  return '';
}

module.exports = function configJSON(req) {
  const baseUrl = resolveBaseUrl(req);
  const iconUrl = `${baseUrl}/images/iconSmall.svg`;
  const applicationExtensionId = resolveApplicationExtensionId(req);

  if (!applicationExtensionId) {
    throw new Error(
      'Missing APPLICATION_EXTENSION_ID environment variable required for Journey Builder validation.'
    );
  }

  return {
    workflowApiVersion: '1.1',
    metaData: {
      icon: iconUrl,
      iconSmall: iconUrl,
      category: 'message'
    },
    type: 'REST',
    lang: {
      'en-US': {
        name: 'Custom SMS Activity',
        description: 'Configures and triggers the DIGO SMS send API with validated payloads.'
      }
    },
    arguments: {
      execute: {
        inArguments: [],
        outArguments: [],
        timeout: 10000,
        retryCount: 5,
        retryDelay: 1000,
        concurrentRequests: 5,
        url: `${baseUrl}/execute`,
        useJwt: true
      }
    },
    configurationArguments: {
      applicationExtensionId,
      save: {
        url: `${baseUrl}/save`
      },
      publish: {
        url: `${baseUrl}/publish`
      },
      validate: {
        url: `${baseUrl}/validate`
      },
      stop: {
        url: `${baseUrl}/stop`
      }
    },
    schema: {
      arguments: {
        execute: {
          inArguments: [
            {
              message: {
                dataType: 'Text',
                isNullable: 'False',
                direction: 'in',
                access: 'visible'
              },
              firstNameAttribute: {
                dataType: 'Text',
                isNullable: 'True',
                direction: 'in',
                access: 'visible'
              },
              mobilePhoneAttribute: {
                dataType: 'Text',
                isNullable: 'False',
                direction: 'in',
                access: 'visible'
              }
            }
          ],
          outArguments: []
        }
      }
    }
  };
};
