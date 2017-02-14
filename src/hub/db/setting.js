module.exports = (Sequelize, dbContext) => {
  return dbContext.define('equipment', {
    key: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      allowNull: false
    },
    value: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    createdDate: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    modifiedBy: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    modifiedDate: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  }, {
    tableName: 'Settings'
  });
};
