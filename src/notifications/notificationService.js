import Promise from 'bludbird';
import HubDatabase from '../hub/db';
import logger from '../logger';

let db;

export function createNotificationService (config) {
  logger.debug('Creating HubDatabase for NotificationService');
  db = new HubDatabase(config.database);
}

export function queueNotification (to, type, body, callback) {
  callback = callback || function () {};

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
      logger.debug(queueItem);
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
    throw new TypeError('to should be a array with at list one value');
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
