"use strict";

class HubError extends Error {
  constructor(message) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = 'HubError';
    this.message = message;
  }
}

module.exports = HubError;