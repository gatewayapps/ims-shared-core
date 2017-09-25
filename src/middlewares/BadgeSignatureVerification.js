import crypto from 'crypto'
import { getUserAccountDetails } from './UserAccountDetails'
import { cacheGet, cacheSet } from '../utils/cache'
const PermissionHandler = require('../lib/PermissionHandler')
import request from '../utils/request'
const BADGE_SIGNATURE_EXPIRATION_MILLISECONDS = 3600000 // 30 minutes * 60 seconds * 1,000 milliseconds
export default function createBadgeMiddleware (config) {
  const permissionHelper = new PermissionHandler({ package: { id: config.packageId } })
  return function validateSignature (req, res, next) {
    const userAccountId = req.query.userAccountId
    const ts = parseInt(req.query.ts)
    const sig = req.query.sig

    const now = new Date().getTime()
    if (now - ts < BADGE_SIGNATURE_EXPIRATION_MILLISECONDS) {
      const hash = crypto.createHmac('sha256', config.secret).update(`userAccountId=${userAccountId}&ts=${ts}`).digest('hex')
      if (hash === sig) {
        return getUserAccountDetails(parseInt(userAccountId)).then((details) => {
          return getUserClaims(userAccountId).then((claims) => {
            req.context = {
              permissions: permissionHelper.createPermissionsArrayFromStringsArray(claims),
              userAccountId: userAccountId,
              details: details
            }

            next()
          })
        })
      } else {
        res.json({ success: false, reason: 'Signature does not match' }).send()
      }
    } else {
      res.json({ success: false, reason: 'Signature has expired' }).send()
    }
  }
}

function getUserClaims (userAccountId) {
  return (cacheGet(`claims:${userAccountId}`)).then((claims) => {
    if (claims) {
      return claims
    } else {
      return request('/api/packages/ims.packages.training/claims/1', { packageId: 'ims.core.administration' }).then((result) => {
        return cacheSet(`claims:${userAccountId}`, result.claims).then(() => {
          return result.claims
        })
      }).catch((err) => {
        console.log(err)
      })
    }
  })
}
