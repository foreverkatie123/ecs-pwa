import React, { useState, useEffect } from 'react';
import { CheckSquare, Upload, Trash2, Search, FileText } from 'lucide-react';
import Header from './../Header/Header';
import './../../styles.css';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client';
import { useFormInitialization } from '../../talons/useFormInitialization';
import { CREATE_PROJECT, CREATE_DESIGN_TEMPLATE, DELETE_DESIGN_TEMPLATE, UPLOAD_FILES } from '../../graphql/mutations';
import { GET_DESIGN_TEMPLATES, GET_BRANCHES, GET_P21_QUOTE, GET_ALL_DESIGN_OPTIONS } from '../../graphql/queries';
import CompanySearch from './CompanySearch';

interface ProjectFile {
  id: string;
  name: string;
  file: File | null;
}

interface IrrigationProjectFormProps {
  onSubmit?: (projectId: string) => void;
  onNavigate?: (page: 'home' | 'form' | 'details' | 'users') => void;
}

const IrrigationProjectForm: React.FC<IrrigationProjectFormProps> = ({ onSubmit, onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { data: branchesData, loading: branchesLoading } = useQuery(GET_BRANCHES);
  const [createProject, { loading: creatingProject }] = useMutation(CREATE_PROJECT);
  const [uploadFiles] = useMutation(UPLOAD_FILES);
  const [createTemplate] = useMutation(CREATE_DESIGN_TEMPLATE);
  const [deleteTemplate] = useMutation(DELETE_DESIGN_TEMPLATE);
  const { data: templatesData, refetch: refetchTemplates } = useQuery(GET_DESIGN_TEMPLATES);
  const [getP21Quote, { loading: checkingQuote }] = useLazyQuery(GET_P21_QUOTE);
  const [branches, setBranches] = useState([]);
  const { defaultValues, options, loading: formLoading, createNewForm } = useFormInitialization();
  const [formData, setFormData] = useState(createNewForm());
  const { data: designOptionsData, loading: designOptionsLoading, error: designOptionsError } = useQuery(GET_ALL_DESIGN_OPTIONS);
  
  const [services, setServices] = useState({
    irrigationDesign: false,
    landscapeMaterials: false,
    lighting: false,
    drainage: false,
    hardscape: false,
    government: false,
  });
  
  const [projectInfo, setProjectInfo] = useState({
    projectName: '',
    planName: '',
    address1: '',
    address2: '',
    city: '',
    state: 'Select a state',
    zipcode: '',
    bidDate: '',
    dueDate: '',
    zoneCount: 'Small',
    existingQuote: '',
    projectNotes: '',
  });
  
  const [contactInfo, setContactInfo] = useState({
    companyName: '',
    accountNumber: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    preferredBranch: '',
    ewingRepresentative: '',
  });
  
  const [files, setFiles] = useState<{
    originalPlans: ProjectFile[];
    specifications: ProjectFile[];
    addenda: ProjectFile[];
  }>({
    originalPlans: [],
    specifications: [],
    addenda: [],
  });

  const [designDetails, setDesignDetails] = useState({
    waterSource: 'Select an option',
    pressure: 'Select an option',
    meterSize: 'Select an option',
    mainline: 'Select an option',
    sleeving: 'Select an option',
    lateralPipe: '',
    controller: '',
    backflow: '',
    valves: '',
    quickCoupler: '',
    rainSensor: '',
    dripKits: '',
    sprays: '',
    rotators: '',
    rotors: '',
    fieldRotors: '',
    treesInTurf: '',
    nonTurfTrees: '',
    plantingBeds: '',
    designNotes: '',
    prioritizeDetails: false,
    templateName: ''
  });

  const [templates, setTemplates] = useState([]);

  // Load templates from GraphQL
  useEffect(() => {
    if (templatesData?.designTemplates) {
      setTemplates(templatesData.designTemplates);
    }
  }, [templatesData]);

  useEffect(() => {
    if (branchesData?.branches) {
      setBranches(branchesData.branches);
    }
  }, [branchesData]);

  const handleSaveTemplate = async () => {
    if (!designDetails.templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      // Create the template data object matching the table structure
      const templateData = {
        name: designDetails.templateName,
        waterSource: designDetails.waterSource,
        pressure: designDetails.pressure,
        size: designDetails.meterSize,
        sleeving: designDetails.sleeving,
        mainline: designDetails.mainline,
        laterals: designDetails.lateralPipe,
        controller: designDetails.controller,
        backflow: designDetails.backflow,
        valves: designDetails.valves,
        quickCoupler: designDetails.quickCoupler,
        rainSensor: designDetails.rainSensor,
        dripKits: designDetails.dripKits,
        sprays: designDetails.sprays,
        rotators: designDetails.rotators,
        rotors: designDetails.rotors,
        fieldRotors: designDetails.fieldRotors,
        treesInTurf: designDetails.treesInTurf,
        nonTurfTrees: designDetails.nonTurfTrees,
        plantingBeds: designDetails.plantingBeds,
        designNotes: designDetails.designNotes,
        prioritizeDetails: designDetails.prioritizeDetails
      };

      console.log('Saving template with data:', {
        name: designDetails.templateName,
        designDetails: JSON.stringify(templateData)
      });

      const result = await createTemplate({
        variables: {
          name: designDetails.templateName,
          designDetails: JSON.stringify(templateData)
        }
      });

      console.log('Template save result:', result);

      alert('Template saved successfully!');
      
      // Clear the template name
      setDesignDetails({ ...designDetails, templateName: '' });
      
      // Refresh the templates list
      await refetchTemplates();
      
    } catch (error) {
      console.error('Error saving template:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      alert('Failed to save template: ' + (error.message || 'Unknown error'));
    }
  };

  const steps = [
    { num: 1, label: 'Project Info' },
    { num: 2, label: 'Project Files' },
    { num: 3, label: 'Design Details' },
    { num: 4, label: 'Submit Request' },
  ];

  const handleFileUpload = (category: keyof typeof files, e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (uploadedFiles) {
      const newFiles = Array.from(uploadedFiles).map((file, idx) => ({
        id: Date.now().toString() + idx,
        name: file.name,
        file: file,
      }));
      setFiles(prev => ({
        ...prev,
        [category]: [...prev[category], ...newFiles],
      }));
    }
  };

  const removeFile = (category: keyof typeof files, id: string) => {
    setFiles(prev => ({
      ...prev,
      [category]: prev[category].filter(f => f.id !== id),
    }));
  };

  // Validate Step 1 fields
  const validateStep1 = async (): Promise<boolean> => {
    // Check required fields
    if (!projectInfo.projectName.trim()) {
      alert('Please enter a Project Name');
      return false;
    }

    if (!projectInfo.planName.trim()) {
      alert('Please enter a Plan Name');
      return false;
    }

    if (!contactInfo.companyName.trim()) {
      alert('Please enter a Company Name');
      return false;
    }

    if (!contactInfo.contactName.trim()) {
      alert('Please select a Contact');
      return false;
    }

    if (!contactInfo.ewingRepresentative.trim()) {
      alert('Please enter an Ewing Representative');
      return false;
    }

    if (!projectInfo.existingQuote.trim()) {
      alert('Please enter a value for "Do you have an existing Ewing Quote for this project?" (enter "No" if you don\'t have one)');
      return false;
    }

    // Check if existing quote contains numbers
    const quoteValue = projectInfo.existingQuote.trim();
    const containsNumbers = /\d/.test(quoteValue);
    
    if (containsNumbers && quoteValue.toLowerCase() !== 'no') {
      // Extract quote number (remove non-numeric characters)
      const quoteNumber = quoteValue.replace(/\D/g, '');
      
      if (quoteNumber) {
        try {
          const { data } = await getP21Quote({
            variables: { quoteNumber }
          });

          if (!data?.p21Quote) {
            alert(`Quote number "${quoteValue}" was not found in P21. Please verify the quote number or enter "No" if you don't have one.`);
            return false;
          }
        } catch (error) {
          console.error('Error checking P21 quote:', error);
          alert('Error validating quote number. Please try again.');
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    try {
      // Step 1: Create the project WITHOUT files
      const variables = {
        projectInfo: {
          projectName: projectInfo.projectName,
          planName: projectInfo.planName,
          address1: projectInfo.address1,
          address2: projectInfo.address2 || null,
          city: projectInfo.city,
          state: projectInfo.state,
          zipcode: projectInfo.zipcode,
          bidDate: projectInfo.bidDate || null,
          dueDate: projectInfo.dueDate || null,
          zoneCount: projectInfo.zoneCount ? parseInt(projectInfo.zoneCount) : null,
          existingQuote: projectInfo.existingQuote || null,
          projectNotes: projectInfo.projectNotes || null,
        },
        contactInfo: {
          companyName: contactInfo.companyName,
          accountNumber: contactInfo.accountNumber,
          contactName: contactInfo.contactName || null,
          contactEmail: contactInfo.contactEmail || null,
          contactPhone: contactInfo.contactPhone || null,
          preferredBranch: contactInfo.preferredBranch || null,
          ewingRepresentative: contactInfo.ewingRepresentative || null,
        },
        services: {
          irrigationDesign: Boolean(services.irrigationDesign),
          landscapeMaterials: Boolean(services.landscapeMaterials),
          lighting: Boolean(services.lighting),
          drainage: Boolean(services.drainage),
          hardscape: Boolean(services.hardscape),
        },
        designDetails: {
          waterSource: designDetails.waterSource || null,
          pressure: designDetails.pressure || null,
          meterSize: designDetails.meterSize || null,
          mainline: designDetails.mainline || null,
          sleeving: designDetails.sleeving || null,
          lateralPipe: designDetails.lateralPipe || null,
          controller: designDetails.controller || null,
          backflow: designDetails.backflow || null,
          valves: designDetails.valves || null,
          quickCoupler: designDetails.quickCoupler || null,
          rainSensor: designDetails.rainSensor || null,
          dripKits: designDetails.dripKits || null,
          sprays: designDetails.sprays || null,
          rotators: designDetails.rotators || null,
          rotors: designDetails.rotors || null,
          fieldRotors: designDetails.fieldRotors || null,
          treesInTurf: designDetails.treesInTurf || null,
          nonTurfTrees: designDetails.nonTurfTrees || null,
          plantingBeds: designDetails.plantingBeds || null,
          designNotes: designDetails.designNotes || null,
          prioritizeDetails: Boolean(designDetails.prioritizeDetails),
          templateName: designDetails.templateName || null,
        },
      };

      console.log('Submitting with variables:', variables);

      // Create the project in the database
      const { data } = await createProject({
        variables: variables
      });

      console.log('Project created:', data);

      const projectId = data.createProject.id;

      // Step 2: Upload all files to Azure Blob Storage (if any files exist)
      const allFiles = [
        ...files.originalPlans.map(f => ({ ...f, category: 'originalPlans' })),
        ...files.specifications.map(f => ({ ...f, category: 'specifications' })),
        ...files.addenda.map(f => ({ ...f, category: 'addenda' })),
      ];

      if (allFiles.length > 0) {
        // Prepare file data for GraphQL mutation
        const fileInputs = await Promise.all(
          allFiles.map(async (fileItem) => {
            if (!fileItem.file) return null;
            
            // Convert file to base64
            const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                // Remove the data URL prefix
                const base64 = result.split(',')[1];
                resolve(base64);
              };
              reader.onerror = reject;
              reader.readAsDataURL(fileItem.file);
            });
            
            return {
              category: fileItem.category,
              fileName: fileItem.name,
              fileData: base64Data,
            };
          })
        );

        // Filter out null values
        const validFileInputs = fileInputs.filter(f => f !== null);

        // Upload files via separate GraphQL mutation
        if (validFileInputs.length > 0) {
          try {
            await uploadFiles({
              variables: {
                projectId,
                files: validFileInputs,
              },
            });
            console.log(`Successfully uploaded ${validFileInputs.length} file(s)`);
          } catch (uploadError) {
            console.error('Failed to upload files:', uploadError);
            // Don't throw error here - project was created successfully
            alert(`Project created successfully (Project Name: ${projectInfo.projectName}), but some files failed to upload. You can upload them later.`);
          }
        }
      }

      alert(`Project submitted successfully! Project Name: ${projectInfo.projectName}`);
      
      if (onSubmit) {
        onSubmit(projectId);
      }
      
    } catch (error) {
      console.error('Error submitting project:', error);
      if (error.graphQLErrors) {
        console.error('GraphQL errors:', error.graphQLErrors);
      }
      if (error.networkError) {
        console.error('Network error:', error.networkError);
      }
      alert('Failed to submit project. Please try again.');
    }
  };

  const [filters, setFilters] = useState({
    name: '',
    waterSource: '',
    pressure: '',
    size: 'All',
    sleeving: '',
    mainline: '',
    laterals: 'All',
    controller: ''
  });

  const US_STATE_CODES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredTemplates = templates.filter((template: any) => {
    // Parse the design details if it's a string
    let details: any = {};
    try {
      if (template.designDetails) {
        details = typeof template.designDetails === 'string' 
          ? JSON.parse(template.designDetails) 
          : template.designDetails;
      }
    } catch (e) {
      return false; // exclude malformed templates
    }
    
    return (
      (filters.name === '' || template.name.toLowerCase().includes(filters.name.toLowerCase())) &&
      (filters.waterSource === '' || (details.waterSource || '').toLowerCase().includes(filters.waterSource.toLowerCase())) &&
      (filters.pressure === '' || (details.pressure || '').includes(filters.pressure)) &&
      (filters.size === 'All' || details.size === filters.size || details.meterSize === filters.size) &&
      (filters.sleeving === '' || (details.sleeving || '').toLowerCase().includes(filters.sleeving.toLowerCase())) &&
      (filters.mainline === '' || (details.mainline || '').toLowerCase().includes(filters.mainline.toLowerCase())) &&
      (filters.laterals === 'All' || (details.laterals || details.lateralPipe || '').toLowerCase().includes(filters.laterals.toLowerCase())) &&
      (filters.controller === '' || (details.controller || '').toLowerCase().includes(filters.controller.toLowerCase()))
    );
  });

  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  // Handle continue button with validation
  const handleContinue = async () => {
    if (currentStep === 1) {
      const isValid = await validateStep1();
      if (!isValid) {
        return;
      }
    }
    setCurrentStep(currentStep + 1);

    //if only one contact looks like auto selects but doesnt actually -- need to fix
  };

  const renderStep1 = () => (
    <div className="form-content">
      <div className="form-section">
        <h2 className="section-title">Check all the services you would like to request:</h2>
        
        <div className="checkbox-list">
          <label className="checkbox-item">
            <input type="checkbox" checked={services.irrigationDesign} onChange={(e) => setServices({ ...services, irrigationDesign: e.target.checked })} />
            <span>Irrigation Design</span>
          </label>
          
          <label className="checkbox-item">
            <input type="checkbox" checked={services.landscapeMaterials} onChange={(e) => setServices({ ...services, landscapeMaterials: e.target.checked })} />
            <span>Landscape Materials</span>
          </label>
          
          <label className="checkbox-item">
            <input type="checkbox" checked={services.lighting} onChange={(e) => setServices({ ...services, lighting: e.target.checked })} />
            <span>Lighting</span>
          </label>

          <label className="checkbox-item">
            <input type="checkbox" checked={services.drainage} onChange={(e) => setServices({ ...services, drainage: e.target.checked })} />
            <span>Drainage</span>
          </label>

          <label className="checkbox-item">
            <input type="checkbox" checked={services.hardscape} onChange={(e) => setServices({ ...services, hardscape: e.target.checked })} />
            <span>Hardscape</span>
          </label>

          <label className="checkbox-item">
            <input type="checkbox" checked={services.government} onChange={(e) => setServices({ ...services, government: e.target.checked })} />
            <span>Government</span>
          </label>
          
          <label className="checkbox-item">
            <input type="checkbox" checked={services.irrigationDesign && services.landscapeMaterials && services.lighting && services.drainage && services.hardscape && services.government} onChange={(e) => setServices({ irrigationDesign: e.target.checked, landscapeMaterials: e.target.checked, lighting: e.target.checked, drainage: e.target.checked, hardscape: e.target.checked, government: e.target.checked })} />
            <span>Check All</span>
          </label>
        </div>
      </div>

      <div className="form-section">
        <h2 className="section-title">Tell Us About Your Project</h2>
        <div className="subsection-title">Site Information</div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Project Name <span style={{ color: 'red' }}>*</span></label>
            <input type="text" value={projectInfo.projectName} onChange={(e) => setProjectInfo({ ...projectInfo, projectName: e.target.value })} className="form-input" placeholder="Central Park" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Plan Name <span style={{ color: 'red' }}>*</span></label>
            <input type="text" value={projectInfo.planName} onChange={(e) => setProjectInfo({ ...projectInfo, planName: e.target.value })} className="form-input" placeholder="Greenward Plan" />
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Address Line 1</label>
          <input type="text" value={projectInfo.address1} onChange={(e) => setProjectInfo({ ...projectInfo, address1: e.target.value })} className="form-input" placeholder="1234 East Main Street" />
        </div>
        
        <div className="form-group">
          <label className="form-label">Address Line 2</label>
          <input type="text" value={projectInfo.address2} onChange={(e) => setProjectInfo({ ...projectInfo, address2: e.target.value })} className="form-input" placeholder="Suite 200" />
        </div>
        
        <div className="form-group">
          <label className="form-label">City</label>
          <input type="text" value={projectInfo.city} onChange={(e) => setProjectInfo({ ...projectInfo, city: e.target.value })} className="form-input" placeholder="New York" />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">State</label>
            <select 
              value={projectInfo.state} 
              onChange={(e) => setProjectInfo({ ...projectInfo, state: e.target.value })} 
              className="form-select"
            >
              <option value="">Select a state</option>
              {US_STATE_CODES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Zipcode</label>
            <input type="text" value={projectInfo.zipcode} onChange={(e) => setProjectInfo({ ...projectInfo, zipcode: e.target.value })} className="form-input" placeholder="10019" />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Project BID Date</label>
            <input type="date" value={projectInfo.bidDate} onChange={(e) => setProjectInfo({ ...projectInfo, bidDate: e.target.value })} className="form-input" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Project DUE Date</label>
            <input type="date" value={projectInfo.dueDate} onChange={(e) => setProjectInfo({ ...projectInfo, dueDate: e.target.value })} className="form-input" />
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Estimated Project Size</label>
          <select value={projectInfo.zoneCount} onChange={(e) => setProjectInfo({ ...projectInfo, zoneCount: e.target.value })} className="form-select">
            <option>Small</option>
            <option>Medium</option>
            <option>Large</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Do you have an existing Ewing Quote for this project? If so, enter the quote number here. <span style={{ color: 'red' }}>*</span></label>
          <input type="text" value={projectInfo.existingQuote} onChange={(e) => setProjectInfo({ ...projectInfo, existingQuote: e.target.value })} className="form-input" placeholder="No" />
        </div>
        
        <div className="form-group">
          <label className="form-label">Project Notes</label>
          <textarea value={projectInfo.projectNotes} onChange={(e) => setProjectInfo({ ...projectInfo, projectNotes: e.target.value })} className="form-textarea" rows={4} placeholder="Please describe your project." />
        </div>
      </div>

      <div className="form-section">
        <h2 className="section-title">Customer Information</h2>
        
        <div className="form-row">
          <CompanySearch
            onCustomerSelect={(customer, contact) => {
              setContactInfo({
                companyName: customer.customer_name,
                accountNumber: customer.customer_id,
                contactName: contact?.name || '',
                contactEmail: contact?.email || '',
                contactPhone: contact?.phone || customer.central_phone_number || '',
                preferredBranch: customer.default_branch || '',
                ewingRepresentative: customer.salesrep_display_name || '',
              });
            }}
          />
        </div>
        <br />
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Preferred Branch</label>
            <select 
              value={contactInfo.preferredBranch} 
              onChange={(e) => setContactInfo({ ...contactInfo, preferredBranch: e.target.value })} 
              className="form-select"
              disabled={branchesLoading}
            >
              <option value="">Select a branch</option>
              {branches.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {branch.branchId} - {branch.description}
                </option>
              ))}
            </select>
            {branchesLoading && (
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Loading branches
              </p>
            )}
          </div>
          
          <div className="form-group">
            <label className="form-label">Ewing Representative <span style={{ color: 'red' }}>*</span></label>
            <input 
              type="text" 
              value={contactInfo.ewingRepresentative} 
              onChange={(e) => setContactInfo({ ...contactInfo, ewingRepresentative: e.target.value })}
              className="form-input" 
              placeholder="Enter representative name"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="form-content">
      <p className="section-subtitle">Choose or drag the appropriate project files into each section as needed.</p>
      
      {[
        { key: 'originalPlans', title: '1. Original Project Plans' },
        { key: 'specifications', title: '2. Specifications' },
        { key: 'addenda', title: '3. Addenda' }
      ].map(({ key, title }) => (
        <div key={key} className="file-upload-section">
          <div className="header-container">
            <div className="file-section-header">
              <h3>{title}</h3>
            </div>
            <div className="upload-section-header">
              <h3>Uploaded Files</h3>
            </div>
          </div>
          
          <div className="file-upload-grid">
            <label className="upload-area">
              <div className="upload-icon">
                <Upload size={48} color="#0099d8" />
              </div>
              <p className="upload-text"><span className="upload-link">Click to upload</span></p>
              <p className="upload-formats">File Types: .cad .pdf .png .jpg .doc .csv | Max File Size: 100MB</p>
              <input type="file" multiple accept=".jpg,.jpeg,.pdf,.png,.cad,.doc,.csv" onChange={(e) => handleFileUpload(key as keyof typeof files, e)} />
            </label>
            
            <div className="uploaded-files">
              {files[key as keyof typeof files].map(file => (
                <div key={file.id} className="file-item">
                  <span className="file-name">{file.name}</span>
                  <button onClick={() => removeFile(key as keyof typeof files, file.id)} className="delete-button">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep3 = () => (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px', color: '#1a1a1a' }}>
        Irrigation Design Request
      </h2>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px', lineHeight: '1.6' }}>
        Please supply any additional or supplemental specs for the irrigation design.<br />
        Click on a template from the table to load it or start a new entry. You can save your current entry as a template at the end of the design details.
      </p>

      <div style={{ overflowX: 'auto', marginBottom: '48px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#0099d8', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Water Source</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Pressure (PSI)</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Size (in)</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Sleeving</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Mainline</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Laterals</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Controller</th>
            </tr>
          </thead>
          <tbody>
            {/* Filter Row */}
            <tr style={{ backgroundColor: 'white' }}>
              <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                <input 
                  type="text" 
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                  placeholder="Filter..."
                  style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} 
                />
              </td>
              <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                <input 
                  type="text" 
                  value={filters.waterSource}
                  onChange={(e) => handleFilterChange('waterSource', e.target.value)}
                  placeholder="Filter..."
                  style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} 
                />
              </td>
              <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                <input 
                  type="text" 
                  value={filters.pressure}
                  onChange={(e) => handleFilterChange('pressure', e.target.value)}
                  placeholder="Filter..."
                  style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} 
                />
              </td>
              <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                <select 
                  value={filters.size}
                  onChange={(e) => handleFilterChange('size', e.target.value)}
                  style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
                >
                  <option>All</option>
                  <option>1</option>
                  <option>2</option>
                  <option>3/4</option>
                </select>
              </td>
              <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                <input 
                  type="text" 
                  value={filters.sleeving}
                  onChange={(e) => handleFilterChange('sleeving', e.target.value)}
                  placeholder="Filter..."
                  style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} 
                />
              </td>
              <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                <input 
                  type="text" 
                  value={filters.mainline}
                  onChange={(e) => handleFilterChange('mainline', e.target.value)}
                  placeholder="Filter..."
                  style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} 
                />
              </td>
              <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                <select 
                  value={filters.laterals}
                  onChange={(e) => handleFilterChange('laterals', e.target.value)}
                  style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
                >
                  <option>All</option>
                  <option>Flex 80</option>
                </select>
              </td>
              <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                <input 
                  type="text" 
                  value={filters.controller}
                  onChange={(e) => handleFilterChange('controller', e.target.value)}
                  placeholder="Filter..."
                  style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} 
                />
              </td>
            </tr>
            
            {/* Template Rows */}
            {filteredTemplates.map((template: any) => {
              // Parse the design details
              let details: any = {};
              try {
                if (template.designDetails) {
                  details = typeof template.designDetails === 'string' 
                    ? JSON.parse(template.designDetails) 
                    : template.designDetails;
                }
              } catch (e) {
                console.error('Failed to parse designDetails for template:', template.id, e);
              }
              
              return (
                <tr
                  key={template.id}
                  onClick={() => {
                    setSelectedRow(template.id);
                    
                    setDesignDetails({
                      waterSource: details.waterSource || '',
                      pressure: details.pressure || '',
                      meterSize: details.size || details.meterSize || '',
                      mainline: details.mainline || '',
                      sleeving: details.sleeving || '',
                      lateralPipe: details.laterals || details.lateralPipe || '',
                      controller: details.controller || '',
                      backflow: details.backflow || '',
                      valves: details.valves || '',
                      quickCoupler: details.quickCoupler || '',
                      rainSensor: details.rainSensor || '',
                      dripKits: details.dripKits || '',
                      sprays: details.sprays || '',
                      rotators: details.rotators || '',
                      rotors: details.rotors || '',
                      fieldRotors: details.fieldRotors || '',
                      treesInTurf: details.treesInTurf || '',
                      nonTurfTrees: details.nonTurfTrees || '',
                      plantingBeds: details.plantingBeds || '',
                      designNotes: details.designNotes || '',
                      prioritizeDetails: details.prioritizeDetails || false,
                      templateName: ''
                    });
                  }}
                  style={{
                    backgroundColor:
                      selectedRow === template.id
                        ? '#dbeafe'
                        : template.id % 2 === 0
                          ? '#f9fafb'
                          : 'white',
                    cursor: 'pointer'
                  }}
                >
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{template.name}</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{details.waterSource || ''}</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{details.pressure || ''}</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{details.size || details.meterSize || ''}</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{details.sleeving || ''}</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{details.mainline || ''}</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{details.laterals || details.lateralPipe || ''}</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{details.controller || ''}</td>
                </tr>
              );
            })}

            {filteredTemplates.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                  No templates match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Design Details Form - Rest of step 3 remains the same */}
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: '#1a1a1a' }}>
        Design Details - New
      </h2>

      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>
        Source, Pipe & Controller
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Water Source</label>
          <select 
            value={designDetails.waterSource} 
            onChange={(e) => setDesignDetails({ ...designDetails, waterSource: e.target.value })} 
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            disabled={designOptionsLoading}
          >
            <option value="">Select an option</option>
            {designOptionsData?.waterSourceOptions
              ?.filter(option => option.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(option => (
                <option key={option.id} value={option.value}>
                  {option.displayName}
                </option>
              ))
              
            }
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Pressure (PSI)</label>
          <select 
            value={designDetails.pressure} 
            onChange={(e) => setDesignDetails({ ...designDetails, pressure: e.target.value })} 
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            disabled={designOptionsLoading}
          >
            <option value="">Select an option</option>
            {designOptionsData?.pressureOptions
              ?.filter(option => option.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(option => (
                <option key={option.id} value={option.value}>
                  {option.displayName}
                </option>
              ))
              
            }
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Meter Size</label>
          <select 
            value={designDetails.meterSize} 
            onChange={(e) => setDesignDetails({ ...designDetails, meterSize: e.target.value })} 
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            disabled={designOptionsLoading}
          >
            <option value="">Select an option</option>
            {designOptionsData?.meterSizeOptions
              ?.filter(option => option.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(option => (
                <option key={option.id} value={option.value}>
                  {option.displayName}
                </option>
              ))
              
            }
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Mainline</label>
          <select 
            value={designDetails.mainline} 
            onChange={(e) => setDesignDetails({ ...designDetails, mainline: e.target.value })} 
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            disabled={designOptionsLoading}
          >
            <option value="">Select an option</option>
            {designOptionsData?.mainlineOptions
              ?.filter(option => option.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(option => (
                <option key={option.id} value={option.value}>
                  {option.displayName}
                </option>
              ))
              
            }
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Sleeving</label>
          <select 
            value={designDetails.sleeving} 
            onChange={(e) => setDesignDetails({ ...designDetails, sleeving: e.target.value })} 
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            disabled={designOptionsLoading}
          >
            <option value="">Select an option</option>
            {designOptionsData?.sleevingOptions
              ?.filter(option => option.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(option => (
                <option key={option.id} value={option.value}>
                  {option.displayName}
                </option>
              ))
              
            }
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Lateral Pipe</label>
          <select 
            value={designDetails.lateralPipe} 
            onChange={(e) => setDesignDetails({ ...designDetails, lateralPipe: e.target.value })} 
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            disabled={designOptionsLoading}
          >
            <option value="">Select an option</option>
            {designOptionsData?.lateralsOptions
              ?.filter(option => option.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(option => (
                <option key={option.id} value={option.value}>
                  {option.displayName}
                </option>
              ))
              
            }
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Controller</label>
        <select 
            value={designDetails.controller} 
            onChange={(e) => setDesignDetails({ ...designDetails, controller: e.target.value })} 
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            disabled={designOptionsLoading}
          >
            <option value="">Select an option</option>
            {designOptionsData?.controllerOptions
              ?.filter(option => option.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(option => (
                <option key={option.id} value={option.value}>
                  {option.displayName}
                </option>
              ))
              
            }
          </select>
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>
        Water Delivery & Sensors
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Backflow</label>
          <select 
            value={designDetails.backflow} 
            onChange={(e) => setDesignDetails({ ...designDetails, backflow: e.target.value })} 
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            disabled={designOptionsLoading}
          >
            <option value="">Select an option</option>
            {designOptionsData?.backflowOptions
              ?.filter(option => option.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(option => (
                <option key={option.id} value={option.value}>
                  {option.displayName}
                </option>
              ))
              
            }
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Valves</label>
          <select 
            value={designDetails.valves} 
            onChange={(e) => setDesignDetails({ ...designDetails, valves: e.target.value })} 
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            disabled={designOptionsLoading}
          >
            <option value="">Select an option</option>
            {designOptionsData?.valveOptions
              ?.filter(option => option.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(option => (
                <option key={option.id} value={option.value}>
                  {option.displayName}
                </option>
              ))
              
            }
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Quick Coupler</label>
          <select 
            value={designDetails.quickCoupler} 
            onChange={(e) => setDesignDetails({ ...designDetails, quickCoupler: e.target.value })} 
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            disabled={designOptionsLoading}
          >
            <option value="">Select an option</option>
            {designOptionsData?.couplerValveOptions
              ?.filter(option => option.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(option => (
                <option key={option.id} value={option.value}>
                  {option.displayName}
                </option>
              ))
              
            }
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Rain Sensor</label>
          <select 
            value={designDetails.rainSensor} 
            onChange={(e) => setDesignDetails({ ...designDetails, rainSensor: e.target.value })} 
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            disabled={designOptionsLoading}
          >
            <option value="">Select an option</option>
            {designOptionsData?.rainSensorOptions
              ?.filter(option => option.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(option => (
                <option key={option.id} value={option.value}>
                  {option.displayName}
                </option>
              ))
              
            }
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Drip Kits</label>
          <select 
            value={designDetails.dripKits} 
            onChange={(e) => setDesignDetails({ ...designDetails, dripKits: e.target.value })} 
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            disabled={designOptionsLoading}
          >
            <option value="">Select an option</option>
            {designOptionsData?.dripValveOptions
              ?.filter(option => option.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(option => (
                <option key={option.id} value={option.value}>
                  {option.displayName}
                </option>
              ))
              
            }
          </select>
        </div>
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>
        Turf Areas
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Sprays</label>
          <select 
            value={designDetails.sprays} 
            onChange={(e) => setDesignDetails({ ...designDetails, sprays: e.target.value })} 
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            disabled={designOptionsLoading}
          >
            <option value="">Select an option</option>
            {designOptionsData?.sprayOptions
              ?.filter(option => option.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(option => (
                <option key={option.id} value={option.value}>
                  {option.displayName}
                </option>
              ))
              
            }
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Rotators</label>
          <select 
            value={designDetails.rotators} 
            onChange={(e) => setDesignDetails({ ...designDetails, rotators: e.target.value })} 
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            disabled={designOptionsLoading}
          >
            <option value="">Select an option</option>
            {designOptionsData?.mpRotatorOptions
              ?.filter(option => option.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(option => (
                <option key={option.id} value={option.value}>
                  {option.displayName}
                </option>
              ))
              
            }
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Rotors</label>
          <select 
            value={designDetails.rotors} 
            onChange={(e) => setDesignDetails({ ...designDetails, rotors: e.target.value })} 
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            disabled={designOptionsLoading}
          >
            <option value="">Select an option</option>
            {designOptionsData?.rotorOptions
              ?.filter(option => option.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(option => (
                <option key={option.id} value={option.value}>
                  {option.displayName}
                </option>
              ))
              
            }
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Field Rotors</label> 
          <select 
            value={designDetails.fieldRotors} 
            onChange={(e) => setDesignDetails({ ...designDetails, fieldRotors: e.target.value })} 
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            disabled={designOptionsLoading}
          >
            <option value="">Select an option</option>
            {designOptionsData?.fieldRotorOptions
              ?.filter(option => option.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(option => (
                <option key={option.id} value={option.value}>
                  {option.displayName}
                </option>
              ))
              
            }
          </select>
        </div>
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>
        Trees in Turf
      </h3>
      <div style={{ marginBottom: '32px' }}>
        <select 
          value={designDetails.treesInTurf} 
          onChange={(e) => setDesignDetails({ ...designDetails, treesInTurf: e.target.value })} 
          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
          disabled={designOptionsLoading}
        >
          <option value="">Select an option</option>
          {designOptionsData?.treeIrrigationOptions
            ?.filter(option => option.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(option => (
              <option key={option.id} value={option.value}>
                {option.displayName}
              </option>
            ))
              
          }
        </select>
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>
        Non-Turf Trees
      </h3>
      <div style={{ marginBottom: '32px' }}>
        <select 
          value={designDetails.nonTurfTrees} 
          onChange={(e) => setDesignDetails({ ...designDetails, nonTurfTrees: e.target.value })} 
          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
          disabled={designOptionsLoading}
        >
          <option value="">Select an option</option>
          {designOptionsData?.bedTreeIrrigationOptions
            ?.filter(option => option.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(option => (
              <option key={option.id} value={option.value}>
                {option.displayName}
              </option>
            ))
              
          }
        </select>
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>
        Planting Beds
      </h3>
      <div style={{ marginBottom: '32px' }}>
        <select 
          value={designDetails.plantingBeds} 
          onChange={(e) => setDesignDetails({ ...designDetails, plantingBeds: e.target.value })} 
          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
          disabled={designOptionsLoading}
        >
          <option value="">Select an option</option>
          {designOptionsData?.bedTypeOptions
            ?.filter(option => option.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(option => (
              <option key={option.id} value={option.value}>
                {option.displayName}
              </option>
            ))
              
          }
        </select>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Design Notes</label>
        <textarea value={designDetails.designNotes} onChange={(e) => setDesignDetails({ ...designDetails, designNotes: e.target.value })} rows={6} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', fontFamily: 'inherit' }} placeholder="Enter design notes..."></textarea>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <input
          type="checkbox"
          id="prioritize"
          checked={designDetails.prioritizeDetails}
          onChange={(e) =>
            setDesignDetails({
              ...designDetails,
              prioritizeDetails: e.target.checked
            })
          }
          style={{ width: '18px', height: '18px', accentColor: '#0099d8' }}
        />
        <label htmlFor="prioritize" style={{ fontSize: '14px', color: '#374151' }}>
          Prioritize these design details over any uploaded specification files for this project
        </label>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#374151' }}>
          Enter a name to create a new design template from these design details.
        </label>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input 
            type="text" 
            value={designDetails.templateName}
            onChange={(e) => setDesignDetails({ ...designDetails, templateName: e.target.value })}
            placeholder="New Template Name" 
            style={{ 
              flex: 1, 
              maxWidth: '400px', 
              padding: '10px', 
              border: '1px solid #d1d5db', 
              borderRadius: '4px', 
              fontSize: '14px' 
            }} 
          />
          <button
            onClick={handleSaveTemplate}
            disabled={!designDetails.templateName.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: !designDetails.templateName.trim() ? '#9ca3af' : '#0099d8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: !designDetails.templateName.trim() ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="form-content">
      <p className="section-subtitle">Review the project you would like to request</p>
      
      <div className="review-section">
        <div className="review-header">
          <h3 className="review-title">Project Information</h3>
          <button className="edit-button" onClick={() => setCurrentStep(1)}>Edit</button>
        </div>
        
        <div className="review-content">
          <div className="review-services">
            {services.irrigationDesign && (
              <div className="review-service-item">
                <CheckSquare size={20} color="#0099d8" />
                <span>Irrigation Design</span>
              </div>
            )}
            {services.landscapeMaterials && (
              <div className="review-service-item">
                <CheckSquare size={20} color="#0099d8" />
                <span>Landscape Materials</span>
              </div>
            )}
            {services.lighting && (
              <div className="review-service-item">
                <CheckSquare size={20} color="#0099d8" />
                <span>Lighting</span>
              </div>
            )}
            {services.drainage && (
              <div className="review-service-item">
                <CheckSquare size={20} color="#0099d8" />
                <span>Drainage</span>
              </div>
            )}
            {services.hardscape && (
              <div className="review-service-item">
                <CheckSquare size={20} color="#0099d8" />
                <span>Hardscape</span>
              </div>
            )}
            {services.government && (
              <div className="review-service-item">
                <CheckSquare size={20} color="#0099d8" />
                <span>Government</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="review-content">
          <div className="subsection-title">Site Information</div>
          <div className="review-grid">
            <div><strong>Project Name</strong><p>{projectInfo.projectName}</p></div>
            <div><strong>Plan Name</strong><p>{projectInfo.planName}</p></div>
            <div><strong>Address Line 1</strong><p>{projectInfo.address1}</p></div>
            <div><strong>Address Line 2</strong><p>{projectInfo.address2}</p></div>
            <div><strong>City</strong><p>{projectInfo.city}</p></div>
            <div><strong>State</strong><p>{projectInfo.state}</p></div>
            <div><strong>Zip Code</strong><p>{projectInfo.zipcode}</p></div>
            <div><strong>Bid Date</strong><p>{projectInfo.bidDate}</p></div>
            <div><strong>Due Date</strong><p>{projectInfo.dueDate}</p></div>
            <div><strong>Estimated Project Size</strong><p>{projectInfo.zoneCount}</p></div>
            <div><strong>Existing Quote</strong><p>{projectInfo.existingQuote}</p></div>
            <div><strong>Project Notes</strong><p>{projectInfo.projectNotes}</p></div>
          </div>
        </div>
        
        <div className="review-content">
          <div className="subsection-title">Customer Information</div>
          <div className="review-grid">
            <div><strong>Company Name</strong><p>{contactInfo.companyName}</p></div>
            <div><strong>Account Number</strong><p>{contactInfo.accountNumber}</p></div>
            <div><strong>Contact Name</strong><p>{contactInfo.contactName}</p></div>
            <div><strong>Contact Email</strong><p>{contactInfo.contactEmail}</p></div>
            <div><strong>Contact Phone</strong><p>{contactInfo.contactPhone}</p></div>
            <div><strong>Preferred Branch</strong><p>{contactInfo.preferredBranch}</p></div>
            <div><strong>Ewing Representative</strong><p>{contactInfo.ewingRepresentative}</p></div>
          </div>
        </div>
      </div>
      
      <div className="review-section">
        <div className="review-header">
          <h3 className="review-title">Project Files</h3>
          <button className="edit-button" onClick={() => setCurrentStep(2)}>Edit</button>
        </div>
        
        <div className="review-content">
          <div className="subsection-title">1. Original Project Plans</div>
          {files.originalPlans.length === 0 ? (
            <p className="file-item">No files uploaded.</p>
          ) : (
            <ul className="review-file-list">
              {files.originalPlans.map((file) => (
                <li key={file.id} className="file-item">
                  <FileText size={16} className="file-icon" />
                  <span className="file-name">{file.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="review-content">
          <div className="subsection-title">2. Specifications</div>
          {files.specifications.length === 0 ? (
            <p className="file-item">No files uploaded.</p>
          ) : (
            <ul className="review-file-list">
              {files.specifications.map((file) => (
                <li key={file.id} className="file-item">
                  <FileText size={16} className="file-icon" />
                  <span className="file-name">{file.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="review-content">
          <div className="subsection-title">3. Addenda</div>
          {files.addenda.length === 0 ? (
            <p className="file-item">No files uploaded.</p>
          ) : (
            <ul className="review-file-list">
              {files.addenda.map((file) => (
                <li key={file.id} className="file-item">
                  <FileText size={16} className="file-icon" />
                  <span className="file-name">{file.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="review-section">
        <div className="review-header">
          <h3 className="review-title">Design Details</h3>
          <button className="edit-button" onClick={() => setCurrentStep(3)}>Edit</button>
        </div>
        
        <div className="review-content">
          <div className="subsection-title">Source, Pipe, & Controller</div>
          <div className="review-grid">
            <div><strong>Water Source</strong><p>{designDetails.waterSource}</p></div>
            <div><strong>Pressure (PSI)</strong><p>{designDetails.pressure}</p></div>
            <div><strong>Meter Size</strong><p>{designDetails.meterSize}</p></div>
            <div><strong>Mainline</strong><p>{designDetails.mainline}</p></div>
            <div><strong>Sleeving</strong><p>{designDetails.sleeving}</p></div>
            <div><strong>Lateral Pipe</strong><p>{designDetails.lateralPipe}</p></div>
            <div><strong>Controller</strong><p>{designDetails.controller}</p></div>
          </div>
        </div>
        
        <div className="review-content">
          <div className="subsection-title">Water Delivery & Sensors</div>
          <div className="review-grid">
            <div><strong>Backflow</strong><p>{designDetails.backflow}</p></div>
            <div><strong>Valves</strong><p>{designDetails.valves}</p></div>
            <div><strong>Quick Coupler</strong><p>{designDetails.quickCoupler}</p></div>
            <div><strong>Rain Sensor</strong><p>{designDetails.rainSensor}</p></div>
            <div><strong>Drip Kits</strong><p>{designDetails.dripKits}</p></div>
          </div>
        </div>
        
        <div className="review-content">
          <div className="subsection-title">Turf Areas</div>
          <div className="review-grid">
            <div><strong>Sprays</strong><p>{designDetails.sprays}</p></div>
            <div><strong>Rotators</strong><p>{designDetails.rotators}</p></div>
            <div><strong>Rotors</strong><p>{designDetails.rotors}</p></div>
            <div><strong>Field Rotors</strong><p>{designDetails.fieldRotors}</p></div>
          </div>
        </div>
        
        <div className="review-content">
          <div className="subsection-title">Trees in Turf</div>
          <div className="review-grid">
            <div><p>{designDetails.treesInTurf}</p></div>
          </div>
        </div>
        
        <div className="review-content">
          <div className="subsection-title">Non-Turf Trees</div>
          <div className="review-grid">
            <div><p>{designDetails.nonTurfTrees}</p></div>
          </div>
        </div>
        
        <div className="review-content">
          <div className="subsection-title">Planting Beds</div>
          <div className="review-grid">
            <div><p>{designDetails.plantingBeds}</p></div>
          </div>
        </div>
        
        <div className="review-content">
          <div className="subsection-title">Additional Details</div>
          <div className="review-grid">
            <div><strong>Design Notes</strong><p>{designDetails.designNotes}</p></div>
            <div><strong>Prioritize Details</strong><p>{designDetails.prioritizeDetails ? 'Yes' : 'No'}</p></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Header onNavigate={onNavigate} />
      <div className="main-content">
        <div className="content-container">
          <h1 className="page-title">New Project: {steps[currentStep - 1].label}</h1>

          <div className="progress-steps">
            {steps.map((step, idx) => (
              <React.Fragment key={step.num}>
                <div className="step">
                  <div className={`step-circle ${currentStep === step.num ? 'active' : ''} ${currentStep > step.num ? 'completed' : ''}`}>{step.num}</div>
                  <span className="step-label">{step.label}</span>
                </div>
                {idx < steps.length - 1 && <div className="step-connector" />}
              </React.Fragment>
            ))}
          </div>

            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            <div className="form-navigation">
              <button onClick={() => currentStep === 1 ? alert('Cancelled') : setCurrentStep(currentStep - 1)} className="nav-button back-button" disabled={creatingProject || checkingQuote}>
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </button>
              {currentStep < 4 ? (
                <button onClick={handleContinue} className="nav-button continue-button" disabled={creatingProject || checkingQuote}>
                  {checkingQuote ? 'Validating...' : 'Continue'}
                </button>
              ) : (
                <button onClick={handleSubmit} className="nav-button submit-button" disabled={creatingProject}>
                  {creatingProject ? 'Submitting...' : 'Submit Request'}
                </button>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default IrrigationProjectForm;