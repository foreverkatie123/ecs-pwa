// Design Field Default Value Type
export interface DesignFieldDefault {
  id: number;
  fieldName: string;
  fieldLabel: string;
  defaultValue: string | null;
  fieldType: 'text' | 'select' | 'number' | 'textarea' | 'checkbox';
  isRequired: boolean;
  placeholderText?: string;
  helpText?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Default form values object (key-value pairs)
export interface DefaultFormValues {
  water_source?: string;
  pressure?: string;
  meter_size?: string;
  sleeving?: string;
  mainline?: string;
  laterals?: string;
  controller?: string;
  zone_count?: string;
  flow_rate?: string;
  coverage_area?: string;
  head_spacing?: string;
  system_type?: string;
  design_notes?: string;
  [key: string]: string | undefined; // Allow for dynamic fields
}

// System Type Option
export interface SystemTypeOption {
  id: number;
  value: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

// Form field configuration (combines default value with metadata)
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'textarea' | 'checkbox';
  defaultValue: string | null;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  order: number;
}

// Complete form initialization data
export interface FormInitializationData {
  defaultFormValues: DefaultFormValues;
  waterSourceOptions: import('./design_field_options_types').WaterSourceOption[];
  pressureOptions: import('./design_field_options_types').PressureOption[];
  meterSizeOptions: import('./design_field_options_types').MeterSizeOption[];
  sleevingOptions: import('./design_field_options_types').SleevingOption[];
  mainlineOptions: import('./design_field_options_types').MainlineOption[];
  lateralsOptions: import('./design_field_options_types').LateralsOption[];
  controllerOptions: import('./design_field_options_types').ControllerOption[];
  systemTypeOptions: SystemTypeOption[];
}

// Helper function to convert DesignFieldDefault to FormFieldConfig
export const toFormFieldConfig = (fieldDefault: DesignFieldDefault): FormFieldConfig => ({
  name: fieldDefault.fieldName,
  label: fieldDefault.fieldLabel,
  type: fieldDefault.fieldType,
  defaultValue: fieldDefault.defaultValue,
  required: fieldDefault.isRequired,
  placeholder: fieldDefault.placeholderText,
  helpText: fieldDefault.helpText,
  order: fieldDefault.displayOrder,
});

// Helper function to create initial form state from defaults
export const createInitialFormState = (defaults: DefaultFormValues): DefaultFormValues => {
  return { ...defaults };
};

// Helper function to merge template values with defaults
export const mergeWithDefaults = (
  templateValues: Partial<DefaultFormValues>,
  defaults: DefaultFormValues
): DefaultFormValues => {
  return {
    ...defaults,
    ...templateValues,
  };
};