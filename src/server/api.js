import express from 'express'
import SwaggerExpress from 'swagger-express-mw'
import logger from '../logger'
import constants from '../lib/constants'
import createAuthenticationMiddleware from '../middlewares/Authentication'
import FileUploadMiddleware from '../middlewares/FileUpload'
import ContractMiddleware from '../middlewares/ContractMiddleware'
import createBadgeMiddleware from '../middlewares/BadgeSignatureVerification'
/* requestHandlers structure
  - onFileUploadRequest : (req,res, fileDetails)
  - onFileDownloadRequest: (req, res, next)
  - onBadgesRequest: (req, res, next) => Promise<number>
*/

export default class Api {
  constructor (serverConfig, swaggerConfig, middlewares, requestHandlers, onException, contractsDirectory) {
    this.onException = onException
    this.requestHandlers = requestHandlers
    this.serverConfig = serverConfig
    this.middlewares = middlewares
    this.contractsDirectory = contractsDirectory

    try {
      this.verifySwaggerConfig(swaggerConfig)

      this.authenticationMiddleware = createAuthenticationMiddleware(serverConfig).swaggerMiddleware

      swaggerConfig.securityHandlers = {
        token: this.defaultSecurityHandler.bind(this),
        package: this.defaultSecurityHandler.bind(this)
      }

      this.swaggerConfig = swaggerConfig

      this.handleError = this.handleError.bind(this)
      this.createApp = this.createApp.bind(this)
    } catch (err) {
      this.handleError(err)
    }
  }

  defaultSecurityHandler (req, authOrSecDef, scopesOrApiKey, next) {
    return this.authenticationMiddleware(req, authOrSecDef, scopesOrApiKey, (error) => {
      logger.api(req)
      if (error) {
        logger.error({ err: error })
      }
      next(error)
    })
  }

  handleError (err) {
    if (err) {
      if (this.onException) {
        this.onException(err)
      }
      logger.error(err)
      if (err.validationErrors) {
        logger.error(err.validationErrors)
      }
    }
  }

  createApp (cb) {
    SwaggerExpress.create(this.swaggerConfig, (err, swaggerExpress) => {
      if (err) {
        this.handleError(err)
        return cb(err)
      }

      const app = express()
      this.connectMiddlewares(app, this.middlewares, this.contractsDirectory)

      swaggerExpress.register(app)
      cb(null, app)
    })
  }

  connectMiddlewares (app, middlewares, contractsDirectory) {
    // If middlewares are provided, use them here
    if (middlewares && Array.isArray(middlewares)) {
      for (var i = 0; i < middlewares.length; i++) {
        if (typeof middlewares[i] === 'function') {
          app.use(middlewares[i])
        }
      }
    }

    // Connect file upload and download middlewares
    FileUploadMiddleware(app, this.serverConfig, { uploadCallback: this.requestHandlers.onFileUploadRequest })
    app.get('/api/download/:id', this.requestHandlers.onFileDownloadRequest)
    app.get(constants.GlobalUrls.BadgeUrl, createBadgeMiddleware(this.serverConfig), this.requestHandlers.onBadgesRequest)

    // Send the swagger file if it's requested
    app.get('/swagger', (req, res) => {
      res.sendFile(this.swaggerConfig.swaggerFile)
    })

    app.get('/api/*', (req, res, next) => {
        // Force client not to cache api get requests.
        // This is mainly for Internet Explorer.
      res.set({
        'Cache-Control': 'private, max-age=0, no-cache',
        'Pragma': 'no-cache',
        'Expires': 0
      })
      next()
    })
    if (contractsDirectory) {
      ContractMiddleware(app, this.serverConfig, contractsDirectory)
    }
  }

  verifySwaggerConfig (swaggerConfig) {
    if (!swaggerConfig) {
      throw new Error('Api requires a swagger config object')
    }
    if (!swaggerConfig.appRoot) {
      throw new Error('swaggerConfig.appRoot cannot be undefined or empty')
    }
    if (!swaggerConfig.configDir) {
      throw new Error('swaggerConfig.configDir cannot be undefined or empty')
    }
    if (!swaggerConfig.swaggerFile) {
      throw new Error('swaggerConfig.swaggerFile cannot be undefined or empty')
    }
  }
}
