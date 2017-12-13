import getContext from './DataContext'
import du from 'du'

export default function StatusMiddleware (app, config, activitiesPath, mongoConnectionString) {
  // const auth = createAuthenticationMiddleware(config)
  const dbo = getContext(mongoConnectionString)
  dbo.runCommand({ ping: 1 }, function (err, res) {
    if (err) {
      console.error(err)
    }
    if (!err && res.ok) console.log('connected to mongo!')
  })

  app.use('/api/core/status', (req, res, next) => {
    du(config.FILE_STORAGE_PATH, (err, sizeInBytes) => {
      if (err) {
        res.json({
          success: false,
          message: 'Error while finding disk space'
        })
      }
      res.json({
        uptime: process.uptime(),
        mem: process.memoryUsage(),
        disk: sizeInBytes
      })
    })
  })
}
