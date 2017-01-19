const Sequelize = require('sequelize');

var instances = {};

module.exports = (config, databaseNameOverride) => {
    var dbName = databaseNameOverride || config.databaseName;
    if (!instances[dbName]) {
        var logging = (
          config.logging ? config.logging : (
            process.env.NODE_ENV === 'development' ? console.log : false
          )
        )
        if(logging){
          console.log(`Connecting to ${dbName}`)
        }
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
                logging: logging
            });
        instances[dbName].authenticate().complete(function(err){
          if(err){
            console.error(err)
          } else {
            console.log(`Connected to ${dbName}`)
          }
        })
    }
    return instances[dbName];
}

