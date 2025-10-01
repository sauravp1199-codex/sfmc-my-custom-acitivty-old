// ****************
// *
// *
// config-json.js (AKA config.JSON)
// *
// APPLICATION EXTENSION THAT DEFINES YOUR CUSTOM ACTIVITY
// *
// *
// ****************

function resolveBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL;
  }

  if (!req || typeof req.get !== 'function') {
    return '';
  }

  const forwardedProto = req.get('x-forwarded-proto');
  let protocol = forwardedProto ? forwardedProto.split(',')[0].trim() : '';

  if (!protocol && req.protocol) {
    protocol = req.protocol;
  }

  if (!protocol) {
    return '';
  }

  const host = req.get('host');

  if (!host) {
    return '';
  }

  return `${protocol}://${host}`;
}

module.exports = function configJSON(req) {
  const baseUrl = resolveBaseUrl(req);
  const iconUrl = `${baseUrl}/images/iconSmall.svg`;

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
        url: `${baseUrl}/executeV2`,
        useJwt: true
      }
    },
    configurationArguments: {
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
                isNullable: false,
                direction: 'in',
                access: 'visible'
              },
              firstNameAttribute: {
                dataType: 'Text',
                isNullable: true,
                direction: 'in',
                access: 'visible'
              },
              mobilePhoneAttribute: {
                dataType: 'Text',
                isNullable: false,
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
