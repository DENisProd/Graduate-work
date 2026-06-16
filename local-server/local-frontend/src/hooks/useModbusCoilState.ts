import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  buildCoilStatePatch,
  coilValueFromState,
  getDeviceState,
  patchModbusDeviceStateCache,
  writeModbusRegister,
} from '@/api/modbus'

/** Coil on/off from last written (or explicitly read) value — not live hardware poll. */
export function useModbusCoilState(deviceId?: string, registerId?: string) {
  const queryClient = useQueryClient()
  const enabled = !!deviceId && !!registerId

  const stateQuery = useQuery({
    queryKey: ['modbus-device-state', deviceId],
    queryFn: () => getDeviceState(deviceId!),
    enabled,
    staleTime: 60_000,
  })

  const cached = stateQuery.data?.find((s) => s.registerId === registerId)
  const isOn = coilValueFromState(cached)

  const writeMutation = useMutation({
    mutationFn: (coil: boolean) =>
      writeModbusRegister(deviceId!, registerId!, { coil }),
    onMutate: (coil) => {
      patchModbusDeviceStateCache(
        queryClient,
        deviceId!,
        registerId!,
        buildCoilStatePatch(registerId!, coil),
      )
    },
    onError: () => {
      void stateQuery.refetch()
    },
  })

  return {
    isOn,
    cached,
    isLoading: stateQuery.isLoading,
    writeCoil: writeMutation.mutate,
    writeCoilAsync: writeMutation.mutateAsync,
    isWriting: writeMutation.isPending,
  }
}
