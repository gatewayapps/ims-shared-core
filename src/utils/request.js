import fetch from 'isomorphic-fetch'
import Constants from '../lib/constants'
import semver from 'semver'
import jwt from 'jsonwebtoken'
let accessTokens = {}
let PackageInformation

export function createRequestHeader (packageId) {
  return {
    'accept': 'application/json',
    'content-type': 'application/json',
    [Constants.RequestHeaders.PackageId]: packageId
  }
}

export function createAuthenticatedRequestHeader (packageId, accessToken) {
  return Object.assign(createRequestHeader(packageId), {
    [Constants.RequestHeaders.Authorization]: `JWT ${accessToken}`
  })
}

export function isPackageAvailable (packageId) {
  return !!accessTokens[packageId]
}

export function prepareRequest (hubUrl, packageSecret, packageInformation) {
  PackageInformation = packageInformation
  if (PackageInformation.packageDependencies) {
    const packageIds = Array.isArray(PackageInformation.packageDependencies)
    ? PackageInformation.packageDependencies
    : Object.keys(PackageInformation.packageDependencies)
    return Promise.all(packageIds.map((p) => {
      const url = combineUrlParts(hubUrl, `packages/${p}/authorize`)
      const headers = {
        [Constants.RequestHeaders.PackageSecret]: packageSecret,
        [Constants.RequestHeaders.PackageId]: PackageInformation.packageId
      }
      return request(url, { authenticate: false, headers }).then((response) => {
        const constraints = Array.isArray(PackageInformation.packageDependencies)
        ? { required: false }
        : PackageInformation.packageDependencies[p]
        handlePackageResponse(p, constraints, response)
      })
    }))
  }
}

function handlePackageResponse (packageId, constraints, response) {
  let verified = false
  let packageInfo
  if (response.success) {
    packageInfo = jwt.decode(response.accessToken)
    if (constraints.version) {
      if (semver.satisfies(packageInfo.targetPackage.version, constraints.version)) {
        verified = true
      } else {
        if (!constraints.required) {
          console.warn(`An access token for ${packageId} was obtained, but the installed version: ${packageInfo.targetPackage.version}
          does not match the requested version: ${constraints.version} and the package may not function as expected.`)
          verified = true
        } else {
          console.error(`An access token for ${packageId} was obtained, but the installed version (${packageInfo.targetPackage.version}) did not match the requested version (${constraints.version}).`)
        }
      }
    } else {
      verified = true
    }
  }
  if (verified) {
    accessTokens[packageId] = {
      url: packageInfo.targetPackage.url,
      packageId:packageId,
      accessToken: response.accessToken.accessToken,
      version: packageInfo.targetPackage.version
    }
  } else {
    if (constraints.required) {
      throw new Error(`An access token for required package ${packageId} could not be obtained.  Please verify ${packageId} is installed.`)
    } else {
      console.log(`Optional package dependency ${packageId} is not installed.`)
    }
  }
}

export default function request (url, options) {
  try {
    verifyInitialized()

    const opts = prepareOptions(options)

    if (opts.authenticate) {
      return makeAuthenticatedRequest(url, opts.requestOptions)
    } else {
      return makeUnauthenticatedRequest(url, opts.requestOptions)
    }
  } catch (e) {
    return Promise.reject(e)
  }
}

function verifyInitialized () {
  return (PackageInformation && PackageInformation.packageId)
}

function combineUrlParts (base, endpoint) {
  if (endpoint.indexOf('/') !== 0) {
    endpoint = '/' + endpoint
  }
  if (base.lastIndexOf('/') === base.length - 1) {
    base = base.substr(0, base.length - 1)
  }
  return `${base}${endpoint}`
}

function getPackage (packageId) {
  return accessTokens[packageId]
}
function getAccessTokenForPackage (packageId) {
  const pkg = getPackage(packageId)
  if (pkg) {
    return pkg.accessToken
  } else {
    console.error('Package not present in accessTokens', accessTokens)
  }
}

function makeAuthenticatedRequest (url, requestOptions) {
  if (requestOptions.packageId) {
    const pkg = getPackage(requestOptions.packageId)
    if (pkg) {
      const accessToken = getAccessTokenForPackage(pkg.packageId)
      requestOptions.headers = createAuthenticatedRequestHeader(requestOptions.packageId, accessToken)
      return makeRequest(combineUrlParts(pkg.url, url), requestOptions)
    } else {
      throw new Error(`Package ${requestOptions.packageId} was not found in ${accessTokens}  Make sure you have added the package to your packageDependencies`)
    }
  }
}
function makeUnauthenticatedRequest (url, requestOptions) {
  return makeRequest(url, requestOptions)
}

function makeRequest (url, requestOptions) {
  return fetch(url, requestOptions).then(parseResponse)
}
export function parseResponse (response) {
  if (!response || response.status >= 500) {
    throw new Error('Response received a server error')
  }
  var contentType = response.headers.get('content-type')
  if (contentType && contentType.indexOf('application/json') !== -1) {
    return response.json()
  } else {
    return response.status === 200
  }
}
function prepareOptions (options = {}) {
  const opts = Object.assign({}, options)

  if (!opts.method) {
    opts.method = 'GET'
  }

  if (!opts.credentials) {
    opts.credentials = 'same-origin'
  }

  if (opts.authenticate === undefined) {
    opts.authenticate = true
  }

  const requestOptions = {
    method: opts.method,
    credentials: opts.credentials,
    packageId: opts.packageId,
    body: opts.body,
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json'
    }
  }
  if (opts.headers) {
    Object.assign(requestOptions.headers, opts.headers)
  }

  if (!opts.requestOptions) {
    opts.requestOptions = requestOptions
  } else {
    opts.requestOptions = Object.assign({}, requestOptions, opts.requestOptions)
  }

  return opts
}
