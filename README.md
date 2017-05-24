# ims-shared-core
Core library for IMS projects

## Notifications

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
### Sending Notifications

#### Queue Notifications for User Accounts
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
  * attachments - array of attachment objects to include in the notification with following structures
    * filename: name of the attachment including file extension that will be used in the notification. Ex: 'MyFile.pdf'
    * content: ```Buffer``` of the attachment file data
* callback - optional callback with parameters (err, notificationId)

```js
import { queueNotification } from 'ims-shared-core/notifications'

queueNotification(userAccountIds, type, body)
  .then((notificationId) => {
    console.log(notificationId)
  })
```

#### Queue Notifications for Nodes
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
  * attachments - array of attachment objects to include in the notification with following structures
    * filename: name of the attachment including file extension that will be used in the notification. Ex: 'MyFile.pdf'
    * content: ```Buffer``` of the attachment file data
* callback - optional callback with parameters (err, notificationId)

```js
import { queueNotificationForNodes } from 'ims-shared-core/notifications'

queueNotificationForNodes(nodeIds, type, body)
  .then((notificationId) => {
    console.log(notificationId)
  })
```

#### Queue Notifications for Permission
Import the queueNotificationForPermission method from ims-shared-core/notifications.

queueNotificationForPermission(permission, roleId, nodeIds, type, body[, callback]) => Promise(notificationId)

* **permission** - The permission held by a user(s) you wish to receive the notificaiton.
* **roleId** - The roleId of the permission held by a user(s) you wish to receive the notificaiton.
* **nodesIds** - array of nodeIds. The process will lookup the UserAccounts for which users within their scope will receive the notification.
* **type** - notification type (in future will be used for determining notification preferences)
* **body**
  * **subject**
  * **longContent** - email body
  * sendAt - date of when to send the notification useful for scheduling future notifications
  * shortContent - for future use with text notifications
  * from - object to override where the email comes from
    * name - display name in from address defaults to "IMS"
    * address - from email address defaults to "noreply@mail.ims.gateway"
  * attachments - array of attachment objects to include in the notification with following structures
    * filename: name of the attachment including file extension that will be used in the notification. Ex: 'MyFile.pdf'
    * content: ```Buffer``` of the attachment file data
* callback - optional callback with parameters (err, notificationId)

```js
import { queueNotificationForPermission } from 'ims-shared-core/notifications'

queueNotificationForPermission('can-receive-approval-emails', 'admin', nodeIds, type, body)
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

### Notification Status Updates
When a notification is sent or fails to send, a request is sent to the package that scheduled the notification over web sockets. The package can listen for these and handle the change of status as needed.

#### Notification Sent
Sent after a notification has successfully been sent.

* payload
  * type: 'NOTIFICATION_SENT'
  * notificationId
  * rejectedUsers - [userAccountIds]
    * These users did not receive the notificaiton usually due to missing or bad email addresses

#### Notification Failed
The service attempts to send a notification four times. On the fourth failed attempt, the notifcation is consided "poisoned" and no further attempts to deliver the notification will be made.

* payload
  * type: 'NOTIFICATION_FAILED'
  * notificationId

## ImageCache Middleware
Middleware for resizing and storing cached resized versions of images.

### Setup
The import returns a function that generates an Express middleware function to handling image resize and caching.

ImageCache(options) => function (req, res, next)

* **options**
  * cacheDir - full path to location to store cached image files defaults to os.tmpdir() + '/ims-cache'
  * debugLogger - function to use when logging debug output default does not log anything
    * Signature: function ([data][,...args])
  * errorLogger - function to use when logging error output default to console.error
    * Signature: function ([data][,...args])
  * **getRawStream** - function to load the stream of an image that is not in the cache
    * Signature: function (imageId) => Promise<Stream>
  * reqIdParam - path parameter name of image id defaults to 'id'

```js
import { ImageCache } from 'ims-shared-core/dist/middlewares'
import logger from 'ims-shared-core/logger'
import attachmentService from './services/attachment'

// logic to create Express app

app.get('/api/images/:id', ImageCache({
  cacheDir: '/path/to/store/cached/images',
  debugLogger: logger.debug,
  errorLogger: logger.error,
  getRawStream: attachmentService.getStream
}))
```

### Requesting Images
To request images from the cache use the path defined when looking up the middleware in your server. Size constraints are passed as query string arguments to the request. Images are resized 

* Query string arguments
  * h - maximum height for the image
  * w - maximum width for the image

Examples:

* Request an image at the original size
  * ```/api/images/A5E4C39F-3BCF-438F-9D5B-DD6A52FDA6AC```
* Request an image with a maximum width of 500px
  * ```/api/images/A5E4C39F-3BCF-438F-9D5B-DD6A52FDA6AC?w=500```
* Request an image with a maximum height of 300px
  * ```/api/images/A5E4C39F-3BCF-438F-9D5B-DD6A52FDA6AC?h=300```
* Request an image with a maximum height of 300px and maximum width of 500px
  * ```/api/images/A5E4C39F-3BCF-438F-9D5B-DD6A52FDA6AC?h=300&w=500```
