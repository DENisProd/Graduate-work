import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useZigbeeSocket } from './useZigbeeSocket'
import { getZigbeeDevice, listZigbeeDevices, syncFromBridge } from '@/api/zigbee'
import type { PairingEvent } from '@/types'

export const PAIRING_DURATION = 240

export type PairingDeviceStatus = 'joining' | 'interviewing' | 'done' | 'failed'

export interface PairingDevice {
  ieeeAddr: string
  friendlyName: string
  status: PairingDeviceStatus
  physicalDeviceId: string | null
  model: string | null
  manufacturer: string | null
  capabilities: string[]
}

interface UsePairingOptions {
  enabled?: boolean
}

function mapEventType(type: PairingEvent['type']): PairingDeviceStatus | null {
  switch (type) {
    case 'device_joined':
      return 'joining'
    case 'interview_started':
      return 'interviewing'
    case 'interview_successful':
      return 'done'
    case 'interview_failed':
      return 'failed'
    default:
      return null
  }
}

async function resolvePhysicalDeviceId(ieeeAddr: string): Promise<string | null> {
  try {
    await syncFromBridge()
  } catch {
    // Pairing can continue even if sync fails.
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const device = await getZigbeeDevice(ieeeAddr)
      return device.id
    } catch {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
    }
  }
  return null
}

