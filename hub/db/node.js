module.exports = (Sequelize, dbContext) => {
  return dbContext.define('node', {
    nodeId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    nodeDetailTypeId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    nodeTypeId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    treeId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    parent: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    rank: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    isDeleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    createdDate: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    modifiedBy: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    modifiedDate: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
  }, {
    tableName: 'Nodes',
    defaultScope: {
      where: {
        isDeleted: false,
      }
    },
    scopes: {
      deleted: {
        where: {
          isDeleted: true
        }
      }
    }
  });
}