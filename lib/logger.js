'use strict';

const LEVEL_PRIORITY = { debug: 10, info: 20, warn: 30, error: 40 };
const DEFAULT_LEVEL = process.env.LOG_LEVEL ? process.env.LOG_LEVEL.toLowerCase() : 'info';
const DEFAULT_PRIORITY = LEVEL_PRIORITY[DEFAULT_LEVEL] || LEVEL_PRIORITY.info;

function formatMeta(meta = {}) {
  if (!meta || typeof meta !== 'object' || Object.keys(meta).length === 0) {
    return '';
  }
  try {
    return ` | meta=${JSON.stringify(meta)}`;
  } catch (error) {
    return ` | meta_unserializable=${error.message}`;
  }
}

function log(level, message, meta) {
  if (LEVEL_PRIORITY[level] < DEFAULT_PRIORITY) {
    return;
  }
  const timestamp = new Date().toISOString();
  const formattedMeta = formatMeta(meta);
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedMeta}`;
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

module.exports = {
  debug(message, meta) {
    log('debug', message, meta);
  },
  info(message, meta) {
    log('info', message, meta);
  },
  warn(message, meta) {
    log('warn', message, meta);
  },
  error(message, meta) {
    log('error', message, meta);
  }
};
