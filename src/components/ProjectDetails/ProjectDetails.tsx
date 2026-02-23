import React, { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import Header from '../Header/Header';
import ProjectHeader from './ProjectHeader';
import ProjectSidebar from './ProjectSidebar';
import ProjectFilesContent from './ProjectFilesContent';
import MaterialsListContent from './MaterialsList/MaterialsListContent';
import SubmittalContent from './SubmittalContent';
import { GET_PROJECT } from '../../graphql/queries';
import './../../styles.css';
import './../../styles/projectDetails.css';
import './../../styles/projectFiles.css';

// GraphQL query to fetch project details


interface ProjectDetailsProps {
  projectId?: string;
  onNavigate?: (page: 'home' | 'form' | 'details' | 'users') => void;
}

interface MaterialItem {
  sku: string;
  content: string;
  quantity: string;
  uom: string;
  notes: string;
  line: string;
  isChild?: boolean;
}

interface TableSection {
  name: string;
  columnName: string;
  items: MaterialItem[];
}

interface IML {
  name: string;
  sections: TableSection[];
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ projectId = '53691', onNavigate }) => {
  const [activeTab, setActiveTab] = useState('Submittal');
  const [status, setStatus] = useState('Estimating');
  const [selectedIML, setSelectedIML] = useState('');
  const [showSubmittalReview, setShowSubmittalReview] = useState(false);
  const [imls, setImls] = useState<IML[]>([
    { 
      name: 'Stack IML', 
      sections: [
        {
          name: 'Mainline',
          columnName: 'Mainline',
          items: [
            { sku: '12345678', content: 'Staff01@takeoffmonkey.com', quantity: '1,234,567.89', uom: '12', notes: 'Lorem Ipsum Dolor Sit Amet', line: '1' },
            { sku: '12345679', content: '12345678901234567890123456789012345', quantity: '381', uom: '12', notes: 'SCH 40 BY DEFAULT', line: '2' },
            { sku: '12345670', content: 'Staff01@takeoffmonkey.com', quantity: '69', uom: 'LF', notes: '', line: '3' },
            { sku: '12345677', content: '12345678901234567890123456789012345', quantity: '0', uom: '12', notes: 'Lorem Ipsum', line: '4' }
          ]
        },
        {
          name: 'Lateral Line',
          columnName: 'Lateral Line',
          items: [
            { sku: '12345678', content: 'Staff01@takeoffmonkey.com', quantity: '1,234,567.89', uom: '12', notes: 'Lorem Ipsum Dolor Sit Amet', line: '1' },
            { sku: '12345675', content: 'Spiral Head', quantity: '381', uom: '12', notes: 'Lorem Ipsum', line: '2', isChild: true },
            { sku: '12345676', content: 'Staff01@takeoffmonkey.com', quantity: '69', uom: 'LF', notes: '12345678', line: '3', isChild: true },
            { sku: '12345673', content: '12345678901234567890123456789012345', quantity: '0', uom: '12', notes: 'Lorem Ipsum', line: '4' }
          ]
        },
        {
          name: 'Controller / Electrical',
          columnName: 'Controller / Electrical',
          items: [
            { sku: '12345671', content: 'Staff01@takeoffmonkey.com', quantity: '1,234,567.890', uom: 'LF', notes: '12345678', line: '1' },
            { sku: '12345672', content: '12345678901234567890123456789012345', quantity: '381', uom: '12', notes: 'Lorem Ipsum', line: '2', isChild: true },
            { sku: '12345658', content: 'Staff01@takeoffmonkey.com', quantity: '69', uom: 'LF', notes: '12345678', line: '3', isChild: true },
            { sku: '12345668', content: '12345678901234567890123456789012345', quantity: '0', uom: '12', notes: 'Lorem Ipsum', line: '4' },
            { sku: '12345688', content: 'Staff01@takeoffmonkey.com', quantity: '69', uom: 'LF', notes: '12345678', line: '5', isChild: true },
            { sku: '12345608', content: '12345678901234567890123456789012345', quantity: '381', uom: '12', notes: 'Lorem Ipsum', line: '6', isChild: true }
          ]
        }
      ]
    }
  ]);

  const handleCreateSubmittal = () => {
    setShowSubmittalReview(true);
  };

  // loading... please weait
  const { loading, error, data } = useQuery(GET_PROJECT, {
    variables: { projectId },
    skip: !projectId,
  });

  // retrieve project data
  const projectData = React.useMemo(() => {
    if (data?.project) {
      const project = data.project;
      
      return {
        name: `${project.planName || project.projectName || 'Untitled Project'}`,
        projectId: project.id,
        quote: project.existingQuote || 'N/A',
        quoteValue: 'TBD',
        location: `${project.city || ''}${project.state ? ', ' + project.state : ''}`.trim() || 'N/A',
        dueDate: project.dueDate ? new Date(project.dueDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        }) : 'N/A',
        internalDueDate: project.bidDate ? new Date(project.bidDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        }) : 'N/A',
        assigned: 'Unassigned',
        branch: project.preferredBranch || 'N/A',
        lastSaved: project.updatedAt ? new Date(project.updatedAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        }) : 'N/A'
      };
    }
    
    return {
      name: 'Loading...',
      projectId: projectId,
      quote: 'N/A',
      quoteValue: 'N/A',
      location: 'N/A',
      dueDate: 'N/A',
      internalDueDate: 'N/A',
      assigned: 'N/A',
      branch: 'N/A',
      lastSaved: 'N/A'
    };
  }, [data, projectId]);

  const menuItems = [
    { label: 'Project Information' },
    { label: 'Project Files' },
    { label: 'Takeoff' },
    { label: 'Interactive Materials List' },
    { label: 'Submittal' },
    { label: 'Notes' },
    { label: 'Original Design' },
    { label: 'Activity Log' }
  ];

  React.useEffect(() => {
    if (imls.length > 0 && !selectedIML) {
      setSelectedIML(imls[0].name);
    }
  }, [imls, selectedIML]);

  // Show loading state
  if (loading) {
    return (
      <div>
        <Header onNavigate={onNavigate} />
        <div className="project-details-container">
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Loading project details...
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div>
        <Header onNavigate={onNavigate} />
        <div className="project-details-container">
          <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
            Error loading project: {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header onNavigate={onNavigate} />
      
      <div className="project-details-container">
        <ProjectHeader
          projectData={projectData}
          status={status}
          onStatusChange={setStatus}
        />

        {/* Main Content Area */}
        <div className="project-content">
          {/* Sidebar Navigation */}
          <ProjectSidebar 
            items={menuItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Main Content */}
          <main className="project-main">
            {activeTab === 'Submittal' && (
              showSubmittalReview ? (
                <SubmittalContent
                  imlName={selectedIML}
                  sections={imls.find(iml => iml.name === selectedIML)?.sections || []}
                />
              ) : (
                <div className="submittal-content">
                  <h2 className="content-title">New Submittal</h2>
                  {imls.length === 0 ? (
                    <p className="content-subtitle">
                      There are currently no submittals created from an IML.
                    </p>
                  ) : (
                    <>
                      <p className="content-subtitle">
                        Create a submittal from an existing IML.
                      </p>

                      <div className="submittal-form">
                        <label className="form-label">Choose an IML to Import</label>
                        <select 
                          className="iml-select"
                          value={selectedIML}
                          onChange={(e) => setSelectedIML(e.target.value)}
                        >
                          {imls.map((iml, index) => (
                            <option key={index} value={iml.name}>
                              {iml.name}
                            </option>
                          ))}
                        </select>

                        <button 
                          className="create-submittal-button"
                          onClick={handleCreateSubmittal}
                        >
                          Create Submittal
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            )}

            {activeTab === 'Project Information' && (
              <div className="content-placeholder">
                <h2>Project Information</h2>
                <p>Project information content goes here...</p>
              </div>
            )}

            {activeTab === 'Project Files' && (
              <ProjectFilesContent projectId={projectId} />
            )}

            {activeTab === 'Takeoff' && (
              <div className="content-placeholder">
                <h2>Takeoff</h2>
                <p>Takeoff content goes here...</p>
              </div>
            )}

            {activeTab === 'Interactive Materials List' && (
              <MaterialsListContent 
                status={status} 
                onStatusChange={setStatus}
                imls={imls}
                onImlsChange={setImls}
              />
            )}

            {activeTab === 'Notes' && (
              <div className="content-placeholder">
                <h2>Notes</h2>
                <p>Notes content goes here...</p>
              </div>
            )}

            {activeTab === 'Original Design' && (
              <div className="content-placeholder">
                <h2>Original Design</h2>
                <p>Original design content goes here...</p>
              </div>
            )}

            {activeTab === 'Activity Log' && (
              <div className="content-placeholder">
                <h2>Activity Log</h2>
                <p>Activity log content goes here...</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;