'use strict';

const { normalizeString, ValidationError } = require('./activity-validation');

function normalizeMappedValues(rawMappedValues) {
  if (!rawMappedValues || typeof rawMappedValues !== 'object' || Array.isArray(rawMappedValues)) {
    return {};
  }

  return Object.entries(rawMappedValues).reduce((acc, [key, value]) => {
    const normalizedValue = normalizeString(value);
    if (normalizedValue !== '') {
      acc[key] = normalizedValue;
    }
    return acc;
  }, {});
}

function buildDigoPayload(args) {
  const {
    transactionID,
    campaignName,
    tiny,
    PE_ID,
    TEMPLATE_ID,
    TELEMARKETER_ID,
    message,
    mappedValues = {},
    recipientMobilePhone
  } = args;

  const normalizedMessage = normalizeString(message);
  const sanitizedMappedValues = normalizeMappedValues(mappedValues);
  const mobilePhone = normalizeString(
    sanitizedMappedValues.mobilePhone || recipientMobilePhone || ''
  );

  if (mobilePhone === '') {
    throw new ValidationError('No recipient mobilePhone provided for the DIGO payload.', [
      'Map a mobilePhone value from the Journey data extension.'
    ]);
  }

  sanitizedMappedValues.mobilePhone = mobilePhone;

  const payload = {
    transactionID,
    message: {
      channel: 'sms',
      content: {
        type: 'text',
        text: normalizedMessage
      },
      recipient: {
        type: 'msisdn',
        address: mobilePhone
      }
    },
    sender: {
      originator: normalizeString(process.env.DIGO_ORIGINATOR || 'TACMPN')
    },
    preferences: {
      tiny
    },
    metaData: {
      campaignName,
      tlv: {
        PE_ID,
        TEMPLATE_ID,
        TELEMARKETER_ID
      },
      mappedValues: sanitizedMappedValues
    }
  };

  return payload;
}

module.exports = {
  buildDigoPayload
};
