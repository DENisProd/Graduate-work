'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@heroui/react';
import { AppWindow, DoorOpen } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/animate-ui/components/radix/accordion';
import { AnimatePresence, motion } from 'motion/react';
import { useRoomPlannerStore } from '@/store/room-planner-store';
import { useTranslation } from '@/hooks';
import { deviceTypesApi, physicalDevicesApi } from '@/lib/api-client';
import { getDisplayName } from '@/features/access-control/lib/utils';
import type { DeviceType } from '@/domain/room-planner';
import type { DeviceTypeResponse, PhysicalDeviceResponse } from '@/types/api';

export function CatalogPanel() {
  const { t, locale } = useTranslation();
  const catalog = useRoomPlannerStore((state) => state.catalog);
  const mode = useRoomPlannerStore((state) => state.mode);
  const houseId = useRoomPlannerStore((state) => state.houseId);
  const pendingDeviceType = useRoomPlannerStore((state) => state.pendingDeviceType);
  const setPendingDeviceType = useRoomPlannerStore((state) => state.setPendingDeviceType);
  const setMode = useRoomPlannerStore((state) => state.setMode);
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeResponse[]>([]);
  const [physicalDevices, setPhysicalDevices] = useState<PhysicalDeviceResponse[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [slideDirection, setSlideDirection] = useState(0);
  const categoriesInitialized = useRef(false);

  useEffect(() => {
    deviceTypesApi
      .getAll()
      .then((list) => setDeviceTypes(Array.isArray(list) ? list : []))
      .catch(() => setDeviceTypes([]));
  }, []);

  useEffect(() => {
    if (!houseId) {
      setPhysicalDevices([]);
      return;
    }
    setDevicesLoading(true);
    physicalDevicesApi
      .getAll({ houseId })
      .then((result) => {
        if (Array.isArray(result)) {
          setPhysicalDevices(result);
          return;
        }
        if (result && typeof result === 'object' && Array.isArray((result as { items?: unknown[] }).items)) {
          setPhysicalDevices((result as { items: PhysicalDeviceResponse[] }).items);
          return;
        }
        setPhysicalDevices([]);
      })
      .catch(() => setPhysicalDevices([]))
      .finally(() => setDevicesLoading(false));
  }, [houseId]);

  const deviceTypesById = useMemo(() => {
    const map = new Map<number, DeviceTypeResponse>();
    deviceTypes.forEach((item) => map.set(item.id, item));
    return map;
  }, [deviceTypes]);

  const devicesByType = useMemo(() => {
    return physicalDevices.reduce<Record<number, PhysicalDeviceResponse[]>>((acc, device) => {
      const typeId = device.deviceTypeId ?? 0;
      acc[typeId] ||= [];
      acc[typeId].push(device);
      return acc;
    }, {});
  }, [physicalDevices]);

  const categories = useMemo(() => {
    return Object.entries(devicesByType).map(([typeId, devices]) => {
      const numericId = Number(typeId);
      return {
        id: numericId,
        type: deviceTypesById.get(numericId),
        devices,
      };
    });
  }, [deviceTypesById, devicesByType]);

  useEffect(() => {
    if (!categoriesInitialized.current && categories.length > 0) {
      setOpenCategories(categories.map((category) => String(category.id)));
      categoriesInitialized.current = true;
    }
  }, [categories]);

  const toPlannerDeviceType = (deviceType: DeviceTypeResponse | undefined): DeviceType => {
    const source = `${deviceType?.code ?? ''} ${deviceType?.name ?? ''}`.toLowerCase();
    if (source.includes('socket') || source.includes('outlet') || source.includes('розет')) return 'socket';
    if (source.includes('switch') || source.includes('light') || source.includes('свет')) return 'switch';
    if (source.includes('motion') || source.includes('движ')) return 'motion-sensor';
    if (source.includes('temperature') || source.includes('thermo') || source.includes('темпера')) return 'temperature-sensor';
    if (source.includes('camera') || source.includes('камера')) return 'camera';
    if (source.includes('dimmer') || source.includes('диммер')) return 'dimmer';
    return 'socket';
  };

  const isHiddenMode = mode === 'walls' || mode === 'select' || mode === 'pan';
  const isOpeningsMode = mode === 'doors' || mode === 'windows';
  const prevIsOpeningsMode = useRef(isOpeningsMode);
  const contentVariants = {
    enter: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 28 : -28,
      filter: 'blur(4px)',
    }),
    center: {
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? -28 : 28,
      filter: 'blur(4px)',
    }),
  };

  useEffect(() => {
    if (prevIsOpeningsMode.current !== isOpeningsMode) {
      setSlideDirection(isOpeningsMode ? 1 : -1);
      prevIsOpeningsMode.current = isOpeningsMode;
    }
  }, [isOpeningsMode]);

  const handleDeviceClick = (type: DeviceType) => {
    if (pendingDeviceType === type) {
      setPendingDeviceType(null);
    } else {
      setPendingDeviceType(type);
      setMode('devices');
    }
  };

  const handleDragStart = (e: React.DragEvent, type: DeviceType) => {
    e.dataTransfer.setData('device-type', type);
    e.dataTransfer.effectAllowed = 'copy';
    setPendingDeviceType(type);
  };

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        width: isHiddenMode ? 0 : 300,
        opacity: isHiddenMode ? 0 : 1,
      }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-full overflow-hidden"
      style={{ pointerEvents: isHiddenMode ? 'none' : 'auto' }}
    >
      <Card className="w-[300px] h-full border border-border rounded-xl shadow-sm overflow-hidden">
        <Card.Header className="p-2 pb-0">
          <Card.Title className="text-sm font-semibold">
            {isOpeningsMode ? t('admin.roomPlanner.openingsCatalog') : t('admin.roomPlanner.catalog')}
          </Card.Title>
        </Card.Header>
        <Card.Content className="p-2 overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={slideDirection}>
            {isOpeningsMode ? (
              <motion.div
                key="openings-content"
                custom={slideDirection}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-2"
              >
                    <div
                      onClick={() => setMode('doors')}
                      className={`flex items-center gap-2 p-2 rounded-lg bg-muted/60 cursor-pointer transition-colors ${
                        mode === 'doors'
                          ? 'bg-accent/20'
                          : 'hover:bg-accent/10'
                      }`}
                    >
                      <DoorOpen className="size-5 text-muted-foreground" />
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-medium">{t('admin.roomPlanner.standardDoor')}</span>
                        <span className="text-xs text-muted-foreground">
                          {mode === 'doors'
                            ? t('admin.roomPlanner.selected')
                            : t('admin.roomPlanner.clickToSelect')}
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={() => setMode('windows')}
                      className={`flex items-center gap-2 p-2 rounded-lg bg-muted/60 cursor-pointer transition-colors ${
                        mode === 'windows'
                          ? 'bg-accent/20'
                          : 'hover:bg-accent/10'
                      }`}
                    >
                      <AppWindow className="size-5 text-muted-foreground" />
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-medium">{t('admin.roomPlanner.standardWindow')}</span>
                        <span className="text-xs text-muted-foreground">
                          {mode === 'windows'
                            ? t('admin.roomPlanner.selected')
                            : t('admin.roomPlanner.clickToSelect')}
                        </span>
                      </div>
                    </div>
              </motion.div>
            ) : (
              <motion.div
                key="devices-content"
                custom={slideDirection}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-2"
              >
                    {devicesLoading && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                        {t('admin.roomPlanner.loadingDevices')}
                      </div>
                    )}
                    {!devicesLoading && categories.length === 0 && (
                      <div className="text-xs text-muted-foreground">{t('admin.roomPlanner.noHouseDevices')}</div>
                    )}
                    {!devicesLoading && categories.length > 0 && (
                      <Accordion
                        type="multiple"
                        value={openCategories}
                        onValueChange={(value) => setOpenCategories(value as string[])}
                        className="space-y-2"
                      >
                        {categories.map((category) => {
                          const title =
                            getDisplayName(
                              category.type?.translations as Record<string, { name?: string }> | undefined,
                              category.type?.name,
                              category.type?.code,
                              locale
                            ) || `${t('admin.roomPlanner.deviceTypeFallback')} ${category.id}`;
                          return (
                            <AccordionItem key={category.id} value={String(category.id)} className="border-0">
                              <AccordionTrigger className="rounded bg-background px-2 py-1 text-sm font-medium hover:bg-accent/10">
                                <div className="flex w-full items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span>{title}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {category.devices.length}
                                    </span>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="mt-2 space-y-2 border-l border-border pl-3">
                                {category.devices.map((device) => {
                                  const plannerType = toPlannerDeviceType(category.type);
                                  const isSelected = pendingDeviceType === plannerType;
                                  return (
                                    <div
                                      key={device.id}
                                      onClick={() => handleDeviceClick(plannerType)}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, plannerType)}
                                      className={`flex items-center gap-2 p-2 rounded-lg bg-muted/60 cursor-pointer transition-colors ${
                                        isSelected
                                          ? 'bg-accent/20'
                                          : 'hover:bg-accent/10'
                                      }`}
                                    >
                                      <span className="text-xl">
                                        {catalog.items.find((item) => item.type === plannerType)?.icon ?? '📦'}
                                      </span>
                                      <div className="flex flex-col flex-1">
                                        <span className="text-sm font-medium">{device.name}</span>
                                        {device.description && (
                                          <span className="text-xs text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5 w-fit">
                                            {device.description}
                                          </span>
                                        )}
                                      </div>
                                      {isSelected && (
                                        <span className="text-xs text-muted-foreground">
                                          {t('admin.roomPlanner.clickCanvas')}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card.Content>
      </Card>
    </motion.div>
  );
}
