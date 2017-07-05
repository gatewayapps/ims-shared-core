import fetch from 'isomorphic-fetch'
import createSignature from './createSignature'
import Constants from '../lib/constants'
import { isLoggerCreated, default as logger } from '../logger'

let HUB_PACKAGE_UPDATE_INTERVAL
const HUB_UPDATE_MAX_ATTEMPTS = 5

let hubAttempt = 0

export default function hubPackageUpdate (hubUrl, packageSecret, imsConfig) {
  return new Promise((resolve, reject) => {
    HUB_PACKAGE_UPDATE_INTERVAL = setInterval(() => {
      if (hubAttempt++ > HUB_UPDATE_MAX_ATTEMPTS) {
        clearInterval(HUB_PACKAGE_UPDATE_INTERVAL)
        reject(new Error('Failed to update package in hub.  Too many attempts.'))
      } else {
        attemptPackageUpdate(resolve, reject, hubUrl, packageSecret, imsConfig)
      }
    }, 10000)
  })
}

function attemptPackageUpdate (resolve, reject, hubUrl, packageSecret, imsConfig) {
  try {
    if (isLoggerCreated()) {
      logger.debug(`Attempting package update in hub.  Attempt: #${hubAttempt}`)
    }
    const payloadSignature = createSignature(imsConfig, packageSecret)
    const postData = {
      data: imsConfig,
      signature: payloadSignature
    }
    const requestOptions = {
      headers: {
        [Constants.RequestHeaders.PackageId]: imsConfig.packageId,
        'content-type': 'application/json',
        'accept': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(postData)
    }

    fetch(`${hubUrl}/api/package/metadata`, requestOptions)
      .then((response) => response.json())
      .then((jsonResponse) => {
        if (jsonResponse.success !== true) {
          throw new Error(jsonResponse.message || 'Unexpected response sending package metadata to hub')
        }
        clearInterval(HUB_PACKAGE_UPDATE_INTERVAL)
        if (isLoggerCreated()) {
          logger.debug(`Package succesfully updated.`)
        }
        resolve(true)
      }).catch((err) => {
        if (isLoggerCreated()) {
          logger.error(err)
        }
      })
  } catch (e) {
    reject(e)
  }
}
