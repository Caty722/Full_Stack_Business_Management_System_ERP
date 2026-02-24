import { useState } from 'react'
import { useShop } from '../../context/ShopContext'
import { useAuth } from '../../context/AuthContext'
import { Save, Building2, Landmark, Phone, Mail, FileCheck, Hash, ShieldAlert, ShoppingCart, Power } from 'lucide-react'

const STATE_CODES = {
    "Andaman and Nicobar Islands": "35",
    "Andhra Pradesh": "37",
    "Arunachal Pradesh": "12",
    "Assam": "18",
    "Bihar": "10",
    "Chandigarh": "04",
    "Chhattisgarh": "22",
    "Dadra and Nagar Haveli": "26",
    "Daman and Diu": "25",
    "Delhi": "07",
    "Goa": "30",
    "Gujarat": "24",
    "Haryana": "06",
    "Himachal Pradesh": "02",
    "Jammu and Kashmir": "01",
    "Jharkhand": "20",
    "Karnataka": "29",
    "Kerala": "32",
    "Lakshadweep Islands": "31",
    "Madhya Pradesh": "23",
    "Maharashtra": "27",
    "Manipur": "14",
    "Meghalaya": "17",
    "Mizoram": "15",
    "Nagaland": "13",
    "Odisha": "21",
    "Puducherry": "34",
    "Punjab": "03",
    "Rajasthan": "08",
    "Sikkim": "11",
    "Tamil Nadu": "33",
    "Telangana": "36",
    "Tripura": "16",
    "Uttar Pradesh": "09",
    "Uttarakhand": "05",
    "West Bengal": "19",
    "Ladakh": "38"
}

