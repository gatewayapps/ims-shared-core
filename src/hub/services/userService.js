
export function getUserAccount (db, userAccountId) {
  return db.UserAccount.findOne({
    where: {
      userAccountId: userAccountId
    },
    raw: true
  })
}

export function getUserAccounts (db, userAccountIds) {
  return db.UserAccount.find({
    where: {
      userAccountId: {
        $in: userAccountIds
      }
    },
    raw: true
  })
}
