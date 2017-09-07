import express from 'express'
import moment from 'moment'
import path from 'path'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import Api from './api'
import { createCache } from '../utils/cache'
import { createLogger, default as logger } from '../logger'
import { createNotificationService } from '../notifications/notificationService'
import { createSettingService } from '../hub/services/settingService'
import { hubPackageUpdate, uploadMigrationFile, prepareRequest } from '../utils'
import Constants from '../lib/constants'

const COOKIE_EXPIRY = 2147483647

/*
  Options
  - onFileUploadRequest : (req,res,next)
  - onFileDownloadRequest: (req, res, next)
  - onBadgesRequest: (userContext) => Promise<number>
  - onUnhandledException: (err)
  - swagger: {
    appRoot: path to /dist/server
    configDir: relative path from appRoot to api/swagger
    swaggerFile: full path to swagger file
  }
  - migrationFilePath: path to migration.zip file
  - migrationReplacements: object with replacement values
  - middlewares [(req, res, next)...] in the order you want them run
  - onInitialized: callback once server is initialized,
  - cacheOptions: {
      stdTTL: 60, <- default expiration time (in seconds)
      checkperiod: 120, <- How often to check if values are expired (in seconds)
      errorOnMissing: false, <- throw an error if value does not exist in cache
      useClones: true <- clone or return original object
  }
*/

export default class Host {
  constructor (serverConfig, packageDef, options) {
    this.serverConfig = serverConfig
    this.packageDef = packageDef
    this.options = options
    this.onUnhandledException = options.onUnhandledException

    // Create logger and notification service
    createCache(options.cacheOptions)
    createLogger(serverConfig)
    createNotificationService(serverConfig)
    createSettingService(serverConfig)
    prepareRequest(this.serverConfig.hubUrl, this.serverConfig.secret, packageDef)

    // wire up exception handling
    process.on('uncaughtException', this.handleException)

    this.handleException = this.handleException.bind(this)
  }

  handleException (err) {
    if (err) {
      if (this.onUnhandledException) {
        this.onUnhandledException(err)
      }
      logger.error(err)
      process.exit(1)
    }
  }

  start () {
    const app = express()

    app.use(cookieParser())
    app.use(compression())

    if (process.env.NODE_ENV === 'development') {
      logger.info('In development mode, so adding middleware to add HUB_URL to cookies')
      app.use((req, res, next) => {
        res.cookie('HUB_URL', this.serverConfig.hubUrl, { maxAge: COOKIE_EXPIRY })
        return next()
      })
    }

    app.get('/authenticate', this.processAuthenticationRequest.bind(this))

    const api = new Api(this.serverConfig, this.options.swagger, this.options.middlewares, {
      onFileUploadRequest : this.options.onFileUploadRequest,
      onFileDownloadRequest: this.options.onFileDownloadRequest || this.defaultFileDownloadRequestHandler,
      onBadgesRequest: this.options.onBadgesRequest || this.defaultBadgesRequestHandler
    }, this.handleException)

    api.createApp((err, apiApp) => {
      if (err) {
        this.handleException(err)
      } else {
        app.use(apiApp)

        app.use(require('connect-history-api-fallback')())

        this.options.onInitialized(null, app)

        hubPackageUpdate(this.serverConfig.hubUrl, this.serverConfig.secret, this.packageDef).then(() => {
          if (this.options.migrationFilePath) {
            uploadMigrationFile(this.options.migrationFilePath, this.serverConfig, this.options.migrationReplacements).then((result) => {
              logger.info(result)
            })
          }
        }).catch(this.handleException)
      }
    })
  }

  defaultBadgesRequestHandler (userContext) {
    return Promise.resolve(0)
  }
  defaultFileDownloadRequestHandler (req, res, next) {
    res.status(404).send()
  }

  processAuthenticationRequest (req, res, next) {
    if (req.query.refreshToken) {
      res.cookie(Constants.Cookies.RefreshToken, req.query.refreshToken, { expires: moment().add(30, 'days').toDate() })
    }
    res.redirect(req.query.return || '/')
    res.send()
  }
}
