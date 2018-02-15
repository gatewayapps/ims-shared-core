import path from 'path'
import fs from 'fs'
import express from 'express'
import SwaggerExpress from 'swagger-express-mw'
import logger from '../logger'
import constants from '../lib/constants'
import createAuthenticationMiddleware from '../middlewares/Authentication'
import FileUploadMiddleware from '../middlewares/FileUpload'
import PermissionCheckMiddleware from '../middlewares/Permissions'
import ContractMiddleware from '../middlewares/ContractMiddleware'
import { ActivityMiddleware } from '../middlewares/Activities'
import { StatusMiddleware } from '../middlewares/Statuses'
import createBadgeMiddleware from '../middlewares/BadgeSignatureVerification'
import ImageCache from '../middlewares/ImageCache'

/* requestHandlers structure
  - onFileUploadRequest : (req,res, fileDetails)
  - onFileDownloadRequest: (req, res, next)
  - onGetRawStreamRequest (id)
  - onBadgesRequest: (req, res, next) => Promise<number>
*/

export default class Api {
  constructor (serverConfig, swaggerConfig, middlewares, requestHandlers, onException, contractsDirectory = './api/contracts', activitiesDirectory = './api/activities') {
    this.onException = onException
    this.requestHandlers = requestHandlers
    this.serverConfig = serverConfig
    this.middlewares = middlewares
    this.contractsDirectory = contractsDirectory
    this.activitiesDirectory = activitiesDirectory

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
      this.connectMiddlewares(app, this.middlewares, this.contractsDirectory, this.activitiesDirectory)

      swaggerExpress.register(app)
      cb(null, app)
    })
  }

  connectMiddlewares (app, middlewares, contractsDirectory, activitiesDirectory) {
    // If middlewares are provided, use them here
    if (middlewares && Array.isArray(middlewares)) {
      for (var i = 0; i < middlewares.length; i++) {
        if (middlewares[i].route && middlewares[i].handler && middlewares[i].method) {
          const method = middlewares[i].method
          if (method === 'GET') {
            app.get(middlewares[i].route, middlewares[i].handler)
          } else if (method === 'POST') {
            app.post(middlewares[i].route, middlewares[i].handler)
          } else if (method === 'DELETE') {
            app.delete(middlewares[i].route, middlewares[i].handler)
          } else if (method === 'PUT') {
            app.put(middlewares[i].route, middlewares[i].handler)
          }
        } else if (typeof middlewares[i] === 'function') {
          app.use(middlewares[i])
        }
      }
    }

    // Connect file upload and download middlewares
    FileUploadMiddleware(app, this.serverConfig, { uploadCallback: this.requestHandlers.onFileUploadRequest })
    app.get('/api/download/:id', this.requestHandlers.onFileDownloadRequest)
    app.get(constants.GlobalUrls.BadgeUrl, createBadgeMiddleware(this.serverConfig), this.requestHandlers.onBadgesRequest)

    app.get('/api/images/:id', ImageCache({
      cacheDir: this.serverConfig.cachePath,
      debugLogger: logger.debug,
      errorLogger: logger.error,
      getRawStream: this.requestHandlers.onGetRawStreamRequest // attachmentService.getStreamAsync
    }))

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
    PermissionCheckMiddleware(app, this.serverConfig)

    contractsDirectory = getAbsolutePath(contractsDirectory, this.serverConfig.serverRoot)
    activitiesDirectory = getAbsolutePath(activitiesDirectory, this.serverConfig.serverRoot)

    if (contractsDirectory && fs.existsSync(contractsDirectory)) {
      ContractMiddleware(app, this.serverConfig, contractsDirectory)
    }

    if (activitiesDirectory && fs.existsSync(activitiesDirectory)) {
      ActivityMiddleware(app, this.serverConfig, activitiesDirectory, this.serverConfig.mongoConnectionString)
    }

    StatusMiddleware(app, this.serverConfig)
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

function getAbsolutePath (path, serverRoot) {
  if (!path.isAbsolute(path)) {
    if (!serverRoot) {
      return undefined
    } else {
      const result = path.resolve(path.join(serverRoot, path))
      if (path.isAbsolute(result)) {
        return result
      } else {
        return undefined
      }
    }
  }
  return path
}
