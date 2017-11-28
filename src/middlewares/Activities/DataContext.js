var mongojs = require('mongojs')

let db

export default function getContext (mongoConnectionString) {
  if (db) {
    return db
  } else {
    db = mongojs(mongoConnectionString)
    return db
  }
}
