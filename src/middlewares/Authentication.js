"use strict";

import { getUserAccountDetails } from "./UserAccountDetails";

const Promise = require("bluebird");
const jwt = require("jsonwebtoken");
const constants = require("../lib/constants");
const UnauthorizedError = require("./Errors/UnauthorizedError");
const ForbiddenError = require("./Errors/ForbiddenError");
const PermissionHandler = require("../lib/PermissionHandler");
var permissionHelper;
var config;

Promise.promisifyAll(jwt);

export default function createAuthenticationMiddleware(conf) {
  config = conf;
  permissionHelper = new PermissionHandler({
    package: { id: config.packageId },
  });
  return {
    defaultMiddleware: defaultHandler,
    validate: validate,
  };
}

function defaultHandler(req, res, next) {
  const tokenHeader = req.headers["x-ims-authorization"];
  if (tokenHeader) {
    const authParts = tokenHeader.split(" ");
    if (authParts.length < 2) {
      next(new UnauthorizedError("Access Token is not valid"));
      return null;
    }

    var token = authParts[1];

    if (!token) {
      next(new UnauthorizedError("Access Token is not valid"));
      return null;
    }

    return validate(req, token, next);
  } else {
    next(new UnauthorizedError("Access Token not provided"));
    return null;
  }
}

function validate(req, token, next) {
  return jwt
    .verifyAsync(token, config.secret)
    .then((decodedToken) => {
      req.context = decodedToken;
      if (req.context.type === constants.TokenTypes.User) {
        req.context.permissions =
          permissionHelper.createPermissionsArrayFromStringsArray(
            req.context.claims
          );
        req.checkNodePermissions = checkNodePermissions.bind(req);

        // The token has been verified as good

        return getUserAccountDetails(req.context.userAccountId).then(
          (userDetails) => {
            req.context.details = userDetails;
            next();
            return null;
          }
        );
      } else {
        next();
        return null;
      }
    })
    .catch((err) => {
      if (err.name !== "TokenExpiredError") {
        console.error("Token failed to verify", token);
        console.error({ err: err });
      }
      next(err);
      return null;
    });
}

function checkNodePermissions(tree, node) {
  let permissions = [];

  // Check node level permissions
  return permissionHelper.checkPermissions(
    permissions,
    this.decoded.permissions
  );
}
