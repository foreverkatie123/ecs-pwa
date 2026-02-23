import React, { useState } from 'react';
import { Search, Download, Share2, Edit, Plus, Trash2, FileText, Save, FolderInput, FilePlusCorner } from 'lucide-react';

interface SubmittalItem {
  sku: string;
  mainline: string;
  manufacturers: string[];
  cutsheet: string;
  line: string;
  selected: boolean;
  status: 'normal' | 'invalid' | 'duplicate' | 'not-sellable';
  isChild?: boolean;
}

interface SubmittalSection {
  name: string;
  columnName: string;
  items: SubmittalItem[];
}

interface SubmittalContentProps {
  imlName: string;
  sections: Array<{
    name: string;
    columnName: string;
    items: Array<{
      sku: string;
      content: string;
      quantity: string;
      uom: string;
      notes: string;
      line: string;
      isChild?: boolean;
    }>;
  }>;
}

export default function SubmittalContent({ imlName, sections }: SubmittalContentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCutsheetModal, setShowCutsheetModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{sectionIndex: number, itemIndex: number} | null>(null);
  const [cutsheetFiles, setCutsheetFiles] = useState<{name: string, checked: boolean}[]>([]);
  const [submittalSections, setSubmittalSections] = useState<SubmittalSection[]>(() => {
    const mapped = sections.map(section => ({
      name: section.name,
      columnName: section.columnName,
      items: section.items.map(item => ({
        sku: item.sku,
        mainline: item.content,
        manufacturers: item.sku ? ['Cresline', 'JM Eagle'] : [],
        cutsheet: '',
        line: item.line,
        selected: false,
        status: 'normal' as const,
        isChild: item.isChild
      }))
    }));

    // Check for duplicate SKUs
    const skuCounts = new Map<string, number>();
    mapped.forEach(section => {
      section.items.forEach(item => {
        if (item.sku) {
          skuCounts.set(item.sku, (skuCounts.get(item.sku) || 0) + 1);
        }
      });
    });

    // Mark duplicates
    mapped.forEach(section => {
      section.items.forEach(item => {
        if (item.sku && skuCounts.get(item.sku)! > 1) {
          item.status = 'duplicate';
        }
      });
    });

    return mapped;
  });

  const [coversheetFile, setCoversheetFile] = useState<string | null>(null);
  const [showCoversheetModal, setShowCoversheetModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [version] = useState(1);
  const [dateSaved] = useState('08/04/2025 (22:42:23)');
  

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoversheetFile(file.name);
      setShowCoversheetModal(false);
    }
  };

  const handleRemoveCoversheet = () => {
    setCoversheetFile(null);
  };

  const handleSendEmail = () => {
    console.log('Sending email to:', shareEmail);
    console.log('Message:', shareMessage);
    alert(`PDF would be sent to: ${shareEmail}`);
    setShowShareModal(false);
    setShareEmail('');
    setShareMessage('');
  };

  const handleOpenCutsheetModal = (sectionIndex: number, itemIndex: number) => {
    setSelectedItem({ sectionIndex, itemIndex });
    setCutsheetFiles([]);
    setShowCutsheetModal(true);
  };

  const handleToggleCutsheet = (index: number) => {
    const updated = [...cutsheetFiles];
    updated[index].checked = !updated[index].checked;
    setCutsheetFiles(updated);
  };

  const handleRemoveCutsheet = (index: number) => {
    const updated = cutsheetFiles.filter((_, i) => i !== index);
    setCutsheetFiles(updated);
  };

  const handleCutsheetFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).map(file => ({
        name: file.name,
        checked: false
      }));
      setCutsheetFiles([...cutsheetFiles, ...newFiles]);
    }
  };

  const handleUpdateCutsheets = () => {
    if (selectedItem) {
      const updated = [...submittalSections];
      const checkedFiles = cutsheetFiles.filter(f => f.checked).map(f => f.name).join(', ');
      updated[selectedItem.sectionIndex].items[selectedItem.itemIndex].cutsheet = checkedFiles || '';
      setSubmittalSections(updated);
    }
    setShowCutsheetModal(false);
    setSelectedItem(null);
    setCutsheetFiles([]);
  };

  const handleSelectItem = (sectionIndex: number, itemIndex: number) => {
    const updated = [...submittalSections];
    updated[sectionIndex].items[itemIndex].selected = !updated[sectionIndex].items[itemIndex].selected;
    setSubmittalSections(updated);
  };

  const handleSelectAll = (sectionIndex: number) => {
    const updated = [...submittalSections];
    const allSelected = updated[sectionIndex].items.every(item => item.selected);
    updated[sectionIndex].items.forEach(item => item.selected = !allSelected);
    setSubmittalSections(updated);
  };

  const handleRemoveItem = (sectionIndex: number, itemIndex: number) => {
    const updated = [...submittalSections];
    updated[sectionIndex].items.splice(itemIndex, 1);
    setSubmittalSections(updated);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'invalid': return '#fecaca';
      case 'duplicate': return '#fef3c7';
      case 'not-sellable': return '#fed7aa';
      default: return 'white';
    }
  };

  const TableSection = ({ section, sectionIndex }: { section: SubmittalSection; sectionIndex: number }) => {
    const allSelected = section.items.length > 0 && section.items.every(item => item.selected);

    return (
      <div style={{ marginBottom: '24px' }}>
        <table style={{ width: '100%', backgroundColor: 'white', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
          <thead>
            <tr style={{ backgroundColor: '#0099d8' }}>
              <th style={{ padding: '12px 16px', width: '40px' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => handleSelectAll(sectionIndex)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: 'white'
                  }}
                />
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'white' }}>SKU</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {section.columnName}
                <Edit style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'white' }}>Manufacturers</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'white' }}>Cutsheet</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'white' }}>Line</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: 'white', width: '80px' }}>Remove</th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((item, itemIndex) => (
              <tr
                key={itemIndex}
                style={{
                  backgroundColor: getStatusColor(item.status),
                  borderBottom: '1px solid #e5e7eb'
                }}
              >
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => handleSelectItem(sectionIndex, itemIndex)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: '#0099d8'
                    }}
                  />
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: item.sku ? '#111827' : '#9ca3af', paddingLeft: item.isChild ? '48px' : '16px' }}>
                  {item.sku || ''}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{item.mainline}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                  {item.manufacturers.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {item.manufacturers.map((manufacturer, idx) => (
                        <span key={idx} style={{ color: '#374151' }}>{manufacturer}</span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>-</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                  {item.cutsheet && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenCutsheetModal(sectionIndex, itemIndex)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#0099d8',
                          fontSize: '13px',
                          padding: '0'
                        }}
                      >
                        <Plus style={{ width: '16px', height: '16px' }} />
                      </button>
                      <span style={{ color: '#6b7280' }}>{item.cutsheet}</span>
                    </div>
                  )}
                  {!item.cutsheet && (
                    <button
                      onClick={() => handleOpenCutsheetModal(sectionIndex, itemIndex)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#0099d8',
                        fontSize: '13px',
                        padding: '0'
                      }}
                    >
                      <Plus style={{ width: '16px', height: '16px' }} />
                    </button>
                  )}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{item.line}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleRemoveItem(sectionIndex, itemIndex)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <Trash2 style={{ width: '18px', height: '18px', color: '#6b7280' }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Submittal Review</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
              <Save style={{ width: '16px', height: '16px' }} />
              Save
            </button>
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
              <FolderInput style={{ width: '16px', height: '16px' }} />
              Import from IML
            </button>
            <button
              onClick={() => setShowCoversheetModal(true)}
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
              <FilePlusCorner style={{ width: '16px', height: '16px' }} />
              Add Coversheet
            </button>
            <button
              onClick={() => setShowShareModal(true)}
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
              <Share2 style={{ width: '16px', height: '16px' }} />
              Share
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
              Download
            </button>
            <button
              style={{
                padding: '8px 24px',
                backgroundColor: '#0099d8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Create PDF
            </button>
          </div>
        </div>

        {/* Version and Legend */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '8px 16px', backgroundColor: '#0099d8', color: 'white', borderRadius: '4px', fontSize: '14px', fontWeight: '500' }}>
              Version {version} <span style={{ fontWeight: '400', fontSize: '12px' }}>Saved {dateSaved}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: '#fecaca', border: '1px solid #e5e7eb' }}></div>
                Invalid Item
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: '#fef3c7', border: '1px solid #e5e7eb' }}></div>
                Duplicate
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: '#fed7aa', border: '1px solid #e5e7eb' }}></div>
                Not Sellable
              </span>
            </div>
          </div>
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
        </div>

        {/* Coversheet */}
        {coversheetFile && (
          <div style={{ backgroundColor: '#0099d8', padding: '16px', borderRadius: '4px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>Coversheet</span>
                <span style={{ color: 'white', fontSize: '13px' }}>{coversheetFile}</span>
                <button
                  onClick={() => setShowCoversheetModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <Edit style={{ width: '16px', height: '16px', color: 'white' }} />
                </button>
              </div>
              <button
                onClick={handleRemoveCoversheet}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <Trash2 style={{ width: '16px', height: '16px', color: 'white' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tables */}
      {submittalSections.map((section, index) => (
        <TableSection key={index} section={section} sectionIndex={index} />
      ))}

      {/* Version History */}
      <div style={{ marginTop: '48px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#0099d8' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'white' }}>Version</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'white' }}>Date Saved</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'white' }}>Action</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'white' }}>Sent to Account Manager</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '12px 16px', fontSize: '13px' }}>{version}</td>
              <td style={{ padding: '12px 16px', fontSize: '13px' }}>{dateSaved}</td>
              <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#0099d8',
                      fontSize: '13px'
                    }}
                  >
                    <Edit style={{ width: '14px', height: '14px' }} />
                    Edit
                  </button>
                  <button
                    onClick={() => window.print()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#0099d8',
                      fontSize: '13px'
                    }}
                  >
                    <Download style={{ width: '14px', height: '14px' }} />
                    Download
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#0099d8',
                      fontSize: '13px'
                    }}
                  >
                    <Share2 style={{ width: '14px', height: '14px' }} />
                    Share
                  </button>
                </div>
              </td>
              <td style={{ padding: '12px 16px', fontSize: '13px' }}>{dateSaved}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Share via Email Modal */}
      {showShareModal && (
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
            onClick={() => setShowShareModal(false)}
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
              zIndex: 1001,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Share Submittal PDF
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
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
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="recipient@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Message (Optional)
              </label>
              <textarea
                placeholder="Add a message to include with the PDF..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f0f9ff', 
              borderRadius: '4px', 
              marginBottom: '20px',
              border: '1px solid #bae6fd'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <FileText style={{ width: '16px', height: '16px', color: '#0284c7' }} />
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#0284c7' }}>
                  Attachment
                </span>
              </div>
              <span style={{ fontSize: '13px', color: '#374151' }}>
                {imlName} - Submittal Review v{version}.pdf
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => setShowShareModal(false)}
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
                onClick={handleSendEmail}
                disabled={!shareEmail}
                style={{
                  padding: '10px 32px',
                  backgroundColor: shareEmail ? '#0099d8' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: shareEmail ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Send Email
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Coversheet Modal */}
      {showCoversheetModal && (
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
            onClick={() => setShowCoversheetModal(false)}
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
              width: '450px',
              zIndex: 1001,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                {coversheetFile ? 'Replace Coversheet' : 'Add Coversheet'}
              </h3>
              <button
                onClick={() => setShowCoversheetModal(false)}
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
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                Upload a PDF file to use as the coversheet for this submittal.
              </p>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#f9fafb',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#0099d8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                <FileText style={{ width: '48px', height: '48px', color: '#9ca3af', marginBottom: '12px' }} />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Click to upload or drag and drop
                </span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  PDF files only
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => setShowCoversheetModal(false)}
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
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Cutsheets Modal */}
      {showCutsheetModal && selectedItem && (
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
            onClick={() => {
              setShowCutsheetModal(false);
              setSelectedItem(null);
              setCutsheetFiles([]);
            }}
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
              width: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              zIndex: 1001,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Add / Edit Cutsheets
              </h3>
              <button
                onClick={() => {
                  setShowCutsheetModal(false);
                  setSelectedItem(null);
                  setCutsheetFiles([]);
                }}
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
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                {submittalSections[selectedItem.sectionIndex].items[selectedItem.itemIndex].sku} - {submittalSections[selectedItem.sectionIndex].items[selectedItem.itemIndex].mainline}
              </h4>
              
              {/* Existing cutsheets */}
              {cutsheetFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {cutsheetFiles.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        backgroundColor: file.checked ? '#f0f9ff' : 'white'
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          flex: 1
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={file.checked}
                          onChange={() => handleToggleCutsheet(index)}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: '#0099d8'
                          }}
                        />
                        <span style={{ fontSize: '13px', color: '#374151' }}>{file.name}</span>
                      </label>
                      <button
                        onClick={() => handleRemoveCutsheet(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <Trash2 style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* File upload area */}
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#f9fafb',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#0099d8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  backgroundColor: '#0099d8', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </div>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Drop your file here or <span style={{ color: '#0099d8', textDecoration: 'underline' }}>click to upload</span>
                </span>
                <span style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  File Types: .pdf, .jpg, .png  |  Max File Size: 10MB
                </span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleCutsheetFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => {
                  setShowCutsheetModal(false);
                  setSelectedItem(null);
                  setCutsheetFiles([]);
                }}
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
                onClick={handleUpdateCutsheets}
                style={{
                  padding: '10px 32px',
                  backgroundColor: '#99CC66',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Update
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}