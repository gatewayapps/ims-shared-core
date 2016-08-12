module.exports = (Sequelize, dbContext) => {
  return dbContext.define('packageRolePermission', {
    packageRolePermissionId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    packageRoleId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    permissionId: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING(500),
    },
    isDeleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    createdBy: {
      type: Sequelize.INTEGER
    },
    createdDate: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
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
    tableName: 'PackageRolePermissions',
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