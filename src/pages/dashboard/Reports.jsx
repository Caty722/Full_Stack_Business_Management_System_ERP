import { BarChart2, TrendingUp, Download, Calendar, Filter, PieChart, LineChart, ArrowUpRight, ArrowDownRight, CreditCard, Users, Package, FileText, IndianRupee, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { useShop } from '../../context/ShopContext'
import { getStartOfRange, getEndOfRange } from '../../lib/dateUtils'
import DateRangeModal from '../../components/DateRangeModal'
import { AnimatePresence } from 'framer-motion'
import { generateTaxReportPdf, generateGstProfitReportPdf, generateRetailProfitReportPdf } from '../../lib/reportPdfGenerator'

const StatCard = ({ title, value, trend, trendUp, icon: Icon, color }) => (
    <div className="stat-card glass-card">
        <div className={`stat-glow ${color}`}></div>
        <div className="stat-content">
            <div className="stat-header">
                <div className={`stat-icon-bg ${color}`}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <div className={`trend-pill ${trendUp ? 'up' : 'down'}`}>
                        {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        <span>{trend}</span>
                    </div>
                )}
            </div>
            <div className="stat-body">
                <p className="stat-label">{title}</p>
                <h3 className="stat-value">{value}</h3>
            </div>
        </div>
    </div>
)

