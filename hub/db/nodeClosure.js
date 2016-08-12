module.exports = (Sequelize, dbContext) => {
  return dbContext.define('nodeClosure', {
    ancestor: {
      type: Sequelize.INTEGER,
      primaryKey: true,
    },
    descendant: {
      type: Sequelize.INTEGER,
      primaryKey: true,
    },
    depth: {
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
    tableName: 'NodeClosures',
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