const NodeCache = require('node-cache')
let cacheInstance

export function createCache (options) {
  if (!options) {
    options = {
      stdTTL: 60,
      checkperiod: 120,
      errorOnMissing: false,
      useClones: true
    }
  }
  cacheInstance = new NodeCache(options)
}

function validateCache () {
  if (!cacheInstance) {
    throw new Error('Must call createCache before getting/setting values in cache')
  }
}

export function cacheGet (key) {
  validateCache()

  return new Promise((resolve, reject) => {
    resolve(cacheInstance.get(key))
  })
}

export function cacheSet (key, val, ttl) {
  validateCache()

  return new Promise((resolve, reject) => {
    try {
      cacheInstance.set(key, val, ttl, (err, success) => {
        if (err) {
          reject(err)
        } else {
          resolve(true)
        }
      })
    } catch (err) {
      reject(err)
    }
  })
}
