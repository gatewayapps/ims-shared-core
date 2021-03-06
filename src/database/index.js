const Sequelize = require('sequelize')

var instances = {}

module.exports = (config, databaseNameOverride) => {
  // Support for automatic transactions
  if (config.cls) {
    Sequelize.cls = config.cls
  }

  // Do not specify MSSQLSERVER as an instance name
  // MSSQLSERVER will not work as an instance name on Linux.
  if (config.instanceName && config.instanceName.toUpperCase() === 'MSSQLSERVER') {
    delete config.instanceName
  }

  var dbName = databaseNameOverride || config.databaseName
  if (!instances[dbName]) {
    var logging = process.env.NODE_ENV === 'development' ? console.log : false
    if (config.logging === false) {
      logging = false
    }

    if (logging) {
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
      })
    instances[dbName].authenticate().then(() => {
      if (logging) {
        console.log(`${dbName} connected`)
      }
    }).catch((err) => {
      console.error(err)
    })
  }
  return instances[dbName]
}
