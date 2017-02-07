import Promise from 'bluebird';
import Sequelize from 'sequelize';
import HubDatabase from '../hub/db';
import logger from '../logger';

let db;

export function createNotificationService (config) {
  logger.debug('Creating HubDatabase for NotificationService');
  db = new HubDatabase(config.database);
}

export function deleteNotification (notificationId, callback) {
  callback = wrapCallback(callback)

  const deleteCmd = 'EXECUTE [dbo].[usp_DeleteQueuedNotification] @i_notificationId = :notificationId'
  return db.context.query(deleteCmd, {
    replacements: {
      notificationId: notificationId
    },
    type: Sequelize.QueryTypes.SELECT
  }).then((results) => {
    if (results.length > 0) {
      const result = results[0];
      if (result.affected > 0) {
        callback(null, true);
        return true;
      }
    }

    // If it gets here then results is empty or 0 was affected
    const error = new Error('Notification does not exist or has already been sent.')
    error.notificationId = notificationId;
    throw error;
  }).catch((error) => {
    logger.debug({ err: error })
    callback(error);
    throw error;
  });
}

export function queueNotificationForNodes (nodes, type, body, callback) {
  // This local cb function is here to prevent a case where if the callback
  // could get called twice should the error happen inside the queueNotification
  // function that is called after finding userAccounts under the nodes.
  let callbackCount = 0;
  const cb = function (err, notificationId) {
    if (callbackCount === 0) {
      const local = wrapCallback(callback);
      local(err, notificationId)
      callbackCount++;
    }
  };

  if (!Array.isArray(nodes) || nodes.length === 0) {
    const error = new TypeError('nodes should be an array with at least one value');
    cb(error);
    Promise.reject(error);
  }

  let query = `SELECT v.userAccountId FROM [dbo].[v_UserAccounts] v
    WHERE EXISTS (SELECT 1 FROM [dbo].[NodeClosures] nc WHERE nc.descendant = v.nodeId
      AND nc.isDeleted = 0 AND nc.ancestor IN (:include))`;
  
  return db.context.query(query, {
    replacements: {
      include: nodes
    },
    type: Sequelize.QueryTypes.SELECT
  }).then((userAccounts) => {
    const to = usersAccounts.map((u) => u.userAccountId);
    return queueNotification(to, type, body, cb);
  }).catch((error) => {
    cb(error);
    throw error;
  });
}

export function queueNotification (to, type, body, callback) {
  callback = wrapCallback(callback)

  try {
    validateNotification(to, type, body);

    const notification = Object.assign({}, body, {
      to: to,
      type: type
    });

    const sendDate = body.sendAt || Date.now();

    logger.debug('Creating item in Notification Queue');

    return db.NotificationQueue.create({
      stateId: 1, // Queued
      sendDate: sendDate,
      message: JSON.stringify(notification)
    }).then((queueItem) => {
      logger.debug(queueItem.toJSON());
      callback(null, queueItem.notificationId);
      return queueItem.notificationId;
    }).catch((error) => {
      logger.error({ err: error });
      callback(error);
      throw error;
    });
  } catch (e) {
    callback(e);
    return Promise.reject(e);
  } 
}

function validateNotification (to, type, body) {
  logger.debug('Validating notification: ', { to: to, type: type, body: body });
  if (!Array.isArray(to) || to.length === 0) {
    throw new TypeError('to should be an array with at list one value');
  }

  if (typeof type !== 'string' || type.length === 0) {
    throw new TypeError('type is a required string');
  }

  if (typeof body !== 'object') {
    throw new TypeError('body should be an object');
  }

  if (typeof body.packageId !== 'string' || body.packageId.length === 0) {
    throw new TypeError('body.packageId is a required string');
  }

  if (typeof body.subject !== 'string' || body.subject.length === 0) {
    throw new TypeError('body.subject is a required string');
  }

  if (typeof body.longContent !== 'string' || body.longContent === 0) {
    throw new TypeError('body.longContent is a required string');
  }
}

function wrapCallback (callback) {
  if (typeof callback !== 'function') {
    return function () {};
  } else {
    return callback;
  }
}
