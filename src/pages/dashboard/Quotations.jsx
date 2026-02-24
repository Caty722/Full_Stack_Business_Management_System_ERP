import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDateDDMMYYYY, getNextInvoiceId } from '../../lib/utils'
import {
    FileText,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Eye,
    Download,
    RefreshCcw,
    Trash2,
    CheckCircle2,
    Clock,
    X,
    ClipboardList,
    TrendingUp,
    Send,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { useShop } from '../../context/ShopContext'
import QuotationBuilderModal from '../../components/QuotationBuilderModal'
import QuotationViewModal from '../../components/QuotationViewModal'
import { generateQuotationPdf } from '../../lib/pdfGenerator'
import { getPdfBlob } from '../../lib/pdfBlob'

// --- Share Modal ---
const ShareModal = ({ quotation, onClose, onShare, onCopyLink }) => {
    if (!quotation) return null
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content share-modal glass-card" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>Share Quotation {quotation.id}</h3>
                    <button className="close-btn" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                </div>
                <div className="share-options" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '24px 0' }}>
                    <button className="share-btn wa" onClick={() => onShare('whatsapp', quotation)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', borderRadius: '12px', background: 'rgba(37, 211, 102, 0.1)', color: '#25d366', border: '1px solid rgba(37, 211, 102, 0.2)', cursor: 'pointer' }}>
                        <span style={{ fontSize: '24px' }}>💬</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>WhatsApp</span>
                    </button>
                    <button className="share-btn em" onClick={() => onShare('email', quotation)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.2)', cursor: 'pointer' }}>
                        <span style={{ fontSize: '24px' }}>✉️</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Email</span>
                    </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                    Share professional quotes with your clients instantly.
                </p>
            </div>
        </div>
    )
}

