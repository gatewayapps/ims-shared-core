const fs = require('fs')
const Promise = require('bluebird')

module.exports = Promise.promisify(move)

// A move() function that renames, if possible, or falls back to copying
function move (oldPath, newPath, callback) {
  fs.rename(oldPath, newPath, function (err) {
    if (err) {
      if (err.code === 'EXDEV') {
        copy()
      } else {
        callback(err)
      }
      return
    }
    callback()
  })

  function copy () {
    var readStream = fs.createReadStream(oldPath)
    var writeStream = fs.createWriteStream(newPath)

    readStream.on('error', callback)
    writeStream.on('error', callback)

    readStream.on('close', function () {
      fs.unlink(oldPath, callback)
    })

    readStream.pipe(writeStream)
  }
}
