// CompanySearch.tsx - Component for Algolia customer search
import React, { useState, useEffect, useRef } from 'react';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { Search, ChevronDown } from 'lucide-react';

interface Customer {
  objectID: string;
  customer_id: string;
  customer_name: string;
  central_phone_number: string;
  phys_address1: string;
  phys_address2?: string;
  phys_city: string;
  phys_state: string;
  phys_postal_code: string;
  phys_country: string;
  ewing_region_id: string;
  linked_contacts_count: number;
  customer_account_type: string;
  credit_status_desc: string;
  terms_desc: string;
  default_branch?: string;
  salesrep_display_name?: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface CompanySearchProps {
  onCustomerSelect: (customer: Customer, contact?: Contact) => void;
  initialCustomerName?: string;
  initialCustomerId?: string;
}

const CompanySearch: React.FC<CompanySearchProps> = ({
  onCustomerSelect,
  initialCustomerName = '',
  initialCustomerId = ''
}) => {
  const [customerSearchTerm, setCustomerSearchTerm] = useState(initialCustomerName);
  const [customerIdSearchTerm, setCustomerIdSearchTerm] = useState(initialCustomerId);
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showCustomerIdDropdown, setShowCustomerIdDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const customerIdDropdownRef = useRef<HTMLDivElement>(null);
  const contactDropdownRef = useRef<HTMLDivElement>(null);

  // Initialize Algolia client (v5 syntax)
  const searchClient = algoliasearch(
    import.meta.env.VITE_ALGOLIA_APP_ID || '',
    import.meta.env.VITE_ALGOLIA_SEARCH_KEY || ''
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
      if (customerIdDropdownRef.current && !customerIdDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerIdDropdown(false);
      }
      if (contactDropdownRef.current && !contactDropdownRef.current.contains(event.target as Node)) {
        setShowContactDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch contacts for selected customer
  const fetchContacts = async (customerId: string) => {
    if (!customerId) return;

    setLoadingContacts(true);
    try {
      const response = await fetch(
        `https://apim-midtier-shared-k1x8.azure-api.net/PL14-dev/contactSearch?customer_id=${customerId}&delete_flag=N`,
        {
          method: 'GET',
          headers: {
            'Ocp-Apim-Subscription-Key': import.meta.env.VITE_AZURE_API_KEY
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Map the contacts from the API response
      const contacts = (data.contacts || []).map((contact: any) => ({
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name}`.trim(),
        email: contact.email_address || '',
        phone: contact.direct_phone || ''
      }));

      setContacts(contacts);
      
      // Auto-select if only one contact
      if (contacts.length === 1) {
        setSelectedContact(contacts[0]);
        if (selectedCustomer) {
          // Pass the contact to update contact fields only
          onCustomerSelect(selectedCustomer, contacts[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Search Algolia when user types
  const searchCustomers = async (query: string, searchBy: 'name' | 'id') => {
    if (query.length < 3) {
      setCustomerResults([]);
      return;
    }

    setLoading(true);
    try {
      const customerIndexName = import.meta.env.VITE_ALGOLIA_CUSTOMER_INDEX || 'customers';
      const { results } = await searchClient.search({
        requests: [
          {
            indexName: customerIndexName,
            query: query,
            filters: 'delete_flag:N',
            hitsPerPage: 10,
            attributesToRetrieve: [
              'objectID', 'customer_id', 'customer_name', 'central_phone_number',
              'phys_address1', 'phys_address2', 'phys_city', 'phys_state', 
              'phys_postal_code', 'phys_country', 'ewing_region_id',
              'linked_contacts_count', 'customer_account_type', 'credit_status_desc', 'terms_desc',
              'default_branch', 'salesrep_display_name' 
            ],
            ...(searchBy === 'id' && {
              restrictSearchableAttributes: ['customer_id']
            })
          }
        ]
      });

      const hits = results[0]?.hits as unknown as Customer[] || [];
      setCustomerResults(hits);
      
      if (searchBy === 'name') {
        setShowCustomerDropdown(true);
      } else {
        setShowCustomerIdDropdown(true);
      }
    } catch (error) {
      console.error('Algolia search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearchTerm.length >= 3) {
        searchCustomers(customerSearchTerm, 'name');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerIdSearchTerm.length >= 3) {
        searchCustomers(customerIdSearchTerm, 'id');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerIdSearchTerm]);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.customer_name);
    setCustomerIdSearchTerm(customer.customer_id);
    setShowCustomerDropdown(false);
    setShowCustomerIdDropdown(false);
    setSelectedContact(null);
    setContacts([]);
    
    // Fetch contacts for this customer
    if (customer.linked_contacts_count > 0) {
      fetchContacts(customer.customer_id);
    } else {
      // No contacts, just return customer info
      onCustomerSelect(customer);
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactDropdown(false);
    if (selectedCustomer) {
      // Only pass the contact info, customer info was already set
      onCustomerSelect(selectedCustomer, contact);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {/* Company Name Search */}
      <div style={{ position: 'relative' }} ref={customerDropdownRef}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
          Company Name
          <span style={{ color: 'red' }}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={customerSearchTerm}
            onChange={(e) => {
              setCustomerSearchTerm(e.target.value);
              setSelectedCustomer(null);
              setSelectedContact(null);
              setContacts([]);
            }}
            placeholder="Type at least 3 characters..."
            style={{
              width: '100%',
              padding: '10px 36px 10px 12px',
              border: '1px solid #d1d5db',
              fontSize: '14px'
            }}
          />
          <Search
            size={16}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }}
          />
        </div>

        {/* Customer Dropdown */}
        {showCustomerDropdown && customerResults.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000
          }}>
            {customerResults.map((customer) => (
              <div
                key={customer.objectID}
                onClick={() => handleCustomerSelect(customer)}
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f3f4f6',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <div style={{ fontWeight: '500', fontSize: '14px', color: '#1f2937' }}>
                  {customer.customer_name}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                  ID: {customer.customer_id} • {customer.phys_city}, {customer.phys_state}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {customer.customer_account_type} • {customer.credit_status_desc}
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && customerSearchTerm.length >= 3 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            padding: '12px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            color: '#6b7280',
            zIndex: 1000
          }}>
            Searching...
          </div>
        )}
      </div>

      {/* Account Number (Customer ID) Search */}
      <div style={{ position: 'relative' }} ref={customerIdDropdownRef}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
          Account Number
          <span style={{ color: 'red' }}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={customerIdSearchTerm}
            onChange={(e) => {
              setCustomerIdSearchTerm(e.target.value);
              setSelectedCustomer(null);
              setSelectedContact(null);
              setContacts([]);
            }}
            placeholder="Type at least 3 characters..."
            style={{
              width: '100%',
              padding: '10px 36px 10px 12px',
              border: '1px solid #d1d5db',
              fontSize: '14px'
            }}
          />
          <Search
            size={16}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }}
          />
        </div>

        {/* Customer ID Dropdown */}
        {showCustomerIdDropdown && customerResults.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000
          }}>
            {customerResults.map((customer) => (
              <div
                key={customer.objectID}
                onClick={() => handleCustomerSelect(customer)}
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f3f4f6',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <div style={{ fontWeight: '500', fontSize: '14px', color: '#1f2937' }}>
                  {customer.customer_id}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                  {customer.customer_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Name Dropdown (only shown when customer is selected and has contacts) */}
      {selectedCustomer && selectedCustomer.linked_contacts_count > 0 && (
        <div style={{ position: 'relative' }} ref={contactDropdownRef}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
            Contact Name <span style={{ color: 'red' }}>*</span> {loadingContacts && <span style={{ color: '#9ca3af', fontSize: '12px' }}>(Loading...)</span>}
          </label>
          <div
            onClick={() => !loadingContacts && contacts.length > 0 && setShowContactDropdown(!showContactDropdown)}
            style={{
              width: '100%',
              padding: '10px 36px 10px 12px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              backgroundColor: loadingContacts || contacts.length === 0 ? '#f9fafb' : 'white',
              cursor: loadingContacts || contacts.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ color: selectedContact ? '#1f2937' : '#9ca3af' }}>
              {loadingContacts 
                ? 'Loading contacts...' 
                : contacts.length === 0 
                  ? 'No contacts available'
                  : selectedContact 
                    ? selectedContact.name 
                    : 'Select a contact...'}
            </span>
            {!loadingContacts && contacts.length > 0 && (
              <ChevronDown size={16} style={{ color: '#9ca3af' }} />
            )}
          </div>

          {showContactDropdown && contacts.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 1000
            }}>
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleContactSelect(contact)}
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div style={{ fontWeight: '500', fontSize: '14px', color: '#1f2937' }}>
                    {contact.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    {contact.email}
                  </div>
                  {contact.phone && (
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {contact.phone}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanySearch;