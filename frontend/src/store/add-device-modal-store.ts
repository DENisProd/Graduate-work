'use client';

import { create } from 'zustand';

export type AddDeviceStep = 1 | 2 | 3;

export interface AddDeviceFormData {
  deviceTypeId: number | null;
  deviceCategoryId: number | null;
  name: string;
  serialNumber: string;
  firmwareVersion: string;
}

const defaultFormData: AddDeviceFormData = {
  deviceTypeId: null,
  deviceCategoryId: null,
  name: '',
  serialNumber: '',
  firmwareVersion: '',
};

interface AddDeviceModalState {
  isOpen: boolean;
  houseId: string | null;
  step: AddDeviceStep;
  formData: AddDeviceFormData;
  isLoading: boolean;
}

interface AddDeviceModalActions {
  open: (houseId: string) => void;
  close: () => void;
  setStep: (step: AddDeviceStep) => void;
  setFormData: (data: Partial<AddDeviceFormData> | ((prev: AddDeviceFormData) => Partial<AddDeviceFormData>)) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState: AddDeviceModalState = {
  isOpen: false,
  houseId: null,
  step: 1,
  formData: defaultFormData,
  isLoading: false,
};

export const useAddDeviceModalStore = create<
  AddDeviceModalState & AddDeviceModalActions
>((set) => ({
  ...initialState,

  open: (houseId) =>
    set({
      isOpen: true,
      houseId,
      step: 1,
      formData: defaultFormData,
      isLoading: false,
    }),

  close: () =>
    set({
      isOpen: false,
      houseId: null,
      step: 1,
      formData: defaultFormData,
      isLoading: false,
    }),

  setStep: (step) => set({ step }),

  setFormData: (dataOrFn) =>
    set((s) => ({
      formData:
        typeof dataOrFn === 'function'
          ? { ...s.formData, ...dataOrFn(s.formData) }
          : { ...s.formData, ...dataOrFn },
    })),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set(initialState),
}));
