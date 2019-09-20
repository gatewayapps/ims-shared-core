"use strict";
const PermissionHandler = require("../lib/PermissionHandler");
import createAuthenticationMiddleware from "./Authentication";
module.exports = (app, config) => {
  const auth = createAuthenticationMiddleware(config);
  const permissionHandler = new PermissionHandler({ package: { id: config.packageId } });

  app.get("/api/user/hasPermission/:permission/:nodeId?", auth.defaultMiddleware, (req, res) => {
    var permissionString = req.params.permission;
    var skipTreeNodeCheck = true;
    if (req.params.nodeId) {
      permissionString += ":*:" + req.params.nodeId;
      skipTreeNodeCheck = false;
    }

    if (
      permissionHandler.checkPermission(
        permissionString,
        req.context.permissions,
        skipTreeNodeCheck
      )
    ) {
      res.status(200).send();
    } else {
      res.status(401).send();
    }
  });
};
