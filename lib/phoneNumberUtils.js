"use strict";
const libphonenumber = require('google-libphonenumber');

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
const PNF = libphonenumber.PhoneNumberFormat;
const DEFAULT_REGION_CODE = 'US';

module.exports = {
  formatE164,
  formatNational,
  hasValue,
  isValid,
};

function parseAndKeepRawInput(phoneNumber) {
  return phoneUtil.parseAndKeepRawInput(phoneNumber, DEFAULT_REGION_CODE);
}

function formatE164(phoneNumber) {
  const parsed = parseAndKeepRawInput(phoneNumber);
  return phoneUtil.format(parsed, PNF.E164);
}

function formatNational(phoneNumber) {
  const parsed = parseAndKeepRawInput(phoneNumber);
  return phoneUtil.format(parsed, PNF.NATIONAL);
}

function hasValue(phoneNumber) {
  if (!phoneNumber) {
    return false;
  }
  else if (phoneNumber === '+' || phoneNumber === '+1') {
    // The react-telephone-input control will always keep at least the '+'
    // in the phone number field. It may also just have '+1' for US numbers
    // when the value is initially blank. This is just to weed out those cases.
    return false;
  }
  else {
    return true;
  }
}

function isValid(phoneNumber) {
  if (!phoneNumber || phoneNumber.length < 4) {
    return false;
  }
  const parsed = parseAndKeepRawInput(phoneNumber);
  return phoneUtil.isValidNumber(parsed);
}
