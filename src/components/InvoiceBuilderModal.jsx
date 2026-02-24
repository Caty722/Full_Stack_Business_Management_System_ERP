/*
 * --------------------------------------------------------------------------
 * LOCKED: This file contains the finalized Invoice Builder/Editor logic.
 * DO NOT MODIFY THIS FILE unless explicitly instructed by the user.
 * --------------------------------------------------------------------------
 */
import React, { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, Plus, Trash2, Calendar, ChevronRight, Calculator, FileText, ChevronDown, Check, Save, User, Truck, Package } from 'lucide-react'
import PremiumDatePicker from './PremiumDatePicker'
import { useShop } from '../context/ShopContext'
import { formatDateDDMMYYYY, getNextInvoiceId } from '../lib/utils'

export default function InvoiceBuilderModal({ isOpen, onClose, invoice, mode = 'GST' }) {
    const {
        customers,
        products,
        createInvoice,
        updateInvoice,
        brands,
        getProductPrice,
        invoices
    } = useShop()

    const isEditing = !!invoice
    const billingMode = mode || (invoice ? (invoice.isGST ? 'GST' : 'Non-GST') : 'GST')

    const [formData, setFormData] = useState({
        billNumber: '',
        customerId: '',
        items: [],
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        paymentMode: 'Cash',
        discountType: 'percentage',
        discountValue: 0,
        hasDiscount: false,
        taxType: 'percentage',
        taxValue: 0,
        hasTax: billingMode === 'GST',
        notes: '',
        terms: 'Please pay within 15 days of receiving this invoice.',
        dueDate: new Date().toISOString().split('T')[0],
        poNumber: '',
        vehicleNumber: '',
        deliveryTerms: '',
        deliveryDate: '',
        financialYear: localStorage.getItem('defaultFinancialYear') || '25-26',
        customFields: {}
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
    }, [products, quickSearchQuery, billingMode])

    const handleProductSelect = (product) => {
        setSelectedQuickProduct(product)
        setQuickSearchQuery(product.name)
        setShowQuickResults(false)
        setQuickSelectedIndex(0)
        // Focus quantity input for fast entry
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

    // --- Payment Mode Logic ---
    const DEFAULT_PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque']
    const [availablePaymentModes, setAvailablePaymentModes] = useState(() => {
        const savedModes = localStorage.getItem('customPaymentModes')
        const parsedModes = savedModes ? JSON.parse(savedModes) : []

        // Combine and deduplicate case-insensitively, preferring Title Case defaults
        const allModes = [...DEFAULT_PAYMENT_MODES, ...parsedModes]
        const uniqueModes = []
        const seen = new Set()

        allModes.forEach(mode => {
            const lower = mode.toLowerCase()
            if (!seen.has(lower)) {
                seen.add(lower)
                uniqueModes.push(mode)
            }
        })
        return uniqueModes
    })

    const handleSaveCustomPaymentMode = (mode) => {
        if (!mode) return

        // Check for case-insensitive duplicate
        const exists = availablePaymentModes.some(m => m.toLowerCase() === mode.trim().toLowerCase())

        if (!exists) {
            const newModes = [...availablePaymentModes, mode.trim()]
            setAvailablePaymentModes(newModes)
            // We save the full list, but next load will dedupe it again if needed
            localStorage.setItem('customPaymentModes', JSON.stringify(newModes))
        }
    }

    // Save default financial year preference
    useEffect(() => {
        if (formData.financialYear) {
            localStorage.setItem('defaultFinancialYear', formData.financialYear)
        }
    }, [formData.financialYear])

    // Sync formData when invoice prop changes for editing
    useEffect(() => {
        if (invoice) {
            setFormData({
                ...invoice,
                items: invoice.items || [],
                billNumber: invoice.id?.split('-').pop()?.split('/')?.[0] || '',
                financialYear: invoice.financialYear || '25-26'
            })
        } else {
            setFormData({
                billNumber: '',
                customerId: '',
                items: [],
                date: new Date().toISOString().split('T')[0],
                status: 'Pending',
                paymentMode: 'Cash',
                discountType: 'percentage',
                discountValue: 0,
                hasDiscount: false,
                taxType: 'percentage',
                taxValue: 0,
                hasTax: billingMode === 'GST',
                notes: '',
                terms: 'Please pay within 15 days of receiving this invoice.',
                dueDate: new Date().toISOString().split('T')[0],
                poNumber: '',
                vehicleNumber: '',
                deliveryTerms: '',
                deliveryDate: '',
                financialYear: localStorage.getItem('defaultFinancialYear') || '25-26',
                customFields: {}
            })
        }
    }, [invoice, isOpen, billingMode])

    const billPrefix = useMemo(() => {
        if (isEditing && invoice?.id) {
            const parts = invoice.id.split('-')
            return parts.length > 1 ? parts[0] + '-' : ''
        }
        return billingMode === 'GST' ? (brands?.GST?.prefix || 'GST') + '-' : (brands?.NON_GST?.prefix || 'INV') + '-'
    }, [billingMode, brands, isEditing, invoice])

    // Auto-calculate next Invoice Number
    useEffect(() => {
        if (!isEditing && invoices && brands && isOpen) {
            const prefix = billingMode === 'GST' ? (brands?.GST?.prefix || 'GST') : (brands?.NON_GST?.prefix || 'INV')
            const nextNum = getNextInvoiceId(invoices, prefix)
            setFormData(prev => ({ ...prev, billNumber: String(nextNum).padStart(3, '0') }))
        }
    }, [invoices, brands, billingMode, isEditing, isOpen])

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
            if (formData.taxType === 'percentage') {
                taxAmount = ((subtotal - discountAmount) * (parseFloat(formData.taxValue) || 0)) / 100
            } else {
                taxAmount = parseFloat(formData.taxValue) || 0
            }
        }

        const total = Math.round(Math.max(0, subtotal - discountAmount + taxAmount))
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

        const isGST = customer?.isGST || billingMode === 'GST'
        const finalStatus = forcedStatus || formData.status

        const payload = {
            ...formData,
            status: finalStatus,
            customer: customer ? customer.name : (formData.customer || 'Unknown'),
            total: totals.total,
            subtotal: totals.subtotal,
            discount: totals.discountAmount,
            tax: totals.taxAmount,
            isGST: isGST,
            customerAddress: customer ? customer.address : (formData.customerAddress || ''),
        }

        // Save custom payment mode if it's new
        handleSaveCustomPaymentMode(formData.paymentMode)

        try {
            const newId = `${billPrefix}${formData.billNumber}`
            if (isEditing) {
                await updateInvoice(invoice.id, { ...payload, id: newId, financialYear: formData.financialYear })
            } else {
                const invoiceData = {
                    ...payload,
                    id: newId,
                    financialYear: formData.financialYear
                }
                await createInvoice(invoiceData)
            }
            onClose()
        } catch (error) {
            console.error("Failed to save invoice:", error)
            alert("Failed to save invoice. Please try again.")
        }
    }

    const handleGenerateInvoice = (e) => {
        // When generating from a draft or new, set status to Pending
        handleSave(e, 'Pending')
    }

    const handleSaveAsDraft = (e) => {
        handleSave(e, 'Draft')
    }

    const addLineItem = () => {
        if ((formData.items || []).length >= 13) {
            alert("Maximum 13 items allowed per invoice.")
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
                            <h2 className="modal-title">
                                {isEditing && invoice?.status !== 'Draft' ? `Edit Invoice ${invoice.id}` : (billingMode === 'GST' ? 'GST Tax Invoice' : 'Non-GST Invoice')}
                            </h2>
                        </div>
                    </div>
                    <div className="header-right">
                        {(formData.status === 'Draft' || !isEditing) && (
                            <button className="btn btn-outline" onClick={handleSaveAsDraft} style={{ marginRight: '12px' }}>
                                <Save size={18} /> Save as Draft
                            </button>
                        )}
                        <button className="btn btn-primary top-save-btn" onClick={handleGenerateInvoice}>
                            <Save size={18} /> {isEditing ? (formData.status === 'Draft' ? 'Generate Invoice' : 'Update Invoice') : 'Generate Invoice'}
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="builder-modal-body">
                    <div className="builder-form-scroller">
                        {/* Section 1: Customer & Logistics */}
                        <div className="builder-section">
                            <div className="section-header-mini">
                                <User size={14} /> RECIPIENT & DETAILS
                            </div>
                            <div className="form-grid-4">
                                <div className="form-group">
                                    <label>Invoice No.</label>
                                    <div className="prefix-input-group">
                                        <span className="prefix">{billPrefix}</span>
                                        <input
                                            type="text"
                                            value={formData.billNumber}
                                            onChange={(e) => setFormData({ ...formData, billNumber: e.target.value.replace(/\D/g, '') })}
                                            placeholder="000"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>

                                {billingMode === 'GST' && (
                                    <div className="form-group">
                                        <label>Financial Year</label>
                                        <div className="prefix-input-group">
                                            <span className="prefix">/</span>
                                            <input
                                                type="text"
                                                value={formData.financialYear}
                                                onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                                                placeholder="25-26"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="form-group flex-2">
                                    <label>Customer</label>
                                    <select
                                        value={formData.customerId}
                                        onChange={(e) => {
                                            const cId = e.target.value
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
                                                taxValue: cust?.isGST ? cust.gstPercentage : 0
                                            })
                                        }}
                                    >
                                        <option value="">Select Customer</option>
                                        {customers.filter(c => billingMode === 'GST' ? c.isGST : !c.isGST).map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <PremiumDatePicker
                                    label="Invoice Date"
                                    value={formData.date}
                                    onChange={(date) => setFormData({ ...formData, date })}
                                />
                            </div>

                            <div className="form-grid-4 mt-4">
                                <div className="form-group">
                                    <label>Payment Mode</label>
                                    <div className="payment-mode-group">
                                        <select
                                            value={availablePaymentModes.includes(formData.paymentMode) ? formData.paymentMode : 'Custom'}
                                            onChange={(e) => {
                                                if (e.target.value === 'Custom') {
                                                    setFormData({ ...formData, paymentMode: '' })
                                                } else {
                                                    setFormData({ ...formData, paymentMode: e.target.value })
                                                }
                                            }}
                                            style={{ width: '100%' }}
                                        >
                                            {availablePaymentModes.map(mode => (
                                                <option key={mode} value={mode}>{mode === 'UPI' ? 'UPI / Digital' : mode}</option>
                                            ))}
                                            <option value="Custom">Custom</option>
                                        </select>
                                        {!availablePaymentModes.includes(formData.paymentMode) && (
                                            <input
                                                type="text"
                                                placeholder="Enter custom mode"
                                                value={formData.paymentMode}
                                                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                                                style={{ marginTop: '8px', width: '100%' }}
                                                autoFocus
                                            />
                                        )}
                                    </div>
                                </div>
                                <PremiumDatePicker
                                    label="Due Date"
                                    value={formData.dueDate}
                                    onChange={(date) => setFormData({ ...formData, dueDate: date })}
                                />
                                <div className="form-group flex-2">
                                    <label>Purchase Order No. (PO)</label>
                                    <input
                                        type="text"
                                        value={formData.poNumber}
                                        onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                                        placeholder="Optional PO Number"
                                    />
                                </div>
                            </div>
                        </div>

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
                                                const cartQty = (formData.items || [])
                                                    .filter(item => item.productId === p.id)
                                                    .reduce((sum, item) => sum + (item.quantity || 0), 0)
                                                const availableStock = (p.stock || 0) - cartQty

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
                                                    {products.map(p => {
                                                        const cartQty = (formData.items || [])
                                                            .filter(item => item.productId === p.id)
                                                            .reduce((sum, item) => sum + (item.quantity || 0), 0)
                                                        const available = (p.stock || 0) - (cartQty - (item.productId === p.id ? item.quantity : 0))
                                                        return (
                                                            <option key={p.id} value={p.id}>
                                                                {p.gstName ? `${p.name} (GST: ${p.gstName})` : p.name} (Avl: {available})
                                                            </option>
                                                        )
                                                    })}
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

                        {/* Section 3: Extra Details */}
                        <div className="builder-section grid-2">
                            <div className="details-col">
                                <div className="section-header-mini"><Truck size={14} /> TRANSPORT & DELIVERY</div>
                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label>Vehicle No.</label>
                                        <input
                                            type="text"
                                            value={formData.vehicleNumber}
                                            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                                            placeholder="TN XX XX XXXX"
                                        />
                                    </div>
                                    <PremiumDatePicker
                                        label="Delivery Date"
                                        value={formData.deliveryDate}
                                        onChange={(date) => setFormData({ ...formData, deliveryDate: date })}
                                    />
                                </div>
                                <div className="form-group mt-2">
                                    <label>Delivery Terms</label>
                                    <input
                                        type="text"
                                        value={formData.deliveryTerms}
                                        onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })}
                                        placeholder="e.g. F.O.R Destination"
                                    />
                                </div>
                            </div>
                            <div className="details-col">
                                <div className="section-header-mini"><FileText size={14} /> NOTES & TERMS</div>
                                <div className="form-group">
                                    <label>Internal Notes</label>
                                    <textarea
                                        rows="2"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Add private remarks..."
                                    />
                                </div>
                                <div className="form-group mt-2">
                                    <label>T & C</label>
                                    <textarea
                                        rows="2"
                                        value={formData.terms}
                                        onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Panel (Sticky Right) */}
                    <div className="builder-summary-panel">
                        <div className="summary-card-v3">
                            <div className="summary-header">
                                <Calculator size={16} /> ORDER SUMMARY
                            </div>

                            <div className="summary-controls">
                                {billingMode === 'GST' && (
                                    <div className="summary-control-group">
                                        <div className="c-label">GST Tax (%)</div>
                                        <div className="c-input">
                                            <input
                                                type="number"
                                                value={formData.taxValue}
                                                onChange={(e) => setFormData({ ...formData, taxValue: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="summary-control-group">
                                    <div className="c-label-row">
                                        <span>Discount</span>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={formData.hasDiscount}
                                                onChange={(e) => setFormData({ ...formData, hasDiscount: e.target.checked })}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                    {formData.hasDiscount && (
                                        <div className="c-input-split">
                                            <input
                                                type="number"
                                                value={formData.discountValue}
                                                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                            />
                                            <select
                                                value={formData.discountType}
                                                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                            >
                                                <option value="percentage">%</option>
                                                <option value="fixed">₹</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="summary-divider"></div>

                            <div className="summary-rows">
                                <div className="s-row">
                                    <span>Subtotal</span>
                                    <span>₹{totals.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="s-row discount">
                                    <span>Discount</span>
                                    <span>- ₹{totals.discountAmount.toLocaleString()}</span>
                                </div>
                                <div className="s-row tax">
                                    <span>Tax Amount</span>
                                    <span>+ ₹{totals.taxAmount.toLocaleString()}</span>
                                </div>
                                <div className="grand-total-box">
                                    <div className="label">Amount Payable</div>
                                    <div className="value">₹{totals.total.toLocaleString()}</div>
                                </div>
                            </div>

                            <button className="confirm-btn" onClick={handleGenerateInvoice}>
                                <Save size={18} /> {isEditing ? (formData.status === 'Draft' ? 'Generate Invoice' : 'Save Changes') : 'Confirm & Save'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.2s ease-out;
                }

                .dark .modal-overlay {
                    background: rgba(0, 0, 0, 0.7);
                }

                .invoice-builder-modal {
                    width: 95%;
                    max-width: 1300px;
                    height: 92vh;
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 24px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: var(--shadow-xl);
                    animation: modalSlideUp 0.4s cubic-bezier(0.19, 1, 0.22, 1);
                    color: var(--text-main);
                }

                @keyframes modalSlideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                .builder-modal-header {
                    padding: 1.25rem 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: var(--bg-surface);
                    border-bottom: 1px solid var(--border-color);
                }

                .header-left { display: flex; align-items: center; gap: 1.5rem; }
                .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; padding: 6px; border-radius: 50%; transition: 0.2s; }
                .close-btn:hover { background: var(--bg-subtle); color: var(--text-main); }

                .modal-title-group { display: flex; align-items: center; gap: 1rem; }
                .badge { background: #6366f1; color: white; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 99px; letter-spacing: 0.05em; }
                .modal-title { font-size: 1.25rem; font-weight: 700; margin: 0; letter-spacing: -0.01em; color: var(--text-main); }

                .builder-modal-body {
                    flex: 1;
                    display: grid;
                    grid-template-columns: 1fr 360px;
                    overflow: hidden;
                }

                .builder-form-scroller {
                    padding: 2rem;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    background: var(--bg-body);
                }

                .builder-section {
                    background: var(--bg-surface);
                    border: 1.5px solid var(--border-color);
                    border-radius: 20px;
                    padding: 1.75rem;
                    box-shadow: 0 15px 40px -12px rgba(0, 0, 0, 0.08);
                    position: relative;
                }

                .dark .builder-section {
                    background: #18181b; /* Solid Zinc 900 for extra pop */
                    border-color: rgba(255, 255, 255, 0.12);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
                }

                .section-header-mini {
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1.25rem;
                    letter-spacing: 0.1em;
                }

                .form-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
                .form-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
                .flex-2 { grid-column: span 2; }

                .form-group label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem; }
                .form-group input, .form-group select, .form-group textarea {
                    width: 100%;
                    background: var(--bg-body);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    padding: 0.75rem 1rem;
                    color: var(--text-main);
                    font-size: 0.9rem;
                    transition: all 0.2s;
                    outline: none;
                }
                .form-group input:focus, .form-group select:focus { border-color: #6366f1; background: var(--bg-surface); box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }

                .prefix-input-group {
                    display: flex;
                    background: var(--bg-body);
                    border: 1.5px solid var(--border-color);
                    border-radius: 10px;
                    overflow: hidden;
                    transition: 0.2s;
                }
                .prefix-input-group:focus-within { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
                .prefix-input-group .prefix { padding: 0.75rem 0.5rem 0.75rem 1rem; color: var(--text-muted); font-weight: 700; font-size: 0.9rem; }
                .prefix-input-group input { border: none !important; background: transparent !important; padding-left: 0 !important; font-weight: 700 !important; color: #6366f1 !important; box-shadow: none !important; }
                .prefix-input-group .separator { color: var(--text-muted); font-weight: 700; display: flex; align-items: center; }
                .prefix-input-group .year-input { width: 70px !important; color: var(--text-secondary) !important; font-size: 0.85rem !important; }

                .section-header-compact { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
                .section-header-compact .title { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
                .section-header-compact .count { color: #6366f1; }
                .add-item-btn { background: #6366f1; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: 0.2s; }
                .add-item-btn:hover { background: #4f46e5; transform: translateY(-1px); }

                .items-table-v3 { border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); }
                .table-head { display: grid; grid-template-columns: 1fr 120px 80px 120px 40px; background: var(--bg-subtle); padding: 0.75rem 1rem; font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
                .table-row { display: grid; grid-template-columns: 1fr 120px 80px 120px 40px; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); align-items: center; gap: 0.75rem; transition: background 0.2s; }
                .table-row:hover { background: var(--bg-subtle); }
                .table-row select, .table-row input { background: transparent; border: 1.5px solid transparent; padding: 0.5rem; border-radius: 8px; color: var(--text-main); }
                .table-row select:hover, .table-row input:hover { border-color: var(--border-color); background: var(--bg-surface); }
                .table-row select:focus, .table-row input:focus { background: var(--bg-surface); border-color: #6366f1; color: var(--text-main); }
                .col-total { font-weight: 700; color: var(--text-main); text-align: right; }
                .del-btn { background: none; border: none; color: #ef4444; opacity: 0.6; cursor: pointer; transition: 0.2s; }
                .del-btn:hover { opacity: 1; transform: scale(1.1); }

                .empty-row { padding: 3rem 2rem; text-align: center; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 1rem; cursor: pointer; border: 2px dashed var(--border-color); margin: 1rem; border-radius: 16px; transition: all 0.3s; }
                .empty-row:hover { background: var(--bg-surface); border-color: #6366f1; color: var(--text-main); }

                .builder-summary-panel { 
                    padding: 0; 
                    background: var(--bg-surface); 
                    border-left: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    height: 100%;
                }
                .summary-card-v3 { 
                    display: flex; 
                    flex-direction: column; 
                    gap: 1.5rem; 
                    height: 100%;
                    padding: 2rem;
                    overflow-y: auto;
                }
                .summary-card-v3::-webkit-scrollbar { width: 4px; }
                .summary-card-v3::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }

                .summary-header { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.1em; display: flex; align-items: center; gap: 0.6rem; }
                
                .summary-controls { display: flex; flex-direction: column; gap: 1rem; }
                .summary-control-group { 
                    background: var(--bg-body); 
                    padding: 1.25rem; 
                    border-radius: 16px; 
                    border: 1.5px solid var(--border-color);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
                }
                .dark .summary-control-group {
                    background: #1c1c1f; /* Consistent with other sections */
                    border-color: rgba(255, 255, 255, 0.1);
                }
                .c-label { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.6rem; text-transform: uppercase; }
                .c-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
                
                .c-input input { width: 100%; background: var(--bg-surface); border: 1.5px solid var(--border-color); border-radius: 10px; padding: 0.6rem; color: var(--text-main); font-weight: 700; text-align: center; font-size: 1rem; }
                .c-input-split { display: grid; grid-template-columns: 1fr 65px; gap: 0.5rem; }
                .c-input-split input { width: 100%; background: var(--bg-surface); border: 1.5px solid var(--border-color); border-radius: 10px; padding: 0.6rem; color: var(--text-main); font-weight: 700; text-align: center; font-size: 1rem; }
                .c-input-split select { background: var(--bg-surface); border: 1.5px solid var(--border-color); border-radius: 10px; color: var(--text-secondary); font-weight: 700; cursor: pointer; }

                .summary-divider { height: 1.5px; background: var(--border-color); }
                .summary-rows { display: flex; flex-direction: column; gap: 1rem; }
                .s-row { display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-secondary); font-weight: 600; }
                .s-row.discount { color: #ef4444; }
                .s-row.tax { color: #3b82f6; }
                
                .grand-total-box { margin-top: 0.5rem; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 1.5rem; border-radius: 20px; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.25); }
                .grand-total-box .label { font-size: 0.75rem; font-weight: 800; color: rgba(255, 255, 255, 0.85); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; }
                .grand-total-box .value { font-size: 2rem; font-weight: 900; color: white; border: none; }

                .confirm-btn { background: var(--text-main); color: var(--bg-body); border: none; border-radius: 14px; padding: 1.1rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.75rem; cursor: pointer; transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1); margin-top: 1rem; box-shadow: var(--shadow-md); }
                .confirm-btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); filter: brightness(1.1); }

                .toggle-switch { position: relative; display: inline-block; width: 36px; height: 20px; }
                .toggle-switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--border-color); transition: .4s; border-radius: 20px; }
                .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; }
                input:checked + .slider { background-color: #6366f1; }
                input:checked + .slider:before { transform: translateX(16px); }

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
                    .builder-summary-panel { border-left: none; border-top: 1px solid var(--border-color); height: auto; overflow: visible; }
                    .summary-card-v3 { height: auto; overflow: visible; padding: 2rem; }
                }

                @media (max-width: 768px) {
                    .builder-modal-container { width: 100%; height: 100%; border-radius: 0; }
                    .builder-modal-header { padding: 1rem; }
                    .header-left { gap: 0.75rem; }
                    .modal-title { font-size: 1.1rem; }
                    .builder-form-scroller { padding: 1.25rem; gap: 1rem; }
                    .builder-section { padding: 1.25rem; border-radius: 16px; }
                    .form-grid-4, .form-grid-2 { grid-template-columns: 1fr; gap: 1rem; }
                    .flex-2 { grid-column: span 1; }
                    .quick-add-bar-v4 { flex-direction: column; align-items: stretch; padding: 1rem; }
                    .quick-qty-box { width: 100%; }
                    .quick-add-btn { width: 100%; justify-content: center; }
                    .items-table-v3 { overflow-x: auto; -webkit-overflow-scrolling: touch; }
                    .table-head, .table-row { min-width: 600px; }
                    .grand-total-box { padding: 1.25rem; border-radius: 16px; }
                    .grand-total-box .value { font-size: 1.5rem; }
                    .summary-card-v3 { padding: 1.5rem; }
                }

                @media (max-width: 480px) {
                    .action-btn { width: 40px; height: 40px; }
                    .modal-title-group { flex-direction: column; align-items: flex-start; gap: 4px; }
                }
            `}</style>
        </div >,
        document.body
    )
}
