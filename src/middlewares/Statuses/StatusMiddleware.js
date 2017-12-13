import du from 'du'

export default function StatusMiddleware (app, config) {
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
