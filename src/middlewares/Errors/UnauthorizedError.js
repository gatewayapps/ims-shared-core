'use strict'

class UnauthorizedError extends Error {
  constructor (message, code) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.name = 'UnauthorizedError'
    this.statusCode = 401
    this.message = message
    this.code = code
  }
}

module.exports = UnauthorizedError
