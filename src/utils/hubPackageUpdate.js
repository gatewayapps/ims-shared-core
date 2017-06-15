import fetch from 'isomorphic-fetch'
import signData from './signData'
import Constants from '../lib/constants'

export default function hubPackageUpdate (hubUrl, packageSecret, imsConfig) {
  try {
    const payloadSignature = signData(imsConfig, packageSecret)
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

    return fetch(`${hubUrl}/api/package/metadata`, requestOptions)
      .then((response) => response.json())
      .then((jsonResponse) => {
        if (jsonResponse.success !== true) {
          throw new Error(jsonResponse.message || 'Unexpected response sending package metadata to hub')
        }
        return true
      })
  } catch (e) {
    return Promise.reject(e)
  }
}
