import React, { useState } from 'react';
import { Search, Download, Edit2, Layers, Trash2, GripVertical, ChevronDown } from 'lucide-react';

interface MaterialsListContentProps {
  status: string;
  onStatusChange: (status: string) => void;
  imls: IML[];
  onImlsChange: (imls: IML[]) => void;
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

export default function MaterialsListContent({ 
  status, 
  onStatusChange, 
  imls, 
  onImlsChange 
}: MaterialsListContentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{sectionIndex: number, itemIndex: number} | null>(null);
  const [hoveredItem, setHoveredItem] = useState<{sectionIndex: number, itemIndex: number} | null>(null);
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [showNewIMLModal, setShowNewIMLModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [otherCategoryName, setOtherCategoryName] = useState('');
  const [newIMLStep, setNewIMLStep] = useState<'initial' | 'categories' | 'p21quote' | 'blank' | 'copy'>('initial');
  const [newIMLName, setNewIMLName] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [customerJobRef, setCustomerJobRef] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [copyFromProject, setCopyFromProject] = useState('');
  const [copyToProject, setCopyToProject] = useState('');
  const [activeIMLIndex, setActiveIMLIndex] = useState(0);

  const availableCategories = [
    'Dry / Point Source Irrigation',
    'Lateral Line Fittings',
    'Point of Connection',
    'Rotor Irrigation',
    'Spray Irrigation',
    'Extra Materials / Misc. Items',
    'Mainline Fittings',
    'Remote Control Valves',
    'Sleeving',
    'Other'
  ];

  const sections = imls[activeIMLIndex]?.sections || [];

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSaveCategories = () => {
    const categoriesToAdd = selectedCategories.map(category => {
      if (category === 'Other' && otherCategoryName.trim()) {
        return otherCategoryName.trim();
      }
      return category;
    }).filter(cat => cat !== 'Other' || otherCategoryName.trim());

    const newSections = categoriesToAdd.map(category => ({
      name: category,
      columnName: category,
      items: []
    }));
    
    const updatedImls = [...imls];
    updatedImls[activeIMLIndex].sections = [...updatedImls[activeIMLIndex].sections, ...newSections];
    onImlsChange(updatedImls);
    
    setShowNewCategoryModal(false);
    setSelectedCategories([]);
    setOtherCategoryName('');
  };

  const handleSaveIML = () => {
    const categoriesToAdd = selectedCategories.map(category => {
      if (category === 'Other' && otherCategoryName.trim()) {
        return otherCategoryName.trim();
      }
      return category;
    }).filter(cat => cat !== 'Other' || otherCategoryName.trim());

    const newSections = categoriesToAdd.map(category => ({
      name: category,
      columnName: category,
      items: []
    }));
    
    const updatedImls = [...imls];
    updatedImls[activeIMLIndex].sections = [...updatedImls[activeIMLIndex].sections, ...newSections];
    onImlsChange(updatedImls);
    
    setShowNewIMLModal(false);
    setSelectedCategories([]);
    setOtherCategoryName('');
    setNewIMLStep('initial');
  };

  const handleResetCategories = () => {
    setSelectedCategories([]);
    setOtherCategoryName('');
  };

  const handleCloseModal = () => {
    setShowNewIMLModal(false);
    setNewIMLStep('initial');
    setSelectedCategories([]);
    setOtherCategoryName('');
    setNewIMLName('');
    setQuoteNumber('');
    setCustomerJobRef('');
    setCustomerNumber('');
    setCopyFromProject('');
    setCopyToProject('');
  };

  const handleInitialOptionSelect = (option: 'blank' | 'existing' | 'p21' | 'project') => {
    if (option === 'blank') {
      setNewIMLStep('blank');
    } else if (option === 'existing') {
      setNewIMLStep('categories');
    } else if (option === 'p21') {
      setNewIMLStep('p21quote');
    } else if (option === 'project') {
      setNewIMLStep('copy');
    }
  };

  const handleCreateBlankIML = () => {
  if (newIMLName.trim()) {
    const newIML: IML = {
      name: newIMLName.trim(),
      sections: []
    };
    onImlsChange([...imls, newIML]);
    setActiveIMLIndex(imls.length);
    handleCloseModal();
  }
};

  const handleCreateFromP21 = () => {
    if (quoteNumber.trim()) {
      // Create from P21 quote logic 
      handleCloseModal();
    }
  };

  const handleCopyFromProject = () => {
    if (copyFromProject.trim() && copyToProject.trim()) {
      // Copy from another project logic
      handleCloseModal();
    }
  };

  const updateLineNumbers = (sections: TableSection[]) => {
    return sections.map(section => ({
      ...section,
      items: section.items.map((item, index) => ({
        ...item,
        line: (index + 1).toString()
      }))
    }));
  };

  const handleDragStart = (sectionIndex: number, itemIndex: number) => {
    if (!isEditMode) return;
    setDraggedItem({ sectionIndex, itemIndex });
  };

  const findParentIndex = (sectionIndex: number, childIndex: number): number | null => {
    const items = imls[activeIMLIndex].sections[sectionIndex].items;
    // Look backwards from child position to find the parent
    for (let i = childIndex - 1; i >= 0; i--) {
      if (!items[i].isChild) {
        return i;
      }
    }
    return null;
  };

  const getChildRange = (sectionIndex: number, parentIndex: number): { start: number; end: number } => {
    const items = imls[activeIMLIndex].sections[sectionIndex].items;
    const start = parentIndex + 1;
    let end = start;
    
    // Find all consecutive children after this parent
    while (end < items.length && items[end].isChild) {
      end++;
    }
    
    return { start, end: end - 1 };
  };

  const handleDragOver = (sectionIndex: number, itemIndex: number) => {
    if (!isEditMode || !draggedItem) return;
    
    const draggedIsChild = imls[activeIMLIndex].sections[draggedItem.sectionIndex].items[draggedItem.itemIndex].isChild;
    const targetItem = imls[activeIMLIndex].sections[sectionIndex].items[itemIndex];
    
    // If dragging a child item
    if (draggedIsChild) {
      // Can only drop on items in the same section
      if (draggedItem.sectionIndex !== sectionIndex) return;
      
      // Find the parent of the dragged child
      const draggedParentIndex = findParentIndex(draggedItem.sectionIndex, draggedItem.itemIndex);
      if (draggedParentIndex === null) return;
      
      // Find valid drop range (parent and its children)
      const { start, end } = getChildRange(sectionIndex, draggedParentIndex);
      
      // Can only drop within the parent's child range or on the parent itself
      if (itemIndex !== draggedParentIndex && (itemIndex < start || itemIndex > end)) {
        return;
      }
    }
    
    setHoveredItem({ sectionIndex, itemIndex });
  };

  const handleDrop = () => {
    if (!draggedItem || !hoveredItem) return;

    // Don't do anything if dropping on itself
    if (draggedItem.sectionIndex === hoveredItem.sectionIndex && draggedItem.itemIndex === hoveredItem.itemIndex) {
      setDraggedItem(null);
      setHoveredItem(null);
      setMousePosition(null);
      return;
    }

    const updatedImls = [...imls];
    const currentSections = [...updatedImls[activeIMLIndex].sections];
    const draggedSection = currentSections[draggedItem.sectionIndex];
    const targetSection = currentSections[hoveredItem.sectionIndex];
    
    const draggedIsChild = draggedSection.items[draggedItem.itemIndex].isChild;

    // If dragging a parent, collect all its children
    let itemsToMove = [draggedSection.items[draggedItem.itemIndex]];
    if (!draggedIsChild) {
      const { start, end } = getChildRange(draggedItem.sectionIndex, draggedItem.itemIndex);
      // Collect all children
      for (let i = start; i <= end && i < draggedSection.items.length; i++) {
        if (draggedSection.items[i].isChild) {
          itemsToMove.push(draggedSection.items[i]);
        }
      }
    }

    // Remove items from original position (in reverse to maintain indices)
    draggedSection.items.splice(draggedItem.itemIndex, itemsToMove.length);

    // Insert at new position
    if (draggedItem.sectionIndex === hoveredItem.sectionIndex) {
      // Same section - adjust target index if dragging downward
      let adjustedIndex = draggedItem.itemIndex < hoveredItem.itemIndex 
        ? hoveredItem.itemIndex - itemsToMove.length + 1
        : hoveredItem.itemIndex;
      targetSection.items.splice(adjustedIndex, 0, ...itemsToMove);
    } else {
      // Different section - only for parent items
      targetSection.items.splice(hoveredItem.itemIndex, 0, ...itemsToMove);
    }

    // Update line numbers for all affected sections
    const sectionsWithUpdatedLines = updateLineNumbers(currentSections);
    updatedImls[activeIMLIndex].sections = [...updatedImls[activeIMLIndex].sections, ...sectionsWithUpdatedLines];
    onImlsChange(updatedImls);
    setDraggedItem(null);
    setHoveredItem(null);
    setMousePosition(null);
  };

  const handleDelete = (sectionIndex: number, itemIndex: number) => {
    const updatedImls = [...imls];
    updatedImls[activeIMLIndex].sections[sectionIndex].items.splice(itemIndex, 1);
    
    // Update line numbers after deletion
    const sectionsWithUpdatedLines = updateLineNumbers(updatedImls[activeIMLIndex].sections);
    updatedImls[activeIMLIndex].sections = sectionsWithUpdatedLines;
    onImlsChange(updatedImls);
  };

  const handleAddChild = (sectionIndex: number, parentIndex: number) => {
    const updatedImls = [...imls];
    const newChildItem: MaterialItem = {
      sku: '',
      content: '',
      quantity: '0',
      uom: 'EA',
      notes: '',
      line: '0',
      isChild: true
    };
    
    // Insert the child right after the parent
    updatedImls[activeIMLIndex].sections[sectionIndex].items.splice(parentIndex + 1, 0, newChildItem);
    
    // Update line numbers
    const sectionsWithUpdatedLines = updateLineNumbers(updatedImls[activeIMLIndex].sections);
    updatedImls[activeIMLIndex].sections = sectionsWithUpdatedLines;
    onImlsChange(updatedImls);
  };

  const handleAddParent = (sectionIndex: number) => {
    const updatedImls = [...imls];
    const newParentItem: MaterialItem = {
      sku: '',
      content: '',
      quantity: '0',
      uom: 'EA',
      notes: '',
      line: '0',
      isChild: false
    };
    
    // Add to the end of the section
    updatedImls[activeIMLIndex].sections[sectionIndex].items.push(newParentItem);
    
    // Update line numbers
    const sectionsWithUpdatedLines = updateLineNumbers(updatedImls[activeIMLIndex].sections);
    updatedImls[activeIMLIndex].sections = sectionsWithUpdatedLines;
    onImlsChange(updatedImls);
  };

  const TableSectionComponent = ({ section, sectionIndex }: { section: TableSection; sectionIndex: number }) => (
    <div style={{ marginBottom: '32px' }}>
      <table style={{ width: '100%', backgroundColor: 'white', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
        <thead>
          <tr style={{ backgroundColor: '#0099d8' }}>
            {isEditMode && (
              <th style={{ padding: '12px 16px', width: '40px' }}></th>
            )}
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'white' }}>SKU</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'white' }}>{section.columnName}</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'white' }}>Quantity</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'white' }}>UOM</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'white' }}>Notes</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'white' }}>Line</th>
            {isEditMode && (
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: 'white', width: '60px' }}>Delete</th>
            )}
          </tr>
        </thead>
        <tbody>
          {section.items.map((item, itemIndex) => (
            <tr 
              key={itemIndex}
              onMouseDown={() => handleDragStart(sectionIndex, itemIndex)}
              onMouseEnter={() => handleDragOver(sectionIndex, itemIndex)}
              onMouseUp={handleDrop}
              style={{ 
                backgroundColor: 
                  draggedItem?.sectionIndex === sectionIndex && draggedItem?.itemIndex === itemIndex 
                    ? '#dbeafe' 
                    : hoveredItem?.sectionIndex === sectionIndex && hoveredItem?.itemIndex === itemIndex && draggedItem
                      ? '#fef3c7'
                      : item.isChild 
                        ? '#f9fafb' 
                        : 'white',
                borderBottom: '1px solid #e5e7eb',
                cursor: isEditMode ? 'grab' : 'pointer',
                opacity: draggedItem?.sectionIndex === sectionIndex && draggedItem?.itemIndex === itemIndex ? 0.6 : 1,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                transition: 'background-color 0.15s ease'
              }}
            >
              {isEditMode && (
                <td 
                  style={{ 
                    padding: '12px 8px', 
                    textAlign: 'center',
                    cursor: 'grab'
                  }}
                >
                  <GripVertical style={{ width: '18px', height: '18px', color: '#9ca3af' }} />
                </td>
              )}
              <td style={{ padding: '12px 16px', fontSize: '13px', paddingLeft: item.isChild ? '48px' : '16px' }}>
                {item.sku}
              </td>
              <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{item.content}</span>
                  {isEditMode && !item.isChild && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddChild(sectionIndex, itemIndex);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        backgroundColor: '#f0f9ff',
                        color: '#0099d8',
                        border: '1px solid #bae6fd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '500',
                        marginLeft: 'auto'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                    >
                      <span style={{ fontSize: '12px' }}>+</span>
                      Child
                    </button>
                  )}
                </div>
              </td>
              <td style={{ padding: '12px 16px', fontSize: '13px' }}>{item.quantity}</td>
              <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                {isEditMode ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {item.uom}
                    <ChevronDown style={{ width: '14px', height: '14px', color: '#6b7280' }} />
                  </div>
                ) : (
                  item.uom
                )}
              </td>
              <td style={{ padding: '12px 16px', fontSize: '13px' }}>{item.notes}</td>
              <td style={{ padding: '12px 16px', fontSize: '13px' }}>{item.line}</td>
              {isEditMode && (
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleDelete(sectionIndex, itemIndex)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <Trash2 style={{ width: '18px', height: '18px', color: '#ef4444' }} />
                  </button>
                </td>
              )}
            </tr>
          ))}
          {isEditMode && (
            <tr style={{ backgroundColor: '#fafafa' }}>
              <td colSpan={8} style={{ padding: '12px 16px', textAlign: 'center' }}>
                <button
                  onClick={() => handleAddParent(sectionIndex)}
                  style={{
                    color: '#0099d8',
                    fontSize: '13px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  + Add Parent Item
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {isEditMode && (
        <div style={{ marginTop: '12px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#0099d8',
              fontSize: '13px',
              fontWeight: '600',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 0'
            }}
            onClick={() => setShowNewCategoryModal(true)}
          >
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>+</span>
            Add Category
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div 
      style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh', position: 'relative' }}
      onMouseMove={(e) => {
        if (draggedItem) {
          setMousePosition({ x: e.clientX, y: e.clientY });
        }
      }}
      onMouseLeave={() => {
        if (draggedItem) {
          setDraggedItem(null);
          setHoveredItem(null);
          setMousePosition(null);
        }
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Interactive Materials List</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: '#9ca3af'
                }} 
              />
              <input
                type="text"
                placeholder="Search Items on List"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: '40px',
                  paddingRight: '16px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '250px'
                }}
              />
            </div>
            {isEditMode && (
              <button 
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#0099d8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onClick={() => setIsEditMode(false)}
              >
                Save IML
              </button>
            )}
            <button 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <Layers style={{ width: '16px', height: '16px' }} />
              Stackit
            </button>
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <Edit2 style={{ width: '16px', height: '16px' }} />
              {isEditMode ? 'Cancel' : 'Edit'}
            </button>
            <button 
              onClick={() => window.print()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <Download style={{ width: '16px', height: '16px' }} />
              Export
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
          {imls.map((iml, index) => (
            <button 
              key={index}
              onClick={() => setActiveIMLIndex(index)}
              style={{
                padding: '12px 24px',
                backgroundColor: activeIMLIndex === index ? '#0099d8' : 'transparent',
                color: activeIMLIndex === index ? 'white' : '#0099d8',
                border: 'none',
                borderTopLeftRadius: '4px',
                borderTopRightRadius: '4px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {iml.name}
            </button>
          ))}
          <button 
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: '#0099d8',
              border: 'none',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer'
            }}
            onClick={() => {
              setShowNewIMLModal(true);
              setNewIMLStep('initial');
            }}
          >
            + New IML
          </button>
        </div>
      </div>

      {/* Tables */}
      {sections.length > 0 ? (
        sections.map((section, index) => (
          <TableSectionComponent key={index} section={section} sectionIndex={index} />
        ))
      ) : (
        isEditMode && (
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '48px 24px', 
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
              No categories yet. Add a category to get started.
            </p>
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#0099d8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
              onClick={() => setShowNewCategoryModal(true)}
            >
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>+</span>
              Add Category
            </button>
          </div>
        )
      )}

      {/* Floating drag preview */}
      {draggedItem && mousePosition && (
        <div
          style={{
            position: 'fixed',
            left: mousePosition.x + 10,
            top: mousePosition.y + 10,
            backgroundColor: 'white',
            border: '2px solid #0099d8',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            pointerEvents: 'none',
            zIndex: 1000,
            minWidth: '300px',
            maxWidth: '500px'
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#0099d8', marginBottom: '8px' }}>
            Moving: {sections[draggedItem.sectionIndex].name} - Line {sections[draggedItem.sectionIndex].items[draggedItem.itemIndex].line}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            <div><strong>SKU:</strong> {sections[draggedItem.sectionIndex].items[draggedItem.itemIndex].sku}</div>
            <div><strong>Content:</strong> {sections[draggedItem.sectionIndex].items[draggedItem.itemIndex].content.substring(0, 40)}{sections[draggedItem.sectionIndex].items[draggedItem.itemIndex].content.length > 40 ? '...' : ''}</div>
            <div><strong>Quantity:</strong> {sections[draggedItem.sectionIndex].items[draggedItem.itemIndex].quantity} {sections[draggedItem.sectionIndex].items[draggedItem.itemIndex].uom}</div>
          </div>
        </div>
      )}

      {/* New Category Modal */}
      {showNewCategoryModal && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000
            }}
            onClick={() => setShowNewCategoryModal(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '500px',
              maxHeight: '80vh',
              overflow: 'auto',
              zIndex: 1001,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>New Category</h3>
              <button
                onClick={() => setShowNewCategoryModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  lineHeight: '1',
                  padding: '0',
                  width: '32px',
                  height: '32px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
                Choose a Category to add
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {availableCategories.map((category) => (
                  <div key={category}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: selectedCategories.includes(category) ? '#f0f9ff' : 'white',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedCategories.includes(category)) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedCategories.includes(category)) {
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: '#0099d8'
                        }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>{category}</span>
                    </label>
                    {category === 'Other' && selectedCategories.includes('Other') && (
                      <div style={{ marginTop: '8px', marginLeft: '30px' }}>
                        <input
                          type="text"
                          placeholder="Enter custom category name"
                          value={otherCategoryName}
                          onChange={(e) => setOtherCategoryName(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0099d8'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={handleResetCategories}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#0099d8',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Reset
              </button>
              <button
                onClick={handleSaveCategories}
                disabled={selectedCategories.length === 0 || (selectedCategories.includes('Other') && !otherCategoryName.trim())}
                style={{
                  padding: '10px 32px',
                  backgroundColor: (selectedCategories.length === 0 || (selectedCategories.includes('Other') && !otherCategoryName.trim())) ? '#d1d5db' : '#0099d8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (selectedCategories.length === 0 || (selectedCategories.includes('Other') && !otherCategoryName.trim())) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}

      {/* New IML Modal */}
      {showNewIMLModal && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000
            }}
            onClick={handleCloseModal}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: newIMLStep === 'initial' ? '450px' : '500px',
              maxHeight: '80vh',
              overflow: 'auto',
              zIndex: 1001,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                {newIMLStep === 'initial' && 'New IML'}
                {newIMLStep === 'categories' && 'New Category'}
                {newIMLStep === 'p21quote' && 'Select a P21 Quote'}
                {newIMLStep === 'blank' && 'New IML'}
                {newIMLStep === 'copy' && 'Copy Takeoff'}
              </h3>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  lineHeight: '1',
                  padding: '0',
                  width: '32px',
                  height: '32px'
                }}
              >
                ×
              </button>
            </div>

            {/* Initial Step */}
            {newIMLStep === 'initial' && (
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
                  How would you like to create the IML?
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Blank IML', value: 'blank' },
                    { label: 'Copy from Existing IML', value: 'existing' },
                    { label: 'Create from P21 Quote', value: 'p21' },
                    { label: 'Copy from Another Project', value: 'project' }
                  ].map((option) => (
                    <label
                      key={option.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: 'white',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      onClick={() => handleInitialOptionSelect(option.value as any)}
                    >
                      <input
                        type="radio"
                        name="iml-option"
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: '#0099d8'
                        }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>{option.label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', marginTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    onClick={handleCloseModal}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#d1d5db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Blank IML Step */}
            {newIMLStep === 'blank' && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder="Enter the name of the New IML"
                    value={newIMLName}
                    onChange={(e) => setNewIMLName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#0099d8'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    onClick={handleCloseModal}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateBlankIML}
                    disabled={!newIMLName.trim()}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: newIMLName.trim() ? '#99CC66' : '#d1d5db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: newIMLName.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Create IML
                  </button>
                </div>
              </div>
            )}

            {/* P21 Quote Step */}
            {newIMLStep === 'p21quote' && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="Quote #"
                      value={quoteNumber}
                      onChange={(e) => setQuoteNumber(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px',
                        outline: 'none',
                        minWidth: 0
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0099d8'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                    />
                    <button
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#0099d8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        flexShrink: 0
                      }}
                    >
                      🔍
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="text"
                      placeholder="Customer Job Ref"
                      value={customerJobRef}
                      onChange={(e) => setCustomerJobRef(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px',
                        outline: 'none',
                        minWidth: 0
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0099d8'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                    />
                    <input
                      type="text"
                      placeholder="Customer Number"
                      value={customerNumber}
                      onChange={(e) => setCustomerNumber(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px',
                        outline: 'none',
                        minWidth: 0
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0099d8'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    onClick={handleCloseModal}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFromP21}
                    disabled={!quoteNumber.trim()}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: quoteNumber.trim() ? '#22c55e' : '#d1d5db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: quoteNumber.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Create IML
                  </button>
                </div>
              </div>
            )}

            {/* Copy from Project Step */}
            {newIMLStep === 'copy' && (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                    From Project #
                  </label>
                  <input
                    type="text"
                    value={copyFromProject}
                    onChange={(e) => setCopyFromProject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#0099d8'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                    To Project #
                  </label>
                  <input
                    type="text"
                    value={copyToProject}
                    onChange={(e) => setCopyToProject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#f9fafb'
                    }}
                    readOnly
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    onClick={handleCloseModal}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCopyFromProject}
                    disabled={!copyFromProject.trim() || !copyToProject.trim()}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: (copyFromProject.trim() && copyToProject.trim()) ? '#22c55e' : '#d1d5db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: (copyFromProject.trim() && copyToProject.trim()) ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Create IML
                  </button>
                </div>
              </div>
            )}

            {/* Categories Step */}
            {newIMLStep === 'categories' && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
                    Choose a Category to add
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {availableCategories.map((category) => (
                      <div key={category}>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: selectedCategories.includes(category) ? '#f0f9ff' : 'white',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!selectedCategories.includes(category)) {
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selectedCategories.includes(category)) {
                              e.currentTarget.style.backgroundColor = 'white';
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category)}
                            onChange={() => toggleCategory(category)}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#0099d8'
                            }}
                          />
                          <span style={{ fontSize: '14px', color: '#374151' }}>{category}</span>
                        </label>
                        {category === 'Other' && selectedCategories.includes('Other') && (
                          <div style={{ marginTop: '8px', marginLeft: '30px' }}>
                            <input
                              type="text"
                              placeholder="Enter custom category name"
                              value={otherCategoryName}
                              onChange={(e) => setOtherCategoryName(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '14px',
                                outline: 'none'
                              }}
                              onFocus={(e) => e.currentTarget.style.borderColor = '#0099d8'}
                              onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    onClick={handleResetCategories}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'transparent',
                      color: '#0099d8',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSaveIML}
                    disabled={selectedCategories.length === 0 || (selectedCategories.includes('Other') && !otherCategoryName.trim())}
                    style={{
                      padding: '10px 32px',
                      backgroundColor: (selectedCategories.length === 0 || (selectedCategories.includes('Other') && !otherCategoryName.trim())) ? '#d1d5db' : '#0099d8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: (selectedCategories.length === 0 || (selectedCategories.includes('Other') && !otherCategoryName.trim())) ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}