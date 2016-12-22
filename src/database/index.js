const Sequelize = require('sequelize');

var instances = {};

module.exports = (config, databaseNameOverride) => {
    var dbName = databaseNameOverride || config.databaseName;
    console.log(`Trying to login to ${dbName}`);
    if (!instances[dbName]) {
        instances[dbName] = new Sequelize(dbName,
            config.username,
            config.password, {
                host: config.server,
                dialect: 'mssql',
                dialectOptions: {
                    instanceName: config.instanceName,
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
                },
                logging: process.env.NODE_ENV === 'development' ? console.log : false
            });
    }
    return instances[dbName];
}

