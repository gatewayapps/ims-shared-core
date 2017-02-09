# ims-shared-core
Core library for IMS projects

## Queuing Notifications

### Setup
In the main startup, create the notification service using the config for your app. This should be done after createing the logger instance.

createNotificationService(config[, options])

* **config** - IMS configuration object
* options
  * log - function to be used print log messages inside the notificationService

```js
import imsConfig from './config'
import {
  createLogger,
  default as logger
} from 'ims-shared-core/logger'
import { createNotificationService } from 'ims-shared-core/notifications'

createLogger(imsConfig)
createNotificationService(imsConfig, { log: logger.debug })
```

### Queue Notifications for User Accounts
Import the queueNotification method from ims-shared-core/notifications.

queueNotification(to, type, body[, callback]) => Promise(notificationId)

* **to** - array of userAccountIds
* **type** - notification type (in future will be used for determining notification preferences)
* **body**
  * **subject**
  * **longContent** - email body
  * sendAt - date of when to send the notification useful for scheduling future notifications
  * shortContent - for future use with text notifications
  * from - object to override where the email comes from
    * name - display name in from address defaults to "IMS"
    * address - from email address defaults to "noreply@mail.ims.gateway"
* callback - optional callback with parameters (err, notificationId)

```js
import { queueNotification } from 'ims-shared-core/notifications'

queueNotification(userAccountIds, type, body)
  .then((notificationId) => {
    console.log(notificationId)
  })
```

### Queue Notifications for Nodes
Import the queueNotificationForNodes method from ims-shared-core/notifications.

queueNotificationForNodes(nodes, type, body[, callback]) => Promise(notificationId)

* **nodes** - array of nodeIds. The process will lookup the UserAccounts under the nodes.
* **type** - notification type (in future will be used for determining notification preferences)
* **body**
  * **subject**
  * **longContent** - email body
  * sendAt - date of when to send the notification useful for scheduling future notifications
  * shortContent - for future use with text notifications
  * from - object to override where the email comes from
    * name - display name in from address defaults to "IMS"
    * address - from email address defaults to "noreply@mail.ims.gateway"
* callback - optional callback with parameters (err, notificationId)

```js
import { queueNotificationForNodes } from 'ims-shared-core/notifications'

queueNotificationForNodes(nodeIds, type, body)
  .then((notificationId) => {
    console.log(notificationId)
  })
```

### Delete Queued Notification
Useful for removing a scheduled future notification before it is sent. Import deleteNotification from ims-shared-core/notifications.

deleteNotification(notificationId[, callback]) => Promise(bool)

* **notificationId**
* callback - optional callback function with parameters (err, success)

```js
import { deleteNotification } from 'ims-shared-core/notifications'

deleteNotification(notificationId)
  .then((success) => {
    console.log(success)
  })
```
