'use strict';

const logger = require('./logger');
const { normalizeString, ValidationError } = require('./activity-validation');

function buildDigoPayload(args, requestBody = {}) {
  const {
    campaignName,
    messageBody,
    recipientTo,
    mediaUrl = '',
    buttonLabel = '',
    rawArguments = {}
  } = args;

  logger.debug('Building provider payload for Comsense execute API.', {
    campaignName,
    messageBody,
    recipientTo,
    mediaUrl,
    buttonLabel
  });

  const normalizedCampaignName = normalizeString(campaignName);
  const normalizedMessageBody = normalizeString(messageBody);
  const normalizedRecipientTo = normalizeString(recipientTo);
  const normalizedMediaUrl = normalizeString(mediaUrl || rawArguments.mediaUrl);
  const normalizedButtonLabel = normalizeString(buttonLabel || rawArguments.buttonLabel);

  if (normalizedCampaignName === '' || normalizedMessageBody === '' || normalizedRecipientTo === '') {
    throw new ValidationError('Required fields missing for provider payload.', [
      'Ensure campaignName, messageBody, and recipientTo resolve to non-empty values.'
    ]);
  }

  const normalizeContextValue = (value, fallback = '') => {
    const normalized = normalizeString(value);
    return normalized !== '' ? normalized : normalizeString(fallback);
  };

  const payload = {
    definitionInstanceId: normalizeContextValue(
      requestBody.definitionInstanceId,
      rawArguments.definitionInstanceId || rawArguments.definitionId
    ),
    activityId: normalizeContextValue(requestBody.activityId, rawArguments.activityId),
    journeyId: normalizeContextValue(requestBody.journeyId, rawArguments.journeyId),
    keyValue: normalizeContextValue(
      requestBody.keyValue,
      rawArguments.keyValue || rawArguments.contactKey || requestBody.contactKey
    ),
    inArguments: []
  };

  const appendArgument = (key, value) => {
    const normalized = normalizeString(value);
    if (normalized !== '') {
      payload.inArguments.push({ [key]: normalized });
    }
  };

  appendArgument('campaignName', normalizedCampaignName);
  appendArgument('messageBody', normalizedMessageBody);
  appendArgument('recipientTo', normalizedRecipientTo);
  appendArgument('mediaUrl', normalizedMediaUrl);
  appendArgument('buttonLabel', normalizedButtonLabel);

  if (payload.inArguments.length === 0) {
    throw new ValidationError('No resolved inArguments available for provider payload.', [
      'At least one argument must resolve to a value before invoking the provider API.'
    ]);
  }

  logger.debug('Provider payload built successfully.', {
    payload
  });

  return payload;
}

module.exports = {
  buildDigoPayload
};
