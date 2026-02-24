import React, { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, Plus, Trash2, Calendar, ChevronRight, Calculator, FileText, ChevronDown, Check, Save, User, Package, PenTool } from 'lucide-react'
import PremiumDatePicker from './PremiumDatePicker'
import { db } from '../lib/firebase'
import { useShop } from '../context/ShopContext'
import { formatDateDDMMYYYY } from '../lib/utils'
import SignaturePad from './SignaturePad'

// Helper to generate next QTN ID
const getNextQuotationId = (quotations, prefix = 'QTN_') => {
    if (!quotations || quotations.length === 0) return '001'
    const nums = quotations
        .map(q => {
            const parts = q.id.split('_')
            return parseInt(parts[parts.length - 1]) || 0
        })
        .filter(n => !isNaN(n))
    const max = Math.max(0, ...nums)
    return String(max + 1).padStart(3, '0')
}

export default function QuotationBuilderModal({ isOpen, onClose, quotation, mode = 'GST' }) {
    const {
        customers,
        products,
        createQuotation,
        updateQuotation,
        deleteQuotation,
        quotations,
        getProductPrice
    } = useShop()

    const isEditing = !!quotation

    const [formData, setFormData] = useState({
        qtnNumber: '',
        customerId: '',
        items: [],
        date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        discountType: 'percentage',
        discountValue: 0,
        hasDiscount: false,
        taxType: 'percentage',
        taxValue: mode === 'GST' ? 18 : 0,
        hasTax: mode === 'GST',
        notes: '',
        terms: '* Estimated delivery 1 - 5 Days from order confirmation.\n* Please pay within 7 days from the date of Invoice bill will be delivered.\n* Prices include GST at the rate of (CGST-9% & SGST-9%) 18%. The GST amount is included in the final total.\n* Delivery charges are not included in the above total, Because delivery Charge should be Free.\n* Any changes to the order may result in revised pricing and GST adjustments.',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 7 days validity
        signature: null
    })

    const [selectedQuickProduct, setSelectedQuickProduct] = useState(null)
    const [quickSearchQuery, setQuickSearchQuery] = useState('')
    const [quickQuantity, setQuickQuantity] = useState('')
    const [showQuickResults, setShowQuickResults] = useState(false)
    const [quickSelectedIndex, setQuickSelectedIndex] = useState(0)
    const searchInputRef = useRef(null)
    const qtyInputRef = useRef(null)

    const filteredProducts = useMemo(() => {
        const query = quickSearchQuery.toLowerCase()
        return products.filter(p => {
            const matchesName = p.name.toLowerCase().includes(query)
            const matchesGST = p.gstName?.toLowerCase().includes(query)
            const matchesSKU = p.sku?.toLowerCase().includes(query)
            return !query || matchesName || matchesGST || matchesSKU
        })
    }, [products, quickSearchQuery, mode])

    const handleProductSelect = (product) => {
        setSelectedQuickProduct(product)
        setQuickSearchQuery(product.name)
        setShowQuickResults(false)
        setQuickSelectedIndex(0)
        // Focus quantity input
        setTimeout(() => qtyInputRef.current?.focus(), 50)
    }

    const handleAddItem = () => {
        if (!selectedQuickProduct) return
        if ((formData.items || []).length >= 13) {
            alert("Maximum 13 items allowed.")
            return
        }

        const qty = parseInt(quickQuantity) || 1
        const price = getProductPrice(selectedQuickProduct, formData.customerId)
        const newItem = { productId: selectedQuickProduct.id, quantity: qty, price }

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }))

        // Reset and refocus search
        setQuickSearchQuery('')
        setQuickQuantity('')
        setSelectedQuickProduct(null)
        setShowQuickResults(false)
        setQuickSelectedIndex(0)
        searchInputRef.current?.focus()
    }

    // Sync formData when quotation prop changes for editing
    useEffect(() => {
        if (quotation) {
            setFormData({
                ...quotation,
                items: quotation.items || [],
                qtnNumber: quotation.id?.split('_').pop() || quotation.id?.split('-').pop() || '',
            })
        } else {
            setFormData({
                qtnNumber: '',
                customerId: '',
                items: [],
                date: new Date().toISOString().split('T')[0],
                status: 'Draft',
                discountType: 'percentage',
                discountValue: 0,
                hasDiscount: false,
                taxType: 'percentage',
                taxValue: 18,
                hasTax: true,
                notes: '',
                terms: '* Estimated delivery 1 - 5 Days from order confirmation.\n* Please pay within 7 days from the date of Invoice bill will be delivered.\n* Prices include GST at the rate of (CGST-9% & SGST-9%) 18%. The GST amount is included in the final total.\n* Delivery charges are not included in the above total, Because delivery Charge should be Free.\n* Any changes to the order may result in revised pricing and GST adjustments.',
                validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            })
        }
    }, [quotation, isOpen])

    useEffect(() => {
        if (!isEditing && quotations && isOpen) {
            const prefix = mode === 'GST' ? 'QTN_' : 'EST_' // Different prefix? Or same? User didn't specify. Keeping same distinct sequence for now.
            // Actually, usually Quotations have same sequence. But Invoices have GST/INV prefix.
            // Let's stick to QTN_ for both as they are "Quotations". The user request said "separate gst and non-gst".
            // Typically they might share sequence or not. For now, let's keep share sequence unless specified.
            // Wait, if I want to filter easily, maybe separate sequence is better?
            // User just said "separate the gst and non-gst". 
            // In InvoiceBuilder, prefix logic is: const idPrefix = isGST ? (brands?.GST?.prefix || 'GST') : (brands?.NON_GST?.prefix || 'INV')
            // Let's default QTN_ for now, but save isGST flag.
            const nextNum = getNextQuotationId(quotations)
            setFormData(prev => ({ ...prev, qtnNumber: nextNum, hasTax: mode === 'GST', taxValue: mode === 'GST' ? 18 : 0 }))
        }
    }, [quotations, isEditing, isOpen, mode])

    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen])

    const totals = useMemo(() => {
        const subtotal = (formData.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0)

        let discountAmount = 0
        if (formData.hasDiscount) {
            if (formData.discountType === 'percentage') {
                discountAmount = (subtotal * (parseFloat(formData.discountValue) || 0)) / 100
            } else {
                discountAmount = parseFloat(formData.discountValue) || 0
            }
        }

        let taxAmount = 0
        if (formData.hasTax) {
            // Tax is calculated on (Subtotal - Discount)
            // BUT, user's reference says "Prices include GST... GST amount is included in the final total"
            // This implies tax inclusive logic OR tax added on top.
            // Looking at the table: Rate 290, Qty 5, Amount 1450. 
            // Total 27388. CGST 9% 2464. SGST 9% 2464. Total Tax 4928.
            // 27388 + 4928 = 32316 + 0.08 round off = 32318.
            // So Tax is EXCLUSIVE (added on top of subtotal).
            if (formData.taxType === 'percentage') {
                taxAmount = ((subtotal - discountAmount) * (parseFloat(formData.taxValue) || 0)) / 100
            } else {
                taxAmount = parseFloat(formData.taxValue) || 0
            }
        }

        const total = subtotal - discountAmount + taxAmount
        return { subtotal, discountAmount, taxAmount, total }
    }, [formData])

    if (!isOpen) return null

    const handleSave = async (e, forcedStatus = null) => {
        if (e) e.preventDefault()

        const customer = customers.find(c => String(c.id) === String(formData.customerId))
        if (!customer && !formData.customerId) {
            alert("Please select a customer.")
            return
        }

        const finalStatus = forcedStatus || formData.status

        const payload = {
            ...formData,
            status: finalStatus,
            customer: customer ? customer.name : (formData.customer || 'Unknown'),
            total: totals.total,
            subtotal: totals.subtotal,
            discount: totals.discountAmount,
            tax: totals.taxAmount,
            customerAddress: customer ? customer.address : (formData.customerAddress || ''),
            isGST: mode === 'GST',
        }

        try {
            const currentPrefix = (isEditing ? (quotation.id?.includes('_') ? quotation.id.split('_')[0] + '_' : quotation.id.split('-')[0] + '-') : 'QTN_')
            const newId = `${currentPrefix}${formData.qtnNumber}`

            if (isEditing) {
                if (newId !== quotation.id) {
                    // ID changed - need to recreate and delete old
                    const { createQuotationInDb, deleteQuotationFromDb } = await import('../lib/db')
                    await createQuotationInDb({ ...quotation, ...payload, id: newId })
                    await deleteQuotationFromDb(quotation.id)
                } else {
                    await updateQuotation(quotation.id, payload)
                }
            } else {
                const quotationData = {
                    ...payload,
                    id: newId,
                }
                await createQuotation(quotationData)
            }
            onClose()
        } catch (error) {
            console.error("Failed to save quotation:", error)
            alert("Failed to save quotation. Please try again.")
        }
    }

    const handleGenerate = (e) => handleSave(e, 'Sent')
    const handleSaveAsDraft = (e) => handleSave(e, 'Draft')

    const addLineItem = () => {
        if ((formData.items || []).length >= 13) {
            alert("Maximum 13 items allowed per quotation.")
            return
        }
        setFormData(prev => ({
            ...prev,
            items: [...(prev.items || []), { productId: '', quantity: 1, price: 0 }]
        }))
    }

    const removeLineItem = (idx) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== idx)
        }))
    }

    const updateLineItem = (idx, updates) => {
        setFormData(prev => {
            const newItems = [...prev.items]
            newItems[idx] = { ...newItems[idx], ...updates }
            return { ...prev, items: newItems }
        })
    }

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="invoice-builder-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="builder-modal-header">
                    <div className="header-left">
                        <button className="close-btn" onClick={onClose}><X size={20} /></button>
                        <div className="modal-title-group">
                            <div className="badge">{isEditing ? 'Editing' : 'New Quote'}</div>
                            <h2 className="modal-title">
                                {isEditing ? `Quotation ${quotation.id}` : 'New Quotation'}
                            </h2>
                        </div>
                    </div>
                    <div className="header-right">
                        <button className="btn btn-outline" onClick={handleSaveAsDraft} style={{ marginRight: '12px' }}>
                            <Save size={18} /> Save Draft
                        </button>
                        <button className="btn btn-primary top-save-btn" onClick={handleGenerate}>
                            <Save size={18} /> {isEditing ? 'Update Quotation' : 'Create Quotation'}
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="builder-modal-body">
                    <div className="builder-form-scroller">
                        {/* Section 1: Customer & Details */}
                        <div className="builder-section">
                            <div className="section-header-mini">
                                <User size={14} /> CUSTOMER & DETAILS
                            </div>
                            <div className="form-grid-5">
                                <div className="form-group">
                                    <label>Quotation No.</label>
                                    <div className="prefix-input-group">
                                        <span className="prefix">
                                            {isEditing ? (quotation.id?.includes('_') ? quotation.id.split('_')[0] + '_' : quotation.id.split('-')[0] + '-') : 'QTN_'}
                                        </span>
                                        <input
                                            type="text"
                                            value={formData.qtnNumber}
                                            onChange={(e) => setFormData({ ...formData, qtnNumber: e.target.value.replace(/\D/g, '') })}
                                            placeholder="022"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>

                                <div className="form-group flex-2">
                                    <label>Customer</label>
                                    <select
                                        value={formData.customerId}
                                        onChange={(e) => {
                                            const cId = e.target.value
                                            // Identify basic customer data
                                            const cust = customers.find(c => String(c.id) === String(cId))
                                            const updatedItems = formData.items.map(item => {
                                                if (!item.productId) return item
                                                const p = products.find(prod => String(prod.id) === String(item.productId))
                                                return p ? { ...item, price: getProductPrice(p, cId) } : item
                                            })
                                            setFormData({
                                                ...formData,
                                                customerId: cId,
                                                items: updatedItems,
                                                // Default tax value from customer if valid
                                                taxValue: cust?.gstPercentage || 18
                                            })
                                        }}
                                    >
                                        <option value="">Select Customer</option>
                                        {customers.filter(c => mode === 'GST' ? c.isGST : !c.isGST).map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <PremiumDatePicker
                                    label="Date"
                                    value={formData.date}
                                    onChange={(date) => setFormData({ ...formData, date })}
                                />
                                <PremiumDatePicker
                                    label="Valid Until"
                                    value={formData.validUntil}
                                    onChange={(date) => setFormData({ ...formData, validUntil: date })}
                                />
                            </div>
                        </div>

                        {/* Section 2: Line Items */}
                        <div className="builder-section line-items-section">
                            <div className="quick-add-bar-v4">
                                <div className="quick-search-container">
                                    <div className="search-input-wrapper">
                                        <Search size={18} className="search-icon" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Search or scan barcode for existing products"
                                            value={quickSearchQuery}
                                            onChange={(e) => {
                                                setQuickSearchQuery(e.target.value)
                                                setShowQuickResults(true)
                                                setQuickSelectedIndex(0)
                                                if (selectedQuickProduct && e.target.value !== selectedQuickProduct.name) {
                                                    setSelectedQuickProduct(null)
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'ArrowDown') {
                                                    setQuickSelectedIndex(prev => Math.min(prev + 1, filteredProducts.length - 1))
                                                } else if (e.key === 'ArrowUp') {
                                                    setQuickSelectedIndex(prev => Math.max(prev - 1, 0))
                                                } else if (e.key === 'Enter' && showQuickResults && filteredProducts[quickSelectedIndex]) {
                                                    handleProductSelect(filteredProducts[quickSelectedIndex])
                                                }
                                            }}
                                            onBlur={() => {
                                                // Small timeout to allow onClick on the result items
                                                setTimeout(() => setShowQuickResults(false), 200)
                                            }}
                                            onFocus={() => setShowQuickResults(true)}
                                            onClick={() => setShowQuickResults(true)}
                                        />
                                    </div>

                                    {showQuickResults && filteredProducts.length > 0 && (
                                        <div className="quick-results-dropdown" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {filteredProducts.map((p, idx) => {
                                                const inCart = formData.items.find(item => item.productId === p.id)
                                                const cartQty = inCart ? inCart.quantity : 0
                                                const availableStock = p.stock - cartQty

                                                return (
                                                    <div
                                                        key={p.id}
                                                        className={`result-item ${idx === quickSelectedIndex ? 'selected' : ''}`}
                                                        onClick={() => handleProductSelect(p)}
                                                        onMouseEnter={() => setQuickSelectedIndex(idx)}
                                                    >
                                                        <div className="item-info">
                                                            <div className="item-name">
                                                                {p.gstName ? (
                                                                    <>
                                                                        <div>{p.name}</div>
                                                                        <div style={{ color: '#6366f1', fontSize: '0.75rem', opacity: 0.8, fontWeight: 500 }}>GST: {p.gstName}</div>
                                                                    </>
                                                                ) : (
                                                                    p.name
                                                                )}
                                                            </div>
                                                            <div className="item-meta">
                                                                <span className={availableStock <= 0 ? 'text-red' : ''}>Avl. qty: {availableStock}</span> {p.unit} • {p.category}
                                                            </div>
                                                        </div>
                                                        <div className="item-price">₹{getProductPrice(p, formData.customerId).toLocaleString()}</div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="quick-qty-box">
                                    <input
                                        ref={qtyInputRef}
                                        type="number"
                                        placeholder="Qty"
                                        value={quickQuantity}
                                        onChange={(e) => setQuickQuantity(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAddItem()
                                            }
                                        }}
                                    />
                                </div>

                                <button
                                    className="quick-add-btn"
                                    onClick={handleAddItem}
                                    disabled={!selectedQuickProduct}
                                >
                                    <Plus size={18} /> Add to Bill
                                </button>
                            </div>

                            <div className="section-header-compact" style={{ marginTop: '1.5rem' }}>
                                <div className="title">
                                    <Package size={14} /> LINE ITEMS
                                    <span className="count">({formData.items.length}/13)</span>
                                </div>
                            </div>

                            <div className="items-table-v3">
                                <div className="table-head">
                                    <div className="col-desc">Description</div>
                                    <div className="col-rate">Rate</div>
                                    <div className="col-qty">Qty</div>
                                    <div className="col-total">Total</div>
                                    <div className="col-action"></div>
                                </div>
                                <div className="table-body">
                                    {formData.items.map((item, idx) => (
                                        <div className="table-row" key={idx}>
                                            <div className="col-desc">
                                                <select
                                                    value={item.productId}
                                                    onChange={(e) => {
                                                        const p = products.find(prod => String(prod.id) === String(e.target.value))
                                                        const price = p ? getProductPrice(p, formData.customerId) : 0
                                                        updateLineItem(idx, { productId: e.target.value, price })
                                                    }}
                                                >
                                                    <option value="">-- Choose Product --</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.gstName ? `${p.name} (GST: ${p.gstName})` : p.name} (Stock: {p.stock})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-rate">
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => updateLineItem(idx, { price: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="col-qty">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateLineItem(idx, { quantity: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="col-total">
                                                ₹{Math.round(item.price * item.quantity).toLocaleString()}
                                            </div>
                                            <div className="col-action">
                                                <button className="del-btn" onClick={() => removeLineItem(idx)}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {formData.items.length === 0 && (
                                        <div className="dashed-empty-state" onClick={() => searchInputRef.current?.focus()}>
                                            <Search size={32} />
                                            <span style={{ fontSize: '1.1rem' }}>Click here to search and add items</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Notes */}
                        <div className="builder-section">
                            <div className="section-header-mini"><FileText size={14} /> NOTES & TERMS</div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    rows="4"
                                    value={formData.terms}
                                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                                    placeholder="Add notes..."
                                />
                                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <PenTool size={14} /> DIGITAL SIGNATURE
                                    </label>
                                    <SignaturePad
                                        initialData={formData.signature}
                                        onSave={(data) => setFormData({ ...formData, signature: data })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Panel */}
                    <div className="builder-summary-panel">
                        <div className="summary-card-v3">
                            <div className="summary-header">
                                <Calculator size={16} /> ORDER SUMMARY
                            </div>

                            <div className="summary-controls" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Tax Input */}
                                <div className="summary-control-group">
                                    <div className="c-label">{mode === 'GST' ? 'GST TAX (%)' : 'TAX (%)'}</div>
                                    <div className="p-input-box">
                                        <input
                                            type="number"
                                            value={formData.taxValue}
                                            onChange={(e) => setFormData({ ...formData, taxValue: e.target.value })}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '5px' }}>
                                            <div style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setFormData(p => ({ ...p, taxValue: (parseFloat(p.taxValue) || 0) + 1 }))}><ChevronRight size={12} style={{ transform: 'rotate(-90deg)' }} /></div>
                                            <div style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setFormData(p => ({ ...p, taxValue: (parseFloat(p.taxValue) || 0) - 1 }))}><ChevronRight size={12} style={{ transform: 'rotate(90deg)' }} /></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Discount Toggle */}
                                <div className="summary-toggle-row">
                                    <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>DISCOUNT</div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.hasDiscount}
                                            onChange={(e) => setFormData({ ...formData, hasDiscount: e.target.checked })}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                {/* Discount Inputs (Conditional) */}
                                {formData.hasDiscount && (
                                    <div className="summary-control-group">
                                        <div className="c-label">DISCOUNT AMOUNT</div>
                                        <div className="p-input-box">
                                            <input
                                                type="number"
                                                value={formData.discountValue}
                                                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="summary-divider" style={{ margin: '2rem 0', borderTop: '1px dashed var(--border-color)' }}></div>

                            <div className="summary-rows" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                <div className="s-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Subtotal</span>
                                    <span style={{ color: 'var(--text-main)' }}>₹{totals.subtotal.toLocaleString()}</span>
                                </div>
                                {formData.hasDiscount && (
                                    <div className="s-row" style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                                        <span>Discount</span>
                                        <span>- ₹{totals.discountAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="s-row" style={{ display: 'flex', justifyContent: 'space-between', color: '#3b82f6' }}>
                                    <span>Tax Amount</span>
                                    <span>+ ₹{totals.taxAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Amount Payable Box */}
                            <div className="amount-payable-box">
                                <div className="label">AMOUNT PAYABLE</div>
                                <div className="value">₹{totals.total.toLocaleString()}</div>
                            </div>

                            <button className="confirm-btn" onClick={handleGenerate}>
                                <Save size={18} /> {isEditing ? 'Save Changes' : 'Create Quotation'}
                            </button>
                        </div>
                    </div>
                </div> {/* Closes builder-modal-body */}
            </div> {/* Closes invoice-builder-modal */}
            {/* Reusing existing styles from global or copied from InvoiceBuilder */}
            <style>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(8px);
                    display: flex; align-items: center; justify-content: center; z-index: 10000;
                    animation: fadeIn 0.2s ease-out;
                }
                .invoice-builder-modal {
                    width: 95%; max-width: 1300px; height: 92vh;
                    background: var(--bg-card); border: 1px solid var(--border-color);
                    border-radius: 24px; display: flex; flex-direction: column; overflow: hidden;
                    box-shadow: var(--shadow-xl); color: var(--text-main);
                }
                .builder-modal-header { padding: 1.25rem 2rem; display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface); border-bottom: 1px solid var(--border-color); }
                .header-left { display: flex; align-items: center; gap: 1.5rem; }
                .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; padding: 6px; border-radius: 50%; }
                .modal-title { font-size: 1.25rem; font-weight: 700; margin: 0; }
                .badge { background: #6366f1; color: white; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 99px; }
                .builder-modal-body { flex: 1; display: grid; grid-template-columns: 1fr 360px; overflow: hidden; }
                .builder-summary-panel { 
                    background: var(--bg-surface); 
                    border-left: 1px solid var(--border-color); 
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    height: 100%;
                }
                .builder-form-scroller { padding: 2rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1.5rem; background: var(--bg-body); height: 100%; }
                .builder-section { background: var(--bg-surface); border: 1.5px solid var(--border-color); border-radius: 20px; padding: 1.75rem; }
                .section-header-mini { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem; }
                .form-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
                .form-grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1.25rem; }
                .flex-2 { grid-column: span 2; }
                .form-group label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem; }
                .form-group input, .form-group select, .form-group textarea { width: 100%; background: var(--bg-body); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.75rem 1rem; color: var(--text-main); font-size: 0.9rem; outline: none; }
                .items-table-v3 { border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); }
                .table-head, .table-row { display: grid; grid-template-columns: 1fr 120px 80px 120px 40px; padding: 0.75rem 1rem; gap: 0.75rem; align-items: center; }
                .table-head { background: var(--bg-subtle); font-size: 0.7rem; font-weight: 800; color: var(--text-muted); }
                .table-row { border-bottom: 1px solid var(--border-color); }
                .table-row input, .table-row select { background: transparent; border: 1.5px solid transparent; padding: 0.5rem; border-radius: 8px; }
                .summary-card-v3 { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; height: 100%; overflow-y: auto; }
                .summary-header { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); display: flex; align-items: center; gap: 0.6rem; }
                .c-input input { width: 100%; background: var(--bg-surface); border: 1.5px solid var(--border-color); border-radius: 10px; padding: 0.6rem; text-align: center; }
                .grand-total-box { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 1.5rem; border-radius: 20px; color: white; margin-top: auto; }
                .confirm-btn { background: var(--text-main); color: var(--bg-body); border: none; border-radius: 14px; padding: 1.1rem; font-weight: 800; margin-top: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.75rem; }
                
                .section-header-compact { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
                .section-header-compact .title { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
                .section-header-compact .count { color: #6366f1; }
                .add-item-btn { background: #6366f1; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: 0.2s; }
                .add-item-btn:hover { background: #4f46e5; transform: translateY(-1px); }
                
                .prefix-input-group { display: flex; background: var(--bg-body); border: 1.5px solid var(--border-color); border-radius: 10px; overflow: hidden; }
                .prefix-input-group .prefix { padding: 0.75rem 0.5rem 0.75rem 1rem; color: var(--text-muted); font-weight: 700; font-size: 0.9rem; }
                .prefix-input-group input { border: none !important; background: transparent !important; padding-left: 0 !important; font-weight: 700 !important; color: #6366f1 !important; box-shadow: none !important; }

                .quick-add-bar-v4 {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    background: var(--bg-surface);
                    padding: 0.5rem;
                    border-radius: 12px;
                    border: 2px solid var(--border-color);
                    margin-bottom: 1rem;
                }
                .quick-search-container { position: relative; flex: 1; }
                .search-input-wrapper { display: flex; align-items: center; background: var(--bg-body); border-radius: 10px; padding: 0 1rem; border: 1.5px solid transparent; transition: 0.2s; }
                .search-input-wrapper:focus-within { border-color: #6366f1; background: var(--bg-surface); }
                .search-icon { color: var(--text-muted); margin-right: 12px; }
                .search-input-wrapper input { border: none !important; background: transparent !important; padding: 0.8rem 0 !important; font-weight: 600 !important; }
                
                .quick-results-dropdown {
                    position: absolute; top: calc(100% + 8px); left: 0; right: 0;
                    background: var(--bg-card); border: 1px solid var(--border-color);
                    border-radius: 12px; box-shadow: var(--shadow-xl); z-index: 1000;
                    max-height: 400px; overflow-y: auto; overflow-x: hidden;
                }
                .result-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid var(--border-color); transition: 0.2s; }
                .result-item:last-child { border-bottom: none; }
                .result-item:hover, .result-item.selected { background: var(--bg-subtle); border-left: 4px solid #6366f1; }
                .item-name { font-weight: 700; font-size: 0.95rem; color: var(--text-main); }
                .item-meta { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
                .item-price { font-weight: 800; color: #6366f1; font-size: 1.1rem; }
                .text-red { color: #ef4444 !important; }

                .quick-qty-box { width: 100px; }
                .quick-qty-box input { text-align: center; font-weight: 700 !important; color: var(--text-main) !important; }

                .quick-add-btn {
                    background: #6366f1; color: white; border: none; border-radius: 10px;
                    padding: 0.8rem 1.5rem; font-weight: 700; cursor: pointer;
                    display: flex; align-items: center; gap: 8px; transition: 0.2s;
                }
                .quick-add-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
                .quick-add-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                @media (max-width: 1024px) {
                    .builder-modal-body { grid-template-columns: 1fr; }
                    .builder-summary-panel { border-left: none; border-top: 1px solid var(--border-color); height: auto; }
                }

                @media (max-width: 768px) {
                    .invoice-builder-modal { width: 100%; height: 100%; border-radius: 0; }
                    .builder-modal-header { padding: 1rem; }
                    .header-left { gap: 0.75rem; }
                    .modal-title { font-size: 1.1rem; }
                    .builder-form-scroller { padding: 1.25rem; gap: 1rem; }
                    .builder-section { padding: 1.25rem; border-radius: 16px; }
                    .form-grid-5, .form-grid-4 { grid-template-columns: 1fr; gap: 1rem; }
                    .flex-2 { grid-column: span 1; }
                    .quick-add-bar-v4 { flex-direction: column; align-items: stretch; padding: 1rem; }
                    .quick-qty-box { width: 100%; }
                    .quick-add-btn { width: 100%; justify-content: center; }
                    .items-table-v3 { overflow-x: auto; -webkit-overflow-scrolling: touch; }
                    .table-head, .table-row { min-width: 600px; }
                    .summary-card-v3 { padding: 1.5rem; }
                    .amount-payable-box .value { font-size: 1.5rem; }
                }
            `}</style>
        </div>,
        document.body
    )
}
