'use strict'

class ForbiddenError extends Error {
  constructor (message, code) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.name = 'ForbiddenError'
    this.statusCode = 403
    this.message = message || 'User Account does not have sufficient permissions for this request.'
    this.code = code
  }
}

module.exports = ForbiddenError
