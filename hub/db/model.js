module.exports = (Sequelize, dbContext) => {
  return dbContext.define('model', {
    modelId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    manufacturerId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    modelNumber: {
      type: Sequelize.STRING(100),
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
    tableName: 'Models',
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