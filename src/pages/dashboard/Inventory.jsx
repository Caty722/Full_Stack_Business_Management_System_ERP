import { useState, useMemo, useEffect } from 'react'
import {
    Package,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    Plus,
    Minus,
    Search,
    Filter,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Trash2,
    Clock,
    Activity,
    AlertTriangle,
    BarChart3,
    ArrowRight,
    Sliders,
    X,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { useShop } from '../../context/ShopContext'
import { formatDateDDMMYYYY } from '../../lib/utils'

const StockStatusPill = ({ status }) => {
    const config = {
        safe: { label: 'Healthy', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
        warning: { label: 'Low Stock', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
        critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
    }
    const { label, color, bg } = config[status] || config.safe
    return (
        <span className="status-pill" style={{ color, background: bg }}>
            <div className="status-dot" style={{ backgroundColor: color }}></div>
            {label}
        </span>
    )
}

export default function Inventory() {
    const { products, stockLogs, addStockLogEntry } = useShop()
    const [activeTab, setActiveTab] = useState('management') // 'management' or 'logs'
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all') // logs filter
    const [isAdjusting, setIsAdjusting] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [adjustmentData, setAdjustmentData] = useState({
        quantity: '',
        type: 'in',
        reason: '',
        notes: ''
    })

    const getStockStatus = (product) => {
        const stock = product.stock || 0
        const capacity = product.totalStock || Math.max(stock, 0) || 100
        const threshold = product.alertThreshold || 25

        if (stock <= 0) return 'critical'
        const pct = (stock / capacity) * 100
        if (pct < threshold / 2) return 'critical'
        if (pct <= threshold) return 'warning'
        return 'safe'
    }

    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.gstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => {
            // Sort by health status (Critical first, then Warning, then Safe)
            const statusOrder = { critical: 0, warning: 1, safe: 2 }
            const statusA = getStockStatus(a)
            const statusB = getStockStatus(b)
            if (statusA !== statusB) return statusOrder[statusA] - statusOrder[statusB]
            return (a.stock / (a.totalStock || 1)) - (b.stock / (b.totalStock || 1))
        })
    }, [products, searchTerm])

    const filteredLogs = useMemo(() => {
        return stockLogs.filter(log => {
            const matchesSearch = log.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.reason?.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesType = filterType === 'all' || log.type === filterType
            return matchesSearch && matchesType
        })
    }, [stockLogs, searchTerm, filterType])

    const stats = useMemo(() => {
        const criticalCount = products.filter(p => getStockStatus(p) === 'critical').length
        const warningCount = products.filter(p => getStockStatus(p) === 'warning').length
        const totalItems = products.reduce((sum, p) => sum + (p.stock || 0), 0)

        return {
            critical: criticalCount,
            warning: warningCount,
            total: totalItems,
            movements: stockLogs.length
        }
    }, [products, stockLogs])

    // --- Pagination Logic ---
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    useEffect(() => {
        setCurrentPage(1)
    }, [activeTab, searchTerm, filterType, products, stockLogs])

    const activeList = activeTab === 'management' ? filteredProducts : filteredLogs
    const totalPages = Math.max(1, Math.ceil(activeList.length / itemsPerPage))

    const paginatedProducts = activeTab === 'management'
        ? filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        : []
    const paginatedLogs = activeTab === 'logs'
        ? filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        : []

    const handleQuickAdjust = (product) => {
        setSelectedProduct(product)
        setAdjustmentData({
            quantity: '',
            type: 'in',
            reason: '',
            notes: ''
        })
        setIsAdjusting(true)
    }

    const handleSubmitAdjustment = async (e) => {
        e.preventDefault()
        if (!selectedProduct || !adjustmentData.quantity) return

        await addStockLogEntry({
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: Number(adjustmentData.quantity),
            type: adjustmentData.type,
            reason: adjustmentData.reason || 'Manual Adjustment',
            notes: adjustmentData.notes
        })

        setIsAdjusting(false)
        setSelectedProduct(null)
    }

    return (
        <div className="inventory-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Inventory Master</h1>
                    <p className="page-subtitle">Real-time stock monitoring and professional movement journals.</p>
                </div>
                <div className="header-actions">
                    <div className="standard-tabs-wrapper" style={{ minWidth: '320px' }}>
                        <div
                            className="standard-tabs-indicator"
                            style={{
                                width: 'calc(50% - 4px)',
                                left: activeTab === 'management' ? '4px' : 'calc(50%)'
                            }}
                        ></div>
                        <button
                            className={`standard-tabs-btn ${activeTab === 'management' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('management'); setSearchTerm(''); }}
                        >
                            <BarChart3 size={18} />
                            <span>Stock Levels</span>
                        </button>
                        <button
                            className={`standard-tabs-btn ${activeTab === 'logs' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('logs'); setSearchTerm(''); }}
                        >
                            <History size={18} />
                            <span>Movement History</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-glow purple"></div>
                    <div className="stat-icon purple"><Package size={24} /></div>
                    <div className="stat-content">
                        <p className="stat-label">Total Inventory</p>
                        <h3 className="stat-value">{stats.total.toLocaleString()} <span className="text-sm font-normal text-muted">Units</span></h3>
                    </div>
                </div>
                <div className={`stat-card ${stats.critical > 0 ? 'critical-glow' : ''}`}>
                    <div className={`stat-glow ${stats.critical > 0 ? 'red' : 'green'}`}></div>
                    <div className={`stat-icon ${stats.critical > 0 ? 'red' : 'green'}`}>
                        {stats.critical > 0 ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Stock Alerts</p>
                        <h3 className="stat-value">
                            {stats.critical > 0 ? `${stats.critical} Critical` : 'All Healthy'}
                            {stats.warning > 0 && <span className="warning-sub">+{stats.warning} Low</span>}
                        </h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-glow blue"></div>
                    <div className="stat-icon blue"><Activity size={24} /></div>
                    <div className="stat-content">
                        <p className="stat-label">Recent Activity</p>
                        <h3 className="stat-value">{stats.movements} <span className="text-sm font-normal text-muted">Logs</span></h3>
                    </div>
                </div>
            </div>

            <div className="card inventory-container glass-card">
                <div className="filters-bar">
                    <div className="standard-search-wrapper">
                        <Search size={20} className="standard-search-icon" />
                        <input
                            type="text"
                            placeholder={activeTab === 'management' ? "Search products..." : "Search logs by product or reason..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="search-clear-btn" onClick={() => setSearchTerm('')}>
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {activeTab === 'logs' && (
                        <div className="filters-right">
                            <div className="standard-tabs-inline">
                                {['all', 'in', 'out'].map(t => (
                                    <button
                                        key={t}
                                        className={`tab-btn ${filterType === t ? 'active' : ''}`}
                                        onClick={() => setFilterType(t)}
                                    >
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="table-responsive">
                    {activeTab === 'management' ? (
                        <table className="inventory-table management">
                            <thead>
                                <tr>
                                    <th>Product Details</th>
                                    <th>Inventory Status</th>
                                    <th>Stock Unit</th>
                                    <th>Stock Level</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedProducts.map((p, idx) => {
                                    const status = getStockStatus(p)
                                    const capacity = p.totalStock || Math.max(p.stock, 0) || 100
                                    const stockPct = Math.max(0, Math.min(100, (p.stock / capacity) * 100))

                                    return (
                                        <tr key={p.id} className="staggered-row" style={{ animationDelay: `${idx * 0.03}s` }}>
                                            <td>
                                                <div className="product-info-cell">
                                                    <div className={`product-avatar ${status}`}>
                                                        {p.name.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="product-name">
                                                            {p.gstName ? (
                                                                <>
                                                                    <div>{p.name}</div>
                                                                    <div style={{ color: '#6366f1', fontSize: '0.7rem', opacity: 0.8, fontWeight: 500 }}>GST: {p.gstName}</div>
                                                                </>
                                                            ) : (
                                                                p.name
                                                            )}
                                                        </div>
                                                        <div className="product-sku">{p.sku || 'No SKU'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <StockStatusPill status={status} />
                                            </td>
                                            <td>
                                                <div className="unit-badge">{p.unit || 'Units'}</div>
                                            </td>
                                            <td>
                                                <div className="stock-level-cell">
                                                    <div className="stock-count-row">
                                                        <span className={`count ${status}`}>{p.stock || 0}</span>
                                                        <span className="capacity">/ {capacity}</span>
                                                    </div>
                                                    <div className="progress-bar-bg">
                                                        <div
                                                            className={`progress-fill ${status}`}
                                                            style={{ width: `${stockPct}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="actions-cell">
                                                    <button
                                                        className="quick-adjust-icon-btn"
                                                        title="Quick Adjust Stock"
                                                        onClick={() => handleQuickAdjust(p)}
                                                    >
                                                        <Sliders size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <table className="inventory-table logs">
                            <thead>
                                <tr>
                                    <th>Date & Time</th>
                                    <th>Product</th>
                                    <th>Type</th>
                                    <th>Quantity</th>
                                    <th>Reason / Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedLogs.map((log, idx) => (
                                    <tr key={log.id} style={{ animationDelay: `${idx * 0.03}s` }} className="staggered-row">
                                        <td>
                                            <div className="date-cell">
                                                <div className="main-date">{formatDateDDMMYYYY(log.timestamp)}</div>
                                                <div className="time-sub text-muted">
                                                    <Clock size={12} /> {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="product-info-cell">
                                                <div className="product-name">
                                                    {(() => {
                                                        const p = products.find(prod => String(prod.id) === String(log.productId))
                                                        if (p?.gstName) {
                                                            return (
                                                                <>
                                                                    <div>{log.productName}</div>
                                                                    <div style={{ color: '#6366f1', fontSize: '0.7rem', opacity: 0.8, fontWeight: 500 }}>GST: {p.gstName}</div>
                                                                </>
                                                            )
                                                        }
                                                        return log.productName
                                                    })()}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`type-pill ${log.type}`}>
                                                {log.type === 'in' ? <Plus size={12} /> : <Minus size={12} />}
                                                {log.type === 'in' ? 'Stock In' : 'Stock Out'}
                                            </span>
                                        </td>
                                        <td className={`qty-cell ${log.type}`}>
                                            {log.type === 'in' ? '+' : '-'}{log.quantity}
                                        </td>
                                        <td>
                                            <div className="reason-cell">
                                                <div className="reason-text">{log.reason || 'N/A'}</div>
                                                {log.notes && <div className="notes-text text-muted">{log.notes}</div>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="sales-footer" style={{ marginTop: '1rem' }}>
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

            {/* Adjust Stock Modal */}
            {isAdjusting && (
                <div className="modal-overlay" onClick={() => setIsAdjusting(false)}>
                    <div className="adjustment-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-modern">
                            <div>
                                <h3 className="modal-title-bold">Stock Adjustment</h3>
                                <p className="text-sm text-muted mt-1">Currently: <span className="text-main font-bold">{selectedProduct?.stock} {selectedProduct?.unit}</span></p>
                            </div>
                            <button className="icon-btn-close" onClick={() => setIsAdjusting(false)}>
                                <Plus size={22} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitAdjustment} className="adjustment-form-modern">
                            <div className="product-display modern-pulse">
                                <div className="product-avatar">{selectedProduct?.name?.slice(0, 2).toUpperCase()}</div>
                                <div className="info">
                                    <div className="name">
                                        {selectedProduct?.gstName ? (
                                            <>
                                                <div>{selectedProduct.name}</div>
                                                <div style={{ color: '#6366f1', fontSize: '0.85rem', opacity: 0.8 }}>GST: {selectedProduct.gstName}</div>
                                            </>
                                        ) : (
                                            selectedProduct?.name
                                        )}
                                    </div>
                                    <div className="sku">{selectedProduct?.sku || 'No SKU'}</div>
                                </div>
                            </div>

                            <div className="type-selector-modern">
                                <button
                                    type="button"
                                    className={`type-btn in ${adjustmentData.type === 'in' ? 'active' : ''}`}
                                    onClick={() => setAdjustmentData({ ...adjustmentData, type: 'in' })}
                                >
                                    <Plus size={18} /> Stock In
                                </button>
                                <button
                                    type="button"
                                    className={`type-btn out ${adjustmentData.type === 'out' ? 'active' : ''}`}
                                    onClick={() => setAdjustmentData({ ...adjustmentData, type: 'out' })}
                                >
                                    <Minus size={18} /> Stock Out
                                </button>
                            </div>

                            <div className="form-group-modern">
                                <label>Quantity to {adjustmentData.type === 'in' ? 'Add' : 'Remove'}</label>
                                <div className="qty-input-wrapper-modern">
                                    <input
                                        type="number"
                                        className="big-qty-modern"
                                        placeholder="0"
                                        value={adjustmentData.quantity}
                                        onChange={e => setAdjustmentData({ ...adjustmentData, quantity: e.target.value })}
                                        autoFocus
                                        required
                                    />
                                    <span className="unit-label-modern">{selectedProduct?.unit}</span>
                                </div>
                            </div>

                            <div className="form-group-modern">
                                <label>Adjustment Reason</label>
                                <div className="select-wrapper-modern">
                                    <select
                                        className="modern-select"
                                        value={adjustmentData.reason}
                                        onChange={e => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Reason...</option>
                                        <option value="New Stock Arrival">New Stock Arrival</option>
                                        <option value="Inventory Correction">Inventory Correction</option>
                                        <option value="Damaged/Expired">Damaged / Expired</option>
                                        <option value="Return to Supplier">Return to Supplier</option>
                                        <option value="Sample / Internal Use">Sample / Internal Use</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </div>
                            </div>

                            {adjustmentData.reason === 'Others' && (
                                <div className="form-group-modern">
                                    <textarea
                                        className="modern-textarea"
                                        placeholder="Explain reason..."
                                        value={adjustmentData.notes}
                                        onChange={e => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            <div className="modal-footer-modern">
                                <button type="button" className="btn-cancel-modern" onClick={() => setIsAdjusting(false)}>Cancel</button>
                                <button
                                    type="submit"
                                    className={`btn-confirm-modern ${adjustmentData.type === 'out' ? 'danger' : 'success'}`}
                                >
                                    Confirm Adjustment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .inventory-page { 
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

                .header-tabs { display: flex; background: var(--bg-surface); padding: 4px; border-radius: 12px; border: 1px solid var(--border-color); }
                .header-tab { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; color: var(--text-muted); transition: 0.2s; }
                .header-tab:hover { color: var(--text-main); background: var(--bg-body); }
                .header-tab.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25); }

                .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
                .stat-card { background: var(--bg-surface); padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 1.25rem; position: relative; overflow: hidden; }
                .stat-icon { width: 54px; height: 54px; border-radius: 12px; display: flex; align-items: center; justify-content: center; z-index: 1; }
                .stat-icon.purple { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
                .stat-icon.red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .stat-icon.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .stat-icon.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                
                .stat-glow.red { background: #ef4444; }
                .stat-glow.blue { background: #3b82f6; }
                .critical-glow { border-color: rgba(239, 68, 68, 0.3); }
                .warning-sub { font-size: 0.8rem; font-weight: 500; color: #f59e0b; margin-left: 8px; }

                .inventory-container { padding: 1.5rem; border-radius: 16px; }
                .filters-bar { display: flex; justify-content: space-between; margin-bottom: 1.5rem; gap: 1rem; }

                .inventory-table { width: 100%; border-collapse: collapse; }
                .inventory-table th { text-align: left; padding: 1rem; font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--border-color); }
                .inventory-table td { padding: 1rem; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
                
                .product-info-cell { display: flex; align-items: center; gap: 1rem; }
                .product-avatar { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; background: var(--bg-body); border: 1px solid var(--border-color); }
                .product-avatar.safe { border-color: rgba(16, 185, 129, 0.3); color: #10b981; background: rgba(16, 185, 129, 0.05); }
                .product-avatar.warning { border-color: rgba(245, 158, 11, 0.3); color: #f59e0b; background: rgba(245, 158, 11, 0.05); }
                .product-avatar.critical { border-color: rgba(239, 68, 68, 0.3); color: #ef4444; background: rgba(239, 68, 68, 0.05); }
                .product-avatar.mini { width: 32px; height: 32px; font-size: 0.7rem; border-radius: 8px; }

                .product-name { font-weight: 700; color: var(--text-main); font-size: 0.95rem; }
                .product-sku { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }

                .status-pill { display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; white-space: nowrap; }
                .status-dot { width: 6px; height: 6px; border-radius: 50%; }

                .unit-badge { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); background: var(--bg-body); padding: 4px 10px; border-radius: 6px; display: inline-block; }

                .stock-level-cell { min-width: 140px; }
                .stock-count-row { display: flex; align-items: baseline; gap: 4px; margin-bottom: 6px; font-family: 'JetBrains Mono', monospace; }
                .stock-count-row .count { font-size: 1.1rem; font-weight: 800; }
                .stock-count-row .count.safe { color: #10b981; }
                .stock-count-row .count.warning { color: #f59e0b; }
                .stock-count-row .count.critical { color: #ef4444; }
                .stock-count-row .capacity { font-size: 0.8rem; color: var(--text-muted); }

                .progress-bar-bg { width: 100%; height: 6px; background: var(--bg-body); border-radius: 10px; overflow: hidden; }
                .progress-fill { height: 100%; border-radius: 10px; transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
                .progress-fill.safe { background: #10b981; }
                .progress-fill.warning { background: #f59e0b; }
                .progress-fill.critical { background: #ef4444; }

                .actions-cell { display: flex; justify-content: flex-end; }
                .quick-adjust-icon-btn {
                    width: 38px; height: 38px; border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(99, 102, 241, 0.08); color: var(--primary); border: 1.5px solid transparent;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer;
                }
                .quick-adjust-icon-btn:hover {
                    background: var(--primary); color: white; transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3); border-color: rgba(99, 102, 241, 0.5);
                }

                /* Logs Table Specifics */
                .type-pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
                .type-pill.in { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .type-pill.out { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .qty-cell { font-weight: 700; font-family: 'JetBrains Mono', monospace; }
                .qty-cell.in { color: #10b981; }
                .qty-cell.out { color: #ef4444; }

                /* Adjustment Form Modern UI */
                @keyframes modalSlideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .adjustment-modal-card {
                    background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 24px;
                    width: 100%; max-width: 440px; padding: 2rem; box-shadow: var(--shadow-xl);
                    animation: modalSlideUp 0.3s cubic-bezier(0.19, 1, 0.22, 1);
                }
                .modal-header-modern { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
                .modal-title-bold { font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -0.02em; }
                .icon-btn-close {
                    background: var(--bg-body); border: 1px solid var(--border-color); color: var(--text-muted);
                    width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: 0.2s;
                }
                .icon-btn-close:hover { background: var(--bg-surface); color: var(--text-main); transform: scale(1.05); }

                .adjustment-form-modern { display: flex; flex-direction: column; gap: 1.5rem; }
                
                .product-display.modern-pulse {
                    display: flex; align-items: center; gap: 16px; background: var(--bg-body);
                    padding: 16px; border-radius: 16px; border: 1.5px solid var(--border-color);
                }
                .product-display .name { font-weight: 800; color: var(--text-main); font-size: 1.1rem; }
                .product-display .sku { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }

                .type-selector-modern { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .type-selector-modern .type-btn {
                    padding: 14px; border-radius: 16px; border: 2px solid transparent; background: var(--bg-body);
                    color: var(--text-muted); font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; font-size: 1rem;
                }
                .type-selector-modern .type-btn:hover { background: var(--bg-surface); border-color: var(--border-color); }
                .type-selector-modern .type-btn.active.in { background: rgba(16, 185, 129, 0.1); border-color: #10b981; color: #10b981; }
                .type-selector-modern .type-btn.active.out { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; color: #ef4444; }

                .form-group-modern label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em; }
                .qty-input-wrapper-modern { position: relative; display: flex; align-items: center; }
                .big-qty-modern {
                    width: 100%; background: var(--bg-body) !important; border: 2px solid var(--border-color) !important;
                    border-radius: 16px; font-size: 1.8rem !important; font-weight: 900 !important; color: var(--text-main) !important;
                    text-align: center; padding: 1.25rem !important; transition: 0.2s; outline: none;
                    -moz-appearance: textfield;
                }
                .big-qty-modern::-webkit-outer-spin-button,
                .big-qty-modern::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .big-qty-modern:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important; }
                .unit-label-modern { position: absolute; right: 20px; font-weight: 800; color: var(--text-muted); font-size: 1.1rem; }

                .modern-select {
                    width: 100%; background: var(--bg-body) !important; border: 2px solid var(--border-color) !important;
                    border-radius: 14px; font-size: 1rem !important; font-weight: 700 !important; color: var(--text-main) !important;
                    padding: 1rem 1.25rem !important; outline: none; appearance: none; transition: 0.2s; cursor: pointer;
                }
                .modern-select:focus { border-color: var(--primary) !important; }
                .select-wrapper-modern { position: relative; }
                .select-wrapper-modern::after {
                    content: '▼'; position: absolute; right: 20px; top: 50%; transform: translateY(-50%);
                    pointer-events: none; font-size: 0.7rem; color: var(--text-muted);
                }

                .modern-textarea {
                    width: 100%; background: var(--bg-body) !important; border: 2px solid var(--border-color) !important;
                    border-radius: 14px; font-size: 0.95rem !important; font-weight: 600 !important; color: var(--text-main) !important;
                    padding: 1rem 1.25rem !important; outline: none; transition: 0.2s; min-height: 100px; resize: vertical;
                }
                .modern-textarea:focus { border-color: var(--primary) !important; }

                .modal-footer-modern { display: flex; gap: 12px; margin-top: 1rem; }
                .btn-cancel-modern {
                    flex: 1; padding: 16px; border-radius: 16px; background: var(--bg-body); border: 2px solid var(--border-color);
                    color: var(--text-main); font-weight: 800; font-size: 1rem; cursor: pointer; transition: 0.2s;
                }
                .btn-cancel-modern:hover { background: var(--bg-surface); border-color: var(--text-muted); }
                .btn-confirm-modern {
                    flex: 2; padding: 16px; border-radius: 16px; border: none; font-weight: 800; font-size: 1rem; color: white;
                    cursor: pointer; transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1); box-shadow: var(--shadow-md);
                }
                .btn-confirm-modern.success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
                .btn-confirm-modern.danger { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
                .btn-confirm-modern:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); filter: brightness(1.1); }

                @media (max-width: 992px) {
                    .inventory-table th:nth-child(3), .inventory-table td:nth-child(3) { display: none; }
                }

                @media (max-width: 768px) {
                    .stats-grid { grid-template-columns: 1fr; }
                    .page-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
                    .header-tabs { width: 100%; }
                    .header-tab { flex: 1; justify-content: center; padding: 10px; font-size: 0.8rem; }
                    .inventory-table th:nth-child(2), .inventory-table td:nth-child(2) { display: none; }
                    .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0 -1rem; padding: 0 1rem; width: calc(100% + 2rem); }
                    .inventory-table { min-width: 600px; }
                    .adjustment-modal-card { width: 100%; height: 100%; border-radius: 0; max-width: none; overflow-y: auto; padding: 1.5rem; }
                    .modal-title-bold { font-size: 1.25rem; }
                    .big-qty-modern { font-size: 1.5rem !important; padding: 1rem !important; }
                    .type-selector-modern .type-btn { padding: 12px; font-size: 0.9rem; }
                    .modal-footer-modern { flex-direction: column; }
                    .btn-confirm-modern { order: -1; width: 100%; }
                    .btn-cancel-modern { width: 100%; }
                }
            `}</style>
        </div>
    )
}
