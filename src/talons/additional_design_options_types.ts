// =====================================================
// Additional Design Options - TypeScript Types
// =====================================================

import { BaseOption } from './design_field_options_types';

// Backflow Option
export interface BackflowOption extends BaseOption {
  manufacturer?: string;
  type?: string; // DC, RPZ, PVB
  description?: string;
}

// Bed Tree Irrigation Option
export interface BedTreeIrrigationOption extends BaseOption {
  description?: string;
}

// Bed Type Option
export interface BedTypeOption extends BaseOption {
  description?: string;
}

// Coupler Valve Option
export interface CouplerValveOption extends BaseOption {
  manufacturer?: string;
  description?: string;
}

// Drip Line Option
export interface DripLineOption extends BaseOption {
  flowRate?: string;
  spacing?: string;
  description?: string;
}

// Drip Valve Option
export interface DripValveOption extends BaseOption {
  manufacturer?: string;
  modelNumber?: string;
  description?: string;
}

// Field Rotor Option
export interface FieldRotorOption extends BaseOption {
  manufacturer?: string;
  modelNumber?: string;
  description?: string;
}

// MP Rotator Option
export interface MpRotatorOption extends BaseOption {
  manufacturer?: string;
  radius?: string;
  description?: string;
}

// Rain Sensor Option
export interface RainSensorOption extends BaseOption {
  connectionType?: string;
  weatherBased?: boolean;
  description?: string;
}

// Rotor Option
export interface RotorOption extends BaseOption {
  manufacturer?: string;
  description?: string;
}

// Specification Option
export interface SpecificationOption extends BaseOption {
  description?: string;
}

// Spray Option
export interface SprayOption extends BaseOption {
  manufacturer?: string;
  radius?: string;
  description?: string;
}

// Tree Irrigation Option
export interface TreeIrrigationOption extends BaseOption {
  manufacturer?: string;
  type?: string;
  description?: string;
}

// Valve Option
export interface ValveOption extends BaseOption {
  manufacturer?: string;
  modelNumber?: string;
  description?: string;
}

// =====================================================
// Complete Design Field Options (Extended)
// =====================================================

export interface CompleteDesignFieldOptions {
  // Original options
  waterSourceOptions: import('./design_field_options_types').WaterSourceOption[];
  pressureOptions: import('./design_field_options_types').PressureOption[];
  meterSizeOptions: import('./design_field_options_types').MeterSizeOption[];
  sleevingOptions: import('./design_field_options_types').SleevingOption[];
  mainlineOptions: import('./design_field_options_types').MainlineOption[];
  lateralsOptions: import('./design_field_options_types').LateralsOption[];
  controllerOptions: import('./design_field_options_types').ControllerOption[];
  systemTypeOptions: import('./design_field_defaults_types').SystemTypeOption[];
  
  // Additional options
  backflowOptions: BackflowOption[];
  bedTreeIrrigationOptions: BedTreeIrrigationOption[];
  bedTypeOptions: BedTypeOption[];
  couplerValveOptions: CouplerValveOption[];
  dripLineOptions: DripLineOption[];
  dripValveOptions: DripValveOption[];
  fieldRotorOptions: FieldRotorOption[];
  mpRotatorOptions: MpRotatorOption[];
  rainSensorOptions: RainSensorOption[];
  rotorOptions: RotorOption[];
  specificationOptions: SpecificationOption[];
  sprayOptions: SprayOption[];
  treeIrrigationOptions: TreeIrrigationOption[];
  valveOptions: ValveOption[];
}

// =====================================================
// Extended Default Form Values
// =====================================================

export interface ExtendedDefaultFormValues extends import('./design_field_defaults_types').DefaultFormValues {
  // Additional fields
  backflow?: string;
  bed_tree_irrigation?: string;
  bed_type?: string;
  coupler_valve?: string;
  drip_line?: string;
  drip_valve?: string;
  field_rotor?: string;
  mp_rotator?: string;
  rain_sensor?: string;
  rotor?: string;
  specification?: string;
  spray?: string;
  tree_irrigation?: string;
  valve?: string;
}