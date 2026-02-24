import { Mail, Phone, MoreVertical, Plus, X, User, Search, Download, Trash2, FileText, Filter, ArrowUpRight, Users, Briefcase, IndianRupee, ChevronDown, Edit2, Check, Image as ImageIcon, Sparkles, Smartphone, Eye, MapPin, Building, Globe, CreditCard, Copy, TrendingUp, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useShop } from '../../context/ShopContext'
import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'

import CustomerDetailsModal from '../../components/CustomerDetailsModal'

const STATE_CODES = {
    'Jammu & Kashmir': '01', 'Himachal Pradesh': '02', 'Punjab': '03', 'Chandigarh': '04',
    'Uttarakhand': '05', 'Haryana': '06', 'Delhi': '07', 'Rajasthan': '08',
    'Uttar Pradesh': '09', 'Bihar': '10', 'Sikkim': '11', 'Arunachal Pradesh': '12',
    'Nagaland': '13', 'Manipur': '14', 'Mizoram': '15', 'Tripura': '16',
    'Meghalaya': '17', 'Assam': '18', 'West Bengal': '19', 'Jharkhand': '20',
    'Odisha': '21', 'Chhattisgarh': '22', 'Madhya Pradesh': '23', 'Gujarat': '24',
    'Daman & Diu': '25', 'Dadra & Nagar Haveli': '26', 'Maharashtra': '27', 'Karnataka': '29',
    'Goa': '30', 'Lakshadweep': '31', 'Kerala': '32', 'Tamil Nadu': '33',
    'Puducherry': '34', 'Andaman & Nicobar Islands': '35', 'Telangana': '36',
    'Andhra Pradesh': '37', 'Ladakh': '38'
}

const StatsCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="stats-card glass-card">
        <div className={`stats-glow ${colorClass}`}></div>
        <div className="stats-content">
            <div className="stats-info">
                <span className="stats-label">{title}</span>
                <h3 className="stats-value">{value}</h3>
            </div>
            <div className={`stats-icon-wrapper ${colorClass}`}>
                <Icon size={24} />
            </div>
        </div>
    </div>
)

