import HubDatabase from '../db'
import { fromValue } from '../helpers/data'

let hubDb

export const SettingKeys = {
  OrganizationName: 'OrganizationName',
  OrganizationShortName: 'OrganizationShortName'
}

export function createSettingService (config) {
  hubDb = new HubDatabase(config.database)
}

export function getSetting (key) {
  throwIfNotInitialized()

  return hubDb.Setting.findOne({
    where: {
      key: key
    }
  }).then((setting) => {
    return fromValue(setting.value, setting.dataType)
  })
}

export function getSettings (keys) {
  throwIfNotInitialized()

  return hubDb.Setting.findAll({
    where: {
      key: {
        $in: keys
      }
    }
  }).then((settings) => {
    const settingsObj = settings.reduce((obj, s) => {
      obj[s.key] = fromValue(s.value, s.dataType)
      return obj
    }, {})
    return settingsObj
  })
}

export default {
  createSettingService,
  getSetting,
  getSettings,
  SettingKeys
}

function throwIfNotInitialized () {
  if (!hubDb) {
    throw new Error('Settings service has not been initialized. Call createSettingService first.')
  }
}
