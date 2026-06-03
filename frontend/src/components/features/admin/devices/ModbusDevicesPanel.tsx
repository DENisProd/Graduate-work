'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, RefreshCw, ChevronRight, CheckCircle2, XCircle, PencilLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { modbusApi } from '@/lib/api-client';
import { useToast } from '@/components/shared';
import type {
  ModbusDeviceResponse,
  ModbusRegisterResponse,
  ModbusRegisterStateResponse,
  ModbusRegisterType,
} from '@/types/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTs(ts: string | undefined) {
  if (!ts) return '—';
  try {
    const diff = Date.now() - new Date(ts).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return `${secs}с назад`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}мин назад`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}ч назад`;
    return new Date(ts).toLocaleDateString();
  } catch {
    return ts;
  }
}

const REGISTER_TYPES: ModbusRegisterType[] = ['holding', 'input', 'coil', 'discrete'];

function RegisterTypeBadge({ type }: { type: ModbusRegisterType }) {
  const cls =
    type === 'holding'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      : type === 'input'
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : type === 'coil'
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', cls)}>{type}</span>
  );
}

// ─── Modal overlay ────────────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {children}
    </>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  title,
  body,
  loading,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalOverlay onClose={onCancel}>
      <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
            Отмена
          </button>
          <button onClick={onConfirm} disabled={loading} className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
            {loading ? '…' : 'Удалить'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Add Device Modal ─────────────────────────────────────────────────────────

function AddDeviceModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [slaveId, setSlaveId] = useState('1');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await modbusApi.createDevice({ name: name.trim(), slaveId: Number(slaveId), description: description.trim() || undefined, enabled });
      showToast('Устройство создано', 'success');
      onSuccess();
      onClose();
    } catch {
      showToast('Не удалось создать устройство', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="fixed left-1/2 top-1/2 z-50 w-96 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Добавить Modbus устройство</h3>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Название</span>
            <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={name} onChange={(e) => setName(e.target.value)} placeholder="Temperature Sensor" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Slave ID (1–247)</span>
            <input type="number" min={1} max={247} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={slaveId} onChange={(e) => setSlaveId(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Описание</span>
            <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Датчик в комнате 1" />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="rounded" />
            Активно
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">Отмена</button>
          <button onClick={handleSubmit} disabled={!name.trim() || loading} className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{loading ? '…' : 'Добавить'}</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Add Register Modal ───────────────────────────────────────────────────────

function AddRegisterModal({ deviceId, onClose, onSuccess }: { deviceId: string; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [regType, setRegType] = useState<ModbusRegisterType>('holding');
  const [address, setAddress] = useState('0');
  const [count, setCount] = useState('1');
  const [unit, setUnit] = useState('');
  const [scaleFactor, setScaleFactor] = useState('1');
  const [offset, setOffset] = useState('0');
  const [writable, setWritable] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await modbusApi.createRegister(deviceId, { name: name.trim(), registerType: regType, address: Number(address), count: Number(count), unit: unit.trim() || undefined, scaleFactor: Number(scaleFactor), offset: Number(offset), writable });
      showToast('Регистр создан', 'success');
      onSuccess();
      onClose();
    } catch {
      showToast('Не удалось создать регистр', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="fixed left-1/2 top-1/2 z-50 w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Добавить регистр</h3>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Название</span>
            <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={name} onChange={(e) => setName(e.target.value)} placeholder="Temperature" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Тип регистра</span>
            <select className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={regType} onChange={(e) => setRegType(e.target.value as ModbusRegisterType)}>
              {REGISTER_TYPES.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Адрес</span>
              <input type="number" min={0} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={address} onChange={(e) => setAddress(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Кол-во</span>
              <input type="number" min={1} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={count} onChange={(e) => setCount(e.target.value)} />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Единица</span>
            <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="°C" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Масштаб</span>
              <input type="number" step="any" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={scaleFactor} onChange={(e) => setScaleFactor(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Смещение</span>
              <input type="number" step="any" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={offset} onChange={(e) => setOffset(e.target.value)} />
            </label>
          </div>
          {(regType === 'holding' || regType === 'coil') && (
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={writable} onChange={(e) => setWritable(e.target.checked)} className="rounded" />
              Доступен для записи
            </label>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">Отмена</button>
          <button onClick={handleSubmit} disabled={!name.trim() || loading} className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{loading ? '…' : 'Добавить'}</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Write Register Modal ─────────────────────────────────────────────────────

function WriteRegisterModal({ deviceId, register, onClose }: { deviceId: string; register: ModbusRegisterResponse; onClose: () => void }) {
  const [value, setValue] = useState('');
  const [coil, setCoil] = useState(true);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleWrite = async () => {
    setLoading(true);
    try {
      if (register.registerType === 'coil') {
        await modbusApi.writeRegister(deviceId, register.id, { coil });
      } else {
        const trimmed = value.trim();
        if (trimmed.includes(',')) {
          await modbusApi.writeRegister(deviceId, register.id, { values: trimmed.split(',').map((v) => Number(v.trim())) });
        } else {
          await modbusApi.writeRegister(deviceId, register.id, { value: Number(trimmed) });
        }
      }
      showToast('Запись выполнена', 'success');
      onClose();
    } catch {
      showToast('Ошибка записи', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Запись в регистр</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{register.name} — addr {register.address}</p>
        <div className="mt-4">
          {register.registerType === 'coil' ? (
            <div className="flex gap-2">
              <button onClick={() => setCoil(true)} className={cn('flex-1 rounded-lg py-2 text-sm font-medium transition-colors', coil ? 'bg-emerald-600 text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800')}>ON</button>
              <button onClick={() => setCoil(false)} className={cn('flex-1 rounded-lg py-2 text-sm font-medium transition-colors', !coil ? 'bg-red-600 text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800')}>OFF</button>
            </div>
          ) : (
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{register.count > 1 ? 'Значения (через запятую)' : 'Значение'}</span>
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={value} onChange={(e) => setValue(e.target.value)} placeholder={register.count > 1 ? '1000, 2000' : '1000'} />
            </label>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">Отмена</button>
          <button onClick={handleWrite} disabled={loading || (register.registerType !== 'coil' && !value.trim())} className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{loading ? '…' : 'Записать'}</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Registers panel ──────────────────────────────────────────────────────────

function RegistersPanel({ device }: { device: ModbusDeviceResponse }) {
  const { showToast } = useToast();
  const [showAddRegister, setShowAddRegister] = useState(false);
  const [pendingDeleteReg, setPendingDeleteReg] = useState<ModbusRegisterResponse | null>(null);
  const [writingReg, setWritingReg] = useState<ModbusRegisterResponse | null>(null);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [deletingRegId, setDeletingRegId] = useState<string | null>(null);
  const [registers, setRegisters] = useState<ModbusRegisterResponse[]>([]);
  const [states, setStates] = useState<ModbusRegisterStateResponse[]>([]);
  const [regLoading, setRegLoading] = useState(true);

  const loadRegisters = useCallback(async () => {
    try {
      const data = await modbusApi.listRegisters(device.id);
      setRegisters(data);
    } catch {
      showToast('Ошибка загрузки регистров', 'error');
    } finally {
      setRegLoading(false);
    }
  }, [device.id]);

  const loadStates = useCallback(async () => {
    try {
      const data = await modbusApi.getDeviceStates(device.id);
      setStates(data);
    } catch {
      // silent
    }
  }, [device.id]);

  useEffect(() => {
    setRegLoading(true);
    loadRegisters();
    loadStates();
    const interval = setInterval(loadStates, 10_000);
    return () => clearInterval(interval);
  }, [loadRegisters, loadStates]);

  const stateMap = useMemo(
    () => new Map<string, ModbusRegisterStateResponse>(states.map((s) => [s.registerId, s])),
    [states],
  );

  const handleDeleteReg = async () => {
    if (!pendingDeleteReg) return;
    setDeletingRegId(pendingDeleteReg.id);
    try {
      await modbusApi.deleteRegister(device.id, pendingDeleteReg.id);
      showToast('Регистр удалён', 'success');
      setPendingDeleteReg(null);
      loadRegisters();
      loadStates();
    } catch {
      showToast('Ошибка удаления', 'error');
    } finally {
      setDeletingRegId(null);
    }
  };

  const handleRead = async (reg: ModbusRegisterResponse) => {
    setReadingId(reg.id);
    try {
      const result = await modbusApi.readRegister(device.id, reg.id);
      showToast(`Прочитано: ${result.scaledValues.join(', ')}`, 'success');
      loadStates();
    } catch {
      showToast('Ошибка чтения', 'error');
    } finally {
      setReadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {device.name}
          <span className="ml-2 text-xs font-normal text-slate-400">slave {device.slaveId}</span>
        </h2>
        <button onClick={() => setShowAddRegister(true)} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
          <Plus className="h-3.5 w-3.5" />
          Добавить регистр
        </button>
      </div>

      {regLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />)}
        </div>
      ) : registers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-2 text-3xl">📋</div>
          <p className="font-medium text-slate-700 dark:text-slate-300">Нет регистров</p>
          <p className="mt-1 text-xs text-slate-400">Добавьте регистр для чтения/записи данных</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Название</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Тип</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Адрес</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Ед.</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Значение</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Обновлено</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {registers.map((reg) => {
                const state = stateMap.get(reg.id);
                const displayValue = state ? state.scaledValues.map((v) => v.toFixed(2)).join(', ') : '—';
                return (
                  <tr key={reg.id} className="bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900">
                    <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-slate-100">{reg.name}</td>
                    <td className="px-3 py-2.5"><RegisterTypeBadge type={reg.registerType} /></td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400">{reg.address}{reg.count > 1 && <span className="text-slate-400"> ×{reg.count}</span>}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400">{reg.unit ?? '—'}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-700 dark:text-slate-300">{displayValue}{reg.unit && state && <span className="ml-0.5 text-slate-400"> {reg.unit}</span>}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-400">{formatTs(state?.timestamp)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleRead(reg)} disabled={readingId === reg.id} title="Прочитать" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-blue-400">
                          <RefreshCw className={cn('h-3.5 w-3.5', readingId === reg.id && 'animate-spin')} />
                        </button>
                        {reg.writable && (
                          <button onClick={() => setWritingReg(reg)} title="Записать" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800 dark:hover:text-amber-400">
                            <PencilLine className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => setPendingDeleteReg(reg)} title="Удалить" className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddRegister && (
        <AddRegisterModal
          deviceId={device.id}
          onClose={() => setShowAddRegister(false)}
          onSuccess={() => { loadRegisters(); loadStates(); }}
        />
      )}

      {pendingDeleteReg && (
        <ConfirmDialog
          title="Удалить регистр?"
          body={`Регистр «${pendingDeleteReg.name}» будет удалён безвозвратно.`}
          loading={!!deletingRegId}
          onConfirm={handleDeleteReg}
          onCancel={() => setPendingDeleteReg(null)}
        />
      )}

      {writingReg && (
        <WriteRegisterModal
          deviceId={device.id}
          register={writingReg}
          onClose={() => setWritingReg(null)}
        />
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function ModbusDevicesPanel() {
  const { showToast } = useToast();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [pendingDeleteDevice, setPendingDeleteDevice] = useState<ModbusDeviceResponse | null>(null);
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  const [devices, setDevices] = useState<ModbusDeviceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await modbusApi.listDevices();
      setDevices(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDevices(); }, [loadDevices]);

  const handleDeleteDevice = async () => {
    if (!pendingDeleteDevice) return;
    setDeletingDeviceId(pendingDeleteDevice.id);
    try {
      await modbusApi.deleteDevice(pendingDeleteDevice.id);
      showToast('Устройство удалено', 'success');
      if (selectedDeviceId === pendingDeleteDevice.id) setSelectedDeviceId(null);
      setPendingDeleteDevice(null);
      loadDevices();
    } catch {
      showToast('Не удалось удалить устройство', 'error');
    } finally {
      setDeletingDeviceId(null);
    }
  };

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) ?? null;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Sidebar: device list */}
        <div className="flex w-72 shrink-0 flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Modbus</h1>
            <button onClick={() => setShowAddDevice(true)} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
              <Plus className="h-3.5 w-3.5" />
              Добавить
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              Ошибка загрузки устройств
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />)}
            </div>
          ) : devices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-2 text-3xl">🔌</div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Нет устройств</p>
              <p className="mt-1 text-xs text-slate-400">Добавьте Modbus устройство</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDeviceId(device.id)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                    selectedDeviceId === device.id
                      ? 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 dark:hover:bg-slate-900',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{device.name}</span>
                      {device.enabled ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">slave {device.slaveId}</span>
                      {device.description && <span className="truncate text-xs text-slate-400 dark:text-slate-500">· {device.description}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={(e) => { e.stopPropagation(); setPendingDeleteDevice(device); }} title="Удалить" className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <ChevronRight className={cn('h-4 w-4 text-slate-400 transition-colors', selectedDeviceId === device.id && 'text-blue-500')} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Register detail panel */}
        <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          {selectedDevice ? (
            <RegistersPanel device={selectedDevice} />
          ) : (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <div className="mb-2 text-4xl">📡</div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Выберите устройство слева</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddDevice && (
        <AddDeviceModal
          onClose={() => setShowAddDevice(false)}
          onSuccess={loadDevices}
        />
      )}

      {pendingDeleteDevice && (
        <ConfirmDialog
          title="Удалить устройство?"
          body={`Устройство «${pendingDeleteDevice.name}» и все его регистры будут удалены.`}
          loading={!!deletingDeviceId}
          onConfirm={handleDeleteDevice}
          onCancel={() => setPendingDeleteDevice(null)}
        />
      )}
    </div>
  );
}
