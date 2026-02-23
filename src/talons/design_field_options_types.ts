// Base interface for all option types
interface BaseOption {
  id: number;
  value: string;
  displayName: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

// Water Source Option
export interface WaterSourceOption extends BaseOption {
  description?: string;
}

// Pressure Option
export interface PressureOption extends BaseOption {
  minPsi?: number;
  maxPsi?: number;
}

// Meter Size Option
export interface MeterSizeOption extends BaseOption {
  sizeInches?: number;
  description?: string;
}

// Sleeving Option
export interface SleevingOption extends BaseOption {
  description?: string;
}

// Mainline Option
export interface MainlineOption extends BaseOption {
  material?: string;
  diameter?: string;
  description?: string;
}

// Laterals Option
export interface LateralsOption extends BaseOption {
  material?: string;
  diameter?: string;
  description?: string;
}

// Controller Option
export interface ControllerOption extends BaseOption {
  manufacturer?: string;
  modelNumber?: string;
  stationCount?: number;
  description?: string;
}

// Combined type for all design field options
export interface DesignFieldOptions {
  waterSourceOptions: WaterSourceOption[];
  pressureOptions: PressureOption[];
  meterSizeOptions: MeterSizeOption[];
  sleevingOptions: SleevingOption[];
  mainlineOptions: MainlineOption[];
  lateralsOptions: LateralsOption[];
  controllerOptions: ControllerOption[];
}

// Type for dropdown/select components
export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

// Helper function to convert option to SelectOption format
export const toSelectOption = (option: BaseOption & { description?: string }): SelectOption => ({
  value: option.value,
  label: option.displayName,
  description: option.description,
});

// Helper function to convert array of options to SelectOption array
export const toSelectOptions = <T extends BaseOption & { description?: string }>(
  options: T[]
): SelectOption[] => {
  return options
    .filter(opt => opt.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toSelectOption);
};