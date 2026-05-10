import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useZigbeeSocket } from './useZigbeeSocket'
import { permitJoin } from '@/api/zigbee'
import type { PairingEvent } from '@/types'

const PAIRING_DURATION = 60

export function usePairing() {
  const queryClient = useQueryClient()
  const { emit, on } = useZigbeeSocket()
  const [active, setActive] = useState(false)
  const [seconds, setSeconds] = useState(PAIRING_DURATION)
  const [events, setEvents] = useState<PairingEvent[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPairing = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    emit('zigbee:pairing:stop')
    emit('zigbee:pairing:unwatch')
    setActive(false)
    queryClient.invalidateQueries({ queryKey: ['physical-devices'] })
  }, [emit, queryClient])

  const startPairing = useCallback(async () => {
    setActive(true)
    setSeconds(PAIRING_DURATION)
    setEvents([])
    emit('zigbee:pairing:watch')

    try {
      await permitJoin()
    } catch {
      toast.error('Failed to start pairing mode')
      setActive(false)
      return
    }

    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          stopPairing()
          return 0
        }
        return s - 1
      })
    }, 1000)
  }, [emit, stopPairing])

  useEffect(() => {
    const offEvent = on('zigbee:pairing:event', (e) => {
      const event = e as PairingEvent
      setEvents((prev) => [...prev, event])
      if (event.type === 'device_joined') {
        toast.success(`Device joined: ${event.friendlyName ?? event.ieeeAddr}`)
      }
    })
    const offStatus = on('zigbee:pairing:status', (s) => {
      const status = s as { permitJoinEnabled: boolean }
      if (!status.permitJoinEnabled) stopPairing()
    })
    return () => {
      offEvent()
      offStatus()
    }
  }, [on, stopPairing])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return { active, seconds, events, startPairing, stopPairing }
}
