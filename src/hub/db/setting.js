module.exports = (Sequelize, dbContext) => {
  return dbContext.define('equipment', {
    key: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      allowNull: false
    },
    settingsGroupId: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    dataType: {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: 'string'
    },
    value: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    createdDate: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    modifiedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
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
