import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Search, Filter, Package, AlertTriangle, IndianRupee, MoreVertical, Edit2, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useShop } from '../../context/ShopContext'
import ProductModal from '../../components/ProductModal'

export default function Products({ isAdmin }) {
    const { products, addProduct } = useShop()
    const [filterMode, setFilterMode] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [brandType, setBrandType] = useState('all') // 'all', 'GST', 'Non-GST'
    const [showFilterMenu, setShowFilterMenu] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [selectedIds, setSelectedIds] = useState([])
    const { updateProduct, deleteProduct, bulkDeleteProducts } = useShop()
    const location = useLocation()

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const q = params.get('q')
        if (q) {
            setSearchTerm(decodeURIComponent(q))
        }
        if (location.state?.filter) {
            setFilterMode(location.state.filter)
        }
    }, [location.search, location.state])

    const filteredProducts = products.filter(p => {
        // Search filter
        const matchesSearch =
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.gstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        // Status filter
        if (filterMode === 'low_stock') {
            const threshold = p.alertThreshold || 25;
            const capacity = p.totalStock || Math.max(p.stock, 0) || 100;
            const pct = (p.stock / capacity) * 100;
            if (pct > threshold) return false;
        }

        // Brand filter
        const matchesBrand = brandType === 'all' ? true : brandType === 'GST' ? p.isGST : !p.isGST;
        if (!matchesBrand) return false;

        return true;
    })

    // --- Pagination Logic ---
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, filterMode, brandType, products])

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handleExportCSV = () => {
        const headers = ["Name", "SKU", "Price", "Stock", "Unit"]
        const csvContent = [
            headers.join(","),
            ...filteredProducts.map(p => [
                `"${p.name}"`,
                `"${p.sku}"`,
                p.price,
                p.stock,
                `"${p.unit || 'Pcs'}"`
            ].join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `inventory_export_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const lowStockProducts = products.filter(p => {
        const threshold = p.alertThreshold || 25;
        const capacity = p.totalStock || Math.max(p.stock, 0) || 100;
        return (p.stock / capacity) * 100 <= threshold;
    });

    const stats = {
        totalItems: products.length,
        lowStock: lowStockProducts.length,
        totalValue: products.reduce((sum, p) => sum + (p.price * Math.max(0, p.stock)), 0)
    }

    // Dynamic Counts for Toggle switch (Filters based on Stat Card)
    const baseProductsForToggle = filterMode === 'low_stock' ? lowStockProducts : products;
    const toggleCounts = {
        all: baseProductsForToggle.length,
        gst: baseProductsForToggle.filter(p => p.isGST).length,
        nongst: baseProductsForToggle.filter(p => !p.isGST).length
    };


    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    const getStockStatus = (stock, capacity, threshold = 25) => {
        if (stock <= 0) return 'critical'
        const pct = (stock / capacity) * 100
        if (pct < threshold / 2) return 'critical'
        if (pct <= threshold) return 'warning'
        return 'safe'
    }

    return (
        <div className="products-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{isAdmin ? "Product Master" : "Products Catalogue"}</h1>
                    <p className="page-subtitle">Manage your inventory, stock levels, and product catalogue efficiently.</p>
                </div>
                {isAdmin && (
                    <div className="header-actions">
                        <div className="standard-tabs-wrapper" style={{ minWidth: '240px' }}>
                            <div
                                className="standard-tabs-indicator"
                                style={{
                                    width: `calc((100% - 8px) / 3)`,
                                    left: `calc(4px + ((${brandType === 'Non-GST' ? 2 : brandType === 'GST' ? 1 : 0}) * (100% - 8px) / 3))`
                                }}
                            ></div>
                            <button
                                className={`standard-tabs-btn ${brandType === 'all' ? 'active' : ''}`}
                                onClick={() => setBrandType('all')}
                            >All <span className="tab-count">{toggleCounts.all}</span></button>
                            <button
                                className={`standard-tabs-btn ${brandType === 'GST' ? 'active' : ''}`}
                                onClick={() => setBrandType('GST')}
                            >GST <span className="tab-count">{toggleCounts.gst}</span></button>
                            <button
                                className={`standard-tabs-btn ${brandType === 'Non-GST' ? 'active' : ''}`}
                                onClick={() => setBrandType('Non-GST')}
                            >Non-GST <span className="tab-count">{toggleCounts.nongst}</span></button>
                        </div>
                        <button className="btn btn-outline export-btn" onClick={() => handleExportCSV()}>
                            <span>Export CSV</span>
                        </button>
                        <button className="btn btn-primary add-product-btn" onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}>
                            <Plus size={18} /> <span>Add Product</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Overview */}
            <div className="stats-grid">
                <div
                    className={`stat-card clickable ${filterMode === 'all' ? 'active' : ''}`}
                    onClick={() => { setFilterMode('all'); setBrandType('all'); }}
                >
                    <div className="stat-glow purple"></div>
                    <div className="stat-icon purple"><Package size={24} /></div>
                    <div className="stat-content">
                        <p className="stat-label">Total Inventory</p>
                        <h3 className="stat-value">{stats.totalItems} Items</h3>
                    </div>
                </div>
                <div
                    className={`stat-card clickable ${filterMode === 'low_stock' ? 'active alert' : ''}`}
                    onClick={() => { setFilterMode('low_stock'); setBrandType('all'); }}
                >
                    <div className="stat-glow orange"></div>
                    <div className="stat-icon orange"><AlertTriangle size={24} /></div>
                    <div className="stat-content">
                        <p className="stat-label">Low Stock Alert</p>
                        <h3 className="stat-value">{stats.lowStock} Items {filterMode === 'low_stock' && '🔥'}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-glow green"></div>
                    <div className="stat-icon green"><IndianRupee size={24} /></div>
                    <div className="stat-content">
                        <p className="stat-label">Total Stock Value</p>
                        <h3 className="stat-value">₹{stats.totalValue.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            <div className="card products-card glass-card">
                <div className="filters-bar">
                    <div className="standard-search-wrapper">
                        <Search size={20} className="standard-search-icon" />
                        <input
                            type="text"
                            placeholder="Search products..."
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
                        {filterMode !== 'all' && (
                            <button className="clear-filter-pill" onClick={() => { setFilterMode('all'); }}>
                                <span>Clear Filters</span>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="table-container">
                    <table className="products-table">
                        <thead>
                            <tr>
                                {isAdmin && (
                                    <th style={{ width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedIds(filteredProducts.map(p => p.id))
                                                else setSelectedIds([])
                                            }}
                                        />
                                    </th>
                                )}
                                <th>Product Name</th>
                                <th>SKU</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProducts.map((product, index) => {
                                const capacity = product.totalStock || Math.max(product.stock, 0) || 100
                                const threshold = product.alertThreshold || 25
                                const stockPct = Math.max(0, Math.min((product.stock / capacity) * 100, 100))
                                const status = getStockStatus(product.stock, capacity, threshold)

                                return (
                                    <tr key={product.id} style={{ animationDelay: `${index * 0.05}s` }} className={`staggered-row ${selectedIds.includes(product.id) ? 'selected' : ''}`}>
                                        {isAdmin && (
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(product.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedIds([...selectedIds, product.id])
                                                        else setSelectedIds(selectedIds.filter(id => id !== product.id))
                                                    }}
                                                />
                                            </td>
                                        )}
                                        <td>
                                            <div className="product-info-cell">
                                                <div className="product-avatar">
                                                    {getInitials(product.name)}
                                                </div>
                                                <div>
                                                    <div className="product-name">
                                                        {product.gstName ? (
                                                            <>
                                                                <div>{product.name}</div>
                                                                <div style={{ color: '#6366f1', fontSize: '0.75rem', opacity: 0.8, fontWeight: 500 }}>GST: {product.gstName}</div>
                                                            </>
                                                        ) : (
                                                            product.name
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="sku-tag">{product.sku}</span></td>
                                        <td className="font-semibold text-main">₹{product.price.toLocaleString()}</td>
                                        <td>
                                            <div className="stock-info-wrapper">
                                                <div className="stock-info">
                                                    <span className="stock-count">{product.stock}</span>
                                                    <span className="stock-total text-muted text-xs"> / {product.totalStock || product.stock} {product.unit || 'Pcs'}</span>
                                                </div>
                                                <div className="stock-progress-bg" style={{ marginTop: '4px', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                                    <div
                                                        className={`stock-progress-fill stage-${status}`}
                                                        style={{
                                                            width: `${stockPct}%`,
                                                            height: '100%',
                                                            backgroundColor: status === 'safe' ? '#10B981' : status === 'warning' ? '#F59E0B' : '#EF4444',
                                                            transition: 'width 0.5s ease'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-pill pill-${status}`}>
                                                <span className="dot"></span>
                                                {status === 'safe' ? 'In Stock' : status === 'warning' ? 'Low Stock' : 'Critical'}
                                            </span>
                                        </td>
                                        {isAdmin && (
                                            <td>
                                                <div className="actions-cell">
                                                    <button
                                                        className="action-btn edit"
                                                        title="Edit Product"
                                                        onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        title="Delete Product"
                                                        onClick={() => { if (confirm('Delete this product?')) deleteProduct(product.id) }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                )
                            })}
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

            {selectedIds.length > 0 && (
                <div className="bulk-action-bar">
                    <div className="bulk-info">
                        <strong>{selectedIds.length}</strong> items selected
                    </div>
                    <div className="bulk-actions">
                        <button className="bulk-btn bulk-delete" onClick={() => {
                            if (confirm(`Delete ${selectedIds.length} items?`)) {
                                bulkDeleteProducts(selectedIds)
                                setSelectedIds([])
                            }
                        }}>
                            <Trash2 size={16} /> Delete All
                        </button>
                        <button className="bulk-close" onClick={() => setSelectedIds([])}>
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .products-page {
                    animation: fadeIn 0.4s ease-out;
                    padding: 0 2rem 2rem 2rem;
                    max-width: 1440px;
                    margin: 0 auto;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
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
                    margin-top: 0.25rem;
                }

                .add-product-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    font-weight: 600;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
                }

                .header-actions {
                    display: flex;
                    gap: 0.75rem;
                }


                .export-btn {
                    border: 1px solid var(--border-color);
                    background: var(--bg-surface);
                    color: var(--text-main);
                }

                .export-btn:hover {
                    background: var(--bg-body);
                    border-color: var(--text-muted);
                }

                /* Stats Grid */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .stat-card {
                    background: var(--bg-surface);
                    padding: 1.5rem;
                    border-radius: 16px;
                    border: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.05);
                }

                .stat-icon {
                    width: 54px;
                    height: 54px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-icon.purple { background: #eef2ff; color: #6366f1; }
                .stat-icon.orange { background: #fff7ed; color: #f97316; }
                .stat-icon.green { background: #f0fdf4; color: #22c55e; }

                .stat-label { font-size: 0.875rem; color: var(--text-muted); font-weight: 500; }
                .stat-value { font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-top: 0.125rem; }

                /* Card & Filters */
                .products-card {
                    border-radius: 16px;
                    padding: 1.5rem;
                    border: 1px solid var(--border-color);
                }

                /* Table Styling */
                .products-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0 0.5rem;
                }

                .products-table th {
                    text-align: left;
                    padding: 1rem;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-muted);
                    font-weight: 700;
                    border-bottom: 1px solid var(--border-color);
                }

                .products-table tr {
                    transition: all 0.2s;
                }

                .products-table tbody tr:hover {
                    background: var(--bg-body);
                    transform: scale(1.002);
                }

                .products-table td {
                    padding: 1rem;
                    vertical-align: middle;
                    border-bottom: 1px solid var(--border-color);
                }

                .product-info-cell {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .product-avatar {
                    width: 40px;
                    height: 40px;
                    background: var(--primary-soft);
                    color: var(--primary);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.85rem;
                }

                .product-name {
                    font-weight: 600;
                    color: var(--text-main);
                }

                .product-category-mobile {
                    display: none;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .sku-tag {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.85rem;
                    background: var(--bg-body);
                    padding: 0.25rem 0.5rem;
                    border-radius: 6px;
                    color: var(--text-muted);
                }

                .status-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.35rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .status-pill.pill-safe { 
                    background: rgba(16, 185, 129, 0.08); 
                    color: #10b981; 
                    border-color: rgba(16, 185, 129, 0.2);
                }
                .status-pill.pill-warning { 
                    background: rgba(245, 158, 11, 0.08); 
                    color: #f59e0b; 
                    border-color: rgba(245, 158, 11, 0.2);
                }
                .status-pill.pill-critical { 
                    background: rgba(239, 68, 68, 0.08); 
                    color: #ef4444; 
                    border-color: rgba(239, 68, 68, 0.2);
                }

                .status-pill .dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }
                .pill-safe .dot { background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }
                .pill-warning .dot { background: #f59e0b; box-shadow: 0 0 8px rgba(245, 158, 11, 0.4); }
                .pill-critical .dot { background: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.4); }

                .actions-cell {
                    display: flex;
                    gap: 0.5rem;
                }

                .action-btn {
                    width: 34px;
                    height: 34px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    color: #64748b;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                :root.dark .action-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.1);
                    color: #94a3b8;
                }

                .action-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }

                .action-btn.edit:hover { background: #6366f1; color: white; border-color: #6366f1; }
                .action-btn.delete:hover { background: #ef4444; color: white; border-color: #ef4444; }

                @media (max-width: 768px) {
                    .stats-grid { grid-template-columns: 1fr; }
                    .products-table th:nth-child(2), .products-table td:nth-child(2),
                    .products-table th:nth-child(3), .products-table td:nth-child(3) { display: none; }
                    .product-category-mobile { display: block; }
                }
                /* High-End Refinements */
                .staggered-row {
                    opacity: 0;
                    animation: slideIn 0.5s ease-out forwards;
                }

                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                .stat-card {
                    position: relative;
                    overflow: hidden;
                    z-index: 1;
                }

                .stat-glow {
                    position: absolute;
                    top: -20px;
                    right: -20px;
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    filter: blur(40px);
                    opacity: 0.15;
                    z-index: -1;
                }

                .stat-glow.purple { background: #6366f1; }
                .stat-glow.orange { background: #f97316; }
                .stat-glow.green { background: #22c55e; }

                .glass-card {
                    background: rgba(255, 255, 255, 0.7) !important;
                    backdrop-filter: blur(20px) !important;
                    -webkit-backdrop-filter: blur(20px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.3) !important;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05) !important;
                }

                :root.dark .glass-card {
                    background: rgba(9, 9, 11, 0.4) !important;
                    border-color: rgba(255, 255, 255, 0.05) !important;
                }

                .stock-cell-v2 {
                    width: 120px;
                }

                .stock-info {
                    display: flex;
                    align-items: baseline;
                    gap: 2px;
                    margin-bottom: 6px;
                }

                .stock-count { font-weight: 700; font-size: 0.95rem; color: var(--text-main); }
                .stock-total { font-size: 0.75rem; color: var(--text-muted); }

                .stock-progress-bg {
                    width: 100%;
                    height: 6px;
                    background: var(--bg-body);
                    border-radius: 10px;
                    overflow: hidden;
                }

                .stock-progress-fill {
                    height: 100%;
                    border-radius: 10px;
                    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .stock-progress-fill.stage-safe { background: linear-gradient(90deg, #10b981, #34d399); }
                .stock-progress-fill.stage-warning { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
                .stock-progress-fill.stage-critical { background: linear-gradient(90deg, #ef4444, #f87171); }

                .glass-btn {
                    background: rgba(255, 255, 255, 0.5);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                :root.dark .glass-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.05);
                }
                .clickable {
                    cursor: pointer;
                    user-select: none;
                }

                .stat-card.active {
                    background: var(--bg-surface);
                    border-color: var(--primary);
                    box-shadow: 0 10px 20px rgba(99, 102, 241, 0.1);
                }

                .stat-card.active.alert {
                    border-color: #f97316;
                    box-shadow: 0 10px 20px rgba(249, 115, 22, 0.1);
                }

                .filters-right {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .clear-filter-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    background: #fff7ed;
                    color: #ea580c;
                    border: 1px solid #ffedd5;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                :root.dark .clear-filter-pill {
                    background: rgba(234, 88, 12, 0.1);
                    border-color: rgba(234, 88, 12, 0.2);
                }

                .clear-filter-pill:hover {
                    background: #ffedd5;
                    transform: translateY(-1px);
                }
                .pulse-alert {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    width: 8px;
                    height: 8px;
                    background: #ef4444;
                    border-radius: 50%;
                    box-shadow: 0 0 0 rgba(239, 68, 68, 0.4);
                    animation: pulse 1.5s infinite;
                    z-index: 2;
                }

                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }

                /* Bulk Action Bar */
                .bulk-action-bar {
                    position: fixed;
                    bottom: 2rem;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    padding: 0.75rem 1.5rem;
                    border-radius: 99px;
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                    z-index: 1000;
                    animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }

                :root.dark .bulk-action-bar {
                    background: rgba(24, 24, 27, 0.95);
                    border-color: rgba(255, 255, 255, 0.1);
                }

                @keyframes slideUp {
                    from { transform: translate(-50%, 100px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }

                .bulk-info {
                    font-size: 0.95rem;
                    color: var(--text-main);
                }

                .bulk-actions {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .bulk-btn {
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .bulk-delete {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }

                .bulk-delete:hover {
                    background: #ef4444;
                    color: white;
                }

                .bulk-close {
                    color: var(--text-muted);
                    padding: 0.25rem;
                    border-radius: 4px;
                    hover: background: var(--bg-body);
                }
                
                .products-table tr.selected {
                    background: rgba(99, 102, 241, 0.05);
                }
                
                :root.dark .products-table tr.selected {
                    background: rgba(99, 102, 241, 0.1);
                }

                @media (max-width: 768px) {
                    .page-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
                    .header-actions { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
                    .header-actions button { justify-content: center; padding: 0.5rem; font-size: 0.85rem; }
                    .stats-grid { grid-template-columns: 1fr; gap: 1rem; }
                    .table-actions-bar { flex-direction: column; gap: 1rem; align-items: stretch; padding: 1.25rem; }
                    .standard-search-wrapper { width: 100%; }
                    .filters-right { width: 100%; overflow-x: auto; padding-bottom: 0.5rem; }
                    .table-container { margin: 0 -1.5rem; width: calc(100% + 3rem); }
                    .bulk-action-bar { 
                        width: calc(100% - 2rem); 
                        bottom: 1rem; 
                        padding: 0.75rem 1rem; 
                        gap: 1rem;
                        flex-direction: column;
                        border-radius: 20px;
                    }
                    .bulk-actions { width: 100%; justify-content: center; }
                    .bulk-info { font-size: 0.85rem; }
                }

                @media (max-width: 480px) {
                    .header-actions { grid-template-columns: 1fr; }
                }
            `}</style>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={addProduct}
                onUpdate={updateProduct}
                product={editingProduct}
            />
        </div>
    )
}
