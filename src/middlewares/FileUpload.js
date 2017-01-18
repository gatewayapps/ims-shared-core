'use strict'
const AuthenticationMiddleware = require('./Authentication')

module.exports = (app, config, options) =>{
  var auth = AuthenticationMiddleware(config)

  app.post('/api/upload', auth.defaultMiddleware, (req, res)=>{

  })
}