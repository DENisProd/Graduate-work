import { useCallback, useEffect, useMemo, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useSettingsStore } from '@/stores/settings.store'
import { useDeviceStatesStore } from '@/stores/device-states.store'
import { resolveServerUrl } from '@/lib/server-url'
import type { ZigbeeState } from '@/types'

const sockets = new Map<string, Socket>()

function getSocket(rawServerUrl: string): Socket {
  const serverUrl = resolveServerUrl(rawServerUrl)
  if (sockets.has(serverUrl)) return sockets.get(serverUrl)!

  const socket = io(`${serverUrl}/zigbee`, {
    transports: ['websocket'],
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  })

  socket.on('zigbee:state', (state: ZigbeeState) => {
    useDeviceStatesStore.getState().setDeviceState(state.deviceIeeeAddr, state)
  })

  sockets.set(serverUrl, socket)
  return socket
}

export function useZigbeeSocket() {
  const serverUrl = useSettingsStore((s) => s.serverUrl)
  const socket = useMemo(() => getSocket(serverUrl), [serverUrl])
  const [connected, setConnected] = useState(socket.connected)

  useEffect(() => {
    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    if (socket.connected) setConnected(true)
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [socket])

  const subscribe = useCallback(
    (ieeeAddr: string) => socket.emit('zigbee:subscribe', { deviceIeeeAddrs: [ieeeAddr] }),
    [socket],
  )

  const unsubscribe = useCallback(
    (ieeeAddr: string) => socket.emit('zigbee:unsubscribe', { deviceIeeeAddrs: [ieeeAddr] }),
    [socket],
  )

  const emit = useCallback(
    (event: string, data?: unknown) => socket.emit(event, data),
    [socket],
  )

  const on = useCallback(
    (event: string, handler: (data: unknown) => void): (() => void) => {
      socket.on(event, handler)
      return () => socket.off(event, handler)
    },
    [socket],
  )

  return { connected, subscribe, unsubscribe, emit, on }
}
