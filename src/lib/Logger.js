'use strict'
const bunyan = require('bunyan')
const path = require('path')
const fs = require('fs')
const bunyanDebugStream = require('bunyan-debug-stream')
var loggerInstance // singleton

var loggerWrapper = {
  debug: (...args)=>{
    loggerInstance.debug(...args)
  },
  info: (...args) =>{
    loggerInstance.info(...args)
  },
  error: (...args)=>{
    loggerInstance.error(...args)
  }
}

export default loggerWrapper

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
  loggerInstance = bunyan.createLogger({
    name: `${config.packageId}`,
    serializers: bunyan.stdSerializers,
    streams: process.env.NODE_ENV === 'development' ? DEBUG_STREAMS : PROD_STREAMS
  })
  loggerInstance.api = (message) => {
    loggerInstance.info(`[API CALL] - ${message}`)
  }

  loggerInstance.url = (message) => {
    loggerInstance.info(`[URL] - ${message}`)
  }
}