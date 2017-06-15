import crypto from 'crypto'

export default function createSignature (data, secret) {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(JSON.stringify(data))
  return hmac.digest('hex')
}