export function usePairing({ enabled = true }: UsePairingOptions = {}) {
  const queryClient = useQueryClient()
  const { emit, on, connected } = useZigbeeSocket()

  const [isActive, setIsActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [devices, setDevices] = useState<PairingDevice[]>([])
  const [events, setEvents] = useState<PairingEvent[]>([])
  const [isSocketConnected, setIsSocketConnected] = useState(connected)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeRef = useRef(false)

  useEffect(() => {
    setIsSocketConnected(connected)
  }, [connected])

  const startCountdown = useCallback((seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(seconds)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setIsActive(false)
          activeRef.current = false
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    emit('zigbee:pairing:stop')
    emit('zigbee:pairing:unwatch')
    setIsActive(false)
    activeRef.current = false
    setTimeLeft(0)
    queryClient.invalidateQueries({ queryKey: ['zigbee-devices'] })
    queryClient.invalidateQueries({ queryKey: ['physical-devices'] })
  }, [emit, queryClient])

  const start = useCallback(
    async (time = PAIRING_DURATION): Promise<{ ok: boolean; error?: string }> => {
      if (!connected) return { ok: false, error: 'Socket not connected' }

      setDevices([])
      setEvents([])
      setIsActive(true)
      activeRef.current = true
      startCountdown(time)
      emit('zigbee:pairing:watch')
      emit('zigbee:pairing:start')

      return { ok: true }
    },
    [connected, emit, startCountdown],
  )

  const clearDevices = useCallback(() => {
    setDevices([])
    setEvents([])
  }, [])

  useEffect(() => {
    if (!enabled) return

    const offEvent = on('zigbee:pairing:event', (raw) => {
      const event = raw as PairingEvent
      if (!activeRef.current) return

      setEvents((prev) => [...prev, event])

      const ieeeAddr = event.ieeeAddr
      if (!ieeeAddr) return

      const status = mapEventType(event.type)
      if (!status) return

      setDevices((prev) => {
        const idx = prev.findIndex((d) => d.ieeeAddr === ieeeAddr)
        const next: PairingDevice = {
          ieeeAddr,
          friendlyName: event.friendlyName ?? ieeeAddr,
          status,
          physicalDeviceId: idx >= 0 ? prev[idx].physicalDeviceId : null,
          model: event.model ?? (idx >= 0 ? prev[idx].model : null),
          manufacturer: event.manufacturerName ?? (idx >= 0 ? prev[idx].manufacturer : null),
          capabilities: idx >= 0 ? prev[idx].capabilities : [],
        }
        if (idx === -1) return [...prev, next]
        const prevDevice = prev[idx]
        const merged: PairingDevice = {
          ...prevDevice,
          ...next,
          physicalDeviceId: next.physicalDeviceId ?? prevDevice.physicalDeviceId,
          model: next.model ?? prevDevice.model,
          manufacturer: next.manufacturer ?? prevDevice.manufacturer,
          status: mergePairingStatus(prevDevice.status, next.status),
        }
        const updated = [...prev]
        updated[idx] = merged
        return updated
      })

      if (event.type === 'interview_successful') {
        void resolvePhysicalDeviceId(ieeeAddr).then((physicalDeviceId) => {
          if (!physicalDeviceId) return
          setDevices((prev) =>
            prev.map((d) =>
              d.ieeeAddr === ieeeAddr ? { ...d, physicalDeviceId, status: 'done' } : d,
            ),
          )
          queryClient.invalidateQueries({ queryKey: ['zigbee-devices'] })
          queryClient.invalidateQueries({ queryKey: ['physical-devices'] })
        })
      }
    })

    const offStatus = on('zigbee:pairing:status', (raw) => {
      const status = raw as { permitJoinEnabled: boolean }
      if (!status.permitJoinEnabled && activeRef.current) {
        if (timerRef.current) clearInterval(timerRef.current)
        setIsActive(false)
        activeRef.current = false
        setTimeLeft(0)
      }
    })

    return () => {
      offEvent()
      offStatus()
    }
  }, [enabled, on, queryClient])

  useEffect(() => {
    if (!enabled) return
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (activeRef.current) {
        emit('zigbee:pairing:stop')
        emit('zigbee:pairing:unwatch')
      }
    }
  }, [enabled, emit])

  const devicesRef = useRef(devices)
  devicesRef.current = devices

  useEffect(() => {
    if (!enabled || !isActive) return

    let cancelled = false

    const refreshPendingFromDb = async () => {
      const pending = devicesRef.current.filter(
        (d) => d.status === 'joining' || d.status === 'interviewing',
      )
      if (pending.length === 0) return

      try {
        await syncFromBridge()
        await new Promise((r) => setTimeout(r, 500))
        if (cancelled) return

        const list = await listZigbeeDevices()
        if (cancelled) return

        setDevices((prev) =>
          prev.map((d) => {
            if (d.status === 'done' || d.status === 'failed') return d
            const found = list.find((item) => item.ieeeAddr === d.ieeeAddr)
            if (!found) return d

            const physicalDeviceId = found.id ?? d.physicalDeviceId
            const model = found.model ?? d.model
            const manufacturer = found.manufacturerName ?? d.manufacturer
            const ready = Boolean(physicalDeviceId) && (Boolean(model) || found.interviewCompleted)

            if (!ready) {
              return {
                ...d,
                physicalDeviceId,
                model,
                manufacturer,
                status:
                  d.status === 'joining' && physicalDeviceId ? 'interviewing' : d.status,
              }
            }

            return {
              ...d,
              status: 'done',
              physicalDeviceId,
              model,
              manufacturer,
            }
          }),
        )
      } catch {
        // Pairing should continue even if sync/list fails.
      }
    }

    void refreshPendingFromDb()
    const interval = setInterval(() => void refreshPendingFromDb(), 2500)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [enabled, isActive])

  // Load existing zigbee devices to filter duplicates during pairing.
  const loadExistingIeee = useCallback(async (): Promise<Set<string>> => {
    try {
      const list = await listZigbeeDevices()
      return new Set(list.map((d) => d.ieeeAddr))
    } catch {
      return new Set()
    }
  }, [])

  return {
    isActive,
    isSocketConnected,
    timeLeft,
    devices,
    events,
    start,
    stop,
    clearDevices,
    loadExistingIeee,
    // Legacy aliases for PairingDialog
    active: isActive,
    seconds: timeLeft,
    startPairing: () => start(),
    stopPairing: stop,
  }
}

function mergePairingStatus(
  current: PairingDeviceStatus,
  incoming: PairingDeviceStatus,
): PairingDeviceStatus {
  const rank: Record<PairingDeviceStatus, number> = {
    joining: 0,
    interviewing: 1,
    done: 2,
    failed: 3,
  }
  if (incoming === 'failed') return 'failed'
  return rank[incoming] >= rank[current] ? incoming : current
}
