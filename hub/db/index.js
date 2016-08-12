"use strict";
const Sequelize = require('sequelize');
const Database = require('../../database');

class HubDatabase {
  constructor(config) {

    this.context = Database(config, config.hubDatabaseName);

    this.Equipment = require('./equipment')(Sequelize, this.context);
    this.EquipmentType = require('./equipmentType')(Sequelize, this.context);
    this.Manufacturer = require('./manufacturer')(Sequelize, this.context);
    this.Model = require('./model')(Sequelize, this.context);
    this.Node = require('./node')(Sequelize, this.context);
    this.NodeDetailType = require('./nodeDetailType')(Sequelize, this.context);
    this.NodeClosure = require('./nodeClosure')(Sequelize, this.context);
    this.NodeType = require('./nodeType')(Sequelize, this.context);
    this.PackageRole = require('./packageRole')(Sequelize, this.context);
    this.PackageRolePermission = require('./packageRolePermission')(Sequelize, this.context);
    this.Tree = require('./tree')(Sequelize, this.context);
    this.UserAccount = require('./userAccount')(Sequelize, this.context);

    /*******************************************
     * Define relations between models
     ******************************************/
    // Node to NodeType
    this.NodeType.hasMany(this.Node, { foreignKey: 'nodeTypeId' });
    this.Node.belongsTo(this.NodeType, { foreignKey: 'nodeTypeId' });

    // Node to NodeClosure ancestor
    this.Node.hasMany(this.NodeClosure, { as: 'descendants', foreignKey: 'ancestor' });
    this.NodeClosure.belongsTo(this.Node, { as: 'ancestorNode', foreignKey: 'ancestor' });

    // Node to NodeClosure descendant
    this.Node.hasMany(this.NodeClosure, { as: 'ancestors', foreignKey: 'descendant' });
    this.NodeClosure.belongsTo(this.Node, { as: 'descendantNode', foreignKey: 'descendant' });

    // PackageRole to PackageRolePermission
    this.PackageRole.hasMany(this.PackageRolePermission, { as: 'permissions', foreignKey: 'packageRoleId' });
    this.PackageRolePermission.belongsTo(this.PackageRole, { foreignKey: 'packageRoleId' });

    // UserAccount to Node
    this.UserAccount.belongsTo(this.Node, { foreignKey: 'nodeId' });
    this.Node.hasOne(this.UserAccount, { foreignKey: 'nodeId' });

    // Equipment to Node
    this.Equipment.belongsTo(this.Node, { foreignKey: 'nodeId' });
    this.Node.hasOne(this.Equipment, { foreignKey: 'nodeId' });

    // Equipment to EquipmentType
    this.EquipmentType.hasMany(this.Equipment, { foreignKey: 'equipmentTypeId' });
    this.Equipment.belongsTo(this.EquipmentType, { foreignKey: 'equipmentTypeId' });

    // Equipment to Manufacturer
    this.Manufacturer.hasMany(this.Equipment, { foreignKey: 'manufacturerId' });
    this.Equipment.belongsTo(this.Manufacturer, { foreignKey: 'manufacturerId' });

    // Equipment to Model
    this.Model.hasMany(this.Equipment, { foreignKey: 'modelId' });
    this.Equipment.belongsTo(this.Model, { foreignKey: 'modelId' });
  }
}

module.exports = HubDatabase;