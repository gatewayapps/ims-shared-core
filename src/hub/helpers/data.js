export function getValue (value) {
  if (value instanceof String) {
    return value
  } else if (value instanceof Number) {
    return value.toString()
  } else if (value instanceof Date) {
    return value.toISODate()
  } else if (typeof value === 'boolean') {
    return value ? '1' : '0'
  } else {
    return value.toString()
  }
}

export function getType (value) {
  if (value instanceof String) {
    return 'string'
  } else if (value instanceof Number) {
    return 'number'
  } else if (value instanceof Date) {
    return 'date'
  } else if (typeof value === 'boolean') {
    return 'boolean'
  } else {
    return typeof value
  }
}

export function fromValue (value, type) {
  switch (type) {
    case 'number':
      return Number(value)
    case 'date':
      return new Date(value)
    case 'boolean':
      return value === '1'
    default:
      return value
  }
}
