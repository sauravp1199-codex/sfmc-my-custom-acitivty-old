'use strict';

const { normalizeString, ValidationError } = require('./activity-validation');

function resolveDataset(message, overrides) {
  if (Array.isArray(overrides) && overrides.length > 0) {
    return overrides
      .map((item) => ({
        msisdn: normalizeString(item.msisdn || item),
        message: normalizeString(item.message || message)
      }))
      .filter((item) => item.msisdn !== '');
  }

  const defaultList = (process.env.DIGO_DEFAULT_MSISDNS || '')
    .split(',')
    .map((entry) => normalizeString(entry))
    .filter((entry) => entry !== '');

  if (defaultList.length === 0) {
    throw new ValidationError('No recipients were provided for the SMS payload.', [
      'Provide a dataSet array in the Journey Builder activity or configure DIGO_DEFAULT_MSISDNS.'
    ]);
  }

  return defaultList.map((msisdn) => ({ msisdn, message }));
}

function buildDigoPayload(args, options = {}) {
  const { message, transactionID, campaignName, tiny, PE_ID, TEMPLATE_ID, TELEMARKETER_ID } = args;
  const { dataSetOverride } = options;

  const dataset = resolveDataset(message, dataSetOverride || args.dataSet);

  return {
    transactionID,
    campaignName,
    oa: process.env.DIGO_ORIGINATOR || 'TACMPN',
    channel: 'sms',
    tiny,
    tlv: {
      PE_ID,
      TEMPLATE_ID,
      TELEMARKETER_ID
    },
    dataSet: dataset
  };
}

module.exports = {
  buildDigoPayload,
  resolveDataset
};
