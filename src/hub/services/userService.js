import { QueryTypes } from 'sequelize'
import { parseTag } from '../helpers/tags'

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

export function getUserAccountsByTag (db, tag, ancestorNodeIds) {
  const tagObj = parseTag(tag)

  if (!Array.isArray(ancestorNodeIds)) {
    ancestorNodeIds = []
  }

  const where = []
  const replacements = {}

  let subQuery = `SELECT 1 FROM [dbo].[v_UserAccountTags] uat`

  where.push('uat.userAccountId = ua.userAccountId')

  where.push('uat.packageId = :packageId')
  replacements.packageId = tagObj.packageId

  where.push('uat.tagId = :tagId')
  replacements.tagId = tagObj.tagId

  if (ancestorNodeIds.length > 0) {
    where.push(`EXISTS (SELECT 1 FROM [dbo].[NodeClosures] nc
      WHERE nc.descendant = uat.nodeId AND nc.isDeleted = 0 AND nc.ancestor IN (:ancestors))`)
    replacements.ancestors = ancestorNodeIds
  }

  subQuery += ' WHERE ' + where.join(' AND ')

  const query = `SELECT * FROM [dbo].[v_UserAccounts] ua WHERE EXISTS (${subQuery})`

  return db.context.query(query, {
    type: QueryTypes.SELECT,
    replacements: replacements
  })
}
