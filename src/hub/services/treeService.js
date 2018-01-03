'use strict'
const sorting = require('../helpers/sorting')

const TREES = {
  areas: 2,
  organization: 1
}

const NODE_DETAIL_TYPES = {
  Branch: 1,
  UserAccount: 2,
  Equipment: 3
}

module.exports = {
  nodeDetailTypes: NODE_DETAIL_TYPES,
  trees: TREES,
  getDescendantEquipment: getDescendantEquipment,
  getDescendantUserAccounts: getDescendantUserAccounts,
  getParentsObject: getParentsObject,
  getStructuredTree: getStructuredTree
}

function buildDescendantQuery (db, nodes, options) {
  options = options || {}

  const ancestorsWhere = {}

  if (Array.isArray(nodes)) {
    ancestorsWhere.ancestor = {
      $in: nodes
    }
  } else {
    ancestorsWhere.ancestor = nodes
  }

  const queryOptions = {
    include: [
      {
        model: db.Node,
        required: true,
        attributes: [ ],
        include: [
          {
            model: db.NodeClosure,
            as: 'ancestors',
            attributes: [ ],
            where: ancestorsWhere
          }
        ]
      }
    ]
  }

  if (Array.isArray(options.attributes) && options.attributes.length > 0) {
    queryOptions.attributes = options.attributes
  }

  if (Array.isArray(options.order) && options.order.length > 0) {
    queryOptions.order = options.order
  }

  return queryOptions
}

function getDescendantEquipment (db, nodes, options) {
  const queryOptions = buildDescendantQuery(db, nodes, options)

  return db.Equipment.findAll(queryOptions)
}

function getDescendantUserAccounts (db, nodes, options) {
  const queryOptions = buildDescendantQuery(db, nodes, options)

  return db.UserAccount.findAll(queryOptions)
}

function getParentsObject (db) {
  if (db) {
    return db.Node.findAll({
      attributes: [
        'nodeId',
        'parent'
      ]
    })
    .then(nodes => {
      const parentObj = {}

      nodes.forEach(n => {
        parentObj[n.nodeId] = n.parent
      })

      return parentObj
    })
  } else {
    return undefined
  }
}

function getStructuredTree (db, treeNameOrId) {
  let treeId = 0
  if (typeof treeNameOrId === 'string') {
    treeId = TREES[treeNameOrId.toLowerCase()]
  } else if (typeof treeNameOrId === 'number') {
    treeId = treeNameOrId
  }

  return getTreeNodes(db, treeId)
    .then(convertNodesToStructuredTree)
}

function getTreeNodes (db, treeId) {
  const query = {
    where: {
      treeId: treeId
    },
    attributes: [ 'nodeId', 'name', 'nodeDetailTypeId', 'treeId', 'parent', 'rank' ],
    include: [
      {
        model: db.NodeType,
        required: false,
        attributes: [ 'nodeTypeId', 'name' ]
      },
      {
        model: db.Equipment,
        required: false,
        attributes: [ 'equipmentId', 'assetNumber', 'description' ],
        include: [
          {
            model: db.EquipmentType,
            required: false,
            attributes: [ 'equipmentTypeId', 'name' ]
          },
          {
            model: db.Manufacturer,
            required: false,
            attributes: [ 'manufacturerId', 'name' ]
          },
          {
            model: db.Model,
            required: false,
            attributes: [ 'modelId', 'modelNumber' ]
          }
        ]
      },
      {
        model: db.UserAccount,
        required: false,
        attributes: [ 'userAccountId', 'firstName', 'lastName', 'displayName', 'email', 'jobTitle', 'homePhone', 'workPhone', 'cellPhone', 'profileImageUrl' ]
      }
    ]
  }

  return db.Node.findAll(query)
}

function convertNodesToStructuredTree (nodes) {
  if (!Array.isArray(nodes) || nodes.length === 0) { return [] }

  const treeStructure = nodes.filter(n => n.parent === 0)
    .map(serializeTreeNode(nodes))

  return treeStructure
}

function serializeTreeNode (allNodes) {
  return (node) => {
    if (node.nodeDetailTypeId === NODE_DETAIL_TYPES.UserAccount) {
      return serializeUserAccount(node)
    } else if (node.nodeDetailTypeId === NODE_DETAIL_TYPES.Equipment) {
      return serializeEquipment(node)
    } else {
      const children = allNodes
        .filter(n => n.parent === node.nodeId)
        .sort(sorting.sortNodes)
        .map(serializeTreeNode(allNodes))

      return serializeBranch(node, children)
    }
  }
}

function serializeBranch (node, children) {
  return {
    dataType: 'node',
    nodeId: node.nodeId,
    name: node.name,
    nodeDetailTypeId: node.nodeDetailTypeId,
    nodeTypeId: node.nodeType.nodeTypeId,
    nodeTypeName: node.nodeType.name,
    children: children
  }
}

function serializeEquipment (node) {
  const serialized = {
    dataType: 'equipment',
    nodeId: node.nodeId,
    name: node.name,
    nodeDetailTypeId: node.nodeDetailTypeId
  }

  const eq = node.equipment
  if (eq) {
    Object.assign(serialized, {
      equipmentId: eq.equipmentId,
      equipmentTypeId: eq.equipmentType ? eq.equipmentType.equipmentTypeId : null,
      equipmentTypeName: eq.equipmentType ? eq.equipmentType.name : null,
      manufacturerId: eq.manufacturer ? eq.manufacturer.manufacturerId : null,
      manufacturerName: eq.manufacturer ? eq.manufacturer.name : null,
      modelId: eq.model ? eq.model.modelId : null,
      modelNumber: eq.model ? eq.model.modelNumber : null,
      assetNumber: eq.assetNumber,
      description: eq.description
    })
  }

  return serialized
}

function serializeUserAccount (node) {
  const serialized = {
    dataType: 'userAccount',
    nodeId: node.nodeId,
    name: node.name,
    nodeDetailTypeId: node.nodeDetailTypeId
  }

  const ua = node.userAccount
  if (ua) {
    Object.assign(serialized, {
      userAccountId: ua.userAccountId,
      firstName: ua.firstName,
      lastName: ua.lastName,
      displayName: ua.displayName,
      email: ua.email,
      jobTitle: ua.jobTitle,
      profileImageUrl: ua.profileImageUrl
    })
  }

  return serialized
}
