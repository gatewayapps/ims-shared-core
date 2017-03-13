'use strict'
const PermissionHandler = require('../lib/PermissionHandler')
const AuthenticationMiddleware = require('./Authentication')
module.exports = (app, config) => {
  const auth = AuthenticationMiddleware(config)
  const permissionHandler = new PermissionHandler({ package: { id: config.packageId } })

  app.get('/api/user/hasPermission/:permission/:nodeId?', auth.defaultMiddleware, (req, res) => {
    var permissionString = req.params.permission
    var skipTreeNodeCheck = true
    if (req.params.nodeId) {
      permissionString += ':*:' + req.params.nodeId
      skipTreeNodeCheck = false
    }
    console.log(`Checking ${permissionString}`, req.context.permissions)
    if (permissionHandler.checkPermission(permissionString, req.context.permissions, skipTreeNodeCheck)) {
      res.status(200).send()
    } else {
      res.status(401).send()
    }
  })
}
