"use strict";
module.exports = {
  isNodeDescendantOf,
  removeNodeParent,
  setNodeParent,
  setNodeParents,
};

function isNodeDescendantOf(testParent, node) {
  // if global.nodeParents does not exist we cannot check for descendants
  if (global.nodeParents !== undefined && typeof global.nodeParents !== 'object') {
    return false;
  }

  // if the node we are checking matches the parent we are checking it is a descendant
  if (node == testParent) {
    return true;
  }

  let currNode = node;
  let isDescendant = false;

  do {
    const parent = global.nodeParents[`${currNode}`];
    if (parent == testParent) {
      isDescendant = true;
    }
    currNode = parent;
  }
  while(!isDescendant && currNode != undefined && currNode >= 0);
  
  return isDescendant;
}

function removeNodeParent(nodeId) {
  if (global.nodeParents && global.nodeParents[nodeId.toString()]) {
    delete global.nodeParents[nodeId.toString()];
  }
}

function setNodeParent(nodeId, parent) {
  if (!global.nodeParents) {
    global.nodeParents = {};
  }
  global.nodeParents[nodeId.toString()] = parent; 
}

function setNodeParents(nodeParents) {
  global.nodeParents = nodeParents;
}