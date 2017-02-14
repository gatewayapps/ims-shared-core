import HubDatabase from '../db';

let hubDb;

export const SettingKeys = {
  OrganizationName: 'OrganizationName',
  OrganizationShortName: 'OrganizationShortName'
};

export function createSettingService (config) {
  hubDb = new HubDatabase(config.database);
}

export function getSetting (key) {
  throwIfNotInitialized()

  return hubDb.Settings.findOne({
    where: {
      key: key
    }
  }).then((setting) => {
    return setting.value;
  });
}

export function getSettings (keys) {
  throwIfNotInitialized();

  return hubDb.Settings.findAll({
    where: {
      key: {
        $in: keys
      }
    }
  }).then((settings) => {
    const settingsObj = settings.reduce((obj, s) => {
      obj[s.key] = s.value;
      return obj;
    }, {});
    return settingsObj;
  });
}

export default {
  createSettingService,
  getSetting,
  getSettings,
  SettingKeys
};

function throwIfNotInitialized () {
  if (!hubDb) {
    throw new Error('Settings service has not been initialized. Call createSettingService first.');
  }
}
