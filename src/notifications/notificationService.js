import Promise from 'bluebird'
import Sequelize from 'sequelize'
import HubDatabase from '../hub/db'

let _db
let _defaultBody = {}
let _logger = function () {}
let _packageId

export function createNotificationService (config, options) {
  options = options || {}

  if (typeof options.log === 'function') {
    _logger = options.log
  }

  _packageId = config.packageId

  _defaultBody = {
    packageId: config.packageId
  }

  _logger('Creating HubDatabase for NotificationService')
  _db = new HubDatabase(config.database)
}

export function deleteNotification (notificationId, callback) {
  callback = wrapCallback(callback)

  const deleteCmd = 'EXECUTE [dbo].[usp_DeleteQueuedNotification] @i_notificationId = :notificationId'
  return _db.context.query(deleteCmd, {
    replacements: {
      notificationId: notificationId
    },
    type: Sequelize.QueryTypes.SELECT
  }).then((results) => {
    if (results.length > 0) {
      const result = results[0]
      if (result.affected > 0) {
        callback(null, true)
        return true
      }
    }

    // If it gets here then results is empty or 0 was affected
    const error = new Error('Notification does not exist or has already been sent.')
    error.notificationId = notificationId
    throw error
  }).catch((error) => {
    _logger(`Error: ${JSON.stringify(error)}`)
    callback(error)
    throw error
  })
}

export function deleteNotifications (notificationIds, callback) {
  callback = wrapCallback(callback)
  return _db.NotificationQueue.destroy({
    where: {
      notificationId: {
        $in: notificationIds
      }
    },
    force: true
  }).then((affected) => {
    callback(null, true)
    return true
  }).catch((error) => {
    _logger(`Error: ${JSON.stringify(error)}`)
    callback(error)
    throw error
  })
}

export function queueNotificationForNodes (nodes, type, body, callback) {
  // This local cb function is here to prevent a case where if the callback
  // could get called twice should the error happen inside the queueNotification
  // function that is called after finding userAccounts under the nodes.
  let callbackCount = 0
  const cb = function (err, notificationId) {
    if (callbackCount === 0) {
      const local = wrapCallback(callback)
      local(err, notificationId)
      callbackCount++
    }
  }

  if (!Array.isArray(nodes) || nodes.length === 0) {
    const error = new TypeError('nodes should be an array with at least one value')
    cb(error)
    return Promise.reject(error)
  }

  let query = `SELECT v.userAccountId FROM [dbo].[v_UserAccounts] v
    WHERE EXISTS (SELECT 1 FROM [dbo].[NodeClosures] nc WHERE nc.descendant = v.nodeId
      AND nc.isDeleted = 0 AND nc.ancestor IN (:include))`

  return _db.context.query(query, {
    replacements: {
      include: nodes
    },
    type: Sequelize.QueryTypes.SELECT
  }).then((userAccounts) => {
    const to = userAccounts.map((u) => u.userAccountId)
    return queueNotification(to, type, body, cb)
  }).catch((error) => {
    cb(error)
    throw error
  })
}

export function queueNotificationForPermission (permission, roleId, nodeIds, type, body, callback) {
  // This local cb function is here to prevent a case where if the callback
  // could get called twice should the error happen inside the queueNotification
  // function that is called after finding userAccounts under the nodes.
  let callbackCount = 0
  const cb = function (err, notificationId) {
    if (callbackCount === 0) {
      const local = wrapCallback(callback)
      local(err, notificationId)
      callbackCount++
    }
  }

  if (!permission) {
    const error = new TypeError('permission should be a string with a value matching a corresponding ims permission')
    cb(error)
    return Promise.reject(error)
  }

  if (!roleId) {
    const error = new TypeError('roleId should be a string with a value matching a corresponding ims role, such as admin, super, or user')
    cb(error)
    return Promise.reject(error)
  }

  if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
    const error = new TypeError('nodeIds should be an array with at least one value')
    cb(error)
    return Promise.reject(error)
  }

  const query = 'EXECUTE [dbo].[usp_UserAccountsByPermission] @permission = :permission, @packageId = :packageId, @roleId = :roleId'

  const usersPromise = _db.context.query(query, {
    replacements: {
      permission: permission,
      packageId: _packageId,
      roleId: roleId
    },
    type: Sequelize.QueryTypes.SELECT
  })

  const scopePromise = _db.context.query('SELECT DISTINCT ancestor FROM [dbo].[NodeClosures] WHERE [descendant] IN (:nodeIds)', {
    replacements: {
      nodeIds: nodeIds
    },
    type: Sequelize.QueryTypes.SELECT
  }).then((result) => result.map((u) => u.ancestor))

  return Promise.all([usersPromise, scopePromise])
    .spread((userAccounts, scopes) => {
      const denied = userAccounts.filter((u) => u.deny).map((uid) => uid.userAccountId)
      // get all the users that aren't denied and have the scope of the nodeIds users
      const to = userAccounts.filter((u) => denied.indexOf(u.userAccountId) < 0 && (checkScope(scopes, u.scope) || u.scope === 0)).map((uid) => uid.userAccountId)
      return queueNotification(to, type, body, cb)
    })
}

function checkScope (scopes, scope) {
  for (var i in scopes) {
    if (scopes[i] === scope) {
      return true
    }
  }
  return false
}

export function queueNotification (to, type, body, callback) {
  callback = wrapCallback(callback)

  try {
    body = Object.assign({}, _defaultBody, body)

    validateNotification(to, type, body)

    const notification = Object.assign({}, body, {
      to: to,
      type: type
    })

    const sendDate = body.sendAt || Date.now()

    _logger('Creating item in Notification Queue')

    return _db.NotificationQueue.create({
      stateId: 1, // Queued
      sendDate: sendDate,
      message: JSON.stringify(notification)
    }).then((queueItem) => {
      _logger(queueItem.toJSON())
      callback(null, queueItem.notificationId)
      return queueItem.notificationId
    }).catch((error) => {
      _logger(`Error: ${JSON.stringify(error)}`)
      callback(error)
      throw error
    })
  } catch (e) {
    callback(e)
    return Promise.reject(e)
  }
}

function validateNotification (to, type, body) {
  _logger('Validating notification: ', JSON.stringify({ to: to, type: type, body: body }))
  if (!Array.isArray(to) || to.length === 0) {
    throw new TypeError('to should be an array with at list one value')
  }

  if (typeof type !== 'string' || type.length === 0) {
    throw new TypeError('type is a required string')
  }

  if (typeof body !== 'object') {
    throw new TypeError('body should be an object')
  }

  if (typeof body.packageId !== 'string' || body.packageId.length === 0) {
    throw new TypeError('body.packageId is a required string')
  }

  if (typeof body.subject !== 'string' || body.subject.length === 0) {
    throw new TypeError('body.subject is a required string')
  }

  if (typeof body.longContent !== 'string' || body.longContent === 0) {
    throw new TypeError('body.longContent is a required string')
  }
}

function wrapCallback (callback) {
  if (typeof callback !== 'function') {
    return function () {}
  } else {
    return callback
  }
}
