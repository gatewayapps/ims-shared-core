module.exports = {
  RequestHeaders: {
    PackageId: 'x-ims-package-id',
    PackageSecret: 'x-ims-package-secret',
    Authorization: 'x-ims-authorization'
  },
  Roles: {
    Administrator: 'admin',
    Supervisor: 'super',
    User: 'user'
  },
  RoleTypes: {
    Grant: 1,
    Deny: -1
  },
  RoleValues: {
    user: 1,
    super: 2,
    admin: 3
  },
  Database: {
    Tables: {
      KnownPackages: '__KNOWN_PACKAGES'
    }
  },
  SocketEvents: {
    TreeModifiedEvent: '@HUB/TREE_MODIFIED'
  },
  Cookies: {
    HubUrl: 'HUB_URL',
    InitialState: '__INITIAL_STATE__',
    PackageId: 'PACKAGE_ID',
    RefreshToken: 'rt',
    PackageVersion: 'PACKAGE_VERSION',
    PackageCommit: 'PACKAGE_COMMIT'
  },
  TokenTypes: {
    Package: 'package',
    User: 'user'
  }
}
