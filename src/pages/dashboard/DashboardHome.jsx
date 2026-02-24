import React from 'react';
import {
  IndianRupee,
  FileText,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Plus,
  File,
  ChevronRight,
  X,
  BarChart2,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  UserCheck,
  User
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
// import { fetchInvoices, fetchCustomers, fetchProducts } from '../../lib/db'; // Data now comes from ShopContext
import { useNavigate } from 'react-router-dom';
import { formatDateDDMMYYYY } from '../../lib/utils';
import InvoiceViewModal from '../../components/InvoiceViewModal';
import { generateInvoicePdf } from '../../lib/pdfGenerator';
import { useShop } from '../../context/ShopContext';
import { getStartOfRange, getEndOfRange, getPreviousPeriodRange } from '../../lib/dateUtils';
import DateRangeModal from '../../components/DateRangeModal';

// Chart Helpers
const generateMonthlyData = (invoices, products) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const gstRevenueMap = {};
  const nonGstRevenueMap = {};
  const gstProfitMap = {};
  const nonGstProfitMap = {};

  // Filter out Drafts and Cancelled from analytics
  const activeInvoices = invoices.filter(inv => !['Draft', 'Cancelled'].includes(inv.status));

  activeInvoices.forEach(inv => {
    const d = new Date(inv.date);
    const m = months[d.getMonth()];

    // Profit Calculation
    const invoiceProfit = (inv.items || []).reduce((pSum, item) => {
      const product = (products || []).find(p => p.id === item.productId || p.id === String(item.productId));
      const purchasePrice = product?.purchasePrice || 0;
      const profitPerUnit = (item.price || 0) - Number(purchasePrice);
      return pSum + (profitPerUnit * (item.quantity || 1));
    }, 0) - (inv.discount || 0);

    // Revenue Split & Profit Split
    if (inv.isGST) {
      gstRevenueMap[m] = (gstRevenueMap[m] || 0) + (inv.total || 0);
      gstProfitMap[m] = (gstProfitMap[m] || 0) + invoiceProfit;
    } else {
      nonGstRevenueMap[m] = (nonGstRevenueMap[m] || 0) + (inv.total || 0);
      nonGstProfitMap[m] = (nonGstProfitMap[m] || 0) + invoiceProfit;
    }
  });

  return months.map(m => ({
    name: m,
    gstRevenue: gstRevenueMap[m] || 0,
    nonGstRevenue: nonGstRevenueMap[m] || 0,
    gstProfit: Math.max(0, gstProfitMap[m] || 0),
    nonGstProfit: Math.max(0, nonGstProfitMap[m] || 0)
  }));
};

const getSparklineData = (invoices, products, days = 7, mode = 'revenue') => {
  const now = new Date();
  const data = [];

  // Group invoices by date for O(1) access
  const invoicesByDate = {};
  invoices.forEach(inv => {
    const dateStr = inv.date.split('T')[0];
    if (!invoicesByDate[dateStr]) invoicesByDate[dateStr] = [];
    invoicesByDate[dateStr].push(inv);
  });

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayInvoices = (invoicesByDate[dateStr] || []).filter(inv => !['Draft', 'Cancelled'].includes(inv.status));

    let dayValue = 0;
    if (mode === 'revenue') {
      dayValue = dayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    } else if (mode === 'profit') {
      dayValue = dayInvoices.reduce((sum, inv) => {
        const invoiceProfit = (inv.items || []).reduce((pSum, item) => {
          const product = (products || []).find(p => String(p.id) === String(item.productId));
          const purchasePrice = product?.purchasePrice || 0;
          return pSum + (((item.price || 0) - Number(purchasePrice)) * (item.quantity || 1));
        }, 0);
        return sum + (invoiceProfit - (inv.discount || 0));
      }, 0);
    } else if (mode === 'customers') {
      dayValue = new Set(dayInvoices.map(inv => inv.customerId || inv.customer)).size;
    }
    data.push({ value: Math.max(0, dayValue) });
  }
  return data;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100
    }
  }
};

