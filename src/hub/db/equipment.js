module.exports = (Sequelize, dbContext) => {
  return dbContext.define('equipment', {
    equipmentId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    equipmentTypeId: {
      type: Sequelize.INTEGER,
    },
    manufacturerId: {
      type: Sequelize.INTEGER,
    },
    modelId: {
      type: Sequelize.INTEGER,
    },
    assetNumber: {
      type: Sequelize.STRING(100),
    },
    description: {
      type: Sequelize.STRING(500),
    },
    nodeId: {
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
    },
    createdDate: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    modifiedBy: {
      type: Sequelize.INTEGER,
    },
    modifiedDate: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    }
  }, {
    tableName: 'Equipment',
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