'use strict'
/* jshint indent: 2 */

module.exports = function (DataTypes, context) {
  return context.define('notificationAttachment', {
    notificationAttachmentId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    notificationId: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    contentType: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    contentSize: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    content: {
      type: DataTypes.BLOB,
      allowNull: false
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    modifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    modifiedDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'NotificationAttachments'
  })
}
