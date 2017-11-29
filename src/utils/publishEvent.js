import { default as request, combineUrlParts } from './request'
import mongojs from 'mongojs'

let mongoClient
let MONGO_CONNECTION_STRING
let HUB_URL
let PACKAGE_ID

let EVENT_VERSION = 1

export function prepareEventPublisher (mongoConnectionString, hubUrl, packageId) {
  MONGO_CONNECTION_STRING = mongoConnectionString
  mongoClient = mongojs(MONGO_CONNECTION_STRING)
  PACKAGE_ID = packageId
  HUB_URL = hubUrl
}
export default function publishEvent (eventType, payload) {
  return new Promise((resolve, reject) => {
    if (!mongoClient || !mongoClient.collection) {
      reject(new Error('You must call prepareEventPublisher before publishing any events.'))
    } else {
      const e = {
        type: eventType,
        payload: payload,
        packageId: PACKAGE_ID,
        processed: false,
        ev: EVENT_VERSION,
        created: new Date()
      }
      console.log('Publishing event', e)
      mongoClient.collection('PackageEvents').insert(e, (err, result) => {
        if (err) {
          reject(err)
        } else {
          console.log('event published', result)
          const url = combineUrlParts(HUB_URL, `/api/core/events/${result._id}`)
          request(url, { method:'POST', authenticate: false })
          resolve(true)
        }
      })
    }
  })
}
