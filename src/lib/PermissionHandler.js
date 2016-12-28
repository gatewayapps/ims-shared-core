"use strict";
const Constants = require('./constants');
const TreeHelper = require('./TreeHelper');

function PermissionHandler(imsConfig) {
  var self = this;
  this.ImsConfig = imsConfig;

  this.checkPermission = function (permission, userPermissions, skipTreeNodeCheck) {
    skipTreeNodeCheck = skipTreeNodeCheck || false;
    if (typeof permission === 'string') {
      permission = this.createPermissionFromString(permission);
    }
    else {
      //this is an object, let's fill in any missing values
      permission = _autoFillValues(permission);
    }

    try {
      _validatePermission(permission);
    }
    catch (ex) {
      console.error(ex);
      return false;
    }

    if (!Array.isArray(userPermissions) || userPermissions.length === 0)
      return false;

    //Always check if a specific permission has been denied first
    if (_isPermissionDenied(permission, userPermissions))
      return false;


    //Has it been explicitly granted to the user
    if (_isPermissionGranted(permission, userPermissions, skipTreeNodeCheck))
      return true;


    //Did the user inherit it based on their role
    if (_isPermissionInherited(permission, userPermissions, skipTreeNodeCheck))
      return true;

    return false;
  }

  this.checkPermissions = function (permissions, userPermissions, skipTreeNodeCheck) {
    return permissions.some(function (p) {
      return self.checkPermission(p, userPermissions, skipTreeNodeCheck);
    });
  }

  this.createPermissionFromString = function (permissionString) {
    var parts = permissionString.split(':');

    //is this missing role:action
    if (permissionString.split(':').length === 2 || permissionString.length === 4) {
      if (parts[0] === 'user' || parts[0] === 'super' || parts[0] === 'admin') {
        //prepend grant and package
        permissionString = '+:' + this.ImsConfig.package.id + ':' + permissionString;
      }
      if (parts.length === 4) {
        //need to append '*:*'
        permissionString += ":*:*";
      }

      parts = permissionString.split(':');
    }

    var retVal = {
      type: parts[0] === '+' ? Constants.RoleTypes.Grant : Constants.RoleTypes.Deny,
      package: parts[1],
      role: parts[2],
      action: parts[3],
      tree: parts[4],
      node: parts[5]
    };

    return _autoFillValues(retVal);
  }

  this.createPermissionsArrayFromStringsArray = function (stringsArray) {
    if (!Array.isArray(stringsArray))
      return [];

    return stringsArray.map(function (permissionString) {
      if (!typeof permissionString === 'string')
        return undefined;

      return this.createPermissionFromString(permissionString);
    }, this);
  }

  function _autoFillValues(permission) {
    if (!permission.type)
      permission.type = Constants.RoleTypes.Grant;
    if (!permission.package)
      permission.package = self.ImsConfig.package.id;
    if (!permission.role)
      permission.role = 'user';
    if (!permission.action)
      permission.action = '*';
    if (!permission.tree)
      permission.tree = '*';
    if (!permission.node)
      permission.node = '*';

    return permission;
  }

  function _isPermissionDenied(permission, userPermissions) {
    for (var i = 0; i < userPermissions.length; i++) {
      const p = userPermissions[i];

      // Is this a deny permission and does it apply to this package
      if (p.type === Constants.RoleTypes.Deny && p.package === self.ImsConfig.package.id) {

        // Does this user permission role match the role for the permission we are checking
        // and does the action match or is the user permission action '*'
        if (p.role === permission.role && p.action === permission.action || p.action === '*') {

          // Does the denied user permission apply to all trees or match the tree for the permission
          if (p.tree === '*' || p.tree === permission.tree) {

            // Does the denied user permission apply to the all nodes or one of the parents 
            // of the current node
            if (p.node === '*' || TreeHelper.isNodeDescendantOf(p.node, permission.node)) {
                return true;
            }

          }

        }

      }

    }

    return false;
  }

  function _isPermissionGranted(permission, userPermissions, skipTreeNodeCheck) {
    for (var i = 0; i < userPermissions.length; i++) {
      const p = userPermissions[i];

      //Is this a grant permission and does it apply to this package
      if (p.type === Constants.RoleTypes.Grant && p.package === self.ImsConfig.package.id) {

        //Does this user permission role match the permission role we are checking
        if (p.role === permission.role) {

          //Does this user permission action match all or match the permission we are checking
          if (p.action === permission.action || p.action === '*') {

            //Does this user permission apply to everything or only to a specific tree?
            //If it's a specific tree, does it match the one we are checking against
            if (p.tree === '*' || p.tree === permission.tree || skipTreeNodeCheck === true) {

              //Does this user permission apply to all nodes or only to a specific node/descendants?
              if (p.node === '*' || TreeHelper.isNodeDescendantOf(p.node, permission.node) || skipTreeNodeCheck === true) {
                  return true;
              }

            }

          }

        }

      }

    }

    return false;
  }

  function _isPermissionInherited(permission, userPermissions, skipTreeNodeCheck) {
    skipTreeNodeCheck = skipTreeNodeCheck || false;
    const roleCheckValue = Constants.RoleValues[permission.role];

    for (var i = 0; i < userPermissions.length; i++) {
        const p = userPermissions[i];

        // Is this user permission a Grant and does it apply to this package
        if (p.type === Constants.RoleTypes.Grant && p.package === self.ImsConfig.package.id) {

          const pRoleValue = Constants.RoleValues[p.role];

          // Is the role value for this permission greater than the role value for the permission we are checking
          // and is the action '*' for the user permission
          if (pRoleValue > roleCheckValue && p.action === '*') {

            // This user has a higher level role with full permissions in some area

            // Does this permission apply to everything or only a specific tree?
            // If it's a specific tree, does it match the one we are checking against
            if (p.tree === '*' || p.tree === permission.tree || skipTreeNodeCheck === true) {

              // Does this permission apply to everything or only a specific node?
              // If it's a specfic node, does it apply to a parent of the one we are checking against
              if (p.node === '*' || TreeHelper.isNodeDescendantOf(p.node, permission.node) || skipTreeNodeCheck) {

                return true;
              }
              
            }
             
          }

        }
        
    }

    return false;
  }

  function _validatePermission(permission) {
    if (!permission.type || !permission.package || !permission.action || !permission.tree || !permission.node) {
      throw {
        "name": "InvalidPermissionException",
        "message": "Permission failed validation check: " + JSON.stringify(permission)
      };
    }

    if (permission.type !== Constants.RoleTypes.Grant && permission.type !== Constants.RoleTypes.Deny) {
      throw {
        "name": "InvalidPermissionException",
        "message": "validatePermission was passed an invalid permission: " + JSON.stringify(permission) + ", part: GRANT/DENY"
      }
    }

    if (!Constants.RoleValues[permission.role]) {
      throw {
        "name": "InvalidPermissionException",
        "message": "userHasPermission was passed an invalid permission role: " + permission.role + ", full permission: " + JSON.stringify(permission)
      };
    }
  }
}

module.exports = PermissionHandler;