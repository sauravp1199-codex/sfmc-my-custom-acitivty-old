'use strict';

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

  const messageSource = args.messageText !== undefined ? args.messageText : args.message;
  const { value: message, error: messageError } = validateRequiredField('message', messageSource);
  if (messageError) errors.push(messageError);

  const mappedValuesArg = args.mappedValues;
  let mobilePhoneSource = args.mobilePhone;
  if (
    mappedValuesArg &&
    typeof mappedValuesArg === 'object' &&
    !Array.isArray(mappedValuesArg) &&
    mappedValuesArg.mobilePhone !== undefined
  ) {
    mobilePhoneSource = mappedValuesArg.mobilePhone;
  }

  const { value: mobilePhone, error: mobilePhoneError } = validateRequiredField('mobilePhone', mobilePhoneSource);
  if (mobilePhoneError) errors.push(mobilePhoneError);

  if (errors.length > 0) {
    throw new ValidationError('Invalid execute payload.', errors);
  }

  const mappedValues = {};
  if (mappedValuesArg && typeof mappedValuesArg === 'object' && !Array.isArray(mappedValuesArg)) {
    Object.entries(mappedValuesArg).forEach(([key, value]) => {
      const normalized = normalizeString(value);
      if (normalized !== '') {
        mappedValues[key] = normalized;
      }
    });
  }

  mappedValues.mobilePhone = mobilePhone;

  return {
    message,
    recipientMobilePhone: mobilePhone,
    mappedValues,
    rawArguments: args
  };
}

module.exports = {
  ValidationError,
  validateExecuteRequest,
  normalizeString
};
