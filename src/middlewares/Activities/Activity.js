import path from 'path'
import fs from 'fs'
import mongojs from 'mongojs'
import fetch from 'isomorphic-fetch'

export default class Activity {
  constructor (context, activity, db) {
    this.context = context
    this.activity = activity
    this.db = db
    this.complete = false
  }

  static LoadActivityDefinition (activitiesPath, name) {
    const activityPath = path.join(activitiesPath, name)
    if (fs.existsSync(activityPath)) {
      const ClassType = require(activityPath)
      if (ClassType.CreateActivityAsync) {
        return ClassType
      } else {
        throw new Error('Not a valid Activity definition')
      }
    } else {
      throw new Error(`Activity not found at ${activityPath}`)
    }
  }

  static CreateActivityAsync (context, activity, db, ClassType) {
    const act = new ClassType(context, activity, db)
    return act.save().then((result) => {
      if (!act.id && result._id) {
        act.id = result._id
      }
      return act
    })
  }

  static LoadActivityAsync (id, activitiesPath, db) {
    return new Promise((resolve, reject) => {
      db.collection('TaskActivities').findOne({
        _id: mongojs.ObjectId(id)
      }, (err, result) => {
        if (err) {
          console.error(err)
          reject(err)
        } else {
          const name = result.activity.id
          const ClassType = this.LoadActivityDefinition(activitiesPath, name)
          const act = new ClassType(result.context, result.activity, db)
          act.result = result.result
          act.auccess = result.success
          act.reason = result.reason
          act.dateCreated = result.dateCreated
          act.complete = result.complete
          act.id = mongojs.ObjectId(id)
          resolve(act)
        }
      })
    })
  }

  save () {
    const record = {
      context: this.context,
      activity: this.activity,
      result: this.result,
      success: this.success,
      reason: this.reason,
      complete: this.complete,
      dateCreated: this.dateCreated
    }
    delete record.context.steps
    if (!record.dateCreated) {
      record.dateCreated = new Date()
    } else {
      record.dateUpdated = new Date()
    }

    if (this.id) {
      record._id = this.id
    }

    return new Promise((resolve, reject) => {
      if (record._id) {
        this.db.collection('TaskActivities').update({ _id: record._id }, record, (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })
      } else {
        this.db.collection('TaskActivities').insert(record, (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })
      }
    })
  }

  callback () {
    if (this.context.callback) {
      const body = {
        context: {
          taskId: this.context.taskId,
          step: this.context.step
        }
      }
      return fetch(this.context.callback, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
  }

  requireInput (name) {
    if (this.activity.inputs === undefined || this.activity.inputs[name] === undefined) {
      this.fail(`${this.activity.packageId}:${this.context.step} requires input ${name} but was passed undefined`)
      return false
    } else {
      return true
    }
  }
  eval () {
    throw new Error('Not implemented')
  }

  getInputType (name) {
    const val = this.getInputValue(name)
    if (val instanceof Array) {
      return 'array'
    } else {
      return typeof val
    }
  }
  getInputValue (name) {
    let val = this.activity.inputs[name]
    if (val) {
      if (val.trim) {
        val = val.trim()
      }
    // Find ${binding.path}
      let regex = /\$\{([^}]+)\}/g
      let match = regex.exec(val)
      while (match && match.length > 1) {
        const bindingText = match[1]
        const bindingPathArray = bindingText.split('.')
        const boundValue = this.getBindingValue(bindingPathArray, this.context)
        val = val.replace(match[0], boundValue)
        regex = /\$\{([^}]+)\}/g
        match = regex.exec(val)
      }
    }
    return val
  }

  getBindingValue (pathArray, obj) {
    let currentObj = obj

    for (let i = 0; i < pathArray.length; i++) {
      let key = pathArray[i]
      let numberKey = Number(pathArray[i])

      currentObj = currentObj[key] || currentObj[numberKey]

      if (!currentObj) {
        break
      }
    }
    if (currentObj === undefined) {
      this.fail(`Invalid binding path: ${pathArray.join('.')} for context`)
    } else {
      return currentObj
    }
  }

  success (value, data) {
    if (this.complete) {
      return this.callback()
    }

    this.complete = true
    this.success = true
    this.result = { value, data }
    return this.save().then(() => this.callback)
  }

  fail (reason) {
    if (this.complete) {
      return this.callback()
    }

    this.complete = true
    this.success = false
    this.reason = reason
    return this.save().then(() => this.callback)
  }
}
