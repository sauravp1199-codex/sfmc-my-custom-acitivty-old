'use strict';

const uuid = require('uuid');

class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    this.statusCode = 400;
  }
}

function normalizeString(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

function parseInArguments(body) {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be a JSON object.');
  }

  const { inArguments } = body;
  if (!Array.isArray(inArguments) || inArguments.length === 0) {
    throw new ValidationError('inArguments is required and must be a non-empty array.');
  }

  const args = inArguments[0];
  if (!args || typeof args !== 'object') {
    throw new ValidationError('The first element in inArguments must be an object.');
  }

  return args;
}

function validateTinyValue(value) {
  const normalized = normalizeString(value);
  if (normalized === '') {
    return { value: normalized, error: 'tiny is required.' };
  }
  if (!['0', '1'].includes(normalized)) {
    return { value: normalized, error: 'tiny must be either "0" or "1".' };
  }
  return { value: normalized, error: null };
}

function validateRequiredField(fieldName, value) {
  const normalized = normalizeString(value);
  if (normalized === '') {
    return { value: normalized, error: `${fieldName} is required.` };
  }
  return { value: normalized, error: null };
}

function validateExecuteRequest(body) {
  const args = parseInArguments(body);
  const errors = [];

  const { value: campaignName, error: campaignError } = validateRequiredField('campaignName', args.campaignName);
  if (campaignError) errors.push(campaignError);

  const tinyResult = validateTinyValue(args.tiny);
  if (tinyResult.error) errors.push(tinyResult.error);

  const { value: peId, error: peError } = validateRequiredField('PE_ID', args.PE_ID);
  if (peError) errors.push(peError);

  const { value: templateId, error: templateError } = validateRequiredField('TEMPLATE_ID', args.TEMPLATE_ID);
  if (templateError) errors.push(templateError);

  const { value: telemarketerId, error: telemarketerError } = validateRequiredField('TELEMARKETER_ID', args.TELEMARKETER_ID);
  if (telemarketerError) errors.push(telemarketerError);

  const { value: message, error: messageError } = validateRequiredField('message', args.message);
  if (messageError) errors.push(messageError);

  let transactionID = normalizeString(args.transactionID);
  if (!transactionID) {
    transactionID = uuid.v4();
  }

  if (errors.length > 0) {
    throw new ValidationError('Invalid execute payload.', errors);
  }

  return {
    transactionID,
    campaignName,
    tiny: tinyResult.value,
    PE_ID: peId,
    TEMPLATE_ID: templateId,
    TELEMARKETER_ID: telemarketerId,
    message,
    rawArguments: args
  };
}

module.exports = {
  ValidationError,
  validateExecuteRequest,
  normalizeString
};
