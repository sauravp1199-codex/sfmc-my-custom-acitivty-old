'use strict';

function maskPhone(value) {
  if (value === null || value === undefined) {
    return value;
  }
  const stringValue = String(value);
  const digits = stringValue.replace(/[^0-9+]/g, '');
  if (digits.length <= 4) {
    return '[REDACTED]';
  }
  const visiblePrefixLength = Math.min(3, stringValue.length);
  const visibleSuffixLength = Math.min(2, Math.max(stringValue.length - visiblePrefixLength, 0));
  const prefix = stringValue.slice(0, visiblePrefixLength);
  const suffix = visibleSuffixLength > 0 ? stringValue.slice(-visibleSuffixLength) : '';
  return `${prefix}***${suffix}`;
}

function maskName(value) {
  if (value === null || value === undefined) {
    return value;
  }
  const stringValue = String(value);
  if (stringValue.length === 0) {
    return stringValue;
  }
  if (stringValue.length === 1) {
    return `${stringValue}***`;
  }
  return `${stringValue[0]}***${stringValue[stringValue.length - 1]}`;
}

function truncateMessage(value) {
  if (value === null || value === undefined) {
    return value;
  }
  const stringValue = String(value);
  const MAX_LENGTH = 512;
  if (stringValue.length <= MAX_LENGTH) {
    return stringValue;
  }
  return `${stringValue.slice(0, MAX_LENGTH)}...`;
}

function sanitizeValue(key, value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => sanitizeValue(String(index), item));
  }

  if (typeof value === 'object') {
    return sanitizeObject(value);
  }

  if (typeof value !== 'string') {
    return value;
  }

  const lowerKey = key ? String(key).toLowerCase() : '';

  if (
    lowerKey.includes('auth') ||
    lowerKey.includes('token') ||
    lowerKey.includes('secret') ||
    lowerKey.includes('password') ||
    lowerKey.includes('key')
  ) {
    return '[REDACTED]';
  }

  if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('recipient')) {
    return maskPhone(value);
  }

  if (lowerKey.includes('name')) {
    return maskName(value);
  }

  if (lowerKey.includes('message')) {
    return truncateMessage(value);
  }

  return value;
}

function sanitizeObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) => sanitizeValue(String(index), item));
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  return Object.keys(obj).reduce((acc, key) => {
    acc[key] = sanitizeValue(key, obj[key]);
    return acc;
  }, {});
}

function sanitizeHeaders(headers = {}) {
  return sanitizeObject(headers);
}

module.exports = {
  sanitizeValue,
  sanitizeObject,
  sanitizeHeaders
};
