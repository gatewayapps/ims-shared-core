'use strict'
const url = require('url')
const bunyan = require('bunyan')
const path = require('path')
const fs = require('fs')
const bunyanDebugStream = require('bunyan-debug-stream')
var loggerInstance // singleton

var loggerWrapper = {
  debug: (...args) => {
    loggerInstance.debug(...args)
  },
  info: (...args) => {
    loggerInstance.info(...args)
  },
  error: (...args) => {
    loggerInstance.error(...args)
  },
  api: (...args) => {
    loggerInstance.api(...args)
  },
  url: (...args) => {
    loggerInstance.url(...args)
  },
  warn: (...args) => {
    loggerInstance.warn(...args)
  }
}

export default loggerWrapper

export function isLoggerCreated () {
  return !!loggerInstance
}

export function createLogger (config, subFileName) {
  const logPath = path.join(config.fileStoragePath, 'logs')

  try {
    fs.statSync(logPath)
  } catch (e) {
    fs.mkdirSync(logPath)
  }

  const DEBUG_STREAMS = [{
    level: 'debug',
    type: 'raw',
    stream: bunyanDebugStream({
      colors: {
        'info': ['green']
      },
      basepath: __dirname, // this should be the root folder of your project.
      forceColor: true
    })
  }]

  const logFileName = subFileName ? `${config.packageId}_${subFileName}.log` : `${config.packageId}.log`

  const PROD_STREAMS = [{
    level: 'debug',
    stream: process.stdout
  }, {
    level: 'info',
    type: 'rotating-file',
    period: '1d',
    count: 7,
    path: path.join(logPath, logFileName)
  }]
  loggerInstance = bunyan.createLogger({
    name: `${config.packageId}`,
    serializers: bunyan.stdSerializers,
    streams: process.env.NODE_ENV === 'development' ? DEBUG_STREAMS : PROD_STREAMS
  })
  loggerInstance.api = (req) => {
    var user = 'GUEST/0'
    if (req.context) {
      user = `${req.context.displayName}/${req.context.userAccountId}`
    }
    loggerInstance.info(`[API CALL]: (${user}) - ${req.method} ${fullUrl(req)}`)
    if (req.body) {
      loggerInstance.info(`[REQUEST BODY]`, req.body)
    }
  }

  loggerInstance.url = (message) => {
    loggerInstance.info(`[URL] - ${message}`)
  }
}

function fullUrl (req) {
  return url.format({
    protocol: req.protocol,
    hostname: req.get('Host').toString().replace('[', '').replace(']', ''),
    pathname: req.originalUrl
  })
}
