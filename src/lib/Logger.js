'use strict'
const bunyan = require('bunyan')
const path = require('path')
const fs = require('fs')
const bunyanDebugStream = require('bunyan-debug-stream')
var Logger // singleton


export default Logger
export function createLogger(config) {
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

  const PROD_STREAMS = [{
    level: 'debug',
    stream: process.stdout
  }, {
    level: 'info',
    type: 'rotating-file',
    period: '1d',
    count: 7,
    path: path.join(logPath, `${config.packageId}.log`)
  }]
  Logger = bunyan.createLogger({
    name: `${config.packageId}`,
    serializers: bunyan.stdSerializers,
    streams: process.env.NODE_ENV === 'development' ? DEBUG_STREAMS : PROD_STREAMS
  })
  Logger.api = (message) => {
    Logger.info(`[API CALL] - ${message}`)
  }

  Logger.url = (message) => {
    Logger.info(`[URL] - ${message}`)
  }
}