import Promise from 'bluebird'
import fs from 'fs-extra'
import gm from 'gm'
import os from 'os'
import path from 'path'

let _errorLogger = console.error
let _debugLogger = () => { }

export default function ImageCacheMiddleware (options = {}) {
  if (typeof options.getRawStream !== 'function') {
    throw new TypeError(`options.getRawStream must be a function`)
  }

  if (!options.cacheDir) {
    options.cacheDir = path.join(os.tmpdir(), 'ims-cache')
  }

  if (typeof options.debugLogger === 'function') {
    _debugLogger = options.debugLogger
  }

  if (typeof options.errorLogger === 'function') {
    _errorLogger = options.errorLogger
  }

  if (!options.reqIdParam) {
    options.reqIdParam = 'id'
  }

  fs.ensureDirSync(options.cacheDir)

  return (req, res, next) => {
    const handleError = errorHandler(res)

    try {
      const imageId = req.params[options.reqIdParam].toUpperCase()

      const imageOptions = parseImageOptions(req.query)

      _debugLogger(`Got image options of: ${JSON.stringify(imageOptions)}`)

      const imageCacheDir = path.resolve(path.join(options.cacheDir, imageId))
      const imageFilename = getImageFilename(imageId, imageOptions)

      _debugLogger(`Checking cache for ${imageFilename} in ${imageCacheDir}`)
      return findCachedImage(imageCacheDir, imageFilename)
        .then((cachedFilePath) => {
          if (cachedFilePath) {
            _debugLogger(`Sending cached file`)
            return res.sendFile(cachedFilePath)
          } else {
            _debugLogger(`Creating new cached version of image ${imageId}`)
            return options.getRawStream(imageId)
              .then((stream) => resizeAndSaveCachedImage(stream, imageCacheDir, imageFilename, imageOptions))
              .then((cachedFilename) => {
                return res.sendFile(cachedFilename)
              })
          }
        })
        .catch(handleError)
    } catch (error) {
      handleError(error)
    }
  }
}

function errorHandler (res) {
  return (error) => {
    _errorLogger(error)
    res.status(400).send(error.message)
  }
}

function parseImageOptions (query) {
  if (typeof query !== 'object') {
    return {}
  }

  return {
    height: query.h > 0 ? query.h : undefined,
    width: query.w > 0 ? query.w : undefined
  }
}

function getImageFilename (imageId, imageOptions) {
  let filename = imageId.toString()

  if (imageOptions.height > 0) {
    filename += `_h${imageOptions.height}`
  }

  if (imageOptions.width > 0) {
    filename += `_w${imageOptions.width}`
  }

  return filename
}

function findCachedImage (cacheDir, requestedFile) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(cacheDir)) {
      return resolve(false)
    }

    fs.readdir(cacheDir, (err, files) => {
      if (err) {
        return reject(err)
      }

      if (files.length === 0) {
        return resolve(false)
      } else {
        let cachedFilename = false

        for (let i = 0; i < files.length; i++) {
          const ext = path.extname(files[i])
          const basename = path.basename(files[i], ext)
          if (basename === requestedFile) {
            cachedFilename = path.join(cacheDir, files[i])
            break
          }
        }

        return resolve(cachedFilename)
      }
    })
  })
}

function resizeAndSaveCachedImage (stream, imageCacheDir, imageFilename, imageOptions) {
  return new Promise((resolve, reject) => {
    try {
      fs.ensureDirSync(imageCacheDir)

      _debugLogger('Loading file stream in GraphicsMagick')

      let img = gm(stream)

      return img.format({ bufferStream: true }, (err, format) => {
        if (err) {
          reject(err)
          return
        }

        _debugLogger(`Image file is of type ${format}`)

        const writeFilePath = path.join(imageCacheDir, `${imageFilename}.${format}`)

        if (!imageOptions.height && !imageOptions.width) {
          // just asking for the original image
          return img.write(writeFilePath, (err2) => {
            if (err2) {
              reject(err2)
              return
            }

            resolve(writeFilePath)
          })
        } else {
          // image is being resized
          const height = imageOptions.height || null
          const width = imageOptions.width || null

          _debugLogger(`Resizing image ${imageFilename} to ${width}x${height}`)

          return img.resize(width, height)
            .write(writeFilePath, (err2) => {
              if (err2) {
                reject(err2)
                return
              }

              resolve(writeFilePath)
            })
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}
