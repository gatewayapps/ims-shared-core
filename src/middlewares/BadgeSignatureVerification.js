import crypto from 'crypto'
import { getUserAccountDetails } from './UserAccountDetails'
const FIVE_MINUTES = 300000 // 5 minutes * 60 seconds * 1,000 milliseconds
export default function createBadgeMiddleware (config) {
  return function validateSignature (req, res, next) {
    const userAccountId = req.query.userAccountId
    const ts = parseInt(req.query.ts)
    const sig = req.query.sign

    const now = new Date().getTime()
    if (now - ts < FIVE_MINUTES) {
      const hash = crypto.createHmac('sha256', config.secret).update(`userAccountId=${userAccountId}&ts=${ts}`).digest('hex')
      if (hash === sig) {
        return getUserAccountDetails(parseInt(userAccountId)).then((details) => {
          req.context = details
          next()
        })
      } else {
        throw new Error('Signature does not match')
      }
    } else {
      throw new Error('Signature has expired')
    }
  }
}
