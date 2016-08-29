"use strict";

function TreeHelper() {
  this.nodeParents = {};

  this.isNodeDescendantOf = function (testParent, node) {
    // if this.nodeParents does not exist we cannot check for descendants
    if (this.nodeParents !== undefined && typeof this.nodeParents !== 'object') {
      return false;
    }

    // if the node we are checking matches the parent we are checking it is a descendant
    if (node == testParent) {
      return true;
    }

    var currNode = node;
    var isDescendant = false;

    do {
      var parent = this.nodeParents[currNode.toString()];
      if (parent == testParent) {
        isDescendant = true;
      }
      currNode = parent;
    }
    while(!isDescendant && currNode != undefined && currNode >= 0);
    
    return isDescendant;
  }

  this.removeNodeParent = function (nodeId) {
    if (this.nodeParents && this.nodeParents[nodeId.toString()]) {
      delete this.nodeParents[nodeId.toString()];
    }
  }

  this.setNodeParent = function (nodeId, parent) {
    if (!this.nodeParents) {
      this.nodeParents = {};
    }
    this.nodeParents[nodeId.toString()] = parent;
  }

  this.setNodeParents = function (nodeParents) {
    this.nodeParents = nodeParents;
  }
}

module.exports = new TreeHelper();