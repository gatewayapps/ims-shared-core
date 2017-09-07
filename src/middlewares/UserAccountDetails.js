import { cacheGet, cacheSet } from '../utils/cache'
import { default as request } from '../utils/request'

export function getUserAccountDetails (userAccountId) {
  return cacheGet(`user:${userAccountId}`).then((details) => {
    if (details) {
      return details
    } else {
      return request(`/api/users/${userAccountId}/full`, { packageId: 'ims.core.administration' }).then((userDetails) => {
        if (userDetails && userDetails.success) {
          return cacheSet(`user:${userAccountId}`, userDetails.userAccount, 300).then(() => {
            return userDetails.userAccount
          })
        } else {
          return undefined
        }
      })
    }
  })
}
