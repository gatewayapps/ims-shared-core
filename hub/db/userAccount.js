module.exports = (Sequelize, dbContext) => {
  return dbContext.define('userAccount', {
    userAccountId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firstName: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    lastName: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    email: {
      type: Sequelize.STRING(255)
    },
    nodeId: {
      type: Sequelize.INTEGER
    },
    jobTitle: {
      type: Sequelize.STRING(255)
    },
    externalId: {
      type: Sequelize.STRING(255)
    },
    homePhone: {
      type: Sequelize.STRING(25)
    },
    workPhone: {
      type: Sequelize.STRING(25)
    },
    cellPhone: {
      type: Sequelize.STRING(25)
    },
    displayName: {
      type: Sequelize.STRING(250)
    },
    profileImageUrl: {
      type: Sequelize.STRING(500)
    },
    isTerminated: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isDeleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    createdBy: {
      type: Sequelize.INTEGER,
      "x-prevent-update": false,
    },
    createdDate: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
      "x-prevent-update": false,
    },
    modifiedBy: {
      type: Sequelize.INTEGER,
    },
    modifiedDate: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  }, {
    tableName: 'UserAccounts',
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
};