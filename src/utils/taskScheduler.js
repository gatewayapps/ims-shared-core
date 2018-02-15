import fs from 'fs'
import logger from '../logger'
import path from 'path'
import childProcess from 'child_process'
import schedule from 'node-schedule'

export function scheduleTasks (tasks, serverRoot) {
  tasks = tasks || []
  tasks.map((t) => {
    schedule.scheduleJob(t.schedule, () => {
      logger.info(`Starting Task: ${t.name}`)

      const modulePath = path.join(serverRoot, t.modulePath)

      try {
        logger.info(`Task ${t.name} module path: ${modulePath}, CWD: ${serverRoot}`)
        const cp = childProcess.fork(modulePath, [], { cwd: serverRoot, stdio: 'inherit' })
        cp.on('exit', (code, signal) => {
          if (code === 0) {
            logger.info(`Task ${t.name} completed succesfully`)
          } else {
            if (code !== null) {
              logger.warn(`Task ${t.name} exited with a code ${code}`)
            } else {
              logger.warn(`Task ${t.name} exited due to a ${signal} signal`)
            }
          }
        })
      } catch (err) {
        logger.warn(`Task ${t.name} failed to start with this error`, err)
      }
    })
  })
}
