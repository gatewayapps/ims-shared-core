import path from "path";
import fs from "fs";
import express from "express";

import logger from "../logger";
import constants from "../lib/constants";
import createAuthenticationMiddleware from "../middlewares/Authentication";
import FileUploadMiddleware from "../middlewares/FileUpload";
import PermissionCheckMiddleware from "../middlewares/Permissions";
import ContractMiddleware from "../middlewares/ContractMiddleware";
import { ActivityMiddleware } from "../middlewares/Activities";
import createBadgeMiddleware from "../middlewares/BadgeSignatureVerification";
import ImageCache from "../middlewares/ImageCache";

/* requestHandlers structure
  - onFileUploadRequest : (req,res, fileDetails)
  - onFileDownloadRequest: (req, res, next)
  - onGetRawStreamRequest (id)
  - onBadgesRequest: (req, res, next) => Promise<number>
*/

export default class Api {
  constructor(
    serverConfig,
    middlewares,
    requestHandlers,
    onException,
    contractsDirectory = "./api/contracts",
    activitiesDirectory = "./api/activities"
  ) {
    this.onException = onException;
    this.requestHandlers = requestHandlers;
    this.serverConfig = serverConfig;
    this.middlewares = middlewares;
    this.contractsDirectory = contractsDirectory;
    this.activitiesDirectory = activitiesDirectory;

    try {
      this.authenticationMiddleware =
        createAuthenticationMiddleware(serverConfig).defaultMiddleware;

      this.handleError = this.handleError.bind(this);
      this.createApp = this.createApp.bind(this);
    } catch (err) {
      this.handleError(err);
    }
  }

  defaultSecurityHandler(req, authOrSecDef, scopesOrApiKey, next) {
    return this.authenticationMiddleware(
      req,
      authOrSecDef,
      scopesOrApiKey,
      (error) => {
        logger.api(req);
        if (error) {
          logger.error({ err: error });
        }
        next(error);
      }
    );
  }

  handleError(err) {
    if (err) {
      if (this.onException) {
        this.onException(err);
      }
      logger.error(err);
      if (err.validationErrors) {
        logger.error(err.validationErrors);
      }
    }
  }

  createApp(cb) {
    const app = express();
    this.connectMiddlewares(
      app,
      this.middlewares,
      this.contractsDirectory,
      this.activitiesDirectory
    );
    cb(null, app);
  }

  connectMiddlewares(
    app,
    middlewares,
    contractsDirectory,
    activitiesDirectory
  ) {
    // If middlewares are provided, use them here
    if (middlewares && Array.isArray(middlewares)) {
      for (var i = 0; i < middlewares.length; i++) {
        if (
          middlewares[i].route &&
          middlewares[i].handler &&
          middlewares[i].method
        ) {
          const method = middlewares[i].method;
          if (method === "GET") {
            app.get(middlewares[i].route, middlewares[i].handler);
          } else if (method === "POST") {
            app.post(middlewares[i].route, middlewares[i].handler);
          } else if (method === "DELETE") {
            app.delete(middlewares[i].route, middlewares[i].handler);
          } else if (method === "PUT") {
            app.put(middlewares[i].route, middlewares[i].handler);
          }
        } else if (typeof middlewares[i] === "function") {
          app.use(middlewares[i]);
        }
      }
    }

    // Connect file upload and download middlewares
    FileUploadMiddleware(app, this.serverConfig, {
      uploadCallback: this.requestHandlers.onFileUploadRequest,
    });
    app.get("/api/download/:id", this.requestHandlers.onFileDownloadRequest);
    app.get(
      constants.GlobalUrls.BadgeUrl,
      createBadgeMiddleware(this.serverConfig),
      this.requestHandlers.onBadgesRequest
    );

    app.get(
      "/api/images/:id",
      ImageCache({
        cacheDir: this.serverConfig.cachePath,
        debugLogger: logger.debug,
        errorLogger: logger.error,
        getRawStream: this.requestHandlers.onGetRawStreamRequest, // attachmentService.getStreamAsync
      })
    );

    app.get("/api/*", (req, res, next) => {
      // Force client not to cache api get requests.
      // This is mainly for Internet Explorer.
      res.set({
        "Cache-Control": "private, max-age=0, no-cache",
        Pragma: "no-cache",
        Expires: 0,
      });
      next();
    });
    PermissionCheckMiddleware(app, this.serverConfig);

    contractsDirectory = getAbsolutePath(
      contractsDirectory,
      this.serverConfig.serverRoot
    );
    activitiesDirectory = getAbsolutePath(
      activitiesDirectory,
      this.serverConfig.serverRoot
    );

    if (contractsDirectory && fs.existsSync(contractsDirectory)) {
      ContractMiddleware(app, this.serverConfig, contractsDirectory);
    }

    if (activitiesDirectory && fs.existsSync(activitiesDirectory)) {
      ActivityMiddleware(
        app,
        this.serverConfig,
        activitiesDirectory,
        this.serverConfig.mongoConnectionString
      );
    }
  }
}

function getAbsolutePath(dir, serverRoot) {
  if (!path.isAbsolute(dir)) {
    if (!serverRoot) {
      return undefined;
    } else {
      const result = path.resolve(path.join(serverRoot, dir));
      if (path.isAbsolute(result)) {
        return result;
      } else {
        return undefined;
      }
    }
  }
  return dir;
}
