import fs from 'fs'
import request from 'request'
const Constants = require('../lib/constants')
const PACKAGE_MIGRATION_ENDPOINT = '/api/package/migrations'

export default function uploadMigrationFile (migrationFile, imsPackage, replacements) {
  return new Promise((resolve, reject) => {
    try {
      const fileStream = fs.createReadStream(migrationFile)
      const formData = {
        file: {
          value: fileStream,
          options: {
            filename: 'migration.zip'
          }
        },
        replacements: JSON.stringify(replacements)
      }

      const url = `${imsPackage.hubUrl}${PACKAGE_MIGRATION_ENDPOINT}`.replace('//', '/').replace(':/', '://')
      const headers = {}
      headers[Constants.RequestHeaders.PackageId] = imsPackage.packageId
      headers[Constants.RequestHeaders.PackageSecret] = imsPackage.secret
      request.post({ url: url, formData: formData, headers: headers }, (err, response, body) => {
        if (err) {
          reject(err)
        } else {
          resolve(JSON.parse(body))
        }
      })
    } catch (err) {
      reject(err)
    }
  })
}
