import express from "express";
import path from "path";
import { scheduleTasks } from "../utils/taskScheduler";

import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import Api from "./api";
import { createCache } from "../utils/cache";

import { createLogger, default as logger } from "../logger";
import { createNotificationService } from "../notifications/notificationService";
import { createSettingService } from "../hub/services/settingService";
import { prepareRequest } from "../utils";

const COOKIE_EXPIRY = 2147483647;

/*
  Options
  - onFileUploadRequest : (req,res,next)
  - onFileDownloadRequest: (req, res, next)
  - onGetRawStreamRequest: (id)
  - onBadgesRequest: (userContext) => Promise<number>
  - onUnhandledException: (err)
  - disableIndexRewrite: boolean = false

  - contractsDirectory: path to contracts folder that contains implementation for contracts
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
  constructor(serverConfig, packageDef, options) {
    this.serverConfig = serverConfig;
    this.packageDef = packageDef;
    this.options = options;
    this.onUnhandledException = options.onUnhandledException;

    // Create logger and notification service
    createCache(options.cacheOptions);
    createLogger(serverConfig);
    createNotificationService(serverConfig);
    createSettingService(serverConfig);

    // To handle packages that don't provide serverRoot in serverConfig
    const oldProcessCWD = path.join(process.cwd(), "dist/server");

    scheduleTasks(packageDef.tasks, serverConfig.serverRoot || oldProcessCWD);
    // wire up exception handling
    process.on("uncaughtException", this.handleException);

    this.handleException = this.handleException.bind(this);
  }

  handleException(err) {
    if (err) {
      if (this.onUnhandledException) {
        this.onUnhandledException(err);
      }
      logger.error(err);
      process.exit(1);
    }
  }

  start() {
    const app = express();

    app.use(cookieParser());
    app.use(compression());
    const corsOptions = {
      optionsSuccessStatus: 200,
    };
    app.use(cors(corsOptions));
    if (process.env.NODE_ENV === "development") {
      logger.trace(
        "In development mode, so adding middleware to add HUB_URL to cookies"
      );
      app.use((req, res, next) => {
        res.cookie("HUB_URL", this.serverConfig.hubUrl, {
          maxAge: COOKIE_EXPIRY,
        });
        return next();
      });
    }

    app.get("/authenticate", this.processAuthenticationRequest.bind(this));

    const api = new Api(
      this.serverConfig,
      this.options.middlewares,
      {
        onFileUploadRequest: this.options.onFileUploadRequest,
        onFileDownloadRequest:
          this.options.onFileDownloadRequest ||
          this.defaultFileDownloadRequestHandler,
        onGetRawStreamRequest:
          this.options.onGetRawStreamRequest || this.defaultGetRawStreamHandler,
        onBadgesRequest:
          this.options.onBadgesRequest || this.defaultBadgesRequestHandler,
      },
      this.handleException,
      this.options.contractsDirectory,
      this.options.activitiesDirectory
    );

    api.createApp((err, apiApp) => {
      if (err) {
        this.handleException(err);
      } else {
        app.use(apiApp);

        if (!this.options.disableIndexRewrite) {
          app.use(require("connect-history-api-fallback")());
        }

        this.options.onInitialized(null, app);

        prepareRequest(
          this.serverConfig.hubUrl,
          this.serverConfig.secret,
          this.packageDef
        );
      }
    });
  }

  defaultBadgesRequestHandler(req, res, next) {
    res.json({ success: false, reason: "Not Implemented" });
  }
  defaultFileDownloadRequestHandler(req, res, next) {
    res.status(404).send();
  }
  defaultGetRawStreamHandler(req, res) {
    return Promise.reject(new Error("Get raw stream handler not defined"));
  }

  processAuthenticationRequest(req, res, next) {
    res.redirect(req.query.return || "/");
    res.send();
  }
}