const CustomerModal = ({ onClose, addCustomer, updateCustomer, editCustomer = null }) => {
    const [activeTab, setActiveTab] = useState('details')
    const [isLoadingPincode, setIsLoadingPincode] = useState(false)
    const [formData, setFormData] = useState(editCustomer || {
        name: '',
        email: '',
        phone: '',
        type: 'Customer', // 'Customer' or 'Vendor'
        isGST: false,
        gstPercentage: 18,
        gstin: '',
        address: '',
        city: '',
        state: '',
        stateCode: '',
        pincode: '',
        website: '',
        creditLimit: ''
    })

    // Body scroll lock
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (editCustomer) {
            updateCustomer({ ...formData, id: editCustomer.id })
        } else {
            addCustomer(formData)
        }
        onClose()
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        const newValue = type === 'checkbox' ? checked : value
        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }))

        // Pincode Lookup Logic
        if (name === 'pincode' && value.length === 6) {
            handlePincodeLookup(value)
        }

        // Manual State Change -> Auto State Code
        if (name === 'state') {
            const derivedCode = STATE_CODES[value] || ''
            setFormData(prev => ({ ...prev, stateCode: derivedCode }))
        }
    }

    const handlePincodeLookup = async (pin) => {
        setIsLoadingPincode(true)
        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
            const data = await response.json()
            if (data[0].Status === 'Success') {
                const postOffice = data[0].PostOffice[0]
                const derivedState = postOffice.State
                const derivedCode = STATE_CODES[derivedState] || ''
                setFormData(prev => ({
                    ...prev,
                    city: postOffice.District,
                    state: derivedState,
                    stateCode: derivedCode
                }))
            }
        } catch (error) {
            console.error('Error fetching pincode data:', error)
        } finally {
            setIsLoadingPincode(false)
        }
    }

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="header-left">
                        <button className="close-btn" onClick={onClose}><X size={20} /></button>
                        <div className="modal-title-group">
                            <h2 className="modal-title">{editCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
                        </div>
                    </div>
                    <button className="btn btn-primary top-save-btn" onClick={handleSubmit}>
                        {editCustomer ? 'Save Changes' : 'Add Customer'}
                    </button>
                </div>

                {/* Tabs */}
                <div className="modal-tabs">
                    <button
                        className={`tab-item ${activeTab === 'details' ? 'active' : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Details
                    </button>
                </div>


                {/* Content */}
                <div className="modal-body split-view">
                    {/* LEFT PANEL: Form Inputs */}
                    <div className="form-panel">
                        {/* MODULE 1: ESSENTIALS */}
                        <div className="details-card staggered-section" style={{ animationDelay: '0.1s' }}>
                            <div className="card-header-mini">ESSENTIALS</div>
                            <div className="card-content">
                                <div className="form-row">
                                    <div className="standard-tabs-wrapper" style={{ minWidth: '180px', height: '38px' }}>
                                        <div
                                            className="standard-tabs-indicator"
                                            style={{
                                                width: `calc((100% - 4px) / 2)`,
                                                left: `calc(2px + (${formData.type === 'Customer' ? 0 : 1} * (100% - 4px) / 2))`
                                            }}
                                        ></div>
                                        <button type="button" className={`standard-tabs-btn ${formData.type === 'Customer' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, type: 'Customer' })}>Customer</button>
                                        <button type="button" className={`standard-tabs-btn ${formData.type === 'Vendor' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, type: 'Vendor' })}>Vendor</button>
                                    </div>
                                    <div className="standard-tabs-wrapper ml-4" style={{ minWidth: '180px', height: '38px' }}>
                                        <div
                                            className="standard-tabs-indicator"
                                            style={{
                                                width: `calc((100% - 4px) / 2)`,
                                                left: `calc(2px + (${formData.isGST ? 0 : 1} * (100% - 4px) / 2))`
                                            }}
                                        ></div>
                                        <button type="button" className={`standard-tabs-btn ${formData.isGST ? 'active' : ''}`} onClick={() => setFormData({ ...formData, isGST: true })}>GST</button>
                                        <button type="button" className={`standard-tabs-btn ${!formData.isGST ? 'active' : ''}`} onClick={() => setFormData({ ...formData, isGST: false })}>Non-GST</button>
                                    </div>
                                </div>

                                <div className="form-group required">
                                    <label>Customer Name</label>
                                    <div className="filled-glass-input">
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Company or Individual Name"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group flex-1">
                                        <label>Email Address</label>
                                        <div className="filled-glass-input">
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group flex-1">
                                        <label>Phone Number</label>
                                        <div className="filled-glass-input">
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+91 98765 00000"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MODULE 2: TAX & ADDRESS */}
                        <div className="details-card staggered-section" style={{ animationDelay: '0.2s' }}>
                            <div className="card-header-mini">TAX & LOCATION</div>
                            <div className="card-content">
                                {formData.isGST && (
                                    <div className="form-group">
                                        <label>GSTIN</label>
                                        <div className="filled-glass-input">
                                            <input
                                                type="text"
                                                name="gstin"
                                                value={formData.gstin}
                                                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                                                placeholder="29AAAAA0000A1Z5"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Billing Address</label>
                                    <div className="filled-glass-input">
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            placeholder="Street Address, Area, etc."
                                            rows="2"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group flex-1">
                                        <label>Pincode</label>
                                        <div className="filled-glass-input" style={{ display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                name="pincode"
                                                value={formData.pincode}
                                                onChange={handleChange}
                                                placeholder="6 Digit PIN"
                                                maxLength="6"
                                            />
                                            {isLoadingPincode && <Loader2 size={16} className="animate-spin" style={{ marginRight: '10px', color: 'var(--primary-color)' }} />}
                                        </div>
                                    </div>
                                    <div className="form-group flex-1">
                                        <label>Place / City</label>
                                        <div className="filled-glass-input">
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                placeholder="City Name"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ width: '80px' }}>
                                        <label>Code</label>
                                        <div className="filled-glass-input">
                                            <input
                                                type="text"
                                                name="stateCode"
                                                value={formData.stateCode}
                                                readOnly
                                                placeholder="--"
                                                style={{ textAlign: 'center', opacity: 0.7 }}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group flex-1">
                                        <label>State</label>
                                        <div className="filled-glass-input">
                                            <input
                                                type="text"
                                                name="state"
                                                value={formData.state}
                                                onChange={handleChange}
                                                placeholder="State Name"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Live Preview */}
                    <div className="preview-panel">
                        <div className="preview-header">
                            <Smartphone size={16} /> <span>Live Preview</span>
                        </div>
                        <div className="mobile-mockup">
                            <div className="mockup-screen">
                                <div className="mockup-status-bar">
                                    <span>9:41</span>
                                    <div className="status-icons">
                                        <div className="icon-signal"></div>
                                        <div className="icon-wifi"></div>
                                        <div className="icon-battery"></div>
                                    </div>
                                </div>
                                <div className="mockup-content" style={{ padding: '20px' }}>
                                    <div style={{
                                        background: 'linear-gradient(135deg, #1e1e24 0%, #2a2a35 100%)',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                            <div style={{
                                                width: '50px', height: '50px',
                                                borderRadius: '50%',
                                                background: formData.name ? `hsl(${formData.name.length * 20}, 70%, 50%)` : '#333',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '20px', fontWeight: 'bold', color: 'white'
                                            }}>
                                                {formData.name ? formData.name.charAt(0).toUpperCase() : <User size={24} />}
                                            </div>
                                            <div>
                                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>{formData.name || 'Customer Name'}</div>
                                                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{formData.type} • {formData.isGST ? 'GST Registered' : 'Consumer'}</div>
                                            </div>
                                        </div>

                                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '15px', marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                                                <Mail size={14} /> <span>{formData.email || 'email@example.com'}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                                                <Phone size={14} /> <span>{formData.phone || '+91 00000 00000'}</span>
                                            </div>
                                        </div>

                                        {(formData.address || formData.city || formData.state || formData.pincode) && (
                                            <div style={{ display: 'flex', gap: '10px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', padding: '0 5px' }}>
                                                <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                                                <span>
                                                    {formData.address && `${formData.address}, `}
                                                    {formData.city && `${formData.city}, `}
                                                    {formData.state && `${formData.state}${formData.stateCode ? ` (${formData.stateCode})` : ''}`}
                                                    {formData.pincode && ` - ${formData.pincode}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="preview-tip">
                            <Eye size={14} /> <span>Previewing contact card</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="btn btn-primary footer-save-btn" onClick={handleSubmit}>
                        {editCustomer ? 'Save Changes' : 'Add Customer'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

export default function Customers() {
    const { customers, addCustomer, updateCustomer, deleteCustomer, bulkDeleteCustomers, invoices } = useShop()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editCustomer, setEditCustomer] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [showActionsMenu, setShowActionsMenu] = useState(null)

    // Calculate dynamic data
    const enrichedCustomers = useMemo(() => {
        return customers.map(customer => {
            const customerInvoices = invoices.filter(inv => inv.customer === customer.name)
            const totalSpent = customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
            const lastOrder = customerInvoices.length > 0
                ? new Date(Math.max(...customerInvoices.map(inv => new Date(inv.date)))).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Never'

            return {
                ...customer,
                totalSpent,
                lastOrder
            }
        })
    }, [customers, invoices])

    const filteredCustomers = enrichedCustomers.filter(c => {
        const matchesSearch =
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.gstin && c.gstin.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesFilter =
            filterType === 'all' ||
            (filterType === 'gst' && c.isGST) ||
            (filterType === 'nongst' && !c.isGST)

        return matchesSearch && matchesFilter
    })

    // --- Pagination Logic ---
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, filterType, customers])

    const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage))
    const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const stats = useMemo(() => {
        const totalCustomers = customers.length
        const gstCustomers = customers.filter(c => c.isGST).length
        const totalReceivables = invoices
            .filter(inv => inv.status !== 'Paid')
            .reduce((sum, inv) => sum + (inv.total || 0), 0)

        return {
            totalCustomers,
            gstCustomers,
            totalReceivables
        }
    }, [customers, invoices])

    const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState(null)


    const handleExport = () => {
        const headers = ['Name', 'Email', 'Phone', 'Address', 'isGST', 'GSTIN', 'GST%', 'Total Spent', 'Last Order']
        const rows = filteredCustomers.map(c => [
            c.name,
            c.email || '',
            c.phone || '',
            `"${c.address}"`,
            c.isGST,
            c.gstin || '',
            c.gstPercentage || 0,
            c.totalSpent,
            c.lastOrder
        ])

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "customers_export.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }


    return (
        <div className="customers-page animate-fade-in">
            <div className="mesh-gradient"></div>

            <div className="page-header mb-6">
                <div className="title-section">
                    <h1 className="page-title">Customers</h1>
                    <p className="page-subtitle">Manage your clients and their billing information</p>
                </div>
                <div className="header-actions">
                    <button className="export-btn glass-card" onClick={handleExport}>
                        <Download size={18} />
                        <span>Export</span>
                    </button>
                    <button className="add-btn primary-btn" onClick={() => {
                        setEditCustomer(null)
                        setIsModalOpen(true)
                    }}>
                        <Plus size={20} />
                        <span>Add Customer</span>
                    </button>
                </div>
            </div>

            <div className="stats-grid mb-8">
                <StatsCard
                    title="Total Customers"
                    value={stats.totalCustomers}
                    icon={Users}
                    colorClass="blue"
                />
                <StatsCard
                    title="GST Customers"
                    value={stats.gstCustomers}
                    icon={FileText}
                    colorClass="purple"
                />
                <StatsCard
                    title="Total Receivables"
                    value={`₹${stats.totalReceivables.toLocaleString('en-IN')}`}
                    icon={IndianRupee}
                    colorClass="green"
                />
            </div>

            <div className="table-actions-bar glass-card mb-6">
                <div className="standard-search-wrapper">
                    <Search className="standard-search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="filters-wrapper">
                    <div className="standard-tabs-wrapper" style={{ minWidth: '320px' }}>
                        <div
                            className="standard-tabs-indicator"
                            style={{
                                width: `calc((100% - 8px) / 3)`,
                                left: `calc(4px + ((${filterType === 'all' ? 0 : filterType === 'gst' ? 1 : 2}) * (100% - 8px) / 3))`
                            }}
                        ></div>
                        <button
                            className={`standard-tabs-btn ${filterType === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterType('all')}
                        >All <span className="tab-count">{customers.length}</span></button>
                        <button
                            className={`standard-tabs-btn ${filterType === 'gst' ? 'active' : ''}`}
                            onClick={() => setFilterType('gst')}
                        >GST <span className="tab-count">{customers.filter(c => c.isGST).length}</span></button>
                        <button
                            className={`standard-tabs-btn ${filterType === 'nongst' ? 'active' : ''}`}
                            onClick={() => setFilterType('nongst')}
                        >Non-GST <span className="tab-count">{customers.filter(c => !c.isGST).length}</span></button>
                    </div>
                </div>
            </div>

            <div className="table-card glass-card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name & Location</th>
                                <th>Contact Information</th>
                                <th>Type</th>
                                <th>Total Revenue</th>
                                <th>Activity</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCustomers.length > 0 ? (
                                paginatedCustomers.map((customer) => (
                                    <tr
                                        key={customer.id}
                                        className="clickable-row"
                                        onClick={() => setSelectedCustomerForLedger(customer)}
                                    >
                                        <td>
                                            <div className="customer-info">
                                                <div className={`customer-avatar-v2 ${customer.isGST ? 'bg-2' : 'bg-0'}`}>
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="customer-details">
                                                    <div className="customer-name">{customer.name}</div>
                                                    <div className="address-text">
                                                        {customer.address || 'Global'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-info-v2">
                                                <div className="contact-link"><Mail size={12} /> {customer.email || '—'}</div>
                                                <div className="contact-link"><Phone size={12} /> {customer.phone || '—'}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`type-pill neon-${customer.isGST ? 'gst' : 'regular'}`}>
                                                <span className="neon-dot"></span>
                                                {customer.isGST ? 'GST' : 'Regular'}
                                            </div>
                                            {customer.isGST && customer.gstin && (
                                                <div className="gstin-subtext">{customer.gstin}</div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="revenue-amount">₹{customer.totalSpent.toLocaleString('en-IN')}</div>
                                            <div className="revenue-label">Total Invoiced</div>
                                        </td>
                                        <td>
                                            <div className="activity-text">{customer.lastOrder}</div>
                                            <div className="activity-label">Last Transaction</div>
                                        </td>
                                        <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                                            <div className="row-actions">
                                                <button
                                                    className="action-pill-btn"
                                                    onClick={() => {
                                                        setEditCustomer(customer)
                                                        setIsModalOpen(true)
                                                    }}
                                                >
                                                    <Edit2 size={14} />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    className="action-pill-btn delete"
                                                    onClick={() => {
                                                        if (window.confirm(`Delete ${customer.name}?`)) {
                                                            deleteCustomer(customer.id)
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="empty-state">
                                        <div className="empty-content">
                                            <Users size={48} className="empty-icon" />
                                            <h3>No results found</h3>
                                            <p>Try refining your search terms or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="sales-footer">
                    <div className="pagination">
                        <span className="page-count" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{currentPage} / {totalPages}</span>
                        <button
                            className="page-btn"
                            disabled={currentPage === 1}
                            onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(1, prev - 1)); }}
                            style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            className="page-btn active"
                            disabled={currentPage === totalPages}
                            onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(totalPages, prev + 1)); }}
                            style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {
                isModalOpen && (
                    <CustomerModal
                        onClose={() => {
                            setIsModalOpen(false)
                            setEditCustomer(null)
                        }}
                        addCustomer={addCustomer}
                        updateCustomer={updateCustomer}
                        editCustomer={editCustomer}
                    />
                )
            }

            {
                selectedCustomerForLedger && (
                    <CustomerDetailsModal
                        customer={selectedCustomerForLedger}
                        onClose={() => setSelectedCustomerForLedger(null)}
                    />
                )
            }

            <style>{`
                .customers-page {
                    position: relative;
                    padding: 0 2rem 3rem 2rem;
                    max-width: 1440px;
                    margin: 0 auto;
                    z-index: 1;
                }

                .mesh-gradient {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.03) 0px, transparent 50%),
                                radial-gradient(at 0% 100%, rgba(200, 200, 200, 0.03) 0px, transparent 50%);
                    z-index: -1;
                    pointer-events: none;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1.5rem;
                }
                .page-title {
                    font-size: 2.25rem;
                    font-weight: 800;
                    color: var(--text-main);
                    letter-spacing: -0.02em;
                }
                .page-subtitle {
                    color: var(--text-muted);
                    font-size: 0.95rem;
                    margin-top: 0.5rem;
                }
                .mb-8 { margin-bottom: 2.5rem; }
                .mb-6 { margin-bottom: 1.5rem; }

                /* Advanced Glassmorphism */
                .glass-card {
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(20px) saturate(160%);
                    -webkit-backdrop-filter: blur(20px) saturate(160%);
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05);
                    position: relative;
                    overflow: hidden;
                }

                :root.dark .glass-card {
                    background: rgba(15, 15, 20, 0.5);
                    backdrop-filter: blur(24px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
                }

                /* Stats Cards Refinement */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1.5rem;
                }
                .stats-card {
                    padding: 1.75rem;
                    border-radius: 20px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .stats-card:hover {
                    transform: translateY(-4px);
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.15);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
                }
                .stats-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: relative;
                    z-index: 2;
                }
                .stats-glow {
                    position: absolute;
                    top: -20px;
                    right: -20px;
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    filter: blur(40px);
                    opacity: 0.1;
                    z-index: 1;
                    transition: opacity 0.3s;
                }
                .stats-card:hover .stats-glow { opacity: 0.2; }
                .stats-glow.blue { background: #6366f1; }
                .stats-glow.purple { background: #a855f7; }
                .stats-glow.green { background: #10b981; }

                .stats-label {
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 600;
                    color: var(--text-muted);
                    margin-bottom: 0.5rem;
                }
                .stats-value {
                    font-size: 2.25rem;
                    font-weight: 800;
                    color: var(--text-main);
                    letter-spacing: -0.03em;
                }
                .stats-icon-wrapper {
                    padding: 1rem;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stats-icon-wrapper.blue { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
                .stats-icon-wrapper.purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
                .stats-icon-wrapper.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }

                /* Table Actions Bar Refinement */
                .table-actions-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem 1.25rem;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid var(--border-color);
                    gap: 1.5rem;
                }
                .standard-search-wrapper:focus-within {
                    background: var(--bg-surface);
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
                }

                /* Global Standardized Tabs logic integrated */
                .segment-btn:not(.active):hover { color: var(--text-main); }

                .bulk-delete-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.25rem;
                    border-radius: 12px;
                    background: rgba(ef, 68, 68, 0.1);
                    border: 1.5px solid rgba(ef, 68, 68, 0.2);
                    color: #ef4444;
                    font-weight: 700;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-left: 0.5rem;
                }
                .bulk-delete-btn:hover {
                    background: #ef4444;
                    color: white;
                    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
                }
                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .export-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    padding: 0.75rem 1.25rem;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                    color: var(--text-main);
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: rgba(255, 255, 255, 0.05);
                }
                .export-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    transform: translateY(-1px);
                    border-color: var(--primary-color);
                }
                :root.dark .export-btn {
                    background: rgba(255, 255, 255, 0.03);
                    border-color: rgba(255, 255, 255, 0.1);
                }

                .add-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    background: #6366f1; /* Explicit solid primary color for visibility */
                    color: #ffffff !important;
                    font-weight: 700;
                    font-size: 0.9rem;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
                    border: none;
                }
                .add-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.45);
                    filter: brightness(110%);
                }
                .add-btn svg {
                    stroke-width: 3px; /* Make icon more prominent */
                }

                /* REFINED TABLE STYLES */
                .table-card { 
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                table { margin-bottom: 0; }
                th {
                    background: rgba(var(--primary-rgb, 99, 102, 241), 0.02);
                    padding: 1.25rem 1.5rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--text-muted);
                    border-bottom: 1.5px solid var(--border-color);
                    position: relative;
                    overflow: hidden;
                }
                th::after {
                    content: '';
                    position: absolute;
                    top: 0; left: -100%;
                    width: 100%; height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
                    animation: shimmer 10s infinite;
                }
                @keyframes shimmer {
                    0% { left: -100%; }
                    20% { left: 100%; }
                    100% { left: 100%; }
                }
                td {
                    padding: 1.5rem;
                    vertical-align: middle;
                    border-bottom: 1px solid var(--border-color);
                    transition: background 0.2s;
                }
                tr:last-child td { border-bottom: none; }
                tr:hover td { background: rgba(var(--primary-rgb, 99, 102, 241), 0.02); }
                
                .selected-row td { background: rgba(var(--primary-rgb, 99, 102, 241), 0.04) !important; }

                /* Customer Information Cell */
                .customer-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .customer-avatar-v2 {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1rem;
                    color: white;
                    flex-shrink: 0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .bg-0 { background: linear-gradient(135deg, #6366f1, #4f46e5); }
                .bg-1 { background: linear-gradient(135deg, #ec4899, #db2777); }
                .bg-2 { background: linear-gradient(135deg, #10b981, #059669); }
                .bg-3 { background: linear-gradient(135deg, #f59e0b, #d97706); }
                .bg-4 { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }

                .customer-name { 
                    font-weight: 600; 
                    font-size: 0.95rem; 
                    color: var(--text-main);
                    margin-bottom: 0.2rem;
                }
                .address-text {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    max-width: 220px;
                    display: -webkit-box;
                    -webkit-line-clamp: 1;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                /* Contact Info Cell */
                .contact-info-v2 {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .contact-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    color: var(--text-muted);
                    transition: color 0.2s;
                }
                .contact-link:hover { color: var(--primary-color); }

                /* Type Pill Refinement (Neon Style) */
                .type-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.35rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    margin-bottom: 0.35rem;
                }
                .type-pill.neon-gst { 
                    background: rgba(16, 185, 129, 0.1); 
                    color: #10b981; 
                    border-color: rgba(16, 185, 129, 0.25);
                    box-shadow: 0 0 15px rgba(16, 185, 129, 0.05);
                }
                .type-pill.neon-regular { 
                    background: rgba(var(--primary-rgb, 99, 102, 241), 0.1); 
                    color: var(--primary-color); 
                    border-color: rgba(var(--primary-rgb, 99, 102, 241), 0.25);
                    box-shadow: 0 0 15px rgba(var(--primary-rgb, 99, 102, 241), 0.05);
                }
                .neon-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }
                .neon-gst .neon-dot { 
                    background: #10b981; 
                    box-shadow: 0 0 8px rgba(16, 185, 129, 0.6); 
                }
                .neon-regular .neon-dot { 
                    background: var(--primary-color); 
                    box-shadow: 0 0 8px rgba(var(--primary-rgb, 99, 102, 241), 0.6); 
                }
                .gstin-subtext { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--text-muted); opacity: 0.8; }

                /* Revenue & Activity */
                .revenue-amount { font-weight: 700; color: var(--text-main); font-size: 1rem; }
                .revenue-label, .activity-label { font-size: 0.75rem; color: var(--text-muted); opacity: 0.7; margin-top: 0.15rem; }
                .activity-text { font-weight: 600; font-size: 0.9rem; color: var(--text-secondary); }

                /* Row Actions */
                .row-actions {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 0.5rem;
                    opacity: 0.4;
                    transition: opacity 0.2s;
                }
                tr:hover .row-actions { opacity: 1; }
                
                .action-pill-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.4rem 0.75rem;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    transition: all 0.2s;
                }
                .action-pill-btn:hover {
                    color: var(--primary-color);
                    border-color: var(--primary-color);
                    transform: translateY(-1px);
                }
                .action-pill-btn.delete { color: #ef4444; }
                .action-pill-btn.delete:hover {
                    background: #ef4444;
                    color: white;
                    border-color: #ef4444;
                }

                .empty-state { padding: 5rem 2rem !important; }
                .empty-icon { color: var(--primary-color); opacity: 0.15; margin-bottom: 1.5rem; }
                .empty-content h3 { font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem; }
                .empty-content p { color: var(--text-muted); }

                /* Custom Checkbox */
                .checkbox-wrapper input {
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    border: 2px solid var(--border-color);
                    border-radius: 5px;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.2s;
                }
                .checkbox-wrapper input:checked {
                    background: var(--primary-color);
                    border-color: var(--primary-color);
                }
                .checkbox-wrapper input:checked::after {
                    content: '✓';
                    position: absolute;
                    color: white;
                    font-size: 12px;
                    font-weight: 900;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }

                /* MODAL STYLES */
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    animation: fadeIn 0.2s ease-out;
                }
                
                .modal-container {
                    width: 95%;
                    max-width: 1100px;
                    max-height: 90vh; /* Reduced to ensure it fits mobile screens */
                    background: var(--bg-surface);
                    border-radius: 20px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden; /* Header and Footer stay fixed */
                    border: 1px solid var(--border-color);
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.2);
                    animation: modalEntry 0.4s cubic-bezier(0.19, 1, 0.22, 1);
                    color: var(--text-main);
                    position: relative;
                }

                @keyframes modalEntry {
                    from { transform: scale(0.95) translateY(20px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .modal-header {
                    padding: 1.25rem 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid var(--border-color);
                    background: rgba(var(--primary-rgb, 99, 102, 241), 0.02);
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    transition: color 0.2s;
                }
                .close-btn:hover { color: var(--text-main); }

                .modal-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text-main);
                }

                .top-save-btn {
                    padding: 0.5rem 1.25rem !important;
                    font-size: 0.85rem !important;
                }

                .modal-tabs {
                    padding: 0 2rem;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    border-bottom: 1px solid var(--border-color);
                    background: rgba(0, 0, 0, 0.02);
                }

                .tab-item {
                    height: 100%;
                    display: flex;
                    align-items: center;
                    padding: 0 0.5rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    position: relative;
                    cursor: pointer;
                }

                .tab-item.active { color: var(--primary-color); }
                .tab-item.active::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: var(--primary-color);
                }

                .modal-body.split-view {
                    flex: 1;
                    display: grid;
                    grid-template-columns: 1.4fr 1fr;
                    overflow: hidden;
                    min-height: 0;
                }

                .form-panel {
                    padding: 2rem;
                    overflow-y: auto;
                    min-height: 0;
                    height: 100%;
                    border-right: 1px solid var(--border-color);
                }

                .preview-panel {
                    background: rgba(0, 0, 0, 0.02);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    position: relative;
                    overflow-y: auto;
                    height: 100%;
                }

                .details-card {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .card-header-mini {
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin-bottom: 1rem;
                }

                .form-row {
                    display: flex;
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }
                .flex-1 { flex: 1; }

                .filled-glass-input {
                    background: rgba(0, 0, 0, 0.03);
                    border: 1.5px solid rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                    padding: 0.5rem 0.75rem;
                    transition: all 0.2s;
                }
                :root.dark .filled-glass-input {
                    background: rgba(255, 255, 255, 0.04);
                    border-color: rgba(255, 255, 255, 0.1);
                }
                .filled-glass-input:focus-within {
                    background: var(--bg-surface);
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                }

                .filled-glass-input input, 
                .filled-glass-input select, 
                .filled-glass-input textarea {
                    background: transparent;
                    border: none;
                    width: 100%;
                    outline: none;
                    box-shadow: none !important;
                    color: var(--text-main);
                    font-weight: 500;
                    padding: 0;
                }

                .preview-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-muted);
                    font-size: 0.8rem;
                    font-weight: 600;
                    margin-bottom: 1.5rem;
                }

                .mobile-mockup {
                    width: 280px;
                    height: 560px;
                    background: #1a1a1a;
                    border-radius: 40px;
                    padding: 12px;
                    border: 4px solid #333;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .mockup-screen {
                    width: 100%;
                    height: 100%;
                    background: #000;
                    border-radius: 32px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .mockup-status-bar {
                    height: 30px;
                    padding: 0 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    font-size: 10px;
                    color: white;
                }

                .status-icons {
                    display: flex;
                    gap: 4px;
                }

                .preview-tip {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-muted);
                    font-size: 0.75rem;
                    margin-top: 1.5rem;
                }

                .modal-footer {
                    padding: 1.25rem 2rem;
                    border-top: 1px solid var(--border-color);
                    background: rgba(var(--primary-rgb, 99, 102, 241), 0.02);
                    display: flex;
                    justify-content: flex-end;
                }

                .footer-save-btn {
                    padding: 0.75rem 2rem !important;
                }

                .ml-4 { margin-left: 1rem; }
                .mt-8 { margin-top: 2rem; }

                /* RESPONSIVE MODAL */
                @media (max-width: 1024px) {
                    .modal-body.split-view {
                        grid-template-columns: 1fr;
                        overflow-y: auto;
                    }
                    .form-panel {
                        border-right: none;
                        border-bottom: 1px solid var(--border-color);
                        height: auto;
                        overflow-y: visible;
                    }
                    .preview-panel {
                        height: auto;
                        overflow-y: visible;
                        padding: 3rem 1rem;
                    }
                    .modal-container {
                        height: 95vh;
                    }
                }

                @media (max-width: 640px) {
                    .modal-tabs {
                        padding: 0 1rem;
                    }
                    .form-panel {
                        padding: 1.5rem 1rem;
                    }
                    .standard-tabs-wrapper {
                        min-width: 140px !important;
                    }
                }

                @media (max-width: 768px) {
                    .page-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
                    .header-actions { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
                    .header-actions button { justify-content: center; padding: 0.5rem; font-size: 0.85rem; }
                    .stats-grid { grid-template-columns: 1fr; gap: 1rem; }
                    .table-actions-bar { flex-direction: column; gap: 1rem; align-items: stretch; padding: 1.25rem; }
                    .standard-search-wrapper { width: 100%; }
                    .filters-wrapper { width: 100%; }
                    .standard-tabs-wrapper { width: 100% !important; min-width: 0 !important; }
                    .table-container { margin: 0 -1.5rem; width: calc(100% + 3rem); }
                    .table-card { padding: 1rem; }
                    .stats-value { font-size: 1.4rem; }
                }

                @media (max-width: 480px) {
                    .header-actions { grid-template-columns: 1fr; }
                    .table-actions-bar { padding: 1rem; }
                }
            `}</style>
        </div >
    )
}