export default function Settings() {
    const { brands, updateBranding, globalSettings, updateGlobalSettings, wipeApplicationData } = useShop()
    const { user, role } = useAuth()
    const [activeTab, setActiveTab] = useState('GST')
    const [localBrands, setLocalBrands] = useState(brands)
    const [isSaving, setIsSaving] = useState(false)
    const [isWiping, setIsWiping] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    const handlePincodeChange = async (brandKey, value) => {
        const pin = value.replace(/\D/g, '').slice(0, 6)
        handleChange(brandKey, 'pincode', pin)

        if (pin.length === 6) {
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
                const data = await res.json()
                if (data[0].Status === "Success") {
                    const postOffice = data[0].PostOffice[0]
                    const city = postOffice.District
                    const state = postOffice.State
                    const code = STATE_CODES[state] || ""

                    setLocalBrands(prev => ({
                        ...prev,
                        [brandKey]: {
                            ...prev[brandKey],
                            pincode: pin,
                            place: city,
                            city: city,
                            state: state,
                            stateCode: code
                        }
                    }))
                }
            } catch (error) {
                console.error("Error fetching pincode data:", error)
            }
        }
    }

    const handleWipeData = async () => {
        const confirmText = prompt("WARNING: This will delete ALL Products, Customers, Invoices, Quotations, and Logs. This action CANNOT BE UNDONE.\n\nType 'FACTORY RESET' to confirm.");
        if (confirmText !== 'FACTORY RESET') {
            setMessage({ type: 'error', text: 'Factory reset cancelled.' })
            return;
        }

        setIsWiping(true)
        setMessage({ type: '', text: 'Wiping application data...' })
        try {
            await wipeApplicationData()
            setMessage({ type: 'success', text: 'All application data has been permanently deleted.' })
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to wipe data: ' + error.message })
        } finally {
            setIsWiping(false)
        }
    }

    const handleChange = (brandKey, field, value) => {
        setLocalBrands(prev => ({
            ...prev,
            [brandKey]: {
                ...prev[brandKey],
                [field]: value
            }
        }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        setMessage({ type: '', text: '' })
        try {
            await updateBranding(localBrands)
            setMessage({ type: 'success', text: 'Settings saved successfully!' })
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save settings: ' + error.message })
        } finally {
            setIsSaving(false)
        }
    }

    const renderBrandForm = (brandKey) => {
        const brand = localBrands[brandKey]
        return (
            <div className="settings-form">
                <div className="settings-grid">
                    {/* Basic Info */}
                    <div className="settings-section glass-card">
                        <div className="section-header">
                            <Building2 className="section-icon" />
                            <h3>Business Branding</h3>
                        </div>
                        <div className="form-group">
                            <label>Business Name</label>
                            <input
                                type="text"
                                value={brand.name}
                                onChange={(e) => handleChange(brandKey, 'name', e.target.value)}
                                placeholder="e.g. Ferwa Regal Clean"
                            />
                        </div>
                        <div className="form-group">
                            <label>Full Address</label>
                            <textarea
                                value={brand.address}
                                onChange={(e) => handleChange(brandKey, 'address', e.target.value)}
                                placeholder="Full address for invoice"
                            />
                        </div>
                        {brandKey === 'NON_GST' && (
                            <div className="form-group">
                                <label>Brand Logo (Will appear on invoice)</label>
                                <div className="logo-upload-preview" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                    {brand.logo ? (
                                        <div style={{ background: '#fff', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                            <img src={brand.logo} alt="Brand Logo" style={{ height: '60px', width: 'auto', borderRadius: '4px', objectFit: 'contain' }} />
                                        </div>
                                    ) : (
                                        <div style={{ height: '60px', width: '100px', background: 'var(--bg-input)', border: '1px dashed var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No Logo</div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0]
                                                if (file) {
                                                    const reader = new FileReader()
                                                    reader.onloadend = () => {
                                                        handleChange(brandKey, 'logo', reader.result)
                                                    }
                                                    reader.readAsDataURL(file)
                                                }
                                            }}
                                            style={{ display: 'block', width: '100%', padding: '0.5rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--border-color)' }}
                                        />
                                        {brand.logo && (
                                            <button
                                                type="button"
                                                onClick={() => handleChange(brandKey, 'logo', '')}
                                                style={{ marginTop: '0.5rem', background: 'transparent', padding: 0, color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                            >
                                                Remove Logo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="form-row">
                            <div className="form-group">
                                <label>Address Line 1</label>
                                <input
                                    type="text"
                                    value={brand.address1}
                                    onChange={(e) => handleChange(brandKey, 'address1', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Address Line 2</label>
                                <input
                                    type="text"
                                    value={brand.address2}
                                    onChange={(e) => handleChange(brandKey, 'address2', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Pincode</label>
                                <input
                                    type="text"
                                    value={brand.pincode || ''}
                                    onChange={(e) => handlePincodeChange(brandKey, e.target.value)}
                                    placeholder="6 digit Pincode"
                                    maxLength={6}
                                />
                            </div>
                            <div className="form-group">
                                <label>Company Place (City)</label>
                                <input
                                    type="text"
                                    value={brand.place || ''}
                                    onChange={(e) => handleChange(brandKey, 'place', e.target.value)}
                                    placeholder="e.g. Salem"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>State</label>
                                <input
                                    type="text"
                                    value={brand.state}
                                    onChange={(e) => handleChange(brandKey, 'state', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>State Code</label>
                                <input
                                    type="text"
                                    value={brand.stateCode}
                                    onChange={(e) => handleChange(brandKey, 'stateCode', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact & Tax */}
                    <div className="settings-section glass-card">
                        <div className="section-header">
                            <FileCheck className="section-icon" />
                            <h3>Contact & Tax Info</h3>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Mobile</label>
                                <div className="input-with-icon">
                                    <Phone size={16} />
                                    <input
                                        type="text"
                                        value={brand.mobile}
                                        onChange={(e) => handleChange(brandKey, 'mobile', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <div className="input-with-icon">
                                    <Mail size={16} />
                                    <input
                                        type="email"
                                        value={brand.email}
                                        onChange={(e) => handleChange(brandKey, 'email', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="form-row">
                            {brandKey !== 'NON_GST' ? (
                                <div className="form-group">
                                    <label>GSTIN</label>
                                    <input
                                        type="text"
                                        value={brand.gstin}
                                        onChange={(e) => handleChange(brandKey, 'gstin', e.target.value)}
                                        placeholder="GSTIN Number"
                                    />
                                </div>
                            ) : (
                                <div className="form-group" style={{ visibility: 'hidden' }}>
                                    <label>Placeholder</label>
                                    <input type="text" disabled />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Invoice Prefix</label>
                                <div className="input-with-icon">
                                    <Hash size={16} />
                                    <input
                                        type="text"
                                        value={brand.prefix}
                                        onChange={(e) => handleChange(brandKey, 'prefix', e.target.value)}
                                        placeholder="e.g. GST or INV"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bank Details */}
                    {brandKey !== 'NON_GST' && (
                        <div className="settings-section glass-card full-width">
                            <div className="section-header">
                                <Landmark className="section-icon" />
                                <h3>Bank Account Details</h3>
                            </div>
                            <div className="form-grid-3">
                                <div className="form-group">
                                    <label>A/C Holder Name</label>
                                    <input
                                        type="text"
                                        value={brand.accountName || ''}
                                        onChange={(e) => handleChange(brandKey, 'accountName', e.target.value)}
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Bank Name</label>
                                    <input
                                        type="text"
                                        value={brand.bankName}
                                        onChange={(e) => handleChange(brandKey, 'bankName', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Account Number</label>
                                    <input
                                        type="text"
                                        value={brand.accountNo}
                                        onChange={(e) => handleChange(brandKey, 'accountNo', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>IFSC Code</label>
                                    <input
                                        type="text"
                                        value={brand.ifsc}
                                        onChange={(e) => handleChange(brandKey, 'ifsc', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Branch Address</label>
                                    <input
                                        type="text"
                                        value={brand.branch}
                                        onChange={(e) => handleChange(brandKey, 'branch', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const renderAdvancedSettings = () => {
        return (
            <div className="settings-form">
                <div className="settings-section glass-card" style={{ border: '1px solid #ef4444' }}>
                    <div className="section-header">
                        <ShieldAlert className="section-icon" style={{ color: '#ef4444', background: '#fef2f2' }} />
                        <h3 style={{ color: '#ef4444' }}>Danger Zone</h3>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <p style={{ color: 'var(--text-main)', marginBottom: '1rem', fontWeight: '500' }}>
                            Factory Reset Application Data
                        </p>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            This action will permanently delete all Products, Customers, Invoices, Quotations, and Stock Logs from the database. Settings and Branding will be preserved. This action <b>cannot</b> be undone.
                        </p>
                        <button
                            className="save-btn"
                            style={{ background: '#ef4444', width: 'auto', display: 'inline-flex' }}
                            onClick={handleWipeData}
                            disabled={isWiping}
                        >
                            <ShieldAlert size={18} />
                            <span>{isWiping ? 'Wiping Data...' : 'Delete All Data'}</span>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="settings-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Business Settings</h1>
                    <p className="page-subtitle">Manage branding and company information for business owners.</p>
                </div>
                <button
                    className={`save-btn ${isSaving ? 'loading' : ''}`}
                    onClick={handleSave}
                    disabled={isSaving || activeTab === 'ADVANCED'}
                    style={{ opacity: activeTab === 'ADVANCED' ? 0 : 1, pointerEvents: activeTab === 'ADVANCED' ? 'none' : 'auto' }}
                >
                    <Save size={18} />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
            </div>
            {message.text && (
                <div className={`alert-message ${message.type}`}>
                    {message.text}
                </div>
            )}


            <div className="settings-tabs">
                <button
                    className={`tab-btn ${activeTab === 'GST' ? 'active' : ''}`}
                    onClick={() => setActiveTab('GST')}
                >
                    GST Brand Configuration
                </button>
                <button
                    className={`tab-btn ${activeTab === 'NON_GST' ? 'active' : ''}`}
                    onClick={() => setActiveTab('NON_GST')}
                >
                    Non-GST Brand Configuration
                </button>
                {(role === 'super_admin' || role === 'admin') && (
                    <button
                        className={`tab-btn ${activeTab === 'ADVANCED' ? 'active alert' : ''}`}
                        onClick={() => setActiveTab('ADVANCED')}
                        style={{ color: activeTab === 'ADVANCED' ? '#ef4444' : '', borderColor: activeTab === 'ADVANCED' ? '#ef4444' : '' }}
                    >
                        Advanced Settings
                    </button>
                )}
            </div>

            <div className="tab-content">
                {activeTab === 'ADVANCED' ? renderAdvancedSettings() : renderBrandForm(activeTab)}
            </div>

            <style>{`
                .settings-page {
                    animation: fadeIn 0.4s ease-out;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .save-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: var(--primary);
                    color: white;
                    border-radius: 12px;
                    font-weight: 600;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                }

                .save-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
                }

                .save-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .alert-message {
                    padding: 1rem;
                    border-radius: 12px;
                    margin-bottom: 1.5rem;
                    font-weight: 500;
                    animation: slideDown 0.3s ease-out;
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .alert-message.success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
                .alert-message.error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

                .settings-tabs {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 1px;
                }

                .tab-btn {
                    padding: 0.75rem 1.5rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    position: relative;
                    transition: all 0.2s;
                }

                .tab-btn.active {
                    color: var(--primary);
                }

                .tab-btn.active::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: var(--primary);
                    border-radius: 3px 3px 0 0;
                }

                .settings-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                }

                .settings-section {
                    padding: 1.5rem;
                    border-radius: 20px;
                }

                .settings-section.full-width {
                    grid-column: span 2;
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                }

                .section-icon { color: var(--primary); }
                .section-header h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-main); }

                .form-group { margin-bottom: 1.25rem; }
                .form-group label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    margin-bottom: 0.5rem;
                }

                .form-group input, .form-group textarea {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: var(--bg-input);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    color: var(--text-main);
                    transition: border-color 0.2s;
                }

                .form-group input:focus, .form-group textarea:focus {
                    outline: none;
                    border-color: var(--primary);
                }

                .form-group textarea { min-height: 80px; resize: vertical; }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .form-grid-3 {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 1rem;
                }

                .input-with-icon {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-with-icon svg {
                    position: absolute;
                    left: 12px;
                    color: var(--text-muted);
                }

                .input-with-icon input {
                    padding-left: 2.5rem;
                }

                @media (max-width: 1024px) {
                    .settings-grid { grid-template-columns: 1fr; }
                    .settings-section.full-width { grid-column: span 1; }
                    .form-grid-3 { grid-template-columns: 1fr; }
                }
                @media (max-width: 768px) {
                    .form-row { grid-template-columns: 1fr; }
                    .settings-page { padding: 1rem; }
                    .settings-header { flex-direction: column; align-items: stretch; gap: 1rem; }
                    .btn-save { width: 100%; justify-content: center; }
                }

                /* Toggle Switch Styles */
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 60px;
                    height: 34px;
                }

                .switch input { 
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    -webkit-transition: .4s;
                    transition: .4s;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
                }

                .slider:before {
                    position: absolute;
                    content: "";
                    height: 26px;
                    width: 26px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    -webkit-transition: .4s;
                    transition: .4s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }

                input:checked + .slider {
                    background-color: #3b82f6;
                }

                input:focus + .slider {
                    box-shadow: 0 0 1px #3b82f6;
                }

                input:checked + .slider:before {
                    -webkit-transform: translateX(26px);
                    -ms-transform: translateX(26px);
                    transform: translateX(26px);
                }

                .slider.round {
                    border-radius: 34px;
                }

                .slider.round:before {
                    border-radius: 50%;
                }
            `}</style>
        </div >
    )
}
