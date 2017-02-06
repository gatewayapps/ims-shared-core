module.exports = (Sequelize, dbContext) => {
  return dbContext.define('notificationQueue', {
    notificationId: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    stateId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    sendDate: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    dequeueDate: {
      type: Sequelize.DATE,
      allowNull: true
    },
    tryCount: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    message: {
      type: Sequelize.STRING,
      allowNull: false
    },
    response: {
      type: Sequelize.STRING,
      allowNull: true
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
    tableName: 'NotificationQueue'
  });
};
