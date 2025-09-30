'use strict';

const logger = require('./logger');
const { normalizeString } = require('./activity-validation');

const STATIC_TEST_RECIPIENT = '+15555550123';
const STATIC_TEST_CAMPAIGN = 'Static Regression Campaign';
const STATIC_TEST_MESSAGE = 'Lifecycle validation regression test';
const STATIC_TEST_MEDIA_URL = 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b';
const STATIC_TEST_BUTTON_LABEL = 'Shop Now';
const STATIC_TEST_CONTACT_KEY = 'static-contact-key';
const STATIC_TEST_JOURNEY_ID = 'static-journey-id';
const STATIC_TEST_ACTIVITY_ID = 'static-activity-id';

const STATIC_LIFECYCLE_ARGUMENTS = {
  campaignName: STATIC_TEST_CAMPAIGN,
  messageBody: STATIC_TEST_MESSAGE,
  recipientTo: STATIC_TEST_RECIPIENT,
  mediaUrl: STATIC_TEST_MEDIA_URL,
  buttonLabel: STATIC_TEST_BUTTON_LABEL
};

const STATIC_EXECUTE_ARGUMENTS = {
  campaignName: STATIC_TEST_CAMPAIGN,
  messageBody: 'Thank you for your purchase!',
  recipientTo: STATIC_TEST_RECIPIENT,
  mediaUrl: STATIC_TEST_MEDIA_URL,
  buttonLabel: STATIC_TEST_BUTTON_LABEL,
  contactKey: STATIC_TEST_CONTACT_KEY,
  ContactKey: STATIC_TEST_CONTACT_KEY,
  journeyId: STATIC_TEST_JOURNEY_ID,
  activityId: STATIC_TEST_ACTIVITY_ID
};

const TRUE_FLAG_VALUES = new Set(['true', '1', 'yes', 'on']);

function shouldUseStaticTestData(req) {
  if (!req || typeof req !== 'object') {
    return false;
  }

  const { headers = {}, query = {}, body = {} } = req;

  const headerFlag = typeof headers['x-use-static-test-data'] === 'string'
    ? headers['x-use-static-test-data']
    : headers['X-Use-Static-Test-Data'];

  if (typeof headerFlag === 'string' && TRUE_FLAG_VALUES.has(headerFlag.toLowerCase())) {
    return true;
  }

  const queryValue = query && typeof query.useStaticTestData === 'string'
    ? query.useStaticTestData
    : undefined;
  if (typeof queryValue === 'string' && TRUE_FLAG_VALUES.has(queryValue.toLowerCase())) {
    return true;
  }

  if (body &&
    ((typeof body.useStaticTestData === 'string' && TRUE_FLAG_VALUES.has(body.useStaticTestData.toLowerCase())) ||
      body.useStaticTestData === true)) {
    return true;
  }

  if (process.env.ENABLE_STATIC_TEST_DATA && TRUE_FLAG_VALUES.has(process.env.ENABLE_STATIC_TEST_DATA.toLowerCase())) {
    return true;
  }

  return false;
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function ensurePlainObjectAtIndex(arr) {
  if (!Array.isArray(arr)) {
    return null;
  }

  if (arr.length === 0) {
    arr.push({});
  }

  if (!isPlainObject(arr[0])) {
    arr[0] = {};
  }

  return arr[0];
}

function shouldApplyDefault(currentValue) {
  if (currentValue === undefined || currentValue === null) {
    return true;
  }

  if (typeof currentValue === 'string') {
    const normalized = normalizeString(currentValue);
    if (normalized === '') {
      return true;
    }

    if (normalized.startsWith('{{') && normalized.endsWith('}}')) {
      return true;
    }

    return false;
  }

  if (isPlainObject(currentValue) && Object.keys(currentValue).length === 0) {
    return true;
  }

  return false;
}

function mergeDefaults(target, defaults) {
  if (!isPlainObject(target) || !isPlainObject(defaults)) {
    return false;
  }

  let applied = false;

  Object.entries(defaults).forEach(([key, value]) => {
    if (isPlainObject(value)) {
      if (!isPlainObject(target[key])) {
        target[key] = {};
        applied = true;
      }
      if (mergeDefaults(target[key], value)) {
        applied = true;
      }
      return;
    }

    if (shouldApplyDefault(target[key])) {
      target[key] = value;
      applied = true;
    }
  });

  return applied;
}

function ensureInArgumentsContainers(body) {
  if (!body || typeof body !== 'object') {
    return [];
  }

  let nestedArray =
    body.arguments &&
    body.arguments.execute &&
    Array.isArray(body.arguments.execute.inArguments)
      ? body.arguments.execute.inArguments
      : null;

  if (!Array.isArray(body.inArguments) || body.inArguments.length === 0) {
    if (nestedArray) {
      body.inArguments = nestedArray;
    } else {
      body.inArguments = [{}];
    }
  }

  const directContainer = ensurePlainObjectAtIndex(body.inArguments);

  if (!nestedArray || nestedArray.length === 0) {
    if (!body.arguments || typeof body.arguments !== 'object') {
      body.arguments = {};
    }

    if (!body.arguments.execute || typeof body.arguments.execute !== 'object') {
      body.arguments.execute = {};
    }

    body.arguments.execute.inArguments = body.inArguments;
    nestedArray = body.arguments.execute.inArguments;
  }

  const nestedContainer = ensurePlainObjectAtIndex(nestedArray);

  const containers = [directContainer];

  if (nestedContainer && nestedContainer !== directContainer) {
    containers.push(nestedContainer);
  }

  return containers;
}

function applyStaticDefaults(req, defaults, contextLabel) {
  if (!shouldUseStaticTestData(req)) {
    return false;
  }

  const body = req.body;
  if (!body || typeof body !== 'object') {
    logger.warn(`Static test data requested for ${contextLabel}, but request body is invalid.`);
    return false;
  }

  const containers = ensureInArgumentsContainers(body);
  let applied = false;

  containers.forEach((target) => {
    if (mergeDefaults(target, defaults)) {
      applied = true;
    }
  });

  if (applied) {
    logger.info(`Static test data applied for ${contextLabel} request.`, {
      correlationId: req.correlationId
    });
  }

  return applied;
}

function applyLifecycleStaticTestData(req) {
  return applyStaticDefaults(req, STATIC_LIFECYCLE_ARGUMENTS, 'lifecycle');
}

function applyExecuteStaticTestData(req) {
  return applyStaticDefaults(req, STATIC_EXECUTE_ARGUMENTS, 'execute');
}

module.exports = {
  shouldUseStaticTestData,
  applyLifecycleStaticTestData,
  applyExecuteStaticTestData,
  STATIC_LIFECYCLE_ARGUMENTS,
  STATIC_EXECUTE_ARGUMENTS
};