export default function DashboardHome() {
  const navigate = useNavigate();
  const [showDateModal, setShowDateModal] = React.useState(false);
  const [selectedRange, setSelectedRange] = React.useState('This Year');
  const [customDateRange, setCustomDateRange] = React.useState({ start: '', end: '' });

  // Use Global State from ShopContext instead of local state
  const { invoices, customers, products, brands } = useShop();

  // Loading state derived from data presence (or could be added to context)
  const loading = !products || !customers || !invoices;

  const [viewInvoice, setViewInvoice] = React.useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);

  const handleDownloadPDF = async (invoice) => {
    generateInvoicePdf(invoice, setIsGeneratingPDF, setViewInvoice);
  };

  // Removed local data fetching effect as it's now handled by ShopContext

  const filteredInvoices = React.useMemo(() => {
    const start = getStartOfRange(selectedRange, customDateRange);
    const end = getEndOfRange(selectedRange, customDateRange);
    return invoices.filter(inv => {
      const invDate = new Date(inv.date);
      const isRevenue = !['Draft', 'Cancelled'].includes(inv.status);
      return invDate >= start && invDate <= end && isRevenue;
    });
  }, [invoices, selectedRange, customDateRange]);

  const previousInvoices = React.useMemo(() => {
    const { start, end } = getPreviousPeriodRange(selectedRange, customDateRange);
    return invoices.filter(inv => {
      const invDate = new Date(inv.date);
      const isRevenue = !['Draft', 'Cancelled'].includes(inv.status);
      return invDate >= start && invDate <= end && isRevenue;
    });
  }, [invoices, selectedRange, customDateRange]);

  const stats = React.useMemo(() => {
    // Helper to calculate revenue from invoices (prefer subtotal for taxable revenue)
    const getRevenue = (invs) => invs.reduce((sum, inv) => sum + (inv.subtotal || inv.total || 0), 0);
    const getProfit = (invs) => invs.reduce((sum, inv) => {
      const invoiceProfit = (inv.items || []).reduce((pSum, item) => {
        const product = products.find(p => String(p.id) === String(item.productId));
        const purchasePrice = product?.purchasePrice || 0;
        const profitPerUnit = (item.price || 0) - Number(purchasePrice);
        return pSum + (profitPerUnit * (item.quantity || 1));
      }, 0);
      return sum + (invoiceProfit - (inv.discount || 0));
    }, 0);

    // Current Period Metrics
    const totalRevenue = getRevenue(filteredInvoices);
    const pendingAmount = filteredInvoices
      .filter(inv => inv.status !== 'Paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    const activeInvoices = filteredInvoices.filter(inv => inv.status === 'Pending').length;

    // Advanced Metrics
    const gstRevenue = getRevenue(filteredInvoices.filter(inv => inv.isGST));
    const nonGstRevenue = getRevenue(filteredInvoices.filter(inv => !inv.isGST));
    const totalProfit = getProfit(filteredInvoices);
    const gstProfit = getProfit(filteredInvoices.filter(inv => inv.isGST));
    const nonGstProfit = getProfit(filteredInvoices.filter(inv => !inv.isGST));
    const gstPending = filteredInvoices
      .filter(inv => inv.isGST && inv.status !== 'Paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    const nonGstPending = filteredInvoices
      .filter(inv => !inv.isGST && inv.status !== 'Paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Previous Period Metrics (for trends)
    const prevRevenue = getRevenue(previousInvoices);
    const prevProfit = getProfit(previousInvoices);
    const prevPending = previousInvoices
      .filter(inv => inv.status !== 'Paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    const prevGstRevenue = getRevenue(previousInvoices.filter(inv => inv.isGST));
    const prevGstProfit = getProfit(previousInvoices.filter(inv => inv.isGST));
    const prevNonGstProfit = getProfit(previousInvoices.filter(inv => !inv.isGST));

    // Trend calculation
    const calculateTrend = (current, previous) => {
      if (current === 0 && (!previous || previous === 0)) return { text: '0%', isNegative: false };
      if (!previous || previous === 0) return { text: '+100%', isNegative: false };

      const diff = ((current - previous) / previous) * 100;
      return {
        text: `${diff >= 0 ? '+' : ''}${Math.abs(diff).toFixed(1)}%`,
        isNegative: diff < 0
      };
    };

    const revTrend = calculateTrend(totalRevenue, prevRevenue);
    const profitTrend = calculateTrend(totalProfit, prevProfit);
    const pendingTrend = calculateTrend(pendingAmount, prevPending);
    const gstTrend = calculateTrend(gstRevenue, prevGstRevenue);
    const gstProfitTrend = calculateTrend(gstProfit, prevGstProfit);
    const nonGstProfitTrend = calculateTrend(nonGstProfit, prevNonGstProfit);

    const prevNonGstRevenue = getRevenue(previousInvoices.filter(inv => !inv.isGST));
    const nonGstRevTrend = calculateTrend(nonGstRevenue, prevNonGstRevenue);

    const gstCustomerCount = customers.filter(c => c.isGST).length;
    const nonGstCustomerCount = customers.filter(c => !c.isGST).length;

    const getActiveCustomers = (invs) => new Set(invs.map(inv => inv.customerId || inv.customer)).size;
    const gstCustTrend = calculateTrend(getActiveCustomers(filteredInvoices.filter(inv => inv.isGST)), getActiveCustomers(previousInvoices.filter(inv => inv.isGST)));
    const nonGstCustTrend = calculateTrend(getActiveCustomers(filteredInvoices.filter(inv => !inv.isGST)), getActiveCustomers(previousInvoices.filter(inv => !inv.isGST)));

    const comparisonText = (() => {
      switch (selectedRange) {
        case 'Today': return 'from yesterday';
        case 'Yesterday': return 'from day before';
        case 'This Week': return 'from last week';
        case 'Last Week': return 'from previous week';
        case 'This Month': return 'from last month';
        case 'Last Month': return 'from previous month';
        case 'This Year': return 'from last year';
        case 'Last Year': return 'from previous year';
        case 'All': return 'total average';
        default: return 'from last period';
      }
    })();

    // Memoized Sparkline generation to avoid multiple passes
    const sprk = {
      totalRev: getSparklineData(filteredInvoices, products),
      gstInvs: filteredInvoices.filter(i => i.isGST),
      nonGstInvs: filteredInvoices.filter(i => !i.isGST),
      pendingInvs: filteredInvoices.filter(i => i.status !== 'Paid')
    };

    return {
      totalRevenue,
      pendingAmount,
      activeInvoices,
      customerCount: customers.length,
      gstCustomerCount,
      nonGstCustomerCount,
      gstRevenue,
      nonGstRevenue,
      totalProfit,
      gstProfit,
      nonGstProfit,
      gstPending,
      nonGstPending,
      comparisonText,
      trends: {
        rev: revTrend,
        gst: gstTrend,
        nonGstRev: nonGstRevTrend,
        pending: pendingTrend,
        profit: profitTrend,
        gstProfit: gstProfitTrend,
        nonGstProfit: nonGstProfitTrend,
        gstCust: gstCustTrend,
        nonGstCust: nonGstCustTrend
      },
      sparklines: {
        totalRevenue: sprk.totalRev,
        gstRevenue: getSparklineData(sprk.gstInvs, products),
        nonGstRevenue: getSparklineData(sprk.nonGstInvs, products),
        netProfit: getSparklineData(filteredInvoices, products, 7, 'profit'),
        gstProfit: getSparklineData(sprk.gstInvs, products, 7, 'profit'),
        nonGstProfit: getSparklineData(sprk.nonGstInvs, products, 7, 'profit'),
        pending: getSparklineData(sprk.pendingInvs, products),
        gstCust: getSparklineData(sprk.gstInvs, products, 7, 'customers'),
        nonGstCust: getSparklineData(sprk.nonGstInvs, products, 7, 'customers'),
        totalSales: sprk.totalRev.map(d => ({ value: d.value > 0 ? 1 : 0 }))
      }
    };
  }, [filteredInvoices, previousInvoices, customers, products, selectedRange]);

  const lowStockProducts = React.useMemo(() => {
    return products
      .filter(p => {
        const stock = Number(p.stock || 0);
        const threshold = Number(p.alertThreshold || 25);
        const capacity = Number(p.totalStock || Math.max(p.stock, 0) || 100);

        const pct = (stock / capacity) * 100;
        return pct <= threshold;
      })
      .sort((a, b) => Number(a.stock) - Number(b.stock));
  }, [products]);

  const chartData = React.useMemo(() => generateMonthlyData(filteredInvoices, products), [filteredInvoices, products]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="dashboard-content"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="page-header" variants={itemVariants}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="page-title">Dashboard Flow</h1>
            <div className="live-sync-badge">
              <span className="pulse-dot"></span>
              <span className="live-text">Live</span>
            </div>
          </div>
          <p className="page-subtitle">
            Real-time overview • Last updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <div className="action-buttons">
          <button className="btn btn-outline" onClick={() => setShowDateModal(true)}>
            <Calendar size={18} />
            <span>{selectedRange}</span>
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/billing/new')}>
            <Plus size={18} />
            <span>Create Invoice</span>
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDateModal && (
          <DateRangeModal
            onClose={() => setShowDateModal(false)}
            onSelect={(range, custom) => {
              setSelectedRange(range);
              if (custom) setCustomDateRange(custom);
              setShowDateModal(false);
            }}
            selected={selectedRange}
            customRange={customDateRange}
          />
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <motion.div className="stats-grid" variants={itemVariants}>
        <StatsCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          change={stats.trends.rev.text}
          isNegative={stats.trends.rev.isNegative}
          description={stats.comparisonText}
          icon={<IndianRupee size={22} />}
          gradient="from-indigo-500 to-purple-500"
          sparklineData={stats.sparklines.totalRevenue}
        />
        <StatsCard
          title="GST Revenue"
          value={`₹${stats.gstRevenue.toLocaleString()}`}
          change={stats.trends.gst.text}
          isNegative={stats.trends.gst.isNegative}
          description={stats.comparisonText}
          icon={<BarChart2 size={22} />}
          gradient="from-blue-500 to-cyan-500"
          sparklineData={stats.sparklines.gstRevenue}
        />
        <StatsCard
          title="Non-GST Revenue"
          value={`₹${stats.nonGstRevenue.toLocaleString()}`}
          change={stats.trends.nonGstRev.text}
          isNegative={stats.trends.nonGstRev.isNegative}
          description={stats.comparisonText}
          icon={<ShoppingCart size={22} />}
          gradient="from-teal-400 to-emerald-500"
          sparklineData={stats.sparklines.nonGstRevenue}
        />
        <StatsCard
          title="Net Profit"
          value={`₹${Math.round(stats.totalProfit).toLocaleString()}`}
          change={stats.trends.profit.text}
          isNegative={stats.trends.profit.isNegative}
          description={stats.comparisonText}
          icon={<TrendingUp size={22} />}
          gradient="from-rose-500 to-pink-500"
          sparklineData={stats.sparklines.netProfit}
        />
        <StatsCard
          title="GST Profit"
          value={`₹${Math.round(stats.gstProfit).toLocaleString()}`}
          change={stats.trends.gstProfit.text}
          isNegative={stats.trends.gstProfit.isNegative}
          description={stats.comparisonText}
          icon={<TrendingUp size={22} />}
          gradient="from-emerald-500 to-cyan-500"
          sparklineData={stats.sparklines.gstProfit}
        />
        <StatsCard
          title="Non-GST Profit"
          value={`₹${Math.round(stats.nonGstProfit).toLocaleString()}`}
          change={stats.trends.nonGstProfit.text}
          isNegative={stats.trends.nonGstProfit.isNegative}
          description={stats.comparisonText}
          icon={<TrendingUp size={22} />}
          gradient="from-orange-500 to-rose-500"
          sparklineData={stats.sparklines.nonGstProfit}
        />
        <StatsCard
          title="Pending Collection"
          value={`₹${stats.pendingAmount.toLocaleString()}`}
          change={stats.trends.pending.text}
          isNegative={stats.trends.pending.isNegative}
          description={stats.comparisonText}
          icon={<FileText size={22} />}
          gradient="from-amber-400 to-orange-500"
          sparklineData={stats.sparklines.pending}
        />
        <StatsCard
          title="Total Sales"
          value={filteredInvoices.length.toString()}
          change="ACTIVE"
          icon={<Activity size={22} />}
          gradient="from-purple-500 to-indigo-500"
          sparklineData={stats.sparklines.totalSales}
        />
      </motion.div>

      {/* Main Content Split */}
      <div className="content-split">
        {/* Charts Column */}
        <div className="charts-column">
          {/* GST Chart */}
          <motion.div className="card chart-card regal-mb" variants={itemVariants}>
            <div className="card-header">
              <div>
                <h2 className="card-title">GST Revenue Performance</h2>
                <p className="card-subtitle">Performance for GST-registered sales</p>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="gstAreaGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <filter id="glowGST" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="gstBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.1} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
                    dy={12}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
                    tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                    width={45}
                  />
                  <Tooltip
                    cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="regal-tooltip glass-card">
                            <header>{label}</header>
                            <div className="tooltip-body">
                              <div className="row">
                                <span className="dot" style={{ background: '#06b6d4' }}></span>
                                <span className="label">Revenue:</span>
                                <span className="value">₹{payload[0].value.toLocaleString()}</span>
                              </div>
                              <div className="sep"></div>
                              <div className="row profit">
                                <span className="dot" style={{ background: '#10b981' }}></span>
                                <span className="label">Profit:</span>
                                <span className="value">₹{payload[1].value.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="gstRevenue"
                    fill="url(#gstBarGrad)"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="gstProfit"
                    stroke="#10b981"
                    strokeWidth={4}
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: 'white' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    filter="url(#glowGST)"
                    name="Profit"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {/* GST Insights Footer */}
            <div className="chart-insights-footer no-border mt-10">
              <div className="insight-stat">
                <span className="insight-label">GST Margin</span>
                <div className="insight-value-group">
                  <span className="insight-value">{stats.gstRevenue > 0 ? ((stats.gstProfit / stats.gstRevenue) * 100).toFixed(1) : 0}%</span>
                  <span className="insight-trend positive">Stable</span>
                </div>
              </div>
              <div className="insight-divider"></div>
              <div className="insight-stat">
                <span className="insight-label">Contribution</span>
                <div className="insight-value-group">
                  <span className="insight-value">{stats.totalRevenue > 0 ? ((stats.gstRevenue / stats.totalRevenue) * 100).toFixed(0) : 0}%</span>
                  <span className="insight-subline text-xs ml-1 opacity-60">of total</span>
                </div>
              </div>
              <div className="insight-divider"></div>
              <div className="insight-stat">
                <span className="insight-label">Collection Rate</span>
                <div className="insight-value-group">
                  <span className="insight-value">{stats.gstRevenue > 0 ? (((stats.gstRevenue - stats.gstPending) / stats.gstRevenue) * 100).toFixed(0) : 0}%</span>
                  <span className={`insight-trend ${stats.gstPending > (stats.gstRevenue * 0.3) ? 'negative' : 'positive'}`}>
                    {stats.gstPending > (stats.gstRevenue * 0.3) ? 'Bad' : 'Good'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Non-GST Chart */}
          <motion.div className="card chart-card regal-mb" variants={itemVariants}>
            <div className="card-header">
              <div>
                <h2 className="card-title">Non-GST Performance</h2>
                <p className="card-subtitle">Volume analysis for direct retail sales</p>
              </div>
            </div>
            <div className="chart-container mini">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="nonGstAreaGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <filter id="glowNonGST" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="nonGstBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.1} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
                    dy={12}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
                    tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                    width={45}
                  />
                  <Tooltip
                    cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="regal-tooltip glass-card">
                            <header>{label}</header>
                            <div className="tooltip-body">
                              <div className="row">
                                <span className="dot" style={{ background: '#8b5cf6' }}></span>
                                <span className="label">Revenue:</span>
                                <span className="value">₹{payload[0].value.toLocaleString()}</span>
                              </div>
                              <div className="sep"></div>
                              <div className="row profit">
                                <span className="dot" style={{ background: '#10b981' }}></span>
                                <span className="label">Profit:</span>
                                <span className="value">₹{payload[1].value.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="nonGstRevenue"
                    fill="url(#nonGstBarGrad)"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="nonGstProfit"
                    stroke="#10b981"
                    strokeWidth={4}
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: 'white' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    filter="url(#glowNonGST)"
                    name="Profit"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {/* Non-GST Insights Footer */}
            <div className="chart-insights-footer no-border mt-10">
              <div className="insight-stat">
                <span className="insight-label">Retail Margin</span>
                <div className="insight-value-group">
                  <span className="insight-value">{stats.nonGstRevenue > 0 ? ((stats.nonGstProfit / stats.nonGstRevenue) * 100).toFixed(1) : 0}%</span>
                  <span className="insight-trend positive">Efficient</span>
                </div>
              </div>
              <div className="insight-divider"></div>
              <div className="insight-stat">
                <span className="insight-label">Contribution</span>
                <div className="insight-value-group">
                  <span className="insight-value">{stats.totalRevenue > 0 ? ((stats.nonGstRevenue / stats.totalRevenue) * 100).toFixed(0) : 0}%</span>
                  <span className="insight-subline text-xs ml-1 opacity-60">of total</span>
                </div>
              </div>
              <div className="insight-divider"></div>
              <div className="insight-stat">
                <span className="insight-label">Collection Rate</span>
                <div className="insight-value-group">
                  <span className="insight-value">{stats.nonGstRevenue > 0 ? (((stats.nonGstRevenue - stats.nonGstPending) / stats.nonGstRevenue) * 100).toFixed(0) : 0}%</span>
                  <span className={`insight-trend ${stats.nonGstPending > (stats.nonGstRevenue * 0.2) ? 'negative' : 'positive'}`}>
                    {stats.nonGstPending > (stats.nonGstRevenue * 0.2) ? 'Action' : 'Healthy'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side Column */}
        <div className="right-column-stack">
          {/* Low Stock Alert */}
          <motion.div className="card low-stock-card" variants={itemVariants}>
            <div className="card-header row">
              <h2 className="card-title">Low Stock Alert</h2>
              <div className="flex items-center gap-2">
                {lowStockProducts.length > 0 && <span className="badge-count">{lowStockProducts.length}</span>}
                <button className="link-btn hide-on-mobile" onClick={() => navigate('/admin/products', { state: { filter: 'low_stock' } })}>View All</button>
              </div>
            </div>

            <div className="stock-list">
              {lowStockProducts.slice(0, 4).map(product => (
                <div key={product.id} className="stock-item">
                  <div className="stock-icon-box">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="stock-info">
                    <h4 className="stock-name">{product.name}</h4>
                    <p className="stock-sku">{product.sku}</p>
                  </div>
                  <div className="stock-status">
                    <span className="stock-value">{product.stock} Left</span>
                    <div className="stock-bar">
                      <div
                        className="stock-fill"
                        style={{
                          width: `${Math.max(0, Math.min((Number(product.stock || 0) / (product.totalStock || Math.max(product.stock, 0) || 100)) * 100, 100))}%`,
                          background: (product.stock <= 0 || (Number(product.stock || 0) / (product.totalStock || 100)) * 100 < (product.alertThreshold || 25) / 2) ? '#ef4444' : '#f97316'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <div className="healthy-state">
                  <CheckCircle size={32} />
                  <p>Inventory is healthy!</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Invoices */}
          <motion.div className="card invoices-card" variants={itemVariants}>
            <div className="card-header row">
              <h2 className="card-title">Recent Invoices</h2>
              <button className="link-btn hide-on-mobile" onClick={() => navigate('/admin/billing')}>View All</button>
            </div>

            <div className="invoices-list">
              {filteredInvoices.slice(0, 6).map(inv => (
                <InvoiceRow
                  key={inv.id}
                  name={inv.customer}
                  date={formatDateDDMMYYYY(inv.date)}
                  amount={`₹${inv.total.toLocaleString()}`}
                  status={inv.status}
                  onIconClick={() => setViewInvoice(inv)}
                />
              ))}
              {filteredInvoices.length === 0 && (
                <p className="text-center py-8 text-muted opacity-60">No invoices in this range.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {viewInvoice && (
        <InvoiceViewModal
          inv={viewInvoice}
          onClose={() => setViewInvoice(null)}
          customers={customers}
          products={products}
          onDownloadPDF={handleDownloadPDF}
          isGeneratingPDF={isGeneratingPDF}
        />
      )}

      <style>{`
                .dashboard-content {
                    padding: 0 2rem 3rem 2rem;
                    max-width: 1440px;
                    margin: 0 auto;
                }

                /* Header */
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
                    letter-spacing: -0.03em;
                    margin-bottom: 0.5rem;
                }
                .page-subtitle {
                    color: var(--text-muted);
                    font-size: 1.05rem;
                    font-weight: 450;
                }
                .action-buttons {
                    display: flex;
                    gap: 0.75rem;
                }
                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.6rem;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .btn-outline {
                    background: transparent;
                    border: 1px solid var(--border-color);
                    color: var(--text-main);
                }
                .btn-outline:hover { 
                    background: var(--bg-input); 
                    transform: translateY(-1px);
                    border-color: var(--text-muted);
                }
                .btn-primary {
                    background: var(--primary);
                    border: 1px solid var(--primary);
                    color: white;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                }
                .btn-primary:hover { 
                    background: #4f46e5; 
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
                }

                /* Stats Grid */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(1, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 2.5rem;
                }
                @media (min-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1200px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }

                .stat-card {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    border-radius: 24px;
                    padding: 1.75rem;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: blur(10px);
                    display: flex;
                    flex-direction: column;
                    min-height: 200px;
                }
                .stat-card:hover {
                    border-color: var(--primary);
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px -10px rgba(0,0,0,0.1);
                    z-index: 2;
                }
                
                .stat-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    width: 100%;
                }
                .icon-box {
                    width: 48px;
                    height: 48px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 12px -2px rgba(0,0,0,0.12);
                    flex-shrink: 0;
                    position: relative;
                }
                .heartbeat::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    background: inherit;
                    opacity: 0.4;
                    z-index: -1;
                    animation: pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse-ring {
                    0% { transform: scale(1); opacity: 0.4; }
                    50% { transform: scale(1.15); opacity: 0; }
                    100% { transform: scale(1); opacity: 0; }
                }
                /* Visual centering correction for Rupee icon */
                .icon-box svg { position: relative; left: 0.5px; }

                .live-sync-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(16, 185, 129, 0.1);
                    padding: 0.25rem 0.75rem;
                    border-radius: 99px;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    margin-top: 0.2rem;
                }
                .pulse-dot {
                    width: 8px;
                    height: 8px;
                    background: #10b981;
                    border-radius: 50%;
                    position: relative;
                }
                .pulse-dot::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: #10b981;
                    border-radius: 50%;
                    animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                @keyframes ping {
                    75%, 100% { transform: scale(2.5); opacity: 0; }
                }
                .live-text {
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: #10b981;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .bg-gradient {
                    background: linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to));
                }
                
                .trend-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    padding: 0.35rem 0.65rem;
                    border-radius: 99px;
                }
                .trend-positive { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .trend-negative { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                
                .stat-title { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin: 0; min-height: 1.2rem; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
                .stat-value { font-size: 1.65rem; font-weight: 800; color: var(--text-main); margin: 0.15rem 0; letter-spacing: -0.02em; }
                .stat-desc { font-size: 0.75rem; color: var(--text-muted); margin: 0.5rem 0 0 0; font-weight: 500; opacity: 0.7; white-space: nowrap; }
                .sparkline-container {
                    margin-left: 1rem;
                    flex-shrink: 0;
                    opacity: 0.6;
                    transition: opacity 0.3s;
                }
                .stat-card:hover .sparkline-container { opacity: 1; }

                /* Content Split */
                .content-split {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                    min-width: 0;
                    width: 100%;
                }
                @media (min-width: 1024px) { 
                    .content-split { grid-template-columns: 2fr 1.2fr; } 
                }

                .card {
                    background: var(--bg-surface);
                    padding: 1.75rem;
                    border-radius: 24px;
                    border: 1px solid var(--border-color);
                    backdrop-filter: blur(10px);
                    transition: border-color 0.2s;
                    min-width: 0;
                    max-width: 100%;
                    box-sizing: border-box;
                    overflow: hidden;
                }
                .card:hover {
                    border-color: var(--border-muted);
                }
                
                .card-header { margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-start; }
                .card-title { font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -0.01em; }
                .card-subtitle { font-size: 0.9rem; color: var(--text-muted); margin-top: 0.25rem; font-weight: 450; }
                
                .chart-select {
                    background: var(--bg-input);
                    border: 1px solid var(--border-color);
                    color: var(--text-main);
                    padding: 0.5rem 1rem;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    outline: none;
                }
                
                .charts-column {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    min-width: 0;
                    width: 100%;
                }
                .regal-mb { margin-bottom: 0.5rem; }
                .chart-container { height: 380px; width: 100%; position: relative; margin-bottom: 2rem; min-width: 0; }
                .chart-container.mini { height: 280px; margin-bottom: 2rem; min-width: 0; }
                .chart-insights-footer.no-border { border: none !important; padding-top: 0.5rem !important; margin-top: 1rem !important; }
                
                .regal-tooltip {
                    background: rgba(10, 10, 15, 0.95) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 12px !important;
                    padding: 14px !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
                }
                .regal-tooltip header {
                    font-size: 0.65rem;
                    font-weight: 900;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin-bottom: 10px;
                }
                .regal-tooltip .tooltip-body { display: flex; flex-direction: column; gap: 6px; }
                .regal-tooltip .row { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; }
                .regal-tooltip .row.profit .value { color: #10b981; font-weight: 800; }
                .regal-tooltip .dot { width: 6px; height: 6px; border-radius: 50%; }
                .regal-tooltip .label { color: var(--text-muted); flex: 1; }
                .regal-tooltip .value { color: white; font-weight: 700; }
                .regal-tooltip .sep { height: 1px; background: rgba(255,255,255,0.05); margin: 4px 0; }

                .regal-legend-text {
                    color: var(--text-muted);
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    margin-left: 6px;
                }

                .pulse-glow {
                    filter: drop-shadow(0 0 8px #10b981);
                    animation: pulse-ring 2s infinite;
                }
                @keyframes pulse-ring {
                    0% { stroke-width: 3; }
                    50% { stroke-width: 6; }
                    100% { stroke-width: 3; }
                }

                .chart-insights-footer {
                    display: grid;
                    grid-template-columns: 1fr 1px 1fr 1px 1fr;
                    padding: 1.5rem 0.5rem 0 0.5rem;
                    margin-top: 1rem;
                    border-top: 1px solid rgba(255,255,255,0.05);
                }
                .insight-stat { display: flex; flex-direction: column; gap: 6px; }
                .insight-label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
                .insight-value-group { display: flex; align-items: baseline; gap: 8px; }
                .insight-value { font-size: 1.25rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.02em; }
                .insight-trend { font-size: 0.6rem; font-weight: 900; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
                .insight-trend.positive { background: rgba(16, 185, 129, 0.12); color: #10b981; }
                .insight-trend.negative { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
                .insight-divider { width: 1px; height: 100%; background: linear-gradient(to bottom, transparent, var(--border-color), transparent); opacity: 0.3; }
                
                .link-btn {
                    background: rgba(99, 102, 241, 0.1);
                    border: none;
                    color: var(--primary);
                    padding: 0.4rem 0.8rem;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .link-btn:hover { background: var(--primary); color: white; }

                /* Right Column Stack */
                .right-column-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    min-width: 0;
                    width: 100%;
                }

                /* Low Stock Card */
                .low-stock-card .card-header { margin-bottom: 1rem; }
                .badge-count {
                    background: #fee2e2;
                    color: #ef4444;
                    font-size: 0.75rem;
                    font-weight: 800;
                    padding: 0.2rem 0.5rem;
                    border-radius: 6px;
                }
                .stock-list { display: flex; flex-direction: column; gap: 0.75rem; }
                .stock-item {
                    display: flex;
                    align-items: center;
                    gap: 0.85rem;
                    padding: 0.75rem;
                    border-radius: 12px;
                    background: var(--bg-input);
                    border: 1px solid var(--border-color);
                    min-width: 0;
                }
                .stock-icon-box {
                    width: 36px;
                    height: 36px;
                    background: #fee2e2;
                    color: #ef4444;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .stock-info { flex: 1; min-width: 0; }
                .stock-name { font-size: 0.9rem; font-weight: 700; color: var(--text-main); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .stock-sku { font-size: 0.75rem; color: var(--text-muted); margin: 0; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                
                .stock-status {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 4px;
                }
                .stock-value { font-size: 0.85rem; font-weight: 700; color: #ef4444; }
                .stock-bar {
                    width: 40px;
                    height: 4px;
                    background: rgba(239, 68, 68, 0.2);
                    border-radius: 2px;
                    overflow: hidden;
                }
                .stock-fill {
                    height: 100%;
                    background: #ef4444;
                    border-radius: 2px;
                }
                .healthy-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 2rem 0;
                    color: #10b981;
                }
                .healthy-state p { font-size: 0.9rem; font-weight: 600; margin: 0; }

                /* Invoice List */
                .invoices-list { display: flex; flex-direction: column; gap: 0.5rem; }
                .invoice-row {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.85rem 1rem;
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid transparent;
                    min-width: 0;
                }
                .invoice-row:hover { 
                    background: var(--bg-input); 
                    border-color: var(--border-color);
                    transform: translateX(4px);
                }
                .doc-icon {
                    width: 44px;
                    height: 44px;
                    background: var(--bg-input);
                    color: var(--text-muted);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }
                .invoice-row:hover .doc-icon {
                    background: var(--primary);
                    color: white;
                    transform: scale(1.05);
                }
                .inv-info { flex: 1; min-width: 0; }
                .inv-name { font-weight: 700; font-size: 0.95rem; color: var(--text-main); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .inv-date { font-size: 0.8rem; color: var(--text-muted); margin: 0; margin-top: 2px; }
                .inv-amount { font-weight: 800; font-size: 1rem; color: var(--text-main); flex-shrink: 0; }
                .status-badge {
                    font-size: 0.7rem;
                    font-weight: 800;
                    padding: 0.25rem 0.6rem;
                    border-radius: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .status-paid { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .status-pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .status-overdue { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

                /* Date Range Modal */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(8px);
                    z-index: 100;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1.5rem;
                }
                .date-modal {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    border-radius: 28px;
                    width: 100%;
                    max-width: 440px;
                    padding: 2rem;
                    box-shadow: var(--shadow-lg);
                    position: relative;
                }
                .modal-close {
                    position: absolute;
                    top: 1.5rem;
                    right: 1.5rem;
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    opacity: 0.6;
                    transition: opacity 0.2s;
                }
                .modal-close:hover { opacity: 1; }
                .modal-title { font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem; }
                .modal-section-title { font-size: 0.9rem; font-weight: 700; color: var(--text-main); margin: 1.5rem 0 1rem 0; }
                
                .presets-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.6rem;
                }
                .preset-chip {
                    padding: 0.5rem 1rem;
                    border-radius: 99px;
                    background: var(--bg-input);
                    border: 1px solid var(--border-color);
                    color: var(--text-main);
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .preset-chip:hover { border-color: var(--primary); transform: translateY(-1px); }
                .preset-chip.active {
                    background: var(--primary);
                    border-color: var(--primary);
                    color: white;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                }
                
                .modal-body-scrollable {
                    max-height: 60vh;
                    overflow-y: auto;
                    margin: 0 -0.5rem;
                    padding: 0 0.5rem;
                }
                .modal-body-scrollable::-webkit-scrollbar { width: 4px; }
                .modal-body-scrollable::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }

                .custom-section {
                    margin-top: 1.5rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid var(--border-color);
                }

                .custom-range-btn {
                    width: 100%;
                    padding: 0.85rem;
                    background: transparent;
                    border: 1px solid var(--border-color);
                    border-radius: 14px;
                    color: var(--text-main);
                    font-weight: 700;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .custom-range-btn:hover { background: var(--bg-input); border-color: var(--text-muted); }
                .custom-range-btn.active {
                    background: var(--primary);
                    border-color: var(--primary);
                    color: white;
                }

                .custom-inputs {
                    margin-top: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    overflow: hidden;
                }
                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .input-group label {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-muted);
                }
                .input-group input {
                    background: var(--bg-input);
                    border: 1px solid var(--border-color);
                    color: var(--text-main);
                    padding: 0.75rem 1rem;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .input-group input:focus { border-color: var(--primary); }
                .w-full { width: 100%; }
                .mt-4 { margin-top: 1rem; }

                /* Mobile Optimization */
                @media (max-width: 768px) {
                    .hide-on-mobile { display: none !important; }
                    .dashboard-home { overflow-x: hidden; width: 100%; max-width: 100vw; box-sizing: border-box; }
                    .header-section { flex-direction: column; align-items: flex-start; gap: 1.5rem; width: 100%; min-width: 0; }
                    .action-buttons { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
                    .action-buttons button { padding: 0.8rem 0.5rem; font-size: 0.85rem; justify-content: center; border-radius: 12px; }
                    .stats-grid { grid-template-columns: 1fr; gap: 1rem; }
                    .content-split { grid-template-columns: 1fr; }
                    .chart-insights-footer { 
                        grid-template-columns: 1fr; 
                        gap: 1.5rem; 
                        padding: 1.5rem;
                        background: rgba(0,0,0,0.02);
                        border-radius: 16px;
                    }
                    .insight-divider { display: none; }
                    .chart-container { height: 300px; padding: 1rem 0; width: 100%; }
                    .stat-value { font-size: 1.5rem; }
                    .stat-title { font-size: 0.8rem; }
                    .invoice-row { padding: 1rem; gap: 0.75rem; }
                    .inv-info { flex: 1; min-width: 0; }
                    .inv-name { font-size: 0.9rem; }
                    .card { padding: 1rem; }
                }
                @media (max-width: 480px) {
                    .action-buttons { grid-template-columns: 1fr; }
                    .insight-value { font-size: 1.25rem; }
                    .page-title { font-size: 1.75rem; }
                    .stat-card { padding: 1.25rem; }
                    .card { padding: 1rem; border-radius: 16px; }
                    .chart-container { height: 260px; }
                    .chart-container.mini { height: 200px; }
                }
            `}</style>
    </motion.div >
  );
}



function StatsCard({ title, value, change, icon, gradient, isNegative, sparklineData, description }) {
  const [from, to] = gradient.replace('from-', '').replace('to-', '').split(' ');

  return (
    <div className="stat-card">
      <div className="stat-header">
        <div
          className="icon-box heartbeat"
          style={{
            background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
            '--tw-gradient-from': colorMap[from] || from,
            '--tw-gradient-to': colorMap[to] || to
          }}
        >
          {icon}
        </div>
        <div className={`trend-pill ${isNegative ? 'trend-negative' : 'trend-positive'}`}>
          {isNegative ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
          {change}
        </div>
      </div>
      <div className="flex justify-between items-end mt-auto">
        <div className="flex-1">
          <p className="stat-title line-clamp-1">{title}</p>
          <h3 className="stat-value">{value}</h3>
          <p className="stat-desc">
            {change === 'ACTIVE' ? 'Currently' : (isNegative ? 'decreased' : 'increased')} {description || 'from last period'}
          </p>
        </div>
        <div className="sparkline-container h-14 w-28 opacity-70">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={change === 'ACTIVE' ? '#6366f1' : (isNegative ? "#ef4444" : "#10b981")} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={change === 'ACTIVE' ? '#6366f1' : (isNegative ? "#ef4444" : "#10b981")} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={isNegative ? "#ef4444" : "#10b981"}
                fillOpacity={1}
                fill={`url(#grad-${title.replace(/\s/g, '')})`}
                strokeWidth={2}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

const colorMap = {
  'indigo-500': '#6366f1',
  'indigo-400': '#818cf8',
  'purple-500': '#a855f7',
  'emerald-400': '#34d399',
  'emerald-500': '#10b981',
  'cyan-500': '#06b6d4',
  'amber-400': '#fbbf24',
  'orange-500': '#f97316',
  'blue-500': '#3b82f6',
  'teal-400': '#2dd4bf',
  'teal-500': '#14b8a6',
  'amber-500': '#f59e0b',
  'orange-400': '#fb923c',
  'rose-500': '#f43f5e',
  'pink-500': '#ec4899'
};

function InvoiceRow({ name, date, amount, status, onIconClick }) {
  const statusClass = `status-${status.toLowerCase()}`;

  return (
    <div className="invoice-row">
      <div className="doc-icon" onClick={(e) => { e.stopPropagation(); onIconClick?.(); }}>
        <File size={20} />
      </div>
      <div className="inv-info">
        <h4 className="inv-name">{name}</h4>
        <p className="inv-date">{date}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="inv-amount">{amount}</div>
        <div className={`status-badge ${statusClass}`}>{status}</div>
      </div>
      <ChevronRight size={16} className="text-muted opacity-40" />
    </div>
  )
}

