'use strict'

const Promise = require('bluebird')
const jwt = require('jsonwebtoken')

const UnauthorizedError = require('./Errors/UnauthorizedError')
const ForbiddenError = require('./Errors/ForbiddenError')
const PermissionHandler = require('../lib/PermissionHandler')
var permissionHelper
var config


Promise.promisifyAll(jwt)

module.exports = (conf) => {
  config = conf
  permissionHelper = new PermissionHandler({ package: { id: config.packageId } })
  return {
    defaultMiddleware: defaultHandler,
    validate: validate,
    swaggerMiddleware: swaggerHandler
  }
}

function defaultHandler(req, res, next) {
  const tokenHeader = req.headers['x-ims-authorization']
  if (tokenHeader) {
    const authParts = tokenHeader.split(' ')
    if (authParts.length < 2) {
      next(new UnauthorizedError('Access Token is not valid'))
      return null
    }

    var token = authParts[1]

    if (!token) {
      next(new UnauthorizedError('Access Token is not valid'))
      return null
    }

    return validate(req, token, next)
  } else {
    next(new UnauthorizedError('Access Token not provided'))
    return null
  }
}

function swaggerHandler(req, authOrSecDef, scopesOrApiKey, next) {
  if (!scopesOrApiKey) {
    next(new UnauthorizedError('Access Token not provided'))
    return null
  }

  let token = ''
  try {
    const authParts = scopesOrApiKey.split(' ')
    if (authParts.length < 2) {
      next(new UnauthorizedError('Access Token is not valid'))
      return null
    }

    token = authParts[1]

    if (!token) {
      next(new UnauthorizedError('Access Token is not valid'))
      return null
    }
  } catch (err) {
    console.log({ err: err })
    next(err)
    return null
  }

  return validate(req, token, next)

}

function validate(req, token, next) {
  return jwt.verifyAsync(token, config.secret)
    .then(decodedToken => {
      req.context = decodedToken
      req.context.permissions = permissionHelper.createPermissionsArrayFromStringsArray(req.context.claims)
      req.checkNodePermissions = checkNodePermissions.bind(req)

      // The token has been verified as good

      if (req.swagger) {
        // Now verify route specific permissions
        const requiredPermissions = req.swagger.operation['x-required-permissions']
        if (requiredPermissions) {
          if (!Array.isArray(requiredPermissions)) {
            throw new Error('Invalid value in swagger definition for "x-required-permissions"')
          }

          if (permissionHelper.checkPermissions(requiredPermissions, req.context.permissions, true) !== true) {
            next(new ForbiddenError('User Account does not have sufficient permissions for this request.'))
            return null
          }
        }
      }

      next()
      return null
    })
    .catch(err => {
      if (err.name !== 'TokenExpiredError') {
        console.log({ err: err })
      }
      next(err)
      return null
    })
}

function checkNodePermissions(tree, node) {
  let permissions = []

  // build new permissions object with node related to this request.
  if (Array.isArray(this.swagger.operation['x-required-permissions'])) {
    permissions = this.swagger.operation['x-required-permissions'].map(p => {
      return Object.assign({}, p, {
        tree: tree,
        node: node
      })
    })
  }

  // Check node level permissions
  return permissionHelper.checkPermissions(permissions, this.decoded.permissions)
}
