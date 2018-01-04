import logger from '../logger'
import path from 'path'
import childProcess from 'child_process'
import schedule from 'node-schedule'

export function scheduleTasks (tasks) {
  tasks = tasks || []
  tasks.map((t) => {
    schedule.scheduleJob(t.schedule, () => {
      logger.info(`Starting Task: ${t.name}`)
      const cwd = path.join(process.cwd(), 'dist/server')
      const modulePath = path.join(cwd, t.modulePath)
      logger.info(`Module Path: ${modulePath}, CWD: ${cwd}`)
      childProcess.fork(modulePath, [], { cwd: cwd, stdio: 'inherit' })
    })
  })
}
