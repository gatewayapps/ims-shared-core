'use strict'
const uuidv4 = require('uuid/v4')
const bb = require('express-busboy')
const path = require('path')
const fs = require('fs')
const mime = require('mime')
const AuthenticationMiddleware = require('./Authentication')
const move = require('../utils/move')
/* options shape
  {
    uploadCallback:  Method to call after an upload is complete,
    errorCallback: Method to call if there is an error during upload
    idGenerator: Method to call to generate a unique id.  By default, we will use node-uuid
  }
*/

const ERROR_NO_FILE_PRESENT = 'Request files was empty or undefined'
const ERROR_FILE_WRITE = 'There was an error writing the file to disk'


module.exports = (app, config, options) => {
  var auth = AuthenticationMiddleware(config)
  bb.extend(app, {
    upload: true
  })
  app.post('/api/upload', auth.defaultMiddleware, (req, res) => {
    //if there's no file, this should error out
    if (!req.files || req.files.length < 1) {
      if (options.errorCallback) {
        options.errorCallback(ERROR_NO_FILE_PRESENT)
      } else {
        res.json({ success: false, message: ERROR_NO_FILE_PRESENT })
      }
    } else {


      var id
      //If options has a generator, use it
      if (options.idGenerator) {
        id = options.idGenerator()
      } else {
        //Otherwise just a uuidv4
        id = uuidv4()
      }

      //tempPath is where node has stored the file temporarily
      var tempPath = req.files.file.file
      //Get filename from temp path
      var fileName = path.basename(tempPath)
      //The final location of the uploaded file.  This gets passed to callback
      var finalPath = generateLocalPath(config, id, fileName)
      //Get the mime type
      var mimeType = mime.lookup(tempPath)

      //Move the file to it's new location
      move(tempPath, finalPath).then((err) => {
        if (err) {
          if (options.errorCallback) {
            options.errorCallback(ERROR_FILE_WRITE)
          } else {
            res.json({ success: false, message: ERROR_FILE_WRITE })
          }
        } else {
          const stats = fs.statSync(finalPath)
          options.uploadCallback(req, res, {
            path: finalPath,
            id: id,
            mimeType: mimeType,
            size: stats['size']
          })

          //The move didn't fail, so we are done here.  

        }
      })
    }
  })
}


function generateLocalPath(config, id, fileName) {
  return path.join(config.fileStoragePath, 'uploads', `${id}-${fileName}`)
}