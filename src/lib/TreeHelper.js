'use strict'

function TreeHelper () {
  this.getAncestorsOf = function (nodeId) {
    var parents = []

    var currNode = nodeId
    do {
      parents.unshift(currNode)
      currNode = global.nodeParents[currNode.toString()]
    }
    while (currNode !== undefined && currNode >= 0)

    return parents
  }

  this.isNodeDescendantOf = function (testParent, node) {
    // if global.nodeParents does not exist we cannot check for descendants
    if (global.nodeParents === undefined || typeof global.nodeParents !== 'object') {
      return false
    }

    if (node === '*') {
      return true
    }

    // if the node we are checking matches the parent we are checking it is a descendant
    if (node === testParent) {
      return true
    }

    var currNode = node
    var isDescendant = false

    do {
      var parent = global.nodeParents[currNode.toString()]
      if (parent === testParent) {
        isDescendant = true
      }
      currNode = parent
    }
    while (!isDescendant && currNode !== undefined && currNode >= 0)

    return isDescendant
  }

  this.removeNodeParent = function (nodeId) {
    if (global.nodeParents && global.nodeParents[nodeId.toString()]) {
      delete global.nodeParents[nodeId.toString()]
    }
  }

  this.setNodeParent = function (nodeId, parent) {
    if (!global.nodeParents) {
      global.nodeParents = {}
    }
    global.nodeParents[nodeId.toString()] = parent
  }

  this.setNodeParents = function (nodeParents) {
    global.nodeParents = nodeParents
  }
}

module.exports = new TreeHelper()
