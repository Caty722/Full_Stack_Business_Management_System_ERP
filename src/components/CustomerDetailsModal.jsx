import { X, Download, FileText, Trash2, Eye, Calendar, DollarSign, CheckCircle, AlertCircle, Clock, Search, Save, User, CreditCard, MapPin, Mail, Phone, Globe } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useShop } from '../context/ShopContext'
import { useState, useMemo } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import InvoiceViewModal from './InvoiceViewModal'
import ProductModal from './ProductModal'

const CustomerDetailsModal = ({ customer, onClose }) => {
    // Filter invoices for this customer
    const { invoices, deleteInvoice, products, brands, customerPrices, getProductPrice, customers, updateProduct, addProduct } = useShop()
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
    const [showPendingOnly, setShowPendingOnly] = useState(false)
    const [viewingInvoice, setViewingInvoice] = useState(null)
    const [viewingProduct, setViewingProduct] = useState(null)

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    const customerInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const matchesCustomer = inv.customer === customer.name
            const matchesPending = showPendingOnly ? inv.status === 'Pending' : true
            return matchesCustomer && matchesPending
        })
    }, [invoices, customer.name, showPendingOnly])

    const stats = useMemo(() => {
        const total = customerInvoices.reduce((sum, inv) => sum + inv.total, 0)
        const paid = customerInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0)
        // Mocking paid amount if not present, assuming 'Paid' status means fully paid
        const calcPaid = customerInvoices.reduce((sum, inv) => {
            return inv.status === 'Paid' ? sum + inv.total : sum + (inv.paidAmount || 0)
        }, 0)
        return {
            total,
            paid: calcPaid,
            pending: total - calcPaid
        }
    }, [customerInvoices])

    const handleDownloadLedger = () => {
        setIsGeneratingPDF(true)
        try {
            const doc = new jsPDF()

            // --- Helper Functions ---
            const formatCurrency = (amount) => `Rs. ${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            const formatDate = (dateStr) => {
                if (!dateStr) return '-'
                const d = new Date(dateStr)
                return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN')
            }

            // --- Header Section ---
            // Fallback for brands if not loaded
            const brand = brands && brands.GST && brands.NON_GST ? (customer.isGST ? brands.GST : brands.NON_GST) : {
                name: 'FERWA ONE',
                address: '123, Main Street, City',
                mobile: '9876543210',
                email: 'info@ferwaone.com'
            }

            // Company Name
            doc.setFontSize(22)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(30, 41, 59) // Dark slate
            doc.text("LEDGER", 14, 20)

            // Company Details (Right Aligned or Below)
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(75, 85, 99) // Gray 600

            let yPos = 30
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text(brand.name || 'Company Name', 14, yPos)

            yPos += 6
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.text(brand.address || '', 14, yPos)
            yPos += 5
            doc.text(`Mobile: ${brand.mobile || ''}`, 14, yPos)
            yPos += 5
            doc.text(`Email: ${brand.email || ''}`, 14, yPos)

            // --- Customer Section ---
            yPos += 15
            doc.setDrawColor(229, 231, 235) // Gray 200
            doc.line(14, yPos, 196, yPos)

            yPos += 10
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(17, 24, 39) // Gray 900
            doc.text(`Customer: ${customer.name}`, 14, yPos)

            // Current Date Range (if applicable, otherwise generated date)
            const today = new Date().toLocaleDateString('en-IN')
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(107, 114, 128) // Gray 500
            doc.text(`Statement Date: ${today}`, 196, yPos, { align: 'right' })

            yPos += 6
            if (customer.address) {
                doc.text(customer.address, 14, yPos)
                yPos += 5
            }
            if (customer.phone) {
                doc.text(`Phone: ${customer.phone}`, 14, yPos)
                yPos += 5
            }

            // --- Summary Cards ---
            yPos += 10
            const summaryY = yPos
            const cardWidth = 45
            const cardHeight = 20
            const cardGap = 4

            // Helper to draw card
            const drawCard = (x, title, value, color) => {
                doc.setFillColor(249, 250, 251) // Gray 50
                doc.setDrawColor(229, 231, 235) // Gray 200
                doc.roundedRect(x, summaryY, cardWidth, cardHeight, 1, 1, 'FD')

                doc.setFontSize(8)
                doc.setTextColor(107, 114, 128)
                doc.text(title, x + cardWidth / 2, summaryY + 6, { align: 'center' })

                doc.setFontSize(11)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(color[0], color[1], color[2])
                doc.text(value, x + cardWidth / 2, summaryY + 14, { align: 'center' })
            }

            drawCard(14, "Opening Balance", formatCurrency(0), [75, 85, 99])
            drawCard(14 + cardWidth + cardGap, "Total Debit (-)", formatCurrency(stats.total), [220, 38, 38])
            drawCard(14 + (cardWidth + cardGap) * 2, "Total Credit (+)", formatCurrency(stats.paid), [22, 163, 74])
            drawCard(14 + (cardWidth + cardGap) * 3, "Closing Balance", formatCurrency(stats.pending), [217, 119, 6])

            // --- Transactions Table ---
            yPos = summaryY + cardHeight + 15

            // Sort invoices by date
            const sortedInvoices = [...customerInvoices].sort((a, b) => new Date(a.date) - new Date(b.date))

            // Calculate running balance
            let runningBalance = 0
            const tableData = []

            // Opening Balance Row
            tableData.push([
                startDate,
                '-',
                'OPENING',
                '-',
                '-',
                '-',
                formatCurrency(0)
            ])

            sortedInvoices.forEach(inv => {
                const debit = inv.total || 0
                const credit = inv.status === 'Paid' ? inv.total : (inv.paidAmount || 0)
                // Simplified Logic: If status is 'Paid', credit = total.
                // If not paid, credit = 0 (or partial if recorded).
                // Actually matching the UI logic:
                // UI calculates: totalBilled - totalPaid.
                // For ledger, usually Invoice is Debit, Payment is Credit.
                // We'll assume Full Payment on 'Paid' status for simplicity matching the UI stats.

                // Invoice Entry (Debit)
                runningBalance += debit
                tableData.push([
                    formatDate(inv.date),
                    `INV-${inv.id}`,
                    'INVOICE',
                    'DEBIT',
                    formatCurrency(debit),
                    '-',
                    formatCurrency(runningBalance)
                ])

                // Payment Entry (Credit) - if fully paid or partial
                // If status is Paid, we add a PAYMENT entry
                if (inv.status === 'Paid') {
                    runningBalance -= debit
                    tableData.push([
                        formatDate(inv.date),
                        `PAY-${inv.id}`,
                        'PAYMENT',
                        'CREDIT',
                        '-',
                        formatCurrency(debit),
                        formatCurrency(runningBalance)
                    ])
                }
            })

            autoTable(doc, {
                startY: yPos,
                head: [['Date', 'Ref No', 'Type', 'Mode', 'Debit (-)', 'Credit (+)', 'Balance']],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [243, 244, 246],
                    textColor: [31, 41, 55],
                    fontStyle: 'bold',
                    lineWidth: 0.1,
                    lineColor: [229, 231, 235]
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    lineColor: [229, 231, 235],
                    lineWidth: 0.1
                },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 25 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 20 },
                    4: { halign: 'right' }, // Debit
                    5: { halign: 'right' }, // Credit
                    6: { halign: 'right', fontStyle: 'bold' } // Balance
                },
                didStartPage: (data) => {
                    // Draw Watermark underneath the content
                    const pageSize = doc.internal.pageSize;
                    doc.setFontSize(40);
                    doc.setTextColor(252, 252, 252); // Extremely faint, drawn first so it stays in the background
                    doc.text(brand.name || "FERWA ONE", pageSize.width / 2, pageSize.height / 2, {
                        angle: 45,
                        align: 'center',
                        baseline: 'middle'
                    });
                }
            })

            const filename = `Ledger_${customer.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);

        } catch (error) {
            console.error('Error generating PDF:', error)
            alert('Failed to generate PDF: ' + error.message + '\n' + error.stack)
        } finally {
            setIsGeneratingPDF(false)
        }
    }

    const [activeTab, setActiveTab] = useState('products')
    const [productSearch, setProductSearch] = useState('')
    const [startDate, setStartDate] = useState('2024-01-01')

    // Filter products based on Customer GST status and Search
    const filteredProducts = useMemo(() => {
        if (!products) return []
        return products.filter(product => {
            // 1. GST Filter
            const matchesGST = product.isGST === customer.isGST

            // 2. Search Filter
            const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                (product.sku && product.sku.toLowerCase().includes(productSearch.toLowerCase()))

            // 3. Strict Special Rate Filter (Always active)
            const hasSpecialRate = customerPrices[`${customer.id}_${product.id}`] !== undefined

            return matchesGST && matchesSearch && hasSpecialRate
        })
    }, [products, customer.isGST, productSearch, customerPrices, customer.id])
    const [endDate, setEndDate] = useState('2024-12-31')

    return createPortal(
        <div className="modal-overlay customer-details-portal" onClick={onClose}>
            <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '1200px', width: '95%', height: '90vh', display: 'flex', flexDirection: 'column' }}>

                {/* Premium Header */}
                <div className="modal-header">
                    <div className="header-info">
                        <div className="profile-avatar-large" style={{ width: '64px', height: '64px', fontSize: '1.25rem' }}>
                            {customer.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="profile-name-row">
                                <h2 className="modal-title" style={{ fontSize: '1.5rem' }}>{customer.name}</h2>
                                <span className={`profile-pill ${customer.type === 'Vendor' ? 'orange' : 'primary'}`}>
                                    {customer.type || 'Customer'}
                                </span>
                                {customer.isGST && (
                                    <span className="profile-pill emerald" style={{ fontSize: '8px', padding: '2px 8px' }}>
                                        GST ACTIVE
                                    </span>
                                )}
                            </div>
                            <div className="customer-meta">
                                <Mail size={12} className="text-muted" />
                                <span>{customer.email || 'No email associated'}</span>
                                <span className="meta-dot">•</span>
                                <Phone size={12} className="text-muted" />
                                <span>{customer.phone || 'No phone number'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn-pdf-premium" onClick={handleDownloadLedger} disabled={isGeneratingPDF}>
                            {isGeneratingPDF ? <Clock size={16} className="animate-spin" /> : <Download size={16} />}
                            <span>{isGeneratingPDF ? 'Generating...' : 'Download Statement'}</span>
                        </button>
                        <button className="close-btn-premium" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs - Standardized */}
                <div className="px-6 border-b border-[var(--border-color)]">
                    <div className="standard-tabs-wrapper w-full mt-4 mb-0">
                        <div
                            className="standard-tabs-indicator"
                            style={{
                                width: '25%',
                                left: activeTab === 'products' ? '0%' :
                                    activeTab === 'transactions' ? '25%' :
                                        activeTab === 'ledger' ? '50%' :
                                            '75%'
                            }}
                        />
                        {[
                            { id: 'products', label: 'Products', count: filteredProducts.length },
                            { id: 'transactions', label: 'Transactions', count: customerInvoices.length },
                            { id: 'ledger', label: 'Ledger', count: null },
                            { id: 'profile', label: 'Profile', count: null }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                className={`standard-tabs-btn ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <span>{tab.label}</span>
                                {tab.count !== null && (
                                    <span className="tab-count" style={{
                                        fontSize: '0.7rem',
                                        background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                                        padding: '2px 6px',
                                        borderRadius: '99px',
                                        minWidth: '20px'
                                    }}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="modal-body">
                    {activeTab === 'products' && (
                        <>
                            {/* Product Controls: Search */}
                            <div className="ledger-controls" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div className="standard-search-wrapper" style={{ flex: 1 }}>
                                    <Search size={18} className="standard-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search for products with special rates..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="table-wrapper glass-card-inner flex-1" style={{ margin: 0 }}>
                                <table className="ledger-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40%' }}>Product Name</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map((product) => (
                                                <tr key={product.id}>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="product-avatar-trigger"
                                                                onClick={() => setViewingProduct(product)}
                                                                title="Quick View"
                                                            >
                                                                <div className="avatar-circle">
                                                                    {getInitials(product.name)}
                                                                </div>
                                                                <div className="avatar-overlay">
                                                                    <Eye size={12} />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="font-bold flex items-center gap-2">
                                                                    {product.name}
                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${product.isGST ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                                        {product.isGST ? 'GST' : 'NON-GST'}
                                                                    </span>
                                                                </div>
                                                                <div className="text-muted text-xs">{product.sku || 'No SKU'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="bill-tag" style={{ width: 'fit-content' }}>{product.category}</div>
                                                    </td>
                                                    <td>
                                                        <div className="flex flex-col">
                                                            <div className="font-bold text-main">₹{getProductPrice(product, customer.id).toLocaleString()}</div>
                                                            {getProductPrice(product, customer.id) !== product.price && (
                                                                <div className="text-[10px] text-green-500 font-bold uppercase tracking-widest">
                                                                    Special Rate Applied
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={product.stock < 10 ? 'text-orange' : 'text-green'}>
                                                            {product.stock} {product.unit || 'Units'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-8 text-muted">
                                                    No products found matching your criteria.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {activeTab === 'transactions' && (
                        <>
                            {/* Controls Bar */}
                            <div className="ledger-controls">
                                <div className="date-range-picker">
                                    <Calendar size={16} className="text-muted" />
                                    <span className="date-text">{startDate}</span>
                                    <span className="arrow">→</span>
                                    <span className="date-text">{endDate}</span>
                                </div>

                                <div className="flex-spacer"></div>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px', cursor: 'pointer', color: '#9ca3af', fontSize: '14px' }}>
                                    <input
                                        type="checkbox"
                                        checked={showPendingOnly}
                                        onChange={(e) => setShowPendingOnly(e.target.checked)}
                                        style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
                                    />
                                    <span>Show Pending Only</span>
                                </label>

                                <div className="balance-summary-pill">
                                    <span className="label">Net Balance:</span>
                                    <span className={`value ${stats.pending > 0 ? 'text-orange' : 'text-green'}`}>
                                        {stats.pending > 0 ? `Due ₹${stats.pending.toLocaleString()}` : `All Clear`}
                                    </span>
                                </div>
                            </div>

                            {/* Stats Grid - Compact */}
                            <div className="ledger-stats-grid compact">
                                <div className="ledger-stat-card">
                                    <div className="l-label">Total Billed</div>
                                    <div className="l-value">₹{stats.total.toFixed(2)}</div>
                                </div>
                                <div className="ledger-stat-card">
                                    <div className="l-label">Total Paid</div>
                                    <div className="l-value text-green">₹{stats.paid.toFixed(2)}</div>
                                </div>
                                <div className="ledger-stat-card">
                                    <div className="l-label">Pending Balance</div>
                                    <div className="l-value text-orange">₹{stats.pending.toFixed(2)}</div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="table-wrapper glass-card-inner flex-1">
                                <table className="ledger-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Invoice No</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th className="text-right">Amount</th>
                                            <th className="text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customerInvoices.length > 0 ? (
                                            customerInvoices.map((inv) => (
                                                <tr key={inv.id}>
                                                    <td>
                                                        <div className="font-medium">{inv.date}</div>
                                                    </td>
                                                    <td>
                                                        <div className="font-bold">#{inv.id}</div>
                                                    </td>
                                                    <td>
                                                        <span className={`type-badge ${inv.isGST ? 'gst' : 'non-gst'}`}>
                                                            {inv.isGST ? 'GST' : 'Non-GST'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${inv.status.toLowerCase()}`}>
                                                            <span className="dot"></span>
                                                            {inv.status}
                                                        </span>
                                                    </td>
                                                    <td className="text-right font-mono font-bold">₹{inv.total.toFixed(2)}</td>
                                                    <td>
                                                        <div className="row-actions justify-end">
                                                            <button
                                                                className="action-icon-btn view"
                                                                onClick={() => setViewingInvoice(inv)}
                                                                title="View Invoice"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            <button className="action-icon-btn delete" onClick={() => deleteInvoice(inv.id)} title="Delete Invoice">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-8 text-muted">
                                                    No transactions found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {activeTab === 'ledger' && (
                        <>
                            {/* Ledger Summary Cards */}
                            <div className="ledger-stats-grid">
                                <div className="ledger-stat-card border-l-4 border-l-blue-500">
                                    <div className="l-label">Previous Balance</div>
                                    <div className="l-value">₹0.00</div>
                                    <div className="text-[10px] text-muted mt-1 uppercase tracking-wider">Opening Statement</div>
                                </div>
                                <div className="ledger-stat-card border-l-4 border-l-red-500">
                                    <div className="l-label">Total Debit (-)</div>
                                    <div className="l-value text-red-400">₹{stats.total.toLocaleString()}</div>
                                    <div className="text-[10px] text-muted mt-1 uppercase tracking-wider">Total Sales</div>
                                </div>
                                <div className="ledger-stat-card border-l-4 border-l-emerald-500">
                                    <div className="l-label">Total Credit (+)</div>
                                    <div className="l-value text-emerald-400">₹{stats.paid.toLocaleString()}</div>
                                    <div className="text-[10px] text-muted mt-1 uppercase tracking-wider">Payments Received</div>
                                </div>
                                <div className="ledger-stat-card border-l-4 border-l-amber-500 bg-white/5">
                                    <div className="l-label">Closing Balance</div>
                                    <div className="l-value text-amber-400">₹{stats.pending.toFixed(2)}</div>
                                    <div className="text-[10px] text-muted mt-1 uppercase tracking-wider">Current Due</div>
                                </div>
                            </div>

                            {/* Detailed Ledger Table */}
                            <div className="table-wrapper glass-card-inner flex-1">
                                <table className="ledger-table">
                                    <thead>
                                        <tr>
                                            <th>Invoice No</th>
                                            <th>Date / Time</th>
                                            <th className="text-center">Status</th>
                                            <th className="text-center">Mode</th>
                                            <th className="text-center">Type</th>
                                            <th className="text-right">Amount</th>
                                            <th className="text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Opening Balance Row */}
                                        <tr>
                                            <td>-</td>
                                            <td className="text-xs">
                                                <div className="text-muted opacity-50">{startDate}</div>
                                                <div className="text-[10px] text-primary italic font-bold">OPENING BALANCE</div>
                                            </td>
                                            <td className="text-center">-</td>
                                            <td className="text-center">-</td>
                                            <td className="text-center">-</td>
                                            <td className="text-right">-</td>
                                            <td className="text-right font-bold">₹0.00</td>
                                        </tr>

                                        {[...customerInvoices].sort((a, b) => new Date(a.date) - new Date(b.date)).map((inv, idx, sortedArr) => {
                                            // Calculate running balance
                                            const runningUpToNow = sortedArr.slice(0, idx + 1);
                                            const totalBilled = runningUpToNow.reduce((sum, item) => sum + item.total, 0);
                                            const totalPaid = runningUpToNow.reduce((sum, item) => sum + (item.status === 'Paid' ? item.total : 0), 0);
                                            const currentBalance = totalBilled - totalPaid;

                                            // Fix double prefixing: Ensure we don't end up with INV-INV-001
                                            const displayId = inv.id.toString().replace(/^(INV-|#)/i, '');

                                            return (
                                                <tr key={inv.id}>
                                                    <td>
                                                        <div className="font-bold tracking-tight">INV-{displayId}</div>
                                                    </td>
                                                    <td className="text-xs whitespace-nowrap">
                                                        <div className="font-medium">{inv.date}</div>
                                                        <div className="text-[10px] text-muted">{inv.time || '10:00 AM'}</div>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`status-badge ${inv.status.toLowerCase()}`} style={{ padding: '0.25rem 0.75rem', fontSize: '10px' }}>
                                                            <span className="dot"></span>
                                                            {inv.status}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="text-[11px] font-semibold text-muted tracking-wide text-uppercase">
                                                            {inv.paymentMode || inv.mode || 'CASH'}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-tighter ${inv.isGST ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                                                            {inv.isGST ? 'GST' : 'NON-GST'}
                                                        </span>
                                                    </td>
                                                    <td className="text-right font-bold font-mono">₹{inv.total.toFixed(2)}</td>
                                                    <td className="text-right font-bold font-mono" style={{ color: currentBalance > 0 ? '#fbbf24' : '#10b981' }}>
                                                        ₹{currentBalance.toFixed(2)}
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {customerInvoices.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="text-center py-12 text-muted italic">
                                                    No financial records found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {activeTab === 'profile' && (
                        <ProfileTab customer={customer} />
                    )}
                </div>

                {/* Footer Summary - Only show for Transactions tab */}
                {activeTab === 'transactions' && (
                    <div className="modal-footer">
                        <div className="summary-buttons">
                            <div className="summary-btn green">
                                <span className="lbl">Total Paid</span>
                                <span className="val">₹ {stats.paid.toLocaleString()}</span>
                            </div>
                            <div className="summary-btn red">
                                <span className="lbl">Pending</span>
                                <span className="val">₹ {stats.pending.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                )}

                <style>{`
                    .customer-details-portal.modal-overlay {
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
                    
                /* Theme-aware Modal Styles */
                .customer-details-portal .modal-content {
                    background: var(--bg-card) !important;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    overflow: hidden;
                    color: var(--text-main);
                }

                /* Header & Structure */
                .customer-details-portal .modal-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 2rem; border-bottom: 1px solid var(--border-color);
                    flex-shrink: 0;
                    background: linear-gradient(to right, var(--bg-subtle), var(--bg-card));
                }
                .customer-details-portal .header-info { display: flex; gap: 1.5rem; align-items: center; }
                .customer-details-portal .header-actions { display: flex; gap: 1rem; align-items: center; }
                .customer-details-portal .customer-meta { 
                    display: flex; gap: 0.65rem; align-items: center; 
                    color: var(--text-muted); font-size: 0.8rem; font-weight: 500;
                }
                .customer-details-portal .modal-title { font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -0.02em; }
                
                .btn-pdf-premium {
                    background: #6366f1; color: white; border: none;
                    padding: 0.65rem 1.25rem; border-radius: 12px;
                    font-size: 0.85rem; font-weight: 700; cursor: pointer;
                    display: flex; align-items: center; gap: 0.75rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
                }
                .btn-pdf-premium:hover:not(:disabled) { background: #4f46e5; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3); }
                .btn-pdf-premium:active { transform: translateY(0); }
                .btn-pdf-premium:disabled { opacity: 0.7; cursor: not-allowed; }

                .close-btn-premium {
                    width: 40px; height: 40px; border-radius: 12px;
                    border: 1px solid var(--border-color); background: var(--bg-subtle);
                    color: var(--text-muted); display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.2s;
                }
                .close-btn-premium:hover { background: #ef4444; color: white; border-color: #ef4444; transform: rotate(90deg); }

                .customer-details-portal .modal-body {
                    flex: 1; 
                    overflow-y: auto; 
                    padding: 1.5rem;
                    display: flex; 
                    flex-direction: column; 
                    gap: 1rem;
                    min-height: 0;
                }

                
                /* Form Styles for Profile */
                .customer-details-portal .form-group { margin-bottom: 1.25rem; }
                .customer-details-portal .form-label { display: block; font-size: 0.85rem; font-weight: 500; color: var(--text-muted); margin-bottom: 0.5rem; }
                .customer-details-portal .form-input { 
                    width: 100%; background: var(--bg-subtle); 
                    border: 1px solid var(--border-color);
                    border-radius: 8px; padding: 0.75rem; 
                    color: var(--text-main); font-size: 0.95rem; 
                    transition: border-color 0.2s;
                }
                .customer-details-portal .form-input:focus { outline: none; border-color: #6366f1; background: var(--bg-card); }
                .customer-details-portal .btn-save { 
                    background: #6366f1; color: white; border: none; 
                    padding: 0.75rem 1.5rem; border-radius: 8px; 
                    font-weight: 600; cursor: pointer; transition: background 0.2s;
                    display: flex; align-items: center; gap: 0.5rem;
                }
                .customer-details-portal .btn-save:hover { background: #4f46e5; }

                /* Reuse existing styles */
                .customer-details-portal .glass-card-inner { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; }
                
                /* Table Wrapper specific for scrolling */
                .customer-details-portal .table-wrapper {
                    flex: 1 0 auto; /* Allow growth, don't shrink too much */
                    overflow-x: auto;
                    background: var(--bg-subtle);
                    min-height: 300px;
                    display: block;
                }

                .customer-details-portal .ledger-table th { background: var(--bg-subtle); color: var(--text-muted); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; }
                .customer-details-portal .ledger-table td { border-bottom: 1px solid var(--border-color); color: var(--text-main); }
                .customer-details-portal .text-muted { color: var(--text-muted); }
                
                /* Ledger Specific */
                .customer-details-portal .ledger-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 0.75rem;
                    margin-bottom: 0.75rem; /* Further reduced margin */
                    flex-shrink: 0;
                }
                .customer-details-portal .ledger-stat-card {
                    padding: 0.5rem 0.75rem; /* Very compact padding */
                    background: var(--bg-subtle);
                    border: 1px solid var(--border-color);
                    border-radius: 8px; /* Slightly tighter radius */
                    transition: transform 0.2s;
                    display: flex;
                    flex-direction: row; /* Ensure horizontal layout can work if needed, or vertical */
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.5rem;
                }
                .customer-details-portal .ledger-stat-card:hover {
                    transform: translateY(-1px);
                    background: var(--bg-card);
                    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
                }
                .customer-details-portal .l-label { font-size: 0.7rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
                .customer-details-portal .l-value { font-size: 1rem; font-weight: 800; margin: 0; }
                
                .customer-details-portal .ledger-controls {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                    margin-bottom: 0.75rem; /* Reduced margin */
                    flex-shrink: 0;
                }
                
                .customer-details-portal .balance-summary-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    padding: 0.5rem 1rem;
                    border-radius: 99px;
                }
                .customer-details-portal .balance-summary-pill .label { font-size: 0.75rem; font-weight: 600; color: #818cf8; }
                .customer-details-portal .balance-summary-pill .value { font-size: 0.9rem; font-weight: 800; }

                .customer-details-portal .action-icon-btn.view {
                    background: rgba(99, 102, 241, 0.1);
                    color: #6366f1;
                    padding: 8px;
                    border-radius: 8px;
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .customer-details-portal .action-icon-btn.view:hover {
                    background: rgba(99, 102, 241, 0.2);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
                }

                .customer-details-portal .action-icon-btn.delete {
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.1);
                    padding: 8px;
                    border-radius: 8px;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .customer-details-portal .row-actions button.action-icon-btn.delete:hover {
                    background: rgba(239, 68, 68, 0.2);
                    transform: scale(1.05);
                }

                .customer-details-portal .summary-btn.red .val { color: #ef4444; }

                /* Product Avatar Trigger Styles */
                .customer-details-portal .product-avatar-trigger {
                    position: relative;
                    width: 36px;
                    height: 36px;
                    cursor: pointer;
                    flex-shrink: 0;
                }
                .customer-details-portal .avatar-circle {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: rgba(99, 102, 241, 0.1);
                    color: #6366f1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 800;
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    transition: all 0.2s;
                }
                .customer-details-portal .avatar-overlay {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(99, 102, 241, 0.8);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transform: scale(0.8);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .customer-details-portal .product-avatar-trigger:hover .avatar-circle {
                    transform: scale(1.1);
                    border-color: #6366f1;
                }
                .customer-details-portal .product-avatar-trigger:hover .avatar-overlay {
                    opacity: 1;
                    transform: scale(1);
                }

                /* Footer & Summary */
                .customer-details-portal .modal-footer {
                    padding: 1rem 1.5rem;
                    border-top: 1px solid var(--border-color);
                    background: var(--bg-subtle);
                    flex-shrink: 0;
                }

                .customer-details-portal .summary-buttons {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }

                .customer-details-portal .summary-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    min-width: 120px;
                }

                .customer-details-portal .summary-btn .lbl {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-muted);
                    font-weight: 600;
                }

                .customer-details-portal .summary-btn .val {
                    font-size: 1.1rem;
                    font-weight: 700;
                }

                .customer-details-portal .summary-btn.green .val { color: #10b981; }
                .customer-details-portal .summary-btn.red .val { color: #ef4444; }

                /* Profile Dashboard Styles */
                .profile-dashboard { max-width: 900px; margin: 0 auto; padding: 1rem 0; width: 100%; animation: fade-in 0.4s ease-out; }
                .profile-header-card {
                    position: relative; overflow: hidden; padding: 2.5rem; border-radius: 24px;
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%);
                    border: 1px solid var(--border-color); margin-bottom: 2rem;
                    display: flex; align-items: center; gap: 2rem;
                }
                .profile-avatar-large {
                    width: 96px; height: 96px; border-radius: 20px; background: rgba(99, 102, 241, 0.2);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 2rem; font-weight: 900; color: #6366f1; border: 2px solid rgba(99, 102, 241, 0.3);
                    box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.2);
                }
                .profile-header-info { flex: 1; }
                .profile-name-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
                .profile-name-row h2 { font-size: 1.75rem; font-weight: 800; margin: 0; letter-spacing: -0.02em; color: var(--text-main); }
                
                .profile-pill { padding: 4px 12px; border-radius: 99px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
                .profile-pill.primary { background: rgba(99, 102, 241, 0.15); color: #6366f1; }
                .profile-pill.orange { background: rgba(249, 115, 22, 0.15); color: #f97316; }
                .profile-pill.emerald { background: rgba(16, 185, 129, 0.15); color: #10b981; }

                .profile-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
                .profile-info-block {
                    display: flex; align-items: center; gap: 1rem; padding: 1.25rem;
                    background: var(--bg-card); border: 1px solid var(--border-color);
                    border-radius: 16px; transition: all 0.3s;
                }
                .profile-info-block:hover { border-color: #6366f1; transform: translateY(-2px); }
                .info-icon-box { width: 40px; height: 40px; border-radius: 12px; background: rgba(99, 102, 241, 0.1); color: #6366f1; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .info-content p:first-child { font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin: 0 0 2px 0; }
                .info-content p:last-child { font-size: 0.85rem; font-weight: 600; color: var(--text-main); margin: 0; }
                
                .profile-section-card {
                    background: var(--bg-card); border: 1px solid var(--border-color);
                    border-radius: 20px; padding: 1.5rem;
                }
                .section-card-title {
                    display: flex; align-items: center; gap: 0.5rem;
                    font-size: 10px; font-weight: 900; color: var(--text-muted);
                    text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1.25rem;
                }
                
                .address-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem; margin-top: 0.5rem; }
                .address-text { font-size: 0.9rem; font-weight: 500; color: var(--text-main); line-height: 1.6; font-style: italic; opacity: 0.8; }
                .location-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; border-left: 1px solid var(--border-color); padding-left: 1.5rem; }
                .loc-item p:first-child { font-size: 9px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin: 0 0 2px 0; }
                .loc-item p:last-child { font-size: 0.8rem; font-weight: 700; color: var(--text-main); margin: 0; }

                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 768px) {
                    .profile-header-card { flex-direction: column; text-align: center; gap: 1rem; padding: 1.5rem; }
                    .profile-name-row { justify-content: center; }
                    .profile-grid { grid-template-columns: 1fr; }
                    .address-layout { grid-template-columns: 1fr; gap: 1rem; }
                    .location-grid { border-left: none; padding-left: 0; border-top: 1px solid var(--border-color); padding-top: 1.5rem; }
                }
                    @media (max-width: 768px) {
                    .customer-details-portal .modal-content { width: 100%; height: 100%; border-radius: 0; }
                    .customer-details-portal .modal-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; padding: 1.5rem; }
                    .customer-details-portal .header-info { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .customer-details-portal .header-actions { width: 100%; flex-wrap: wrap; }
                    .btn-pdf-premium { flex: 1; justify-content: center; }
                    .customer-details-portal .ledger-stats-grid { grid-template-columns: 1fr; gap: 1rem; }
                    .customer-details-portal .ledger-controls { flex-direction: column; align-items: stretch; gap: 1rem; }
                    .balance-summary-pill { margin-left: 0 !important; width: 100%; justify-content: center; }
                    .standard-tabs-wrapper { height: auto; flex-wrap: wrap; padding: 4px; border-radius: 12px; }
                    .standard-tabs-btn { height: 40px; padding: 0 10px; font-size: 0.75rem; flex: 1 0 45%; }
                    .standard-tabs-indicator { display: none; }
                    .modal-body { padding: 1rem; }
                }

                @media (max-width: 480px) {
                    .customer-details-portal .modal-title { font-size: 1.25rem; }
                    .standard-tabs-btn { flex: 1 0 100%; }
                }
            `}</style>
                {viewingInvoice && (
                    <InvoiceViewModal
                        inv={viewingInvoice}
                        onClose={() => setViewingInvoice(null)}
                        products={products}
                        customers={customers}
                        brands={brands}
                    />
                )}

                {viewingProduct && (
                    <ProductModal
                        isOpen={!!viewingProduct}
                        onClose={() => setViewingProduct(null)}
                        product={viewingProduct}
                        onUpdate={updateProduct}
                        onAdd={addProduct}
                    />
                )}
            </div >

        </div >,
        document.body
    )
}

// Sub-component for Profile Tab - High Fidelity Read Only View
const ProfileTab = ({ customer }) => {
    return (
        <div className="profile-dashboard">
            {/* TOP HEADER CARD */}
            <div className="profile-header-card">
                <div className="profile-avatar-large">
                    {customer.name?.charAt(0).toUpperCase()}
                </div>
                <div className="profile-header-info">
                    <div className="profile-name-row">
                        <h2>{customer.name}</h2>
                        <span className={`profile-pill ${customer.type === 'Vendor' ? 'orange' : 'primary'}`}>
                            {customer.type || 'Customer'}
                        </span>
                        {customer.isGST && (
                            <span className="profile-pill emerald">
                                GST ACTIVE
                            </span>
                        )}
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mail size={14} /> {customer.email || 'No email associated'}
                    </p>
                </div>
            </div>

            <div className="profile-grid">
                {/* CONTACT SECTION */}
                <div className="profile-info-block">
                    <div className="info-icon-box"><Phone size={18} /></div>
                    <div className="info-content">
                        <p>Phone Number</p>
                        <p>{customer.phone || '—'}</p>
                    </div>
                </div>
                <div className="profile-info-block">
                    <div className="info-icon-box"><Mail size={18} /></div>
                    <div className="info-content">
                        <p>Email Address</p>
                        <p>{customer.email || '—'}</p>
                    </div>
                </div>
                <div className="profile-info-block">
                    <div className="info-icon-box"><Globe size={18} /></div>
                    <div className="info-content">
                        <p>Website</p>
                        <p>{customer.website || '—'}</p>
                    </div>
                </div>

                {/* TAX SECTION */}
                <div className="profile-section-card" style={{ gridColumn: 'span 1' }}>
                    <div className="section-card-title"><CreditCard size={14} /> Financials</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>GSTIN NUMBER</p>
                            <p style={{ fontSize: '0.9rem', fontWeight: '800', color: '#10b981', tracking: '0.05em' }}>{customer.gstin || 'NOT REGISTERED'}</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>GST RATE</p>
                                <p style={{ fontWeight: '700' }}>{customer.gstPercentage || 0}%</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>CREDIT LIMIT</p>
                                <p style={{ fontWeight: '700', color: '#6366f1' }}>₹{(customer.creditLimit || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ADDRESS SECTION */}
                <div className="profile-section-card" style={{ gridColumn: 'span 2' }}>
                    <div className="section-card-title"><MapPin size={14} /> Registered Address</div>
                    <div className="address-layout">
                        <div className="address-text">
                            "{customer.address || 'Company address not available in records'}"
                        </div>
                        <div className="location-grid">
                            <div className="loc-item">
                                <p>City</p>
                                <p>{customer.city || '—'}</p>
                            </div>
                            <div className="loc-item">
                                <p>State Code</p>
                                <p style={{ color: '#6366f1' }}>{customer.stateCode || '—'}</p>
                            </div>
                            <div className="loc-item">
                                <p>Pincode</p>
                                <p>{customer.pincode || '—'}</p>
                            </div>
                            <div className="loc-item">
                                <p>Region</p>
                                <p>{customer.state || '—'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CustomerDetailsModal
