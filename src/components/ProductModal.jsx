import React, { useState, useEffect, useMemo } from 'react'
import { useShop } from '../context/ShopContext'
import { createPortal } from 'react-dom'
import { X, Plus, Image as ImageIcon, Sparkles, Lock, Info, ChevronDown, Check, Package, Box, Weight, Droplets, TrendingUp, Smartphone, Eye, Wine, Ruler, Layers, ShoppingBag, Beaker, Save, Copy } from 'lucide-react'

export default function ProductModal({ isOpen, onClose, onAdd, onUpdate, product }) {
    const [activeTab, setActiveTab] = useState('details')
    const [isDuplicateMode, setIsDuplicateMode] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        type: 'Product',
        price: '',
        unit: 'Pcs',
        hsn: '',
        purchasePrice: '',
        taxIncluded: false,
        barcode: '',
        description: '',
        stock: '',
        totalStock: '100',
        alertThreshold: 25,
        isGST: true,
        gstName: ''
    })

    // Sync formData when product prop changes (for editing)
    useEffect(() => {
        if (product) {
            setFormData({
                ...product,
                price: String(product.price),
                purchasePrice: String(product.purchasePrice || ''),
                stock: String(product.stock),
                totalStock: String(product.totalStock || '100')
            })
            setIsDuplicateMode(false)
        } else {
            setFormData({
                name: '',
                type: 'Product',
                price: '',
                unit: 'Pcs',
                hsn: '',
                purchasePrice: '',
                taxIncluded: false,
                barcode: '',
                description: '',
                stock: '',
                totalStock: '100',
                alertThreshold: 25,
                isGST: true,
                gstName: ''
            })
        }
    }, [product, isOpen])

    const [availableUnits, setAvailableUnits] = useState([
        { label: 'Pcs', icon: Package },
        { label: 'Box', icon: Box },
        { label: 'Kg', icon: Weight },
        { label: 'Ltr', icon: Droplets }
    ])

    const { products, updateProduct } = useShop()

    // Helper: Smart Icon Mapping based on keywords
    const getSmartIcon = (label) => {
        const lower = label.toLowerCase()
        if (['bottle', 'jar', 'can', 'tin', 'drum'].some(k => lower.includes(k))) return Wine
        if (['m', 'meter', 'cm', 'inch', 'ft', 'yard'].some(k => lower.includes(k))) return Ruler
        if (['set', 'bundle', 'dozen', 'pair', 'pack'].some(k => lower.includes(k))) return Layers
        if (['bag', 'packet', 'sack', 'pouch'].some(k => lower.includes(k))) return ShoppingBag
        if (['ml', 'oz', 'cup', 'pint'].some(k => lower.includes(k))) return Beaker

        return Package // Default
    }

    // Smart Logic: Profit Margin Calculator
    const profitMargin = useMemo(() => {
        if (!formData.price || !formData.purchasePrice) return null
        const sell = Number(formData.price)
        const buy = Number(formData.purchasePrice)
        if (buy === 0) return 100
        const margin = ((sell - buy) / sell) * 100
        return margin.toFixed(1)
    }, [formData.price, formData.purchasePrice])

    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleSubmit = (e) => {
        e.preventDefault()
        const payload = {
            ...formData,
            price: Number(formData.price),
            stock: Number(formData.stock || 0),
            totalStock: (!product || isDuplicateMode) ? Number(formData.stock || 0) : Number(formData.totalStock || formData.stock || 0),
            sku: formData.barcode || formData.sku || `SKU-${Math.floor(Math.random() * 10000)}`
        }

        if (product && !isDuplicateMode) {
            onUpdate(payload)
        } else {
            onAdd(payload)
        }
        onClose()
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const generateSKU = () => {
        const name = formData.name.trim()
        if (!name) {
            alert('Please enter a product name first')
            return
        }

        // 1. Brand Prefix
        const prefix = 'FR'

        // 2. Product Code: Extract first letter of each word (uppercase)
        const words = name.split(/\s+/).filter(w => w.length > 0)
        const productCode = words
            .map(word => word[0].toUpperCase())
            .join('')
            .substring(0, 4) // Limit to 4 chars max

        // 3. Size: Extract numbers followed by ml, l, kg, g, etc.
        let size = ''
        const sizeMatch = name.match(/(\d+\.?\d*)\s*(ml|l|kg|g|oz|lb|m|cm|mm)/i)
        if (sizeMatch) {
            const value = parseFloat(sizeMatch[1])
            const unit = sizeMatch[2].toLowerCase()

            // Convert to standard units
            if (unit === 'l') {
                size = (value * 1000).toString() // 1L -> 1000
            } else if (unit === 'kg') {
                size = (value * 1000).toString() // 1kg -> 1000
            } else if (unit === 'g' && value < 1000) {
                size = value.toString() // 500g -> 500
            } else if (unit === 'ml') {
                size = value.toString() // 500ml -> 500
            } else {
                size = value.toString()
            }
        }

        // 4. Serial: Random 3-digit number (001-999)
        const serial = Math.floor(Math.random() * 999 + 1).toString().padStart(3, '0')

        // Construct SKU: FR-PRODUCTCODE-[SIZE]-SERIAL
        const parts = [prefix, productCode]
        if (size) parts.push(size)
        parts.push(serial)

        const sku = parts.join('-')
        setFormData(prev => ({ ...prev, barcode: sku }))
    }

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="header-left">
                        <button className="close-btn" onClick={onClose}><X size={20} /></button>
                        <div className="modal-title-group">
                            <h2 className="modal-title">{product ? (isDuplicateMode ? 'Duplicate Product' : 'Edit Product') : 'Add Product'}</h2>
                            {product && !isDuplicateMode && (
                                <button
                                    className="duplicate-badge"
                                    onClick={() => {
                                        setIsDuplicateMode(true);
                                        setFormData(prev => ({ ...prev, name: `${prev.name} (Copy)`, barcode: '' }));
                                    }}
                                >
                                    <Copy size={12} /> Duplicate
                                </button>
                            )}
                        </div>
                    </div>
                    <button className="btn btn-primary top-save-btn" onClick={handleSubmit}>
                        {product && !isDuplicateMode ? 'Save Changes' : 'Add Product'}
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
                                <div className="form-group flex-2">
                                    <div className="standard-tabs-wrapper" style={{ width: '100%', height: '42px' }}>
                                        <div
                                            className="standard-tabs-indicator"
                                            style={{
                                                width: `calc((100% - 8px) / 2)`,
                                                left: `calc(4px + (${formData.type === 'Product' ? 0 : 1} * (100% - 8px) / 2))`
                                            }}
                                        ></div>
                                        <button
                                            type="button"
                                            className={`standard-tabs-btn ${formData.type === 'Product' ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, type: 'Product' })}
                                        >Product</button>
                                        <button
                                            type="button"
                                            className={`standard-tabs-btn ${formData.type === 'Service' ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, type: 'Service' })}
                                        >Service</button>
                                    </div>
                                </div>

                                <div className="form-group required">
                                    <label>Product Name (Internal)</label>
                                    <div className="filled-glass-input">
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Enter Item Name"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>GST Billing Name (Optional)</label>
                                    <div className="filled-glass-input">
                                        <input
                                            type="text"
                                            name="gstName"
                                            value={formData.gstName}
                                            onChange={handleChange}
                                            placeholder="Display name for GST Invoices"
                                        />
                                    </div>
                                    <div className="helper-link" style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.7 }}>
                                        If blank, standard name will be used on GST bills.
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <div className="filled-glass-input">
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Brief product description..."
                                            rows="2"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MODULE 2: PRICING ENGINE */}
                        <div className="details-card staggered-section" style={{ animationDelay: '0.2s' }}>
                            <div className="card-header-mini">PRICING ENGINE</div>
                            <div className="card-content">
                                <div className="pricing-grid">
                                    <div className="price-block selling-block">
                                        <label>Selling Price</label>
                                        <div className="money-input-wrapper">
                                            <span className="currency">₹</span>
                                            <input
                                                type="number"
                                                name="price"
                                                value={formData.price}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="gst-toggle">
                                            <span>Tax Included?</span>
                                            <input
                                                type="checkbox"
                                                name="taxIncluded"
                                                checked={formData.taxIncluded}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="price-block secondary-block">
                                        <div className="form-group">
                                            <label>Purchase Price</label>
                                            <div className="filled-glass-input sm">
                                                <input
                                                    type="number"
                                                    name="purchasePrice"
                                                    value={formData.purchasePrice}
                                                    onChange={handleChange}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>HSN / SAC</label>
                                            <div className="filled-glass-input sm">
                                                <input
                                                    type="text"
                                                    name="hsn"
                                                    value={formData.hsn}
                                                    onChange={handleChange}
                                                    placeholder="HSN Code"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="unit-section">
                                    <label>Unit</label>
                                    <div className="unit-selector-premium">
                                        {[...availableUnits, { label: 'Custom', icon: Plus }].map((unitItem) => {
                                            const Icon = unitItem.icon
                                            // Check if active: 
                                            // 1. If it's a standard unit, check strict equality
                                            // 2. If it's 'Custom', check if current unit is NOT in standard list (and not empty)
                                            const isStandard = availableUnits.some(u => u.label === formData.unit)
                                            const isCustomActive = unitItem.label === 'Custom' && !isStandard && formData.unit !== ''
                                            const isActive = unitItem.label === 'Custom' ? isCustomActive : formData.unit === unitItem.label

                                            return (
                                                <button
                                                    key={unitItem.label}
                                                    type="button"
                                                    className={`unit-chip ${isActive ? 'active' : ''}`}
                                                    onClick={() => {
                                                        if (unitItem.label === 'Custom') {
                                                            // Keep current value if already custom, else clear
                                                            if (isStandard) setFormData({ ...formData, unit: '' })
                                                        } else {
                                                            setFormData({ ...formData, unit: unitItem.label })
                                                        }
                                                    }}
                                                >
                                                    <Icon size={14} />
                                                    <span>{unitItem.label}</span>
                                                    {isActive && <Check size={10} className="unit-check" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {/* Custom Unit Input */}
                                    {(!availableUnits.some(u => u.label === formData.unit) && formData.unit !== 'Pcs') && (
                                        <div className="mt-2" style={{ animation: 'fadeIn 0.3s ease' }}>
                                            <div className="filled-glass-input sm">
                                                <input
                                                    type="text"
                                                    placeholder="Enter custom unit (e.g. Dozen)"
                                                    value={formData.unit}
                                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && formData.unit.trim()) {
                                                            e.preventDefault();
                                                            const newSmartIcon = getSmartIcon(formData.unit.trim()); // Smart Icon Logic
                                                            const newUnit = { label: formData.unit.trim(), icon: newSmartIcon };

                                                            // Prevent duplicates
                                                            if (!availableUnits.some(u => u.label.toLowerCase() === newUnit.label.toLowerCase())) {
                                                                setAvailableUnits(prev => [...prev, newUnit]);
                                                            }
                                                        }
                                                    }}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="helper-link" style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.7 }}>Press Enter to save as preset</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* MODULE 3: INVENTORY & MEDIA */}
                        <div className="details-card staggered-section" style={{ animationDelay: '0.3s' }}>
                            <div className="card-header-mini">INVENTORY & MEDIA</div>
                            <div className="card-content">
                                <div className="inventory-row">
                                    <div className="form-group">
                                        <label>Opening Stock</label>
                                        <div className="filled-glass-input">
                                            <input
                                                type="number"
                                                name="stock"
                                                value={formData.stock}
                                                onChange={handleChange}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group flex-2">
                                        <label>Barcode / SKU</label>
                                        <div className="filled-glass-input">
                                            <div className="input-group-seamless">
                                                <input
                                                    type="text"
                                                    name="barcode"
                                                    value={formData.barcode}
                                                    onChange={handleChange}
                                                    placeholder="SKU-XXXX"
                                                />
                                                <button type="button" onClick={generateSKU} className="icon-btn">
                                                    <Sparkles size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Low Stock Alert ({formData.alertThreshold}%)</label>
                                    <input
                                        type="range"
                                        min="5"
                                        max="50"
                                        name="alertThreshold"
                                        value={formData.alertThreshold}
                                        onChange={handleChange}
                                        className="styled-slider full-width"
                                    />
                                </div>

                                <div className="image-grid-upload compact">
                                    <div className="upload-tile main-tile">
                                        <ImageIcon size={20} />
                                        <span>Cover</span>
                                    </div>
                                    <div className="upload-tile"><Plus size={14} /></div>
                                    <div className="upload-tile"><Plus size={14} /></div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT PANEL: Live Preview */}
                    <div className="preview-panel">
                        <div className="preview-header">
                            <Smartphone size={16} /> <span>Live Mobile Preview</span>
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
                                <div className="mockup-content">
                                    <div className="product-card-preview">
                                        <div className="preview-image-area">
                                            {/* Placeholder or Uploaded Image */}
                                            <div className="preview-img-placeholder">
                                                <ImageIcon size={32} />
                                            </div>
                                            {/* Stock Badge */}
                                            <div className="preview-stock-badge">
                                                {Number(formData.stock) > Number(formData.alertThreshold) ? 'In Stock' : 'Low Stock'}
                                            </div>
                                        </div>
                                        <div className="preview-details">
                                            <div className="preview-row-top">
                                                <span className="preview-category">{formData.category || 'Category'}</span>
                                                {profitMargin && (
                                                    <span className="profit-badge">
                                                        <TrendingUp size={10} /> {profitMargin}% Margin
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="preview-name">{formData.name || 'New Product Name'}</h3>
                                            <div className="preview-pricing">
                                                <span className="preview-price">₹{formData.price || '0.00'}</span>
                                                <span className="preview-unit">/ {formData.unit}</span>
                                            </div>
                                            <div className="preview-stats">
                                                <div className="p-stat">
                                                    <span className="label">Stock</span>
                                                    <span className="value">{formData.stock || 0}</span>
                                                </div>
                                                <div className="p-stat">
                                                    <span className="label">Code</span>
                                                    <span className="value">{formData.barcode || '---'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mock Description Preview */}
                                    <div className="preview-desc-block">
                                        <h4>Description</h4>
                                        <div className="desc-lines">
                                            <div className="line l1"></div>
                                            <div className="line l2"></div>
                                            <div className="line l3"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="preview-tip">
                            <Eye size={14} /> <span>Previewing as standard user</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="btn btn-primary footer-save-btn" onClick={handleSubmit}>
                        {product && !isDuplicateMode ? 'Save Changes' : 'Add Product'}
                    </button>
                </div>
            </div>

            <style>{`
                .modal-overlay {
                    /* Base Theme Variables (Default to DARK as requested) */
                    --pm-bg-overlay: rgba(0, 0, 0, 0.7);
                    --pm-bg-container: rgba(28, 28, 30, 0.95);
                    --pm-border-color: rgba(255, 255, 255, 0.1);
                    --pm-text-main: #FFFFFF;
                    --pm-text-secondary: #cbd5e1; /* Brightened from #94a3b8 */
                    --pm-text-label: #e2e8f0;     /* Brightened from #cbd5e1 */
                    
                    /* Form Elements */
                    --pm-card-bg: rgba(255, 255, 255, 0.05);     /* Increased from 0.02 */
                    --pm-card-border: rgba(255, 255, 255, 0.1);  /* Increased from 0.05 */
                    --pm-input-bg: rgba(255, 255, 255, 0.06);     /* Slightly increased */
                    --pm-input-border: rgba(255, 255, 255, 0.12); /* Slightly increased */
                    --pm-input-focus-bg: rgba(255, 255, 255, 0.1);
                    --pm-hover-bg: rgba(255, 255, 255, 0.08);
                    
                    /* Header & Tabs */
                    --pm-header-bg: rgba(255, 255, 255, 0.03);
                    --pm-header-border: rgba(255, 255, 255, 0.1);
                    --pm-preview-bg: rgba(0, 0, 0, 0.2);

                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: var(--pm-bg-overlay);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }

                /* Light Mode Overrides
                   Target :root (html) because ThemeContext applies class there.
                   If .dark is MISSING, we are in Light Mode. 
                */
                :root:not(.dark) .modal-overlay {
                    --pm-bg-overlay: rgba(0, 0, 0, 0.4);
                    --pm-bg-container: #FFFFFF;
                    --pm-border-color: #E2E8F0;
                    --pm-text-main: #0F172A;
                    --pm-text-secondary: #475569;
                    --pm-text-label: #334155;
                    
                    --pm-card-bg: #F8FAFC;
                    --pm-card-border: #E2E8F0;
                    --pm-input-bg: #FFFFFF;
                    --pm-input-border: #CBD5E1;
                    --pm-input-focus-bg: #FFFFFF;
                    --pm-hover-bg: #F1F5F9;
                    
                    --pm-header-bg: #F8FAFC;
                    --pm-header-border: #E2E8F0;
                    --pm-preview-bg: #F1F5F9;
                }

                .modal-container {
                    width: 95%;
                    max-width: 1100px;
                    height: 85vh;
                    background: var(--pm-bg-container);
                    border-radius: 20px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    border: 1px solid var(--pm-border-color);
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(50px);
                    -webkit-backdrop-filter: blur(50px);
                    animation: modalEntry 0.5s cubic-bezier(0.19, 1, 0.22, 1);
                    color: var(--pm-text-main);
                }

                .modal-title-group {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .duplicate-badge {
                    background: var(--pm-hover-bg);
                    color: var(--pm-text-secondary);
                    border: 1px solid var(--pm-border-color);
                    padding: 0.25rem 0.6rem;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .duplicate-badge:hover {
                    background: var(--pm-input-focus-bg);
                    color: var(--pm-text-main);
                    border-color: var(--pm-text-secondary);
                }

                @keyframes modalEntry {
                    from { transform: scale(0.95) translateY(20px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }

                .staggered-section {
                    opacity: 0;
                    animation: sectionSlideIn 0.5s ease-out forwards;
                }

                @keyframes sectionSlideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .modal-header {
                    padding: 1.25rem 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid var(--pm-header-border);
                    background: var(--pm-header-bg);
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: var(--pm-text-secondary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                }

                .modal-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--pm-text-main);
                }

                .top-save-btn {
                    padding: 0.5rem 1.25rem;
                    font-size: 0.9rem;
                }

                .modal-tabs {
                    padding: 0 2rem;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    border-bottom: 1px solid var(--pm-header-border);
                    background: var(--pm-header-bg);
                    flex-shrink: 0;
                }

                .modal-body.split-view {
                    flex: 1;
                    display: grid;
                    grid-template-columns: 1.4fr 1fr;
                    overflow: hidden;
                    padding: 0;
                    min-height: 0;
                }

                .form-panel {
                    padding: 2rem;
                    overflow-y: auto;
                    min-height: 0;
                    height: 100%;
                    border-right: 1px solid var(--pm-border-color);
                    background: var(--pm-bg-container);
                }

                .preview-panel {
                    background: var(--pm-preview-bg);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    padding: 2rem;
                    overflow-y: auto;
                    height: 100%;
                }

                .preview-panel::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle at center, rgba(99, 102, 241, 0.08), transparent 60%);
                    pointer-events: none;
                }

                .preview-header {
                    position: absolute;
                    top: 1.5rem;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--pm-text-label);
                    font-size: 0.85rem;
                    font-weight: 500;
                    opacity: 0.8;
                }

                .mobile-mockup {
                    width: 300px;
                    height: 580px;
                    background: #1c1c1e;
                    border-radius: 40px;
                    border: 8px solid #2c2c2e;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    position: relative;
                    overflow: hidden;
                    z-index: 10;
                    transform: scale(0.95);
                    transition: transform 0.3s ease;
                }

                .mobile-mockup:hover {
                    transform: scale(1);
                    box-shadow: 0 30px 60px rgba(0,0,0,0.6);
                }

                .mockup-screen {
                    width: 100%;
                    height: 100%;
                    background: #0f0f11;
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .mockup-status-bar {
                    display: flex;
                    justify-content: space-between;
                    color: white;
                    font-size: 0.75rem;
                    font-weight: 600;
                    padding: 0 0.5rem;
                    margin-top: 0.5rem;
                }

                .status-icons {
                    display: flex;
                    gap: 4px;
                }

                .status-icons div {
                    width: 14px;
                    height: 14px;
                    background: white;
                    border-radius: 50%; /* Simplified icons */
                    opacity: 0.8;
                }

                .mockup-content {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding-right: 0.5rem;
                }

                .mockup-content::-webkit-scrollbar {
                    width: 4px;
                }

                .mockup-content::-webkit-scrollbar-track {
                    background: transparent;
                }

                .mockup-content::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 2px;
                }

                /* Product Card Preview Styles */
                .product-card-preview {
                    background: #1c1c1e;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }

                .preview-image-area {
                    height: 180px;
                    background: #2c2c2e;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .preview-img-placeholder {
                    color: #4b5563;
                }

                .preview-stock-badge {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0,0,0,0.6);
                    color: white;
                    font-size: 0.65rem;
                    padding: 4px 8px;
                    border-radius: 20px;
                    backdrop-filter: blur(4px);
                    font-weight: 600;
                }

                .preview-details {
                    padding: 1rem;
                }

                .preview-row-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.4rem;
                }

                .preview-category {
                    font-size: 0.7rem;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .profit-badge {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    font-size: 0.65rem;
                    background: rgba(16, 185, 129, 0.15);
                    color: #34d399;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: 600;
                }

                .preview-name {
                    font-size: 1rem;
                    color: white;
                    margin-bottom: 0.5rem;
                    line-height: 1.3;
                    /* Truncate text */
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .preview-pricing {
                    display: flex;
                    align-items: baseline;
                    gap: 0.25rem;
                    margin-bottom: 1rem;
                }

                .preview-price {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #6366f1;
                }

                .preview-unit {
                    font-size: 0.8rem;
                    color: #94a3b8;
                }

                .preview-stats {
                    display: flex;
                    gap: 1.5rem;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    padding-top: 0.75rem;
                }

                .p-stat {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .p-stat .label {
                    font-size: 0.65rem;
                    color: #64748b;
                }

                .p-stat .value {
                    font-size: 0.8rem;
                    color: #e2e8f0;
                    font-weight: 600;
                }

                .preview-desc-block {
                    padding: 0 0.5rem;
                }

                .preview-desc-block h4 {
                    font-size: 0.75rem;
                    color: #64748b;
                    margin-bottom: 0.5rem;
                    text-transform: uppercase;
                }

                .desc-lines .line {
                    height: 6px;
                    background: #2c2c2e;
                    border-radius: 3px;
                    margin-bottom: 6px;
                }

                .desc-lines .l1 { width: 100%; }
                .desc-lines .l2 { width: 85%; }
                .desc-lines .l3 { width: 60%; }

                .preview-tip {
                    position: absolute;
                    bottom: 2rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: rgba(255,255,255,0.3);
                    font-size: 0.8rem;
                }

                /* Range Slider Styles */
                .range-slider-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    background: rgba(255,255,255,0.03);
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .styled-slider {
                    -webkit-appearance: none;
                    width: 100%;
                    height: 4px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 2px;
                    outline: none;
                }

                .styled-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 16px;
                    height: 16px;
                    background: #6366f1;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
                    transition: transform 0.2s;
                }

                .styled-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                }

                .slider-value {
                    font-size: 0.85rem;
                    color: #cbd5e1;
                    white-space: nowrap;
                    font-weight: 600;
                }

                .slider-value span {
                    font-weight: 400;
                    color: #94a3b8;
                    margin-right: 4px;
                }

                .tab-item {
                    padding: 0;
                    height: 100%;
                    background: none;
                    border: none;
                    color: var(--pm-text-secondary);
                    font-size: 0.95rem;
                    font-weight: 500;
                    cursor: pointer;
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .modal-body {
                    /* Reset default padding since using split view */
                    padding: 0; 
                    overflow-y: hidden; /* Main vertical scroll handled by panels */
                    color: var(--pm-text-main);
                }

                .section-title {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--pm-text-secondary);
                    margin-bottom: 1.25rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .add-custom-btn {
                    background: none;
                    border: none;
                    color: var(--pm-text-secondary);
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    cursor: pointer;
                }


                .form-group {
                    margin-bottom: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .form-group.required label::after {
                    content: ' *';
                    color: #ef4444;
                }

                .form-group label {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--pm-text-label);
                }

                .input-glow-wrapper {
                    position: relative;
                    width: 100%;
                }

                .input-glow-wrapper::after {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    background: linear-gradient(45deg, #6366f1, #a855f7);
                    border-radius: 10px;
                    z-index: -1;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    filter: blur(8px);
                }

                .input-glow-wrapper:focus-within::after {
                    opacity: 0.3;
                }

                .form-group input, .form-group select, .form-group textarea {
                    background: var(--pm-input-bg) !important;
                    border: 1px solid var(--pm-input-border) !important;
                    border-radius: 8px;
                    padding: 0.85rem 1.15rem;
                    color: var(--pm-text-main);
                    font-size: 0.95rem;
                    transition: all 0.2s ease;
                    width: 100%;
                }

                .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
                    outline: none;
                    border-color: rgba(99, 102, 241, 0.5) !important;
                    background: var(--pm-input-focus-bg) !important;
                }

                /* Ensure placeholder visibility */
                .form-group input::placeholder, 
                .form-group textarea::placeholder {
                    color: var(--pm-text-secondary);
                    opacity: 0.6;
                }

                .input-with-icon {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .currency-prefix {
                    position: absolute;
                    left: 1rem;
                    color: var(--pm-text-secondary);
                }

                .input-with-icon input {
                    padding-left: 2.5rem;
                    width: 100%;
                }

                .input-arrow {
                    position: absolute;
                    right: 1rem;
                    color: var(--pm-text-secondary);
                }

                .form-row {
                    display: flex;
                    gap: 1.5rem;
                    align-items: flex-start;
                }

                .flex-2 { flex: 2; }
                .form-group { flex: 1; }

                .gst-helper {
                    flex: 1;
                    padding-top: 2rem;
                }

                .blue-link {
                    color: #6366f1;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                }

                .gst-helper p {
                    font-size: 0.8rem;
                    color: var(--pm-text-secondary);
                    margin-top: 0.25rem;
                }


                .optional-badge {
                    background: var(--pm-header-bg);
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    color: var(--pm-text-secondary);
                    margin-left: 0.5rem;
                    border: 1px solid var(--pm-input-border);
                }

                .helper-link {
                    font-size: 0.8rem;
                    color: #6366f1;
                    cursor: pointer;
                }

                .input-group {
                    display: flex;
                    gap: 0;
                }

                .input-group input {
                    border-top-right-radius: 0;
                    border-bottom-right-radius: 0;
                    flex: 1;
                }

                .tax-select {
                    border-top-left-radius: 0;
                    border-bottom-left-radius: 0;
                    background: var(--pm-input-bg) !important;
                    color: var(--pm-text-secondary) !important;
                    font-size: 0.85rem !important;
                    padding: 0 0.5rem !important;
                    border: 1px solid var(--pm-input-border) !important;
                }

                .auto-gen-btn {
                    background: var(--pm-input-bg);
                    border: 1px solid var(--pm-input-border);
                    border-left: none;
                    color: var(--pm-text-main);
                    padding: 0 1rem;
                    border-top-right-radius: 8px;
                    border-bottom-right-radius: 8px;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }

                .upload-box-wrapper {
                    position: relative;
                    width: fit-content;
                }

                .upload-box-wrapper:hover::after {
                    content: '';
                    position: absolute;
                    top: -4px;
                    left: -4px;
                    right: -4px;
                    bottom: -4px;
                    background: linear-gradient(45deg, #6366f1, #a855f7);
                    border-radius: 12px;
                    z-index: -1;
                    opacity: 0.2;
                    filter: blur(10px);
                }

                .upload-box {
                    width: 110px;
                    height: 110px;
                    border: 2px dashed var(--pm-card-border);
                    border-radius: 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 0.6rem;
                    background: var(--pm-card-bg);
                    color: var(--pm-text-secondary);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .upload-box:hover {
                    border-color: #6366f1;
                    background: var(--pm-hover-bg);
                    color: var(--pm-text-main);
                    transform: scale(1.02);
                }

                .upload-helper {
                    font-size: 0.8rem;
                    color: #94a3b8;
                    margin-top: 0.5rem;
                }

                .rich-editor {
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    overflow: hidden;
                }

                .editor-toolbar {
                    background: #2c2c2e;
                    padding: 0.5rem;
                    display: flex;
                    gap: 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .editor-toolbar button {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                }

                .ai-btn {
                    margin-left: auto;
                    color: #6366f1 !important;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                }

                .rich-editor textarea {
                    width: 100%;
                    min-height: 100px;
                    border: none;
                    background: none;
                    padding: 1rem;
                    resize: vertical;
                }

                .modal-footer {
                    padding: 1rem 1.5rem;
                    border-top: 1px solid var(--pm-header-border);
                    display: flex;
                    justify-content: flex-end;
                }

                .footer-save-btn {
                    padding: 0.75rem 2.5rem;
                }

                .more-details-helper {
                    background: var(--pm-card-bg);
                    border: 1px solid var(--pm-card-border);
                    border-radius: 8px;
                    padding: 0.75rem 1rem;
                    margin-bottom: 2rem;
                }

                .helper-main {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--pm-text-label);
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-bottom: 0.25rem;
                }

                .helper-arrow { color: var(--pm-text-secondary); transform: rotate(-90deg); }

                .more-details-helper p {
                    font-size: 0.8rem;
                    color: var(--pm-text-secondary);
                    margin-left: 1.5rem;
                }

                .mt-6 { margin-top: 1.5rem; }

                .unit-selector-premium {
                    display: flex;
                    gap: 0.75rem;
                    padding: 0.25rem 0;
                }

                .unit-chip {
                    flex: 1;
                    padding: 0.75rem 0;
                    background: var(--pm-card-bg);
                    border: 1px solid var(--pm-card-border);
                    border-radius: 12px;
                    color: var(--pm-text-secondary);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                    overflow: hidden;
                }

                .unit-chip:hover {
                    background: var(--pm-hover-bg);
                    border-color: var(--pm-border-color);
                    transform: translateY(-2px);
                    color: var(--pm-text-main);
                }

                .unit-chip.active {
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15));
                    border-color: #6366f1;
                    color: #6366f1;
                    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.2);
                    font-weight: 600;
                }

                .unit-chip.active::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
                    pointer-events: none;
                }

                .unit-check {
                    position: absolute;
                    top: 6px;
                    right: 6px;
                    color: #6366f1;
                    background: white;
                    border-radius: 50%;
                    padding: 1px;
                }

                .unit-chip span {
                    font-size: 0.8rem;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }
                .image-grid-upload {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr;
                    gap: 0.75rem;
                    margin-bottom: 0.5rem;
                }

                .upload-tile {
                    background: var(--pm-card-bg);
                    border: 1px dashed var(--pm-card-border);
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--pm-text-secondary);
                    aspect-ratio: 1;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .upload-tile:hover {
                    background: var(--pm-hover-bg);
                    border-color: #6366f1;
                    color: var(--pm-text-main);
                }

                .form-panel {
                    padding: 1.5rem;
                    overflow-y: auto;
                    border-right: 1px solid var(--pm-border-color);
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .details-card {
                    background: var(--pm-card-bg);
                    border: 1px solid var(--pm-card-border);
                    border-radius: 16px;
                    padding: 1.25rem;
                    transition: border-color 0.3s ease;
                }

                .details-card:hover {
                    border-color: var(--pm-border-color);
                }

                .card-header-mini {
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 1px;
                    color: var(--pm-text-secondary);
                    margin-bottom: 1rem;
                }

                .filled-glass-input {
                    background: var(--pm-input-bg);
                    border-radius: 8px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .filled-glass-input:focus-within {
                    background: var(--pm-input-focus-bg);
                }

                .filled-glass-input input, 
                .filled-glass-input select,
                .filled-glass-input textarea {
                    width: 100%;
                    background: none;
                    border: none;
                    color: var(--pm-text-main);
                    padding: 0.8rem 1rem;
                    font-size: 0.9rem;
                    outline: none;
                }

                .filled-glass-input::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 2px;
                    width: 0%;
                    background: linear-gradient(90deg, #6366f1, #a855f7);
                    transition: width 0.3s ease;
                }

                .filled-glass-input:focus-within::after {
                    width: 100%;
                }

                .money-input-wrapper {
                    display: flex;
                    align-items: center;
                    background: var(--pm-input-bg);
                    border-radius: 12px;
                    padding: 0.5rem 1rem;
                    border: 1px solid rgba(99, 102, 241, 0.2);
                }

                .money-input-wrapper .currency {
                    font-size: 1.2rem;
                    color: #6366f1;
                    font-weight: 600;
                }

                .money-input-wrapper input {
                    background: none;
                    border: none;
                    color: var(--pm-text-main);
                    font-size: 1.5rem;
                    font-weight: 700;
                    width: 100%;
                    padding-left: 0.5rem;
                    outline: none;
                }

                .pricing-grid {
                    display: grid;
                    grid-template-columns: 1.2fr 1fr;
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .image-grid-upload.compact {
                    grid-template-columns: 1fr 1fr 1fr;
                }

                .image-grid-upload.compact .upload-tile {
                    aspect-ratio: 1;
                    height: auto;
                }

                /* RESPONSIVE MODAL */
                @media (max-width: 1024px) {
                    .modal-body.split-view {
                        grid-template-columns: 1fr;
                        overflow-y: auto;
                    }
                    .form-panel {
                        border-right: none;
                        border-bottom: 1px solid var(--pm-border-color);
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
                    .form-panel {
                        padding: 1.5rem 1rem;
                    }
                }
            `}</style>
        </div >,
        document.body
    )
}
