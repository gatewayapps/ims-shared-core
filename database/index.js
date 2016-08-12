const Sequelize = require('sequelize');

var instances = {};

module.exports = (config, databaseNameOverride) => {
    var dbName = databaseNameOverride || process.env.DATABASE_NAME || config.databaseName;
    if (!instances[dbName]) {
        instances[dbName] = new Sequelize(dbName,
            process.env.LOGIN_USERNAME || config.username,
            process.env.LOGIN_PASSWORD || config.password, {
                host: process.env.DATABASE_SERVER || config.server,
                dialect: 'mssql',
                dialectOptions: {
                    instanceName: process.env.DATABASE_INSTANCE_NAME || process.instanceName,
                    requestTimeout: 300000
                },
                pool: {
                    max: 5,
                    min: 0,
                    idle: 10000
                },
                options: {
                    retry: {
                        max: 3
                    }
                },
                define: {
                    timestamps: false
                }
            });
    }
    return instances[dbName];
}

