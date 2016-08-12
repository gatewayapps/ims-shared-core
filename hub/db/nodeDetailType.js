module.exports = (Sequlize, dbContext) => {
  return dbContext.define('nodeDetailType', {
    nodeDetailTypeId: {
      type: Sequlize.INTEGER,
      primaryKey: true,
    },
    name: {
      type: Sequlize.STRING(100),
      allowNull: false,
    }
  }, {
    tableName: 'NodeDetailTypes',
  });
}