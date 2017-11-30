import moment from 'moment'
import { spawn } from 'child_process'
import Activity from './Activity'
import getContext from './DataContext'
// import createAuthenticationMiddleware from '../Authentication'
import fs from 'fs'
import path from 'path'

const ChildProcesses = {}

const ACTIVITY_MANAGER_PATH = path.join(__dirname, 'ActivityManager.js')

export default function ActivityMiddleware (app, config, activitiesPath, mongoConnectionString) {
  // const auth = createAuthenticationMiddleware(config)
  const dbo = getContext(mongoConnectionString)
  dbo.runCommand({ ping: 1 }, function (err, res) {
    if (err) {
      console.error(err)
    }
    if (!err && res.ok) console.log('connected to mongo!')
  })

  app.use('/api/core/activity', (req, res, next) => {
    const activityPath = path.join(activitiesPath, req.body.activity.id)

    if (fs.existsSync(activityPath)) {
      const activityRef = require(activityPath)

      if (activityRef.CreateActivityAsync) {
        Activity.CreateActivityAsync(req.body.context, req.body.activity, dbo, activityRef).then((activity) => {
          res.json({ success: true })
          const child = spawn('node', [
            ACTIVITY_MANAGER_PATH,
            `-i ${activity.id}`,
            `-a ${activitiesPath}`,
            `-m ${mongoConnectionString}`
          ], { stdio: 'inherit' })
          ChildProcesses[child.pid] = child
          ChildProcesses[child.pid].spawnedAt = new Date()
          setTimeout(() => {
            const pids = Object.keys(ChildProcesses)
            for (var i = 0; i < pids.length; i++) {
              const pid = pids[i]
              if (moment().diff(moment(ChildProcesses[pid].spawnedAt), 'seconds') > 10.0) {
                console.log('Terminating PID', pid)
                try {
                  process.kill(pid)
                  delete ChildProcesses[pid]
                } catch (err) {
                  console.error(err)
                }
              }
            }
          }, 15000)
        })
      } else {
        res.json({ success: false, reason: `Activity '${req.body.activity.id}' does not inherit from ims-shared-core::Activity` })
      }
    } else {
      res.json({ success: false, reason: `Activity definition not found for ${req.body.activity.id}` })
    }
  })
}
