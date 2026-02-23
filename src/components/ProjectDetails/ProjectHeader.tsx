import React from 'react';

interface ProjectData {
  name: string;
  projectId: string;
  quote: string;
  quoteValue: string;
  location: string;
  dueDate: string;
  internalDueDate: string;
  assigned: string;
  branch: string;
  lastSaved: string;
}

interface ProjectHeaderProps {
  projectData: ProjectData;
  status: string;
  onStatusChange: (status: string) => void;
  statusOptions?: string[];
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ 
  projectData, 
  status, 
  onStatusChange,
  statusOptions = ['Estimating', 'In Progress', 'Completed', 'On Hold']
}) => (
    <div className="full-header">
        <div className="project-header">
            <h1 className="project-name">{projectData.name}</h1>
            <div className="status-dropdown">
            <label>Status</label>
            <select value={status} onChange={(e) => onStatusChange(e.target.value)}>
                {statusOptions.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
                ))}
            </select>
            </div>
        </div>
        <div className="project-info-bar">
          <div className="info-group">
            <div className="info-item">
              <span className="info-label">Project #:</span>
              <span className="info-value">{projectData.projectId}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Location:</span>
              <span className="info-value">{projectData.location}</span>
            </div>
          </div>

          <div className="info-group">
            <div className="info-item">
              <span className="info-label">Quote:</span>
              <span className="info-value">{projectData.quote}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Quote Value:</span>
              <span className="info-value">{projectData.quoteValue}</span>
            </div>
          </div>

          <div className="info-group">
            <div className="info-item">
              <span className="info-label">Project Due Date:</span>
              <span className="info-value">{projectData.dueDate}</span>
            </div>
            <div className="info-item">
              <span className="info-label internal-due">Internal Due Date:</span>
              <span className="info-value internal-due">{projectData.internalDueDate}</span>
            </div>
          </div>

          <div className="info-group">
            <div className="info-item">
              <span className="info-label">Assigned:</span>
              <span className="info-value">{projectData.assigned}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Branch Assignment:</span>
              <span className="info-value">{projectData.branch}</span>
            </div>
          </div>

          <div className="save-section">
            <div className="last-saved">Last Saved: {projectData.lastSaved}</div>
            <button className="save-button">Save</button>
          </div>
        </div>
  </div>
);

export default ProjectHeader;