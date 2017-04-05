export function parseTag (tag) {
  if (typeof tag === 'string') {
    return createFromString(tag)
  } else if (typeof tag === 'object') {
    return createTagObject(tag.packageId, tag.tagId)
  } else {
    throw new TypeError('Invalid tag value')
  }
}

function createFromString (tagString) {
  const parts = tagString.split(':')
  if (parts.length < 2) {
    throw new TypeError('Invalid tag string')
  }

  return createTagObject(parts[0], parts[1])
}

function createTagObject (packageId, tagId) {
  return {
    packageId: packageId,
    tagId: tagId
  }
}
