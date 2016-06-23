module.exports = {
    Roles: {
        Administrator: "admin",
        Supervisor: "super",
        User: "user"
    },
    RequestHeaders: {
        PackageId: "x-ims-package-id",
        PackageSecret: "x-ims-package-secret",
        Authorization: "authorization"
    },

    Database: {
        Tables: {
            KnownPackages: "__KNOWN_PACKAGES",
        }
    },

    Cookies: {
        RefreshToken: "rt"
    },
    TokenTypes: {
        Package: 'package',
        User: 'user'

    }
}