export default function Reports() {
    const { invoices, products, customers, brands } = useShop()
    const [activeTab, setActiveTab] = useState('taxes') // 'taxes' or 'profit'

    const [profitSubTab, setProfitSubTab] = useState('gst') // 'gst' or 'ret' (Retail/Non-GST)

    // Date Filtering State
    const [showDateModal, setShowDateModal] = useState(false)
    const [selectedRange, setSelectedRange] = useState('This Month')
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })

    // --- Pagination Logic ---
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    useEffect(() => {
        setCurrentPage(1)
    }, [selectedRange, customDateRange, activeTab])

    // --- Calculations ---

    const filteredInvoices = useMemo(() => {
        const start = getStartOfRange(selectedRange, customDateRange)
        const end = getEndOfRange(selectedRange, customDateRange)
        return invoices.filter(inv => {
            const invDate = new Date(inv.date)
            // Only include revenue-generating invoices
            const isRevenue = !['Draft', 'Cancelled'].includes(inv.status)
            return invDate >= start && invDate <= end && isRevenue
        })
    }, [invoices, selectedRange, customDateRange])

    const analytics = useMemo(() => {
        const gstInvoices = filteredInvoices.filter(inv => inv.isGST)
        const totalTax = gstInvoices.reduce((sum, inv) => sum + (inv.tax || 0), 0)
        const totalSales = filteredInvoices.reduce((sum, inv) => sum + (inv.subtotal || inv.total || 0), 0)

        // Profit Analysis
        let gstProfit = 0
        let nonGstProfit = 0
        const gstProductProfits = {}
        const nonGstProductProfits = {}
        const gstCustomerProfits = {}
        const nonGstCustomerProfits = {}

        filteredInvoices.forEach(inv => {
            let invProfit = 0
            if (inv.items) {
                inv.items.forEach(item => {
                    const product = products.find(p => String(p.id) === String(item.productId))
                    if (product) {
                        const cost = parseFloat(product.purchasePrice) || 0
                        const sale = parseFloat(item.price) || 0
                        const profitPerUnit = sale - cost
                        const itemProfit = profitPerUnit * (item.quantity || 1)

                        if (inv.isGST) {
                            gstProfit += itemProfit
                            gstProductProfits[item.productId] = (gstProductProfits[item.productId] || 0) + itemProfit
                        } else {
                            nonGstProfit += itemProfit
                            nonGstProductProfits[item.productId] = (nonGstProductProfits[item.productId] || 0) + itemProfit
                        }
                        invProfit += itemProfit
                    }
                })
            }

            // Subtract invoice discount from profit
            const discount = parseFloat(inv.discount) || 0
            invProfit -= discount
            if (inv.isGST) {
                gstProfit -= discount
            } else {
                nonGstProfit -= discount
            }

            // Customer breakdown
            const customerId = customers.find(c => c.name === inv.customer)?.id || inv.customer
            if (inv.isGST) {
                gstCustomerProfits[customerId] = (gstCustomerProfits[customerId] || 0) + invProfit
            } else {
                nonGstCustomerProfits[customerId] = (nonGstCustomerProfits[customerId] || 0) + invProfit
            }
        })

        const getTopFromMap = (map, count = 5, isGST = false) => {
            return Object.entries(map)
                .map(([id, profit]) => {
                    const p = products.find(prod => String(prod.id) === String(id))
                    const c = customers.find(cust => String(cust.id) === String(id))

                    let foundName = id || 'Unknown'
                    if (p) {
                        foundName = (isGST && p.gstName) ? p.gstName : p.name
                    } else if (c) {
                        foundName = c.name
                    }

                    return {
                        id,
                        name: foundName,
                        profit
                    }
                })
                .sort((a, b) => b.profit - a.profit)
                .slice(0, count)
        }

        return {
            totalTax,
            totalSales,
            gstProfit,
            nonGstProfit,
            totalProfit: gstProfit + nonGstProfit,
            gstInvoices,
            gstTopProducts: getTopFromMap(gstProductProfits, 5, true),
            nonGstTopProducts: getTopFromMap(nonGstProductProfits, 5, false),
            gstTopCustomers: getTopFromMap(gstCustomerProfits, 5, true),
            nonGstTopCustomers: getTopFromMap(nonGstCustomerProfits, 5, false)
        }
    }, [filteredInvoices, products, customers])

    const totalPages = Math.max(1, Math.ceil(analytics.gstInvoices.length / itemsPerPage))
    const paginatedGstInvoices = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return analytics.gstInvoices.slice(start, start + itemsPerPage)
    }, [analytics.gstInvoices, currentPage])

    const handleDownloadPdf = async () => {
        const start = getStartOfRange(selectedRange, customDateRange);
        const end = getEndOfRange(selectedRange, customDateRange);
        const formatDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const dateLabel = `${formatDate(start)} - ${formatDate(end)}`;

        try {
            if (activeTab === 'taxes') {
                await generateTaxReportPdf(analytics, dateLabel, brands?.GST?.name || "Ferwa Regal Clean");
            } else {
                // Profit Tab - Check Sub-tab
                if (profitSubTab === 'gst') {
                    await generateGstProfitReportPdf(analytics, dateLabel, brands?.GST?.name || "Ferwa Regal Clean");
                } else {
                    await generateRetailProfitReportPdf(analytics, dateLabel, brands?.NON_GST?.name || "Ferwa One");
                }
            }
        } catch (error) {
            console.error("Download Error:", error);
        }
    };

    const handleDownloadCsv = () => {
        if (!analytics.gstInvoices || analytics.gstInvoices.length === 0) {
            alert('No GST invoices to export.');
            return;
        }

        const start = getStartOfRange(selectedRange, customDateRange);
        const end = getEndOfRange(selectedRange, customDateRange);
        const formatDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const dateLabel = `${formatDate(start)}_${formatDate(end)}`.replace(/\s/g, '-');

        const headers = ["Invoice No", "Date", "Customer", "Subtotal", "Tax Amount", "Total Amount"];
        const rows = analytics.gstInvoices.map(inv => [
            inv.invoiceNumber || inv.id,
            new Date(inv.date).toLocaleDateString(),
            typeof inv.customer === 'object' ? inv.customer.name : inv.customer,
            (inv.subtotal || 0).toFixed(2),
            (inv.tax || 0).toFixed(2),
            (inv.total || 0).toFixed(2)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `GST_Report_${dateLabel}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="reports-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analytics & Insights</h1>
                    <p className="page-subtitle">Detailed tax records and profitability metrics for your business.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-outline date-btn" onClick={() => setShowDateModal(true)}>
                        <Calendar size={18} />
                        <span>{selectedRange}</span>
                    </button>
                    <button className="btn-outline date-btn" onClick={handleDownloadPdf}>
                        <Download size={18} />
                        <span>Export PDF</span>
                    </button>
                    <div className="standard-tabs-wrapper" style={{ minWidth: '280px' }}>
                        <div
                            className="standard-tabs-indicator"
                            style={{
                                width: 'calc(50% - 4px)',
                                left: activeTab === 'taxes' ? '4px' : 'calc(50%)'
                            }}
                        ></div>
                        <button
                            className={`standard-tabs-btn ${activeTab === 'taxes' ? 'active' : ''}`}
                            onClick={() => setActiveTab('taxes')}
                        >
                            Tax Reports
                        </button>
                        <button
                            className={`standard-tabs-btn ${activeTab === 'profit' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profit')}
                        >
                            Profit Analysis
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showDateModal && (
                    <DateRangeModal
                        onClose={() => setShowDateModal(false)}
                        onSelect={(range, custom) => {
                            setSelectedRange(range)
                            if (custom) setCustomDateRange(custom)
                            setShowDateModal(false)
                        }}
                        selected={selectedRange}
                        customRange={customDateRange}
                    />
                )}
            </AnimatePresence>

            <div className="stats-grid">
                <StatCard
                    title="Total Revenue"
                    value={`₹${analytics.totalSales.toLocaleString()}`}
                    icon={IndianRupee}
                    color="blue"
                />
                <StatCard
                    title="Total Profit"
                    value={`₹${analytics.totalProfit.toLocaleString()}`}
                    icon={TrendingUp}
                    color="green"
                />
                <StatCard
                    title="GST Profit"
                    value={`₹${analytics.gstProfit.toLocaleString()}`}
                    icon={TrendingUp}
                    color="purple"
                />
                <StatCard
                    title="Non-GST Profit"
                    value={`₹${analytics.nonGstProfit.toLocaleString()}`}
                    icon={TrendingUp}
                    color="orange"
                />
                <StatCard
                    title="GST Collected"
                    value={`₹${analytics.totalTax.toLocaleString()}`}
                    icon={FileText}
                    color="purple"
                />
            </div>

            {activeTab === 'taxes' ? (
                <div className="report-section fade-in">
                    <div className="section-header">
                        <h2 className="section-title">Individual Bill GST Data</h2>
                        <button className="btn-outline btn-sm" onClick={handleDownloadCsv}>
                            <Download size={14} /> <span>Export GST CSV</span>
                        </button>
                    </div>
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table className="reports-table">
                                <thead>
                                    <tr>
                                        <th>Invoice No</th>
                                        <th>Customer</th>
                                        <th>Date</th>
                                        <th>Subtotal</th>
                                        <th>GST Amount</th>
                                        <th>Grand Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.gstInvoices.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-8 opacity-50">No GST invoices found.</td></tr>
                                    ) : (
                                        paginatedGstInvoices.map((inv, index) => (
                                            <tr key={inv.id} style={{ animationDelay: `${index * 0.05}s` }} className="staggered-row">
                                                <td className="font-mono text-primary">{inv.id}</td>
                                                <td className="font-semibold">{inv.customer}</td>
                                                <td>{new Date(inv.date).toLocaleDateString()}</td>
                                                <td>₹{(inv.subtotal || 0).toLocaleString()}</td>
                                                <td className="text-purple-500 font-bold">₹{(inv.tax || 0).toLocaleString()}</td>
                                                <td className="font-bold">₹{(inv.total || 0).toLocaleString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {analytics.gstInvoices.length > itemsPerPage && (
                        <div className="report-footer">
                            <div className="pagination">
                                <span className="page-count">{currentPage} / {totalPages}</span>
                                <button
                                    className="page-btn"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    className="page-btn"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="report-section fade-in">
                    <div className="section-header">
                        <div className="sub-tab-navigation">
                            <button
                                className={`sub-tab-btn ${profitSubTab === 'gst' ? 'active' : ''}`}
                                onClick={() => setProfitSubTab('gst')}
                            >
                                GST Analytics
                            </button>
                            <button
                                className={`sub-tab-btn ${profitSubTab === 'ret' ? 'active' : ''}`}
                                onClick={() => setProfitSubTab('ret')}
                            >
                                Retail Analytics (Non-GST)
                            </button>
                        </div>
                    </div>

                    <div className="analysis-grid">
                        <div className="glass-card analysis-card">
                            <h3 className="card-title">Top {profitSubTab === 'gst' ? 'GST' : 'Retail'} Products</h3>
                            <div className="profit-list">
                                {(profitSubTab === 'gst' ? analytics.gstTopProducts : analytics.nonGstTopProducts).map((p, idx) => (
                                    <div key={p.id} className="profit-item">
                                        <div className="rank">#{idx + 1}</div>
                                        <div className="item-info">
                                            <div className="item-name">{p.name}</div>
                                            <div className="progress-bar">
                                                <div
                                                    className={`progress-fill ${profitSubTab === 'gst' ? 'gst-gradient' : 'ret-gradient'}`}
                                                    style={{ width: `${(profitSubTab === 'gst' ? analytics.gstTopProducts : analytics.nonGstTopProducts)[0]?.profit ? (p.profit / (profitSubTab === 'gst' ? analytics.gstTopProducts : analytics.nonGstTopProducts)[0].profit) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="profit-value">₹{p.profit.toLocaleString()}</div>
                                    </div>
                                ))}
                                {(profitSubTab === 'gst' ? analytics.gstTopProducts : analytics.nonGstTopProducts).length === 0 && (
                                    <p className="text-center opacity-50 py-4">No data available for this segment.</p>
                                )}
                            </div>
                        </div>

                        <div className="glass-card analysis-card">
                            <h3 className="card-title">Top {profitSubTab === 'gst' ? 'GST' : 'Retail'} Customers</h3>
                            <div className="profit-list">
                                {(profitSubTab === 'gst' ? analytics.gstTopCustomers : analytics.nonGstTopCustomers).map((c, idx) => (
                                    <div key={c.id} className="profit-item">
                                        <div className="rank">#{idx + 1}</div>
                                        <div className="item-info">
                                            <div className="item-name">{c.name}</div>
                                            <div className="progress-bar">
                                                <div
                                                    className={`progress-fill ${profitSubTab === 'gst' ? 'gst-gradient' : 'ret-gradient'}`}
                                                    style={{ width: `${(profitSubTab === 'gst' ? analytics.gstTopCustomers : analytics.nonGstTopCustomers)[0]?.profit ? (c.profit / (profitSubTab === 'gst' ? analytics.gstTopCustomers : analytics.nonGstTopCustomers)[0].profit) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="profit-value">₹{c.profit.toLocaleString()}</div>
                                    </div>
                                ))}
                                {(profitSubTab === 'gst' ? analytics.gstTopCustomers : analytics.nonGstTopCustomers).length === 0 && (
                                    <p className="text-center opacity-50 py-4">No data available for this segment.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .reports-page {
                    animation: fadeIn 0.15s ease-out;
                    padding: 0 2rem 3rem 2rem;
                    max-width: 1440px;
                    margin: 0 auto;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .fade-in { animation: fadeIn 0.1s ease-out; }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1.5rem;
                }

                .header-actions {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }

                .date-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1rem;
                    border-radius: 10px;
                    border: 1px solid var(--border-color);
                    background: var(--bg-surface);
                    color: var(--text-main);
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .date-btn:hover {
                    background: var(--bg-input);
                    border-color: var(--text-muted);
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
                }

                /* Tabs */
                .tab-navigation {
                    display: flex;
                    gap: 0.5rem;
                    background: var(--bg-surface);
                    padding: 4px;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                }

                .tab-btn {
                    padding: 0.6rem 1.25rem;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    transition: all 0.2s;
                }

                .tab-btn.active {
                    background: var(--primary);
                    color: white;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                }

                .sub-tab-navigation {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                }

                .sub-tab-btn {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: var(--text-muted);
                    padding: 0.5rem 0;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s;
                    cursor: pointer;
                    background: transparent;
                }

                .sub-tab-btn:hover {
                    color: var(--text-main);
                }

                .sub-tab-btn.active {
                    color: var(--primary);
                    border-bottom-color: var(--primary);
                }

                .btn-sm {
                    padding: 0.4rem 0.8rem;
                    font-size: 0.8rem;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .stat-card {
                    padding: 1.5rem;
                    border-radius: 20px;
                    position: relative;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                }

                .stat-glow {
                    position: absolute;
                    top: -40px;
                    right: -40px;
                    width: 120px;
                    height: 120px;
                    filter: blur(40px);
                    opacity: 0.1;
                }

                .stat-glow.purple { background: #6366f1; }
                .stat-glow.blue { background: #2563eb; }
                .stat-glow.green { background: #16a34a; }
                .stat-glow.orange { background: #ea580c; }

                .stat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .stat-icon-bg {
                    width: 44px; height: 44px; border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                }
                .stat-icon-bg.purple { background: #eef2ff; color: #6366f1; }
                .stat-icon-bg.blue { background: #eff6ff; color: #2563eb; }
                .stat-icon-bg.green { background: #f0fdf4; color: #16a34a; }
                .stat-icon-bg.orange { background: #fff7ed; color: #ea580c; }

                .stat-label { font-size: 0.875rem; color: var(--text-muted); font-weight: 500; }
                .stat-value { font-size: 1.6rem; font-weight: 800; color: var(--text-main); margin-top: 0.25rem; }

                /* Table */
                .section-header {
                    display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;
                }
                .section-title { font-size: 1.25rem; font-weight: 700; color: var(--text-main); }

                .table-container { border-radius: 20px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
                .reports-table { width: 100%; border-collapse: collapse; min-width: 800px; }
                .reports-table th {
                    text-align: left; padding: 1rem; background: var(--bg-body);
                    font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);
                }
                .reports-table td { padding: 1rem; border-bottom: 1px solid var(--border-color); font-size: 0.9rem; }
                .reports-table tr:last-child td { border-bottom: none; }

                /* Analysis Grid */
                .analysis-grid {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem;
                }
                .analysis-card { padding: 2rem; border-radius: 24px; }
                .card-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--text-main); }

                .profit-list { display: flex; flex-direction: column; gap: 1.5rem; }
                .profit-item { display: flex; align-items: center; gap: 1rem; }
                .rank { font-weight: 800; color: var(--text-muted); min-width: 30px; font-size: 0.9rem; }
                .item-info { flex: 1; }
                .item-name { font-weight: 600; color: var(--text-main); margin-bottom: 6px; font-size: 0.95rem; }
                
                .progress-bar { width: 100%; height: 6px; background: var(--bg-body); border-radius: 10px; overflow: hidden; }
                .progress-fill { height: 100%; border-radius: 10px; transition: width 0.3s ease; }
                .gst-gradient { background: linear-gradient(90deg, #6366f1, #818cf8); }
                .ret-gradient { background: linear-gradient(90deg, #f97316, #fb923c); }
                .profit-value { font-weight: 700; color: var(--text-main); font-size: 1rem; }

                @media print {
                    .date-btn, .header-actions, .tab-navigation, .sub-tab-navigation, .btn-sm {
                        display: none !important;
                    }
                    .reports-page { padding: 0 !important; background: white !important; }
                    .glass-card { background: white !important; border: 1px solid #eee !important; box-shadow: none !important; }
                    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
                    .analysis-grid { grid-template-columns: 1fr !important; }
                    .page-header { margin-bottom: 2rem !important; }
                }

                /* PDF Specific Targeting for html2pdf */
                .printing .date-btn, 
                .printing .header-actions, 
                .printing .tab-navigation, 
                .printing .sub-tab-navigation,
                .printing .btn-sm,
                .printing .stats-glow {
                    display: none !important;
                }

                .printing .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 1rem !important; }
                .printing .stat-card { min-height: auto !important; padding: 1.25rem !important; }
                .printing .stat-value { font-size: 1.4rem !important; }
                .printing .glass-card { background: #fafafa !important; border: 1px solid #ddd !important; box-shadow: none !important; }
                .printing .reports-page { background: #ffffff !important; color: #000000 !important; }
                .printing .page-title { color: #000000 !important; }
                .printing .stat-label { color: #666 !important; }
                @media (max-width: 768px) {
                    .page-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
                    .header-actions { width: 100%; flex-wrap: wrap; gap: 0.75rem; }
                    .header-actions button { flex: 1; min-width: 140px; }
                    .tab-navigation { width: 100%; }
                    .tab-btn { flex: 1; font-size: 0.8rem; height: 44px; }
                    .sub-tab-navigation { width: 100%; flex-wrap: wrap; gap: 0.5rem; }
                    .sub-tab-btn { flex: 1; min-width: 120px; font-size: 0.75rem; }
                    .stats-grid { grid-template-columns: 1fr; gap: 1rem; }
                    .reports-page { padding: 0 1rem 3rem 1rem; }
                    .analysis-grid { grid-template-columns: 1fr; }
                    .stat-value { font-size: 1.4rem; }
                }
                @media (max-width: 480px) {
                    .header-actions button { width: 100%; }
                }

                /* Pagination Styles */
                .report-footer {
                    margin-top: 1.5rem;
                    display: flex;
                    justify-content: flex-end;
                }

                .pagination {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    background: var(--bg-surface);
                    padding: 0.5rem 1rem;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                }

                .page-count {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-muted);
                }

                .page-btn {
                    width: 34px;
                    height: 34px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-body);
                    border: 1px solid var(--border-color);
                    color: var(--text-main);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .page-btn:hover:not(:disabled) {
                    background: var(--primary-soft);
                    color: var(--primary);
                    border-color: var(--primary);
                }

                .page-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .staggered-row {
                    opacity: 0;
                    animation: slideIn 0.3s ease-out forwards;
                }

                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                .font-mono { font-family: 'JetBrains Mono', monospace; }
                .text-primary { color: var(--primary); }
            `}</style>
        </div>
    )
}
