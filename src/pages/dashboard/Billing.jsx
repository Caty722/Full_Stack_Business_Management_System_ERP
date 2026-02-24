/*
 * --------------------------------------------------------------------------
 * LOCKED: This file contains the finalized Invoice Dashboard (Billing) logic.
 * DO NOT MODIFY THIS FILE unless explicitly instructed by the user.
 * --------------------------------------------------------------------------
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import logo from '../../assets/logo.png'
import logotype from '../../assets/ferwa_logotype.png'
import fullLogo from '../../assets/ferwa_full_logo.png'
import regalCleanLogo from '../../assets/ferwa_regal_clean_logo.png'
import { createPortal } from 'react-dom'
import { useTheme } from '../../context/ThemeContext'
import { useShop } from '../../context/ShopContext'
import {
    Plus,
    Settings,
    Search,
    ChevronDown,
    MoreHorizontal,
    MoreVertical,
    Eye,
    IndianRupee,
    Send,
    Bell,
    Filter,
    ChevronRight,
    ChevronLeft,
    X,
    Save,
    Trash2,
    Printer,
    Download,
    FileText,
    CheckCircle,
    ArrowRight,
    Calendar
} from 'lucide-react'
import PremiumCalendar from '../../components/PremiumCalendar'
import PremiumDatePicker from '../../components/PremiumDatePicker'
import { QRCodeSVG } from 'qrcode.react'

// --- Helper ---
import GSTInvoiceLayout, { numberToWords, formatEliteDate } from '../../components/GSTInvoiceLayout'
import { formatDateDDMMYYYY } from '../../lib/utils'
import InvoiceViewModal from '../../components/InvoiceViewModal'
import InvoiceBuilderModal from '../../components/InvoiceBuilderModal'
import { generateInvoicePdf } from '../../lib/pdfGenerator'
import { getPdfBlob } from '../../lib/pdfBlob'
// --- Modals ---


const ShareModal = ({ inv, onClose, onShare, onCopyLink }) => {
    if (!inv) return null
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content share-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Share Invoice {inv.id}</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="share-options">
                    <button className="share-opt wa" onClick={() => onShare('whatsapp', inv)}>
                        <span className="icon">💬</span> WhatsApp
                    </button>
                    <button className="share-opt em" onClick={() => onShare('email', inv)}>
                        <span className="icon">✉️</span> Email
                    </button>
                    <button className="share-opt sms" onClick={() => onShare('sms', inv)}>
                        <span className="icon">📱</span> SMS
                    </button>
                </div>
            </div>
        </div>
    )
}

const PaymentConfirmationModal = ({ inv, onClose, onConfirm }) => {
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
    // Initialize with invoice's payment mode or default to Cash
    const [paymentMode, setPaymentMode] = useState(inv.paymentMode || 'Cash')
    const initialBalance = (inv.balanceDue !== undefined && inv.status !== 'Paid') ? inv.balanceDue : inv.total
    const [isFullPayment, setIsFullPayment] = useState(true)
    const [paidAmount, setPaidAmount] = useState(initialBalance)

    // --- Custom Payment Mode Logic (Same as InvoiceBuilder) ---
    const DEFAULT_PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque']
    const [availablePaymentModes, setAvailablePaymentModes] = useState(() => {
        const savedModes = localStorage.getItem('customPaymentModes')
        const parsedModes = savedModes ? JSON.parse(savedModes) : []

        // Combine and deduplicate case-insensitively
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
        const exists = availablePaymentModes.some(m => m.toLowerCase() === mode.trim().toLowerCase())
        if (!exists) {
            const newModes = [...availablePaymentModes, mode.trim()]
            setAvailablePaymentModes(newModes)
            localStorage.setItem('customPaymentModes', JSON.stringify(newModes))
        }
    }

    useEffect(() => {
        setPaidAmount(isFullPayment ? initialBalance : '')
    }, [isFullPayment, initialBalance])

    if (!inv) return null

    const handleConfirm = () => {
        const finalAmount = isFullPayment ? initialBalance : parseFloat(paidAmount || 0)
        const newBalance = initialBalance - finalAmount
        const status = newBalance <= 0 ? 'Paid' : 'Partially Paid'

        // Save custom mode if new
        handleSaveCustomPaymentMode(paymentMode)

        onConfirm(inv.id, {
            status,
            paymentDate,
            paymentMode,
            amountPaid: (inv.total - initialBalance) + finalAmount, // Cumulative amount paid
            balanceDue: Math.max(0, newBalance)
        })
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>Confirm Payment</h3>
                    <button className="close-btn" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
                </div>

                <div style={{ padding: '1rem 0' }}>
                    <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                        Mark invoice <strong style={{ color: 'var(--text-main)' }}>{inv.id}</strong> as Paid?
                    </p>
                    <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Bill</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>₹{inv.total.toLocaleString()}</span>
                        </div>
                        {inv.total > initialBalance && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem', color: '#10b981' }}>Already Paid</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#10b981' }}>₹{(inv.total - initialBalance).toLocaleString()}</span>
                            </div>
                        )}
                        <div style={{ borderTop: '1px dashed var(--border-color)', margin: '0.5rem 0', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '600' }}>Remaining Payable</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent)' }}>₹{initialBalance.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ marginBottom: 0 }}>Full Payment</label>
                        <button
                            type="button"
                            className={`toggle-switch ${isFullPayment ? 'active' : ''}`}
                            onClick={() => setIsFullPayment(!isFullPayment)}
                            style={{
                                width: '44px',
                                height: '24px',
                                background: isFullPayment ? '#10b981' : 'var(--border-color)',
                                borderRadius: '99px',
                                position: 'relative',
                                transition: '0.3s',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <span style={{
                                position: 'absolute',
                                top: '2px',
                                left: isFullPayment ? '22px' : '2px',
                                width: '20px',
                                height: '20px',
                                background: 'white',
                                borderRadius: '50%',
                                transition: '0.3s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }} />
                        </button>
                    </div>

                    {!isFullPayment && (
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Amount Paid (₹)</label>
                            <input
                                type="number"
                                value={paidAmount}
                                onChange={e => setPaidAmount(e.target.value)}
                                className="premium-input"
                                min="0"
                                max={inv.total}
                            />
                        </div>
                    )}

                    <PremiumDatePicker
                        label="Payment Date"
                        value={paymentDate}
                        onChange={setPaymentDate}
                    />

                    <div className="form-group">
                        <label>Payment Mode</label>
                        <select
                            value={availablePaymentModes.includes(paymentMode) ? paymentMode : 'Custom'}
                            onChange={e => {
                                if (e.target.value === 'Custom') {
                                    setPaymentMode('')
                                } else {
                                    setPaymentMode(e.target.value)
                                }
                            }}
                            className="premium-input"
                            style={{ width: '100%' }}
                        >
                            {availablePaymentModes.map(mode => (
                                <option key={mode} value={mode}>{mode === 'UPI' ? 'UPI / Digital' : mode}</option>
                            ))}
                            <option value="Custom">Custom</option>
                        </select>
                        {!availablePaymentModes.includes(paymentMode) && (
                            <input
                                type="text"
                                placeholder="Enter custom mode"
                                value={paymentMode}
                                onChange={e => setPaymentMode(e.target.value)}
                                className="premium-input"
                                style={{ marginTop: '8px', width: '100%' }}
                                autoFocus
                            />
                        )}
                    </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        onClick={handleConfirm}
                        style={{
                            background: '#10b981',
                            color: 'white',
                            padding: '0.625rem 1.5rem',
                            borderRadius: '8px',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Confirm Payment
                    </button>
                </div>
            </div>
        </div>
    )
}


export default function Billing() {
    const navigate = useNavigate()
    const location = useLocation()
    const { invoices, customers, products, createInvoice, updateInvoice, deleteInvoice, getProductPrice, brands } = useShop()
    const [billingType, setBillingType] = useState(location.state?.returnBillingType || 'GST')
    const [activeTab, setActiveTab] = useState('All')
    const [searchTerm, setSearchTerm] = useState('')
    const [viewInvoice, setViewInvoice] = useState(null)
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
    const [shareInvoice, setShareInvoice] = useState(null)
    const [confirmPayment, setConfirmPayment] = useState(null)
    const [activeMenuId, setActiveMenuId] = useState(null)
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })

    // --- Pagination State ---
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    // --- New Filter State ---
    const [dateRange, setDateRange] = useState('All')
    const [showDateModal, setShowDateModal] = useState(false)
    const [dateCustomRange, setDateCustomRange] = useState({ start: '', end: '' })
    const dateModalRef = useRef(null)

    // Local modal logic removed - moving to dedicated page (/admin/billing/new)



    const menuRef = useRef(null)
    const dateMenuRef = useRef(null)
    const { theme } = useTheme()

    // --- Handlers ---
    useEffect(() => {
        // Handle URL search query
        const params = new URLSearchParams(location.search)
        const q = params.get('q')
        if (q) {
            setSearchTerm(decodeURIComponent(q))
            setActiveTab('All')
        }

        // Auto-open invoice if passed from navigation state
        if (location.state?.openInvoiceId && invoices.length > 0) {
            const draftInvoice = invoices.find(inv => inv.id === location.state.openInvoiceId)
            if (draftInvoice && draftInvoice.status === 'Draft') {
                setActiveTab('Drafts')
                navigate(location.pathname, { replace: true, state: {} })
            }
        }

        const handleClickOutside = (event) => {
            if (event.target.closest('.portal-menu') || event.target.closest('.filter-menu-overlay')) {
                return
            }
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMenuId(null)
            }
            if (dateModalRef.current && !dateModalRef.current.contains(event.target)) {
                setShowDateModal(false)
            }
        }

        const handleScroll = () => {
            setActiveMenuId(null)
        }

        document.addEventListener('mousedown', handleClickOutside)
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            window.removeEventListener('scroll', handleScroll)
        }
    }, [location.search, location.state, invoices, navigate])

    // --- Handlers ---
    const handlePaymentUpdate = (inv) => {
        setConfirmPayment(inv)
    }

    const handleConfirmPayment = (id, updates) => {
        updateInvoice(id, updates)
        setConfirmPayment(null)
    }

    const [downloadingInvoice, setDownloadingInvoice] = useState(null)

    const handleDownloadPDF = async (invoice) => {
        setDownloadingInvoice(invoice)
        setIsGeneratingPDF(true)
        setTimeout(async () => {
            try {
                const blob = await getPdfBlob('printable-invoice', `Invoice_${invoice.id}.pdf`)
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `Invoice_${invoice.id}.pdf`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
            } catch (error) {
                console.error("PDF Download failed:", error)
                alert("Failed to download PDF.")
            } finally {
                setIsGeneratingPDF(false)
                setDownloadingInvoice(null)
            }
        }, 500)
    }


    const handleCopyLink = (inv) => {
        // Obsoleted
    }

    const getShareText = (inv) => {
        return encodeURIComponent(`Hello, here is your invoice ${inv.id} from Ferwa.\nTotal: ₹${Math.round(inv.total).toLocaleString('en-IN')}\n\nPlease find the attached PDF.`)
    }

    const handleShare = (type, inv) => {
        const text = getShareText(inv)
        const link = `https://ferwa.app/invoice/${inv.id}`

        switch (type) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${text}`, '_blank')
                break
            case 'email':
                window.open(`mailto:?subject=Invoice ${inv.id} from Ferwa&body=${text}`, '_blank')
                break
            case 'sms':
                window.open(`sms:?body=${text}`, '_blank')
                break
            default:
                break
        }
    }

    // --- Helpers ---


    // --- Filtering Logic ---
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            // 1. Type Match (All, GST, Non-GST)
            const matchesType = billingType === 'all' || inv.isGST === (billingType === 'GST')

            // 2. Tab Match (Filter by Status)
            let matchesTab = false
            const status = (inv.status || '').toLowerCase()
            if (activeTab === 'All') {
                matchesTab = status !== 'draft' && status !== 'cancelled'
            } else {
                const target = (activeTab === 'Drafts' ? 'draft' : activeTab.toLowerCase())
                matchesTab = status === target
            }

            // 3. Search Match
            const search = (searchTerm || '').trim().toLowerCase()
            const matchesSearch = !search ||
                (inv.id || '').toLowerCase().includes(search) ||
                (inv.customer || '').toLowerCase().includes(search) ||
                (inv.items || []).some(item => (item.name || '').toLowerCase().includes(search))

            // 4. Date Filter (Comprehensive Presets)
            let matchesDate = true
            if (dateRange && dateRange !== 'All') {
                let invDate
                if (typeof inv.date === 'string' && inv.date.includes('/')) {
                    const [d, m, y] = inv.date.split('/')
                    invDate = new Date(Number(y), Number(m) - 1, Number(d))
                } else if (inv.date?.toDate) {
                    invDate = inv.date.toDate()
                } else if (inv.date) {
                    invDate = new Date(inv.date)
                }

                if (!invDate || isNaN(invDate.getTime())) return false

                const now = new Date()
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)

                switch (dateRange) {
                    case 'Today':
                        matchesDate = invDate.toDateString() === today.toDateString()
                        break
                    case 'Yesterday':
                        matchesDate = invDate.toDateString() === yesterday.toDateString()
                        break
                    case 'This Week': {
                        const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay())
                        matchesDate = invDate >= startOfWeek
                        break
                    }
                    case 'Last Week': {
                        const startOfLastWeek = new Date(today); startOfLastWeek.setDate(today.getDate() - today.getDay() - 7)
                        const endOfLastWeek = new Date(startOfLastWeek); endOfLastWeek.setDate(startOfLastWeek.getDate() + 6); endOfLastWeek.setHours(23, 59, 59)
                        matchesDate = invDate >= startOfLastWeek && invDate <= endOfLastWeek
                        break
                    }
                    case 'This Month':
                        matchesDate = invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear()
                        break
                    case 'Last Month': {
                        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                        matchesDate = invDate.getMonth() === lastMonth.getMonth() && invDate.getFullYear() === lastMonth.getFullYear()
                        break
                    }
                    case 'Last 30 Days': {
                        const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(today.getDate() - 30)
                        matchesDate = invDate >= thirtyDaysAgo
                        break
                    }
                    case 'This Year':
                        matchesDate = invDate.getFullYear() === now.getFullYear()
                        break
                    case 'Last Year':
                        matchesDate = invDate.getFullYear() === now.getFullYear() - 1
                        break
                    case 'Last Quarter': {
                        const currentQuarter = Math.floor(now.getMonth() / 3)
                        const firstMonthOfLastQuarter = (currentQuarter - 1) * 3
                        const year = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear()
                        const start = new Date(year, (firstMonthOfLastQuarter + 12) % 12, 1)
                        const end = new Date(start.getFullYear(), start.getMonth() + 3, 0); end.setHours(23, 59, 59)
                        matchesDate = invDate >= start && invDate <= end
                        break
                    }
                    case 'FY 25-26':
                        matchesDate = invDate >= new Date(2025, 3, 1) && invDate <= new Date(2026, 2, 31, 23, 59, 59)
                        break
                    case 'FY 24-25':
                        matchesDate = invDate >= new Date(2024, 3, 1) && invDate <= new Date(2025, 2, 31, 23, 59, 59)
                        break
                    case 'FY 23-24':
                        matchesDate = invDate >= new Date(2023, 3, 1) && invDate <= new Date(2024, 2, 31, 23, 59, 59)
                        break
                    case 'FY 22-23':
                        matchesDate = invDate >= new Date(2022, 3, 1) && invDate <= new Date(2023, 2, 31, 23, 59, 59)
                        break
                    case 'Custom Range': {
                        if (dateCustomRange.start && dateCustomRange.end) {
                            // Robust parsing for YYYY-MM-DD or DD/MM/YYYY
                            const parseDate = (dateStr) => {
                                if (dateStr.includes('-')) {
                                    const [y, m, d] = dateStr.split('-')
                                    return new Date(Number(y), Number(m) - 1, Number(d))
                                } else if (dateStr.includes('/')) {
                                    const [d, m, y] = dateStr.split('/')
                                    return new Date(Number(y), Number(m) - 1, Number(d))
                                }
                                return new Date(dateStr)
                            }

                            const start = parseDate(dateCustomRange.start); start.setHours(0, 0, 0, 0)
                            const end = parseDate(dateCustomRange.end); end.setHours(23, 59, 59, 999)
                            matchesDate = invDate >= start && invDate <= end
                        }
                        break
                    }
                    default:
                        matchesDate = true
                }
            }

            return matchesType && matchesTab && matchesSearch && matchesDate
        })
    }, [invoices, activeTab, searchTerm, billingType, dateRange, dateCustomRange])

    useEffect(() => {
        setCurrentPage(1)
    }, [activeTab, searchTerm, billingType, dateRange, dateCustomRange, invoices])

    const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage))
    const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    // --- Summary Calculations ---
    const totals = useMemo(() => {
        return filteredInvoices.reduce((acc, inv) => {
            const total = Number(inv.total || 0)
            acc.total += total
            if (inv.status === 'Paid') acc.paid += total
            else if (inv.status === 'Pending') acc.pending += total
            return acc
        }, { total: 0, paid: 0, pending: 0 })
    }, [filteredInvoices])

    const tabs = [
        { name: 'All', count: invoices.filter(i => (billingType === 'all' || i.isGST === (billingType === 'GST')) && i.status !== 'Draft' && i.status !== 'Cancelled').length },
        { name: 'Pending', count: invoices.filter(i => (billingType === 'all' || i.isGST === (billingType === 'GST')) && i.status === 'Pending').length },
        { name: 'Paid', count: invoices.filter(i => (billingType === 'all' || i.isGST === (billingType === 'GST')) && i.status === 'Paid').length },
        { name: 'Cancelled', count: invoices.filter(i => (billingType === 'all' || i.isGST === (billingType === 'GST')) && i.status === 'Cancelled').length },
        { name: 'Drafts', count: invoices.filter(i => (billingType === 'all' || i.isGST === (billingType === 'GST')) && i.status === 'Draft').length }
    ]



    return (
        <div className="sales-container">
            {/* Header */}
            <div className="page-header">
                <div className="header-text-block">
                    <h1 className="page-title">{billingType === 'GST' ? 'GST Invoices' : 'Non-GST Invoices'}</h1>
                    <p className="page-subtitle">Track and manage your {billingType === 'GST' ? 'GST-compliant' : 'standard'} sales transactions and receivables.</p>
                </div>
                <div className="header-actions">
                    <div className="standard-tabs-wrapper" style={{ minWidth: '280px' }}>
                        <div
                            className="standard-tabs-indicator"
                            style={{
                                width: 'calc(50% - 4px)',
                                left: billingType === 'GST' ? '4px' : 'calc(50%)'
                            }}
                        ></div>
                        <button
                            className={`standard-tabs-btn ${billingType === 'GST' ? 'active' : ''}`}
                            onClick={() => { setBillingType('GST'); setActiveTab('All'); }}
                        >
                            <span>GST</span>
                            <span className="type-count">{invoices.filter(i => i.isGST).length}</span>
                        </button>
                        <button
                            className={`standard-tabs-btn ${billingType === 'Non-GST' ? 'active' : ''}`}
                            onClick={() => { setBillingType('Non-GST'); setActiveTab('All'); }}
                        >
                            <span>Non-GST</span>
                            <span className="type-count">{invoices.filter(i => !i.isGST).length}</span>
                        </button>
                    </div>
                    <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings size={18} />
                        <span>Settings</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => { navigate('/admin/billing/new', { state: { mode: billingType } }) }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={20} />
                        <span>New Invoice</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-glow purple"></div>
                    <div className="stat-icon purple"><Search size={24} /></div>
                    <div className="stat-content">
                        <p className="stat-label">Total Volume</p>
                        <h3 className="stat-value">₹{Math.round(totals.total).toLocaleString('en-IN')}</h3>
                    </div>
                </div>
                <div className="stat-card alert">
                    <div className="stat-glow orange"></div>
                    <div className="stat-icon orange"><Bell size={24} /></div>
                    <div className="stat-content">
                        <p className="stat-label">Pending Collection</p>
                        <h3 className="stat-value">₹{Math.round(totals.pending).toLocaleString('en-IN')}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-glow green"></div>
                    <div className="stat-icon green"><Save size={24} /></div>
                    <div className="stat-content">
                        <p className="stat-label">Successfully Paid</p>
                        <h3 className="stat-value">₹{Math.round(totals.paid).toLocaleString('en-IN')}</h3>
                    </div>
                </div>
            </div>

            <div className="card glass-card sales-card">
                {/* Tabs */}
                <div className="standard-tabs-wrapper mb-6" style={{ maxWidth: '650px', margin: '1rem 0 1.5rem 0' }}>
                    <div
                        className="standard-tabs-indicator"
                        style={{
                            width: `calc((100% - 8px) / ${tabs.length})`,
                            left: `calc(4px + (${tabs.findIndex(t => t.name === activeTab)} * (100% - 8px) / ${tabs.length}))`
                        }}
                    ></div>
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            className={`standard-tabs-btn ${activeTab === tab.name ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.name)}
                        >
                            {tab.name} {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
                        </button>
                    ))}
                </div>

                {/* Filter Bar */}
                <div className="filters-bar">
                    <div className="standard-search-wrapper" style={{ height: '44px' }}>
                        <Search size={18} className="standard-search-icon" />
                        <input
                            type="text"
                            placeholder="Search invoices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="search-clear-btn" onClick={() => setSearchTerm('')}>
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <div className="filters-right">
                        <div className="filter-dropdown-container">
                            <button
                                className={`btn btn-outline filter-btn glass-btn ${dateRange !== 'All' ? 'active' : ''}`}
                                onClick={() => setShowDateModal(true)}
                                style={{ gap: '8px' }}
                            >
                                <Filter size={16} />
                                <span>
                                    {dateRange === 'Custom Range'
                                        ? `${dateCustomRange.start ? formatDateDDMMYYYY(dateCustomRange.start).split('/')[0] + '/' + formatDateDDMMYYYY(dateCustomRange.start).split('/')[1] : ''} - ${dateCustomRange.end ? formatDateDDMMYYYY(dateCustomRange.end).split('/')[0] + '/' + formatDateDDMMYYYY(dateCustomRange.end).split('/')[1] : ''}`
                                        : dateRange}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="table-container">
                    <table className="products-table billing-table">
                        <thead>
                            <tr>
                                <th style={{ width: '12%' }}>Bill #</th>

                                <th style={{ width: '20%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>Customer</div>
                                </th>







                                <th style={{ width: '16%' }}>
                                    <div className="th-content">
                                        Date
                                        <span className="sub-th" style={{ display: 'block', fontSize: '0.62rem', textTransform: 'none', marginTop: '1px', opacity: 0.8 }}>Created time</span>
                                    </div>
                                </th>



                                <th style={{ width: '10%' }}>Mode</th>
                                <th style={{ width: '12%', textAlign: 'center' }}>
                                    <div className="th-content justify-center">Status</div>
                                </th>


                                <th style={{ width: '14%', textAlign: 'center' }}>
                                    <div className="th-content justify-center">
                                        Amount
                                    </div>
                                </th>



                                <th style={{ textAlign: 'center', width: '16%', whiteSpace: 'nowrap' }}>Actions</th>



                            </tr>
                        </thead>
                        <tbody>
                            {paginatedInvoices.map((inv, index) => (
                                <tr
                                    key={inv.id}
                                    className="staggered-row"
                                    style={{ animationDelay: `${index * 0.05}s`, cursor: 'pointer' }}
                                    onClick={() => {
                                        if (inv.status === 'Draft') {
                                            navigate('/admin/billing/new', { state: { invoice: inv } })
                                        } else {
                                            setViewInvoice(inv);
                                        }
                                    }}
                                >
                                    <td>
                                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{inv.id}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>by ~Hamza</div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ fontWeight: '500', display: 'flex', justifyContent: 'center', width: '100%' }}>{inv.customer}</div>
                                    </td>




                                    <td>
                                        <div style={{ fontWeight: '600' }}>{formatDateDDMMYYYY(inv.date)}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.createdAt ? new Date(inv.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '12:00 PM'}</div>
                                    </td>
                                    <td>
                                        <span className="sku-tag" style={{ background: inv.paymentMode === 'Cash' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)', color: inv.paymentMode === 'Cash' ? '#10b981' : '#6366f1', fontWeight: '600' }}>
                                            {inv.paymentMode || 'Cash'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <span className={`status-pill pill-${inv.status === 'Paid' ? 'safe' :
                                                inv.status === 'Draft' ? 'draft' :
                                                    inv.status === 'Cancelled' ? 'cancelled' : 'warning'
                                                }`}>
                                                <span className="dot"></span>
                                                {inv.status}
                                                {inv.status === 'Pending' && <Bell size={12} style={{ marginLeft: '4px', opacity: 0.8 }} />}
                                                {inv.status === 'Draft' && <FileText size={12} style={{ marginLeft: '4px', opacity: 0.8 }} />}
                                            </span>
                                            {inv.status === 'Pending' && <div style={{ fontSize: '0.7rem', color: '#f87171', marginTop: '4px', fontWeight: '600' }}>since 1 day</div>}
                                        </div>
                                    </td>
                                    <td className="font-bold text-main" style={{ textAlign: 'center', fontSize: '1.05rem', paddingRight: '1rem' }}>

                                        ₹ {Math.round(inv.total).toLocaleString('en-IN')}
                                        {inv.balanceDue > 0 && inv.status !== 'Paid' && (
                                            <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600', marginTop: '2px' }}>
                                                Due: ₹{Math.round(inv.balanceDue).toLocaleString('en-IN')}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="actions-cell" style={{ justifyContent: 'flex-end', gap: '4px' }}>

                                            {inv.status !== 'Paid' && (
                                                <button
                                                    className="action-btn payment-trigger-btn"
                                                    style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }}
                                                    onClick={(e) => { e.stopPropagation(); handlePaymentUpdate(inv); }}
                                                    title="Mark as Paid"
                                                >
                                                    <IndianRupee size={16} strokeWidth={2.5} />
                                                </button>
                                            )}
                                            <button className="action-btn edit" title="View" onClick={(e) => { e.stopPropagation(); setViewInvoice(inv); }}>
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                className="action-btn send-action-btn"
                                                title="Send"
                                                onClick={(e) => { e.stopPropagation(); setShareInvoice(inv); }}
                                            >
                                                <Send size={14} />
                                            </button>
                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    className={`action-btn ${activeMenuId === inv.id ? 'active' : ''}`}
                                                    title="Options"
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (activeMenuId === inv.id) {
                                                            setActiveMenuId(null)
                                                        } else {
                                                            const rect = e.currentTarget.getBoundingClientRect()
                                                            const spaceBelow = window.innerHeight - rect.bottom
                                                            const estimatedHeight = inv.status !== 'Paid' ? 300 : 260
                                                            const showAbove = spaceBelow < estimatedHeight

                                                            setMenuPosition({
                                                                top: showAbove ? 'auto' : rect.bottom,
                                                                bottom: showAbove ? window.innerHeight - rect.top : 'auto',
                                                                left: rect.right - 180, // width of dropdown
                                                                direction: showAbove ? 'up' : 'down'
                                                            })

                                                            setActiveMenuId(inv.id)
                                                        }
                                                    }}
                                                >
                                                    <MoreVertical size={14} />
                                                </button>

                                                {activeMenuId === inv.id && createPortal(
                                                    <>
                                                        <div className="filter-menu-overlay" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}></div>
                                                        <div
                                                            className={`action-dropdown-menu portal-dropdown portal-menu ${menuPosition.direction}`}
                                                            ref={menuRef}
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{
                                                                position: 'fixed',
                                                                top: menuPosition.top === 'auto' ? 'auto' : `${menuPosition.top}px`,
                                                                bottom: menuPosition.bottom === 'auto' ? 'auto' : `${menuPosition.bottom}px`,
                                                                left: `${menuPosition.left}px`,
                                                                marginTop: menuPosition.direction === 'down' ? '4px' : '0',
                                                                marginBottom: menuPosition.direction === 'up' ? '4px' : '0'
                                                            }}
                                                        >
                                                            <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); navigate('/admin/billing/new', { state: { invoice: inv } }); setActiveMenuId(null); }}>
                                                                <FileText size={14} /> Edit Invoice
                                                            </button>
                                                            <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); setViewInvoice(inv); setActiveMenuId(null); }}>
                                                                <Eye size={14} /> View Details
                                                            </button>
                                                            {inv.status !== 'Paid' && (
                                                                <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); handlePaymentUpdate(inv); setActiveMenuId(null); }}>
                                                                    <CheckCircle size={14} /> Mark as Paid
                                                                </button>
                                                            )}
                                                            <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleShare('whatsapp', inv); setActiveMenuId(null); }}>
                                                                <Send size={14} /> Send via WhatsApp
                                                            </button>
                                                            <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleDownloadPDF(inv); setActiveMenuId(null); }}>
                                                                <Download size={14} /> Download PDF
                                                            </button>
                                                            <div className="dropdown-divider"></div>

                                                            {inv.status === 'Draft' ? (
                                                                <button className="dropdown-item delete" onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm(`Are you sure you want to delete this Draft ${inv.id}?`)) {
                                                                        deleteInvoice(inv.id);
                                                                    }
                                                                    setActiveMenuId(null);
                                                                }}>
                                                                    <Trash2 size={14} /> Delete Draft
                                                                </button>
                                                            ) : inv.status !== 'Cancelled' ? (
                                                                <button className="dropdown-item delete" style={{ color: '#ef4444' }} onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm(`Are you sure you want to CANCEL Invoice ${inv.id}? This will restore stock and void the record.`)) {
                                                                        updateInvoice(inv.id, { status: 'Cancelled' });
                                                                    }
                                                                    setActiveMenuId(null);
                                                                }}>
                                                                    <X size={14} /> Cancel Invoice
                                                                </button>
                                                            ) : (
                                                                <button className="dropdown-item delete" onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm(`Are you sure you want to permanently DELETE the Cancelled Invoice ${inv.id}?`)) {
                                                                        deleteInvoice(inv.id);
                                                                    }
                                                                    setActiveMenuId(null);
                                                                }}>
                                                                    <Trash2 size={14} /> Delete Record
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>,
                                                    document.body
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '4rem' }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>No invoices found in this view.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div >

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
            </div >

            {/* Modals Rendering */}
            {
                viewInvoice && (
                    <InvoiceViewModal
                        inv={viewInvoice}
                        onClose={() => setViewInvoice(null)}
                        products={products}
                        customers={customers}
                        onDownloadPDF={handleDownloadPDF}
                        isGeneratingPDF={isGeneratingPDF}
                        brands={brands}
                    />
                )
            }
            {
                downloadingInvoice && (
                    <InvoiceViewModal
                        inv={downloadingInvoice}
                        onClose={() => setDownloadingInvoice(null)}
                        products={products}
                        customers={customers}
                        brands={brands}
                        isHidden={true}
                    />
                )
            }
            {
                shareInvoice && (
                    <ShareModal
                        inv={shareInvoice}
                        onClose={() => setShareInvoice(null)}
                        onShare={handleShare}
                        onCopyLink={handleCopyLink}
                    />
                )
            }
            {
                confirmPayment && (
                    <PaymentConfirmationModal
                        inv={confirmPayment}
                        onClose={() => setConfirmPayment(null)}
                        onConfirm={handleConfirmPayment}
                    />
                )
            }
            {
                showDateModal && (
                    <DateRangeModal
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        dateCustomRange={dateCustomRange}
                        setDateCustomRange={setDateCustomRange}
                        onClose={() => setShowDateModal(false)}
                        modalRef={dateModalRef}
                    />
                )
            }


            {/* WhatsApp Button Removed */}

        </div >
    )
}

function DateRangeModal({ dateRange, setDateRange, onClose, dateCustomRange, setDateCustomRange, modalRef }) {
    const presets = [
        'All', 'Today', 'Yesterday', 'This Week',
        'Last Week', 'This Month', 'Last Month', 'Last 30 Days',
        'This Year', 'Last Year', 'Last Quarter',
        'FY 25-26', 'FY 24-25', 'FY 23-24', 'FY 22-23'
    ]

    const [isCustom, setIsCustom] = useState(dateRange === 'Custom Range')

    return createPortal(
        <div
            className="modal-overlay premium-modal-overlay"
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10002,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)'
            }}
        >
            <div
                className="modal-content date-range-modal premium-glass-modal"
                onClick={e => e.stopPropagation()}
                ref={modalRef}
                style={{
                    position: 'relative',
                    width: '560px',
                    maxWidth: '94vw',
                    padding: '0',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.4)',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <div className="modal-header" style={{ padding: '32px', background: 'transparent', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, textAlign: 'center' }}>Timeframe</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0', textAlign: 'center' }}>Select a preset or custom period</p>
                    <button
                        className="close-btn premium-close"
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'rgba(0,0,0,0.05)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '32px', boxSizing: 'border-box', width: '100%' }}>
                    <div className="presets-section" style={{ width: '100%' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '20px', textAlign: 'left' }}>Presets</label>
                        <div className="date-range-modal-grid" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                            {presets.map(p => (
                                <button
                                    key={p}
                                    className={`preset-btn-premium ${dateRange === p ? 'active' : ''}`}
                                    style={{ height: '44px', fontSize: '0.85rem', width: '100%', margin: 0, padding: '0 8px', whiteSpace: 'nowrap' }}
                                    onClick={() => {
                                        setDateRange(p)
                                        setIsCustom(false)
                                        onClose()
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="custom-range-section" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                background: isCustom ? 'rgba(99, 102, 241, 0.05)' : 'rgba(0,0,0,0.02)',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => setIsCustom(!isCustom)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: isCustom ? 'var(--color-primary)' : 'rgba(0,0,0,0.05)',
                                    color: isCustom ? 'white' : 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Calendar size={16} />
                                </div>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: isCustom ? 'var(--color-primary)' : 'var(--text-main)' }}>Custom Range</span>
                            </div>
                            <ChevronDown size={18} style={{ transform: isCustom ? 'rotate(180deg)' : 'none', transition: '0.3s', color: 'var(--text-muted)' }} />
                        </div>

                        {isCustom && (
                            <div style={{ marginTop: '20px', animation: 'slideDown 0.3s ease-out' }}>
                                <PremiumCalendar
                                    range={dateCustomRange}
                                    onSelect={setDateCustomRange}
                                    mode="range"
                                />

                                <button
                                    className="apply-custom-btn"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDateRange('Custom Range');
                                        onClose();
                                    }}
                                    style={{
                                        width: '100%',
                                        height: '48px',
                                        borderRadius: '12px',
                                        marginTop: '20px',
                                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                        boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)',
                                        border: 'none',
                                        color: 'white',
                                        fontWeight: 800,
                                        fontSize: '0.95rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    Apply Custom Range
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
