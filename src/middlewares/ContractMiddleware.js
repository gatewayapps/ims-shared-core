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
          res.json({ success: false, reason: `Action not found on contract ${req.params.packageId}:${req.params.contract}` })
        }
      } else {
        res.json({ success: false, reason: `Contract not found for package ${req.params.packageId}` })
      }
    } else {
      res.json({ success: false, reason: `Contract definition not found for ${req.params.packageId}:${req.params.contract}:${req.params.action} ` })
    }
  })
}
