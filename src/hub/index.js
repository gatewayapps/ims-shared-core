'use strict'
const HubDatabase = require('./db')
const HubError = require('./HubError')
const TreeHelper = require('../lib/TreeHelper')
const treeService = require('./services/treeService')

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
    console.log('Refreshing parent nodes')
    return treeService.getParentsObject(this.db).then((nodeParents) => {
      TreeHelper.setNodeParents(nodeParents)
      console.log('Parent nodes refreshed')
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