export default function Quotations() {
    const navigate = useNavigate()
    const { invoices, quotations, customers, products, createQuotation, updateQuotation, deleteQuotation, createInvoice, brands } = useShop()
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [quotationMode, setQuotationMode] = useState('GST') // 'GST' or 'Non-GST'
    const [isCreating, setIsCreating] = useState(false)
    const [showBuilder, setShowBuilder] = useState(false)
    const [viewingQuotation, setViewingQuotation] = useState(null)
    const [editingQuotation, setEditingQuotation] = useState(null)
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
    const [shareQuotation, setShareQuotation] = useState(null)

    const [downloadingQuotation, setDownloadingQuotation] = useState(null)

    const handleDownloadPDF = async (quotation) => {
        setDownloadingQuotation(quotation)
        setIsGeneratingPDF(true)
        setTimeout(async () => {
            try {
                const blob = await getPdfBlob('invoice-capture-area', `Quotation_${quotation.id}.pdf`)
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `Quotation_${quotation.id}.pdf`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
            } catch (error) {
                console.error("PDF Download failed:", error)
                alert("Failed to download PDF.")
            } finally {
                setIsGeneratingPDF(false)
                setDownloadingQuotation(null)
            }
        }, 500)
    }

    const handleCopyLink = (q) => {
        // Obsoleted: public viewer not implemented.
    }

    const getShareText = (q) => {
        const total = Math.round(q.total || 0).toLocaleString('en-IN')
        return `Hello, here is your quotation ${q.id} from Ferwa.\n\nTotal: ₹${total}\n\nPlease find the attached PDF.`
    }

    const handleShare = async (type, q) => {
        // Set it as viewing so the capture area mounts
        setViewingQuotation(q)
        setShareQuotation(null) // Close share modal

        setTimeout(async () => {
            try {
                setIsGeneratingPDF(true)
                const text = getShareText(q)
                const blob = await getPdfBlob('invoice-capture-area', `Quotation_${q.id}.pdf`)
                const file = new File([blob], `Quotation_${q.id}.pdf`, { type: 'application/pdf' })

                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

                if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Quotation_${q.id}.pdf`,
                        text: text
                    })
                } else {
                    // Fallback for Desktop browsers that do not support sharing files natively (or where the OS share sheet lacks WhatsApp)
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `Quotation_${q.id}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)

                    alert("PDF generated and downloaded. Opening " + (type === 'whatsapp' ? 'WhatsApp' : 'Email') + ". Please attach the downloaded file manually.")

                    if (type === 'whatsapp') {
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                    } else if (type === 'email') {
                        window.open(`mailto:?subject=Quotation ${q.id} from Ferwa&body=${encodeURIComponent(text)}`, '_blank')
                    }
                }
            } catch (error) {
                console.error("PDF Share failed:", error)
                alert("Failed to generate PDF for sharing.")
            } finally {
                setIsGeneratingPDF(false)
                setViewingQuotation(null)
            }
        }, 500)
    }

    const gstQuotations = useMemo(() => quotations.filter(q => q.isGST !== false), [quotations])

    // Stats
    const stats = {
        total: gstQuotations.length,
        pending: gstQuotations.filter(q => q.status === 'Draft' || q.status === 'Sent').length,
        converted: gstQuotations.filter(q => q.status === 'Converted').length,
        totalValue: gstQuotations.reduce((sum, q) => sum + (q.total || 0), 0)
    }

    const filteredQuotations = quotations.filter(q => {
        const matchesMode = quotationMode === 'all' ? true : (quotationMode === 'GST' ? q.isGST !== false : q.isGST === false)
        const matchesSearch = q.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.id?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || q.status === statusFilter
        return matchesMode && matchesSearch && matchesStatus
    })

    // --- Pagination Logic ---
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter, gstQuotations])

    const totalPages = Math.max(1, Math.ceil(filteredQuotations.length / itemsPerPage))
    const paginatedQuotations = filteredQuotations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handleConvertToInvoice = async (quotation) => {
        if (!confirm('Convert this quotation to a Tax Invoice?')) return

        const customer = customers.find(c => c.name === quotation.customer)
        const isGST = customer?.isGST || false
        const prefix = isGST ? (brands?.GST?.prefix || 'GST') : (brands?.NON_GST?.prefix || 'INV')

        // Get next sequential number
        const nextNum = getNextInvoiceId(invoices, prefix)
        const billNumber = String(nextNum).padStart(3, '0')

        const invoiceData = {
            ...quotation,
            id: `${prefix}-${billNumber}`,
            status: 'Draft',
            fromQuotation: quotation.id,
            convertedAt: new Date().toISOString()
        }

        await createInvoice(invoiceData)
        await updateQuotation(quotation.id, { status: 'Converted' })

        // Navigate to dedicated Invoice Builder page instead of local Billing modal
        navigate('/admin/billing/new', { state: { invoice: invoiceData } })
    }

    return (
        <div className="quotations-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Quotations & Estimates</h1>
                    <p className="page-subtitle">Send professional estimates and convert them to invoices instantly.</p>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* Toggle Removed as requested */}
                    <button className="btn btn-primary" onClick={() => { setEditingQuotation(null); setShowBuilder(true) }}>
                        <Plus size={18} /> <span>New Quotation</span>
                    </button>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-glow purple"></div>
                    <div className="stat-icon purple"><FileText size={24} /></div>
                    <div className="stat-content">
                        <p className="stat-label">All Quotes</p>
                        <h3 className="stat-value">{stats.total}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-glow orange"></div>
                    <div className="stat-icon orange"><Clock size={24} /></div>
                    <div className="stat-content">
                        <p className="stat-label">Pending Approval</p>
                        <h3 className="stat-value">{stats.pending}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-glow green"></div>
                    <div className="stat-icon green"><TrendingUp size={24} /></div>
                    <div className="stat-content">
                        <p className="stat-label">Conversion Rate</p>
                        <h3 className="stat-value">{stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0}%</h3>
                    </div>
                </div>
            </div>

            <div className="card glass-card">
                <div className="filters-bar">
                    <div className="standard-search-wrapper">
                        <Search size={20} className="standard-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by ID or customer..."
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
                        <div className="status-filter-toggle">
                            {['all', 'Draft', 'Sent', 'Converted', 'Expired'].map(status => (
                                <button
                                    key={status}
                                    className={`status-btn ${statusFilter === status ? 'active' : ''}`}
                                    onClick={() => setStatusFilter(status)}
                                >
                                    {status === 'all' ? 'All Status' : status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <table className="quotations-table">
                        <thead>
                            <tr>
                                <th>Quote ID</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedQuotations.map((q, idx) => (
                                <tr key={q.id} className="staggered-row">
                                    <td><span className="id-badge">{q.id}</span></td>
                                    <td>
                                        <div className="customer-cell">
                                            <div className="customer-name">{q.customer}</div>
                                        </div>
                                    </td>
                                    <td>{formatDateDDMMYYYY(q.date)}</td>
                                    <td className="font-bold">₹{Math.round(q.total || 0).toLocaleString('en-IN')}</td>
                                    <td>
                                        <span className={`status-pill ${q.status?.toLowerCase()}`}>
                                            {q.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            {q.status !== 'Converted' && (
                                                <button
                                                    className="action-btn convert"
                                                    title="Convert to Invoice"
                                                    onClick={() => handleConvertToInvoice(q)}
                                                >
                                                    <RefreshCcw size={14} />
                                                </button>
                                            )}
                                            {q.status !== 'Converted' && (
                                                <button
                                                    className="action-btn edit"
                                                    title="Edit Quotation"
                                                    onClick={() => { setEditingQuotation(q); setShowBuilder(true) }}
                                                >
                                                    <Edit size={14} />
                                                </button>
                                            )}
                                            <button className="action-btn view" title="View PDF" onClick={() => setViewingQuotation(q)}>
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                className="action-btn send"
                                                title="Download PDF"
                                                onClick={() => handleDownloadPDF(q)}
                                            >
                                                <Download size={14} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to delete this quotation?')) {
                                                        deleteQuotation(q.id)
                                                    }
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedQuotations.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="empty-state">
                                        <div className="empty-content">
                                            <ClipboardList size={48} className="text-muted" />
                                            <h3>No quotations found</h3>
                                            <p>Create your first estimate to get started.</p>
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

            {/* Modals */}
            {showBuilder && (
                <QuotationBuilderModal
                    isOpen={showBuilder}
                    onClose={() => { setShowBuilder(false); setEditingQuotation(null) }}
                    quotation={editingQuotation}
                    mode={quotationMode}
                />
            )}

            {viewingQuotation && (
                <QuotationViewModal
                    quotation={viewingQuotation}
                    onClose={() => setViewingQuotation(null)}
                    products={products}
                    customers={customers}
                    onDownloadPDF={handleDownloadPDF}
                    isGeneratingPDF={isGeneratingPDF}
                    brands={brands}
                />
            )}

            {shareQuotation && (
                <ShareModal
                    quotation={shareQuotation}
                    onClose={() => setShareQuotation(null)}
                    onShare={handleShare}
                    onCopyLink={handleCopyLink}
                />
            )}

            {downloadingQuotation && (
                <QuotationViewModal
                    quotation={downloadingQuotation}
                    onClose={() => setDownloadingQuotation(null)}
                    products={products}
                    customers={customers}
                    brands={brands}
                    isHidden={true}
                />
            )}

            <style>{`
                .quotations-page { 
                    animation: fadeIn 0.4s ease-out; 
                    padding: 0 2rem 2rem 2rem;
                    max-width: 1440px;
                    margin: 0 auto;
                }
                .page-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: flex-start; 
                    margin-bottom: 1.5rem; 
                }
                .page-title { font-size: 2.25rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.02em; }
                .page-subtitle { color: var(--text-muted); font-size: 0.95rem; }

                .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
                .stat-card { background: var(--bg-surface); padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 1.25rem; }
                .stat-icon { width: 54px; height: 54px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .stat-icon.purple { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
                .stat-icon.orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }
                .stat-icon.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }

                .id-badge { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; background: var(--bg-body); padding: 4px 8px; border-radius: 6px; color: var(--text-main); font-weight: 600; }
                
                .status-pill { padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
                .status-pill.draft { background: rgba(156, 163, 175, 0.1); color: #9ca3af; }
                .status-pill.sent { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .status-pill.converted { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .status-pill.expired { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

                .actions-cell { display: flex; justify-content: flex-end; gap: 8px; }
                .action-btn { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-muted); transition: 0.2s; cursor: pointer; }
                .action-btn:hover { background: var(--bg-body); color: var(--text-main); transform: translateY(-2px); }
                .action-btn.convert:hover { background: #6366f1; color: white; border-color: #6366f1; }
                .action-btn.send { color: #6366f1; }
                .action-btn.send:hover { background: #6366f1; color: white; border-color: #6366f1; }
                .action-btn.delete:hover { background: #ef4444; color: white; border-color: #ef4444; }

                .share-modal { border: 1px solid var(--border-color); animation: modalScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
                @keyframes modalScale { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .share-btn { transition: all 0.2s ease; }
                .share-btn:hover { transform: translateY(-4px); filter: brightness(1.1); box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
                .share-btn:active { transform: translateY(0); }

                .premium-select { padding: 8px 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-main); font-size: 0.9rem; font-weight: 600; outline: none; cursor: pointer; }

                .status-filter-toggle {
                    display: flex;
                    background: var(--bg-body);
                    padding: 4px;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                    gap: 4px;
                }
                .status-btn {
                    padding: 6px 14px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    border: none;
                    background: transparent;
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: 0.2s;
                    white-space: nowrap;
                }
                .status-btn:hover {
                    color: var(--text-main);
                    background: var(--bg-subtle);
                }
                .status-btn.active {
                    background: var(--bg-surface);
                    color: #6366f1;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
                }

                @media (max-width: 768px) {
                    .stats-grid { grid-template-columns: 1fr; }
                    .quotations-table th:nth-child(3), .quotations-table td:nth-child(3) { display: none; }
                }
            `}</style>
        </div>
    )
}
