import du from 'du'
import io from 'socket.io-client'
import logger from '../logger'

const SEND_HEARTBEAT_TIMEOUT = 10000

let _packageSocket
let _packageId
let _fileStoragePath

export function prepareSocketService (packageId, serverConfig) {
  _packageId = packageId
  _fileStoragePath = serverConfig.fileStoragePath
  logger.debug(`Connecting to socket service at ${process.env.SOCKET_SERVICE_URL}`)
  _packageSocket = io(`${process.env.SOCKET_SERVICE_URL}/package`)

  const packageInfo = {
    packageId: _packageId,
    url: serverConfig.baseUrl
  }

  logger.debug(`Registering package ${_packageId} with socket service`, packageInfo)
  _packageSocket.emit('register', packageInfo)

  sendHeartbeat()
  setInterval(sendHeartbeat, SEND_HEARTBEAT_TIMEOUT)
}

function sendHeartbeat () {
  du(_fileStoragePath, (err, sizeInBytes) => {
    if (err) {
      logger.error(err)
      return
    }

    const payload = {
      packageId: _packageId,
      status: {
        uptime: process.uptime(),
        mem: process.memoryUsage(),
        disk: sizeInBytes
      }
    }

    logger.debug(`Sending heartbeat for ${_packageId} to socket service`, payload)
    _packageSocket.emit('heartbeat', payload)
  })
}
