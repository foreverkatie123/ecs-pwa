import { useQuery } from '@apollo/client';
import { useMemo } from 'react';
import { GET_ALL_DESIGN_OPTIONS } from '../graphql/queries';
import { toSelectOptions } from './design_field_options_types';

interface DefaultFormValues {
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
  [key: string]: string | undefined;
}

interface UseFormInitializationResult {
  // Default values for form fields
  defaultValues: DefaultFormValues;
  
  // All dropdown options (formatted for select components)
  options: {
    waterSource: Array<{ value: string; label: string }>;
    pressure: Array<{ value: string; label: string }>;
    meterSize: Array<{ value: string; label: string }>;
    sleeving: Array<{ value: string; label: string }>;
    mainline: Array<{ value: string; label: string }>;
    laterals: Array<{ value: string; label: string }>;
    controller: Array<{ value: string; label: string }>;
    systemType: Array<{ value: string; label: string }>;
  };
  
  // Loading and error states
  loading: boolean;
  error: any;
  
  // Helper functions
  createNewForm: () => DefaultFormValues;
  createFormFromTemplate: (templateValues: Partial<DefaultFormValues>) => DefaultFormValues;
}

/**
 * Hook to initialize forms with default values and options
 * Use this when creating a new template or starting a project from scratch
 * 
 * @example
 * const { defaultValues, options, loading, createNewForm } = useFormInitialization();
 * 
 * // Initialize a new form
 * const [formData, setFormData] = useState(createNewForm());
 * 
 * // Or initialize from a template
 * const formFromTemplate = createFormFromTemplate(existingTemplate);
 */
export const useFormInitialization = (): UseFormInitializationResult => {
  const { data, loading, error } = useQuery(
    GET_ALL_DESIGN_OPTIONS,
    {
      fetchPolicy: 'cache-first',
    }
  );

  // Memoize default values
  const defaultValues = useMemo<DefaultFormValues>(() => {
    if (!data?.defaultFormValues) {
      return {};
    }
    // If it's a string, parse it
    if (typeof data.defaultFormValues === 'string') {
      try {
        return JSON.parse(data.defaultFormValues);
      } catch (e) {
        console.error('Error parsing defaultFormValues:', e);
        return {};
      }
    }
    // If it's already an object, return it
    return data.defaultFormValues;
  }, [data?.defaultFormValues]);

  // Memoize all options
  const options = useMemo(() => {
    if (!data) {
      return {
        waterSource: [],
        pressure: [],
        meterSize: [],
        sleeving: [],
        mainline: [],
        laterals: [],
        controller: [],
        systemType: [],
      };
    }

    return {
      waterSource: toSelectOptions(data.waterSourceOptions || []),
      pressure: toSelectOptions(data.pressureOptions || []),
      meterSize: toSelectOptions(data.meterSizeOptions || []),
      sleeving: toSelectOptions(data.sleevingOptions || []),
      mainline: toSelectOptions(data.mainlineOptions || []),
      laterals: toSelectOptions(data.lateralsOptions || []),
      controller: toSelectOptions(data.controllerOptions || []),
      systemType: toSelectOptions(data.systemTypeOptions || []),
    };
  }, [data]);

  // Helper function to create a new form with defaults
  const createNewForm = (): DefaultFormValues => {
    return { ...defaultValues };
  };

  // Helper function to create form from template with defaults as fallback
  const createFormFromTemplate = (templateValues: Partial<DefaultFormValues>): DefaultFormValues => {
    return {
      ...defaultValues,
      ...templateValues,
    };
  };

  return {
    defaultValues,
    options,
    loading,
    error,
    createNewForm,
    createFormFromTemplate,
  };
};

/**
 * Simpler hook that just returns the default values
 * Use when you only need defaults without all the options
 * 
 * @example
 * const { defaultValues, loading } = useDefaultFormValues();
 */
export const useDefaultFormValues = () => {
  const { defaultValues, loading, error } = useFormInitialization();

  return {
    defaultValues,
    loading,
    error,
  };
};