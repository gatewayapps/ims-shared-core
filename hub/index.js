"use strict";
const HubDatabase = require('./db');
const HubError = require('./HubError');
const treeService = require('./services/treeService');

class Hub {
  constructor() {
    this.db = undefined;
  }

  init(config) {
    this.db = new HubDatabase(config); 
  }

  _isInitialized() {
    if (this.db instanceof HubDatabase)
      return true;

    return false;
  }

  getStructuredTree(treeName) {
    if (!this._isInitialized()) {
      throw new HubError('Hub has not been initialized.');
    }

    return treeService.getStructuredTree(this.db, treeName);
  }
}

module.exports = new Hub();