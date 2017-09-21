import createAuthenticationMiddleware from './Authentication'
import fs from 'fs'
import path from 'path'

module.exports = (app, config, contractsPath) => {
  const auth = createAuthenticationMiddleware(config)
  app.use('/api/contracts/:packageId/:contract/:action', auth.defaultMiddleware, (req, res, next) => {
    const contractFilePath = path.join(contractsPath, `${req.params.packageId}.js`)
    if (fs.existsSync(contractFilePath)) {
      const packageContractFile = require(contractFilePath)
      const contract = packageContractFile[req.params.contract]
      if (contract) {
        const action = contract[req.params.action]
        if (action) {
          action(req, res, next)
        } else {
          res.status(404).send()
        }
      } else {
        res.status(404).send()
      }
    } else {
      res.status(404).send()
    }
  })
}
