import React from 'react';

interface SidebarItem {
  label: string;
  hasArrow?: boolean;
}

interface ProjectSidebarProps {
  items: SidebarItem[] | string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ 
  items, 
  activeTab, 
  onTabChange,
  className = ''
}) => {
  const normalizeItems = (items: SidebarItem[] | string[]): SidebarItem[] => {
    return items.map(item => 
      typeof item === 'string' ? { label: item } : item
    );
  };

  const normalizedItems = normalizeItems(items);

  return (
    <aside className={`project-sidebar ${className}`}>
      {normalizedItems.map((item) => (
        <button
          key={item.label}
          className={`sidebar-item ${activeTab === item.label ? 'active' : ''}`}
          onClick={() => onTabChange(item.label)}
        >
          {item.label}
          {item.label === activeTab && <span className="arrow">›</span>}
        </button>
      ))}
    </aside>
  );
};


export default ProjectSidebar;