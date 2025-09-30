'use strict';

const logger = require('./logger');

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

function resolveInArguments(body) {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be a JSON object.');
  }

  if (Array.isArray(body.inArguments) && body.inArguments.length > 0) {
    return body.inArguments;
  }

  const nested = body.arguments && body.arguments.execute && body.arguments.execute.inArguments;
  if (Array.isArray(nested) && nested.length > 0) {
    logger.info('Falling back to arguments.execute.inArguments payload.');
    return nested;
  }

  return body.inArguments;
}

function parseInArguments(body) {
  const inArguments = resolveInArguments(body);

  if (!Array.isArray(inArguments) || inArguments.length === 0) {
    throw new ValidationError('inArguments is required and must be a non-empty array.');
  }

  const mergedArgs = inArguments.reduce((acc, current) => {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return acc;
    }
    return Object.assign(acc, current);
  }, {});

  if (Object.keys(mergedArgs).length === 0) {
    throw new ValidationError('inArguments must contain at least one object with properties.');
  }

  return mergedArgs;
}

function validateRequiredField(fieldName, value) {
  const normalized = normalizeString(value);
  if (normalized === '') {
    return { value: normalized, error: `${fieldName} is required.` };
  }
  return { value: normalized, error: null };
}

function validateExecuteRequest(body) {
  logger.debug('Validating execute request body (accepts mobilePhone or mobilePhoneAttribute).', { body });
  const args = parseInArguments(body);
  const errors = [];

  const messageSource = args.messageText !== undefined ? args.messageText : args.message;
  const { value: message, error: messageError } = validateRequiredField('message', messageSource);
  if (messageError) errors.push(messageError);

  const mappedValuesArg = args.mappedValues;
  let mobilePhoneSource = args.mobilePhone;
  let resolvedFromAttribute = false;
  if (
    mappedValuesArg &&
    typeof mappedValuesArg === 'object' &&
    !Array.isArray(mappedValuesArg) &&
    mappedValuesArg.mobilePhone !== undefined
  ) {
    mobilePhoneSource = mappedValuesArg.mobilePhone;
  } else {
    const normalizedMobilePhone = normalizeString(mobilePhoneSource);
    if (normalizedMobilePhone === '') {
      const normalizedAttribute = normalizeString(args.mobilePhoneAttribute);
      if (normalizedAttribute !== '') {
        mobilePhoneSource = normalizedAttribute;
        resolvedFromAttribute = true;
      }
    }
  }

  const { value: mobilePhone, error: mobilePhoneError } = validateRequiredField(
    'mobilePhone or mobilePhoneAttribute',
    mobilePhoneSource
  );
  if (mobilePhoneError) errors.push(mobilePhoneError);

  if (errors.length > 0) {
    logger.warn('Execute request validation failed.', { errors });
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
  if (resolvedFromAttribute) {
    mappedValues.mobilePhoneAttribute = mobilePhone;
  }

  return {
    message,
    recipientMobilePhone: mobilePhone,
    mappedValues,
    rawArguments: args
  };
}

function validateLifecycleRequest(body) {
  logger.debug('Validating lifecycle request body.', { body });
  const args = parseInArguments(body);
  const errors = [];

  const messageSource = args.messageText !== undefined ? args.messageText : args.message;
  const { value: message, error: messageError } = validateRequiredField('message', messageSource);
  if (messageError) errors.push(messageError);

  const { value: mobilePhoneAttribute, error: mobilePhoneAttributeError } = validateRequiredField(
    'mobilePhoneAttribute',
    args.mobilePhoneAttribute
  );
  if (mobilePhoneAttributeError) errors.push(mobilePhoneAttributeError);

  if (errors.length > 0) {
    logger.warn('Lifecycle request validation failed.', { errors });
    throw new ValidationError('Invalid lifecycle payload.', errors);
  }

  return {
    message,
    mobilePhoneAttribute,
    rawArguments: args
  };
}

logger.debug('Execute request validation module initialized.');

module.exports = {
  ValidationError,
  validateExecuteRequest,
  validateLifecycleRequest,
  normalizeString
};
