'use strict'
const HubDatabase = require('./db')
const HubError = require('./HubError')
const TreeHelper = require('../lib/TreeHelper')
const treeService = require('./services/treeService')

const userService = require('./services/userService')

class Hub {
  constructor () {
    this.db = undefined
  }

  init (config) {
    this.db = new HubDatabase(config)
  }

  _isInitialized () {
    if (this.db instanceof HubDatabase) { return true }

    return false
  }

  getUserAccount (userAccountId) {
    if (!this._isInitialized()) {
      throw new HubError('Hub has not been initialized.')
    }

    return userService.getUserAccount(this.db, userAccountId)
  }
  getUserAccounts (userAccountIds) {
    if (!this._isInitialized()) {
      throw new HubError('Hub has not been initialized.')
    }
    return userService.getUserAccounts(this.db, userAccountIds)
  }

  getUserAccountsByTag (tag, ancestorNodeIds) {
    if (!this._isInitialized()) {
      throw new HubError('Hub has not been initialized.')
    }

    return userService.getUserAccountsByTag(this.db, tag, ancestorNodeIds)
  }

  getDescendantEquipment (nodes, options) {
    if (!this._isInitialized()) {
      throw new HubError('Hub has not been initialized.')
    }

    return treeService.getDescendantEquipment(this.db, nodes, options)
  }

  getDescendantUserAccounts (nodes, options) {
    if (!this._isInitialized()) {
      throw new HubError('Hub has not been initialized.')
    }

    return treeService.getDescendantUserAccounts(this.db, nodes, options)
  }

  refreshParentNodes () {
    return treeService.getParentsObject(this.db).then((nodeParents) => {
      if (nodeParents) {
        TreeHelper.setNodeParents(nodeParents)
      }
    }).catch((err) => {
      console.error(err)
    })
  }

  getStructuredTree (treeName) {
    if (!this._isInitialized()) {
      throw new HubError('Hub has not been initialized.')
    }

    return treeService.getStructuredTree(this.db, treeName)
  }
}

module.exports = new Hub()
