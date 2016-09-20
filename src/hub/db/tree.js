module.exports = (Sequelize, dbContext) => {
  return dbContext.define('tree', {
    treeId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    shortCode: {
      type: Sequelize.STRING(5)
    },
  }, {
    tableName: 'Trees',
  });
}