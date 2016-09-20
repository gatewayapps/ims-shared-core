"use strict";
module.exports = {
  sortNodes,
  sortByRank,
  sortByName,
}

function sortNodes(a, b) {
  // First, sort by nodeDetailType
  //  1 = Branches
  //  2 = User Account
  //  3 = Equipment
  const nodeDetailTypeDiff = a.nodeDetailTypeId - b.nodeDetailTypeId;
  if (nodeDetailTypeDiff != 0) {
    return nodeDetailTypeDiff;
  }

  // Second, sort by the ranks if nodeDetailType is not User Account (2)
  // Or by name for User Accounts
  if (a.nodeDetailTypeId == 2) {
    return sortByName(a, b);
  }
  else {
    return sortByRank(a, b);
  }
}

function sortByRank(a, b) {
  return a.rank - b.rank;
}

function sortByName(a, b) {
  const nameA = a.name.toUpperCase();
  const nameB = b.name.toUpperCase();

  if (nameA < nameB) {
    return -1;
  }
  else if (nameA > nameB) {
    return 1;
  }

  // names must be equal
  return 0;
}