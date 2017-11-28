import path from 'path'
import Activity from './Activity'
import args from 'args'
import mongojs from 'mongojs'

args
    .option('id', 'Activity ID to process')
    .option('activitiesPath', 'Path to activities directory(ex: server/api/activities)')
    .option('mongoConnectionString', 'Mongo connection String')

const flags = args.parse(process.argv)
if (flags.i && flags.a && flags.m) {
  executeActivity(flags.m, flags.a, flags.i)
}

export function executeActivity (mongoUrl, activitiesPath, activityId) {
  const db = mongojs(mongoUrl)
  Activity.LoadActivityAsync(flags.i, activitiesPath, db).then((a) => {
    a.eval()
  })
}
