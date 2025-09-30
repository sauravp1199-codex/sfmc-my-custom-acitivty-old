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
  logger.debug('Validating execute request body for outbound API payload.', { body });
  const args = parseInArguments(body);
  const errors = [];

  const { value: campaignName, error: campaignNameError } = validateRequiredField(
    'campaignName',
    args.campaignName
  );
  if (campaignNameError) errors.push(campaignNameError);

  const messageSource =
    args.messageBody !== undefined
      ? args.messageBody
      : args.messageText !== undefined
      ? args.messageText
      : args.message;
  const { value: messageBody, error: messageBodyError } = validateRequiredField('messageBody', messageSource);
  if (messageBodyError) errors.push(messageBodyError);

  const recipientSource =
    args.recipientTo !== undefined
      ? args.recipientTo
      : args.mobilePhone !== undefined
      ? args.mobilePhone
      : args.mobile;
  const { value: recipientTo, error: recipientError } = validateRequiredField('recipientTo', recipientSource);
  if (recipientError) errors.push(recipientError);

  if (errors.length > 0) {
    logger.warn('Execute request validation failed.', { errors });
    throw new ValidationError('Invalid execute payload.', errors);
  }

  const mediaUrl = normalizeString(args.mediaUrl);
  const buttonLabel = normalizeString(args.buttonLabel);

  return {
    campaignName,
    messageBody,
    recipientTo,
    mediaUrl,
    buttonLabel,
    rawArguments: args
  };
}

function validateLifecycleRequest(body) {
  logger.debug('Validating lifecycle request body for inspector save.', { body });
  const args = parseInArguments(body);
  const errors = [];

  const { value: campaignName, error: campaignNameError } = validateRequiredField(
    'campaignName',
    args.campaignName
  );
  if (campaignNameError) errors.push(campaignNameError);

  const messageSource =
    args.messageBody !== undefined
      ? args.messageBody
      : args.messageText !== undefined
      ? args.messageText
      : args.message;
  const { value: messageBody, error: messageBodyError } = validateRequiredField('messageBody', messageSource);
  if (messageBodyError) errors.push(messageBodyError);

  const { value: recipientTo, error: recipientError } = validateRequiredField(
    'recipientTo',
    args.recipientTo || args.mobilePhone || args.mobile
  );
  if (recipientError) errors.push(recipientError);

  if (errors.length > 0) {
    logger.warn('Lifecycle request validation failed.', { errors });
    throw new ValidationError('Invalid lifecycle payload.', errors);
  }

  return {
    campaignName,
    messageBody,
    recipientTo,
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
