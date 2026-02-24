import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useShop } from '../../context/ShopContext'
import { Search, ChevronDown, Check, TrendingUp, Tag, Loader2, RotateCcw, Download, Percent, UserCheck, ArrowUpDown, ChevronLeft, ChevronRight, X } from 'lucide-react'

const CustomerPricing = () => {
    const { products, customers, customerPrices, updateCustomerPrice, removeCustomerPrice } = useShop()
    const [selectedCustomerId, setSelectedCustomerId] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [showDiscountModal, setShowDiscountModal] = useState(false)
    const [bulkDiscount, setBulkDiscount] = useState('')
    const dropdownRef = useRef(null)
    const portalRef = useRef(null) // Added for Portal click detection
    const [dropdownRect, setDropdownRect] = useState(null)

    // Sorting & Pagination State
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    const [customerTypeFilter, setCustomerTypeFilter] = useState('gst')

    const selectedCustomer = customers.find(c => String(c.id) === String(selectedCustomerId))

    const filteredCustomers = customers.filter(c => {
        if (customerTypeFilter === 'gst') return c.isGST
        if (customerTypeFilter === 'nongst') return !c.isGST
        return true
    })

    // Close dropdown when clicking outside and handle real-time positioning
    useEffect(() => {
        const updatePosition = () => {
            if (isDropdownOpen && dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect()
                setDropdownRect(rect)
            }
        }

        const handleClickOutside = (event) => {
            const isOutsideTrigger = dropdownRef.current && !dropdownRef.current.contains(event.target)
            const isOutsidePortal = !portalRef.current || !portalRef.current.contains(event.target)

            if (isOutsideTrigger && isOutsidePortal) {
                setIsDropdownOpen(false)
            }
        }

        if (isDropdownOpen) {
            updatePosition()
            window.addEventListener('scroll', updatePosition, true) // useCapture to catch scroll in parents
            window.addEventListener('resize', updatePosition)
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            window.removeEventListener('scroll', updatePosition, true)
            window.removeEventListener('resize', updatePosition)
        }
    }, [isDropdownOpen])

    // Sorting Logic
    const handleSort = (key) => {
        let direction = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const processedProducts = useMemo(() => {
        let processed = products
            .filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.gstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
            )

        if (sortConfig.key) {
            processed.sort((a, b) => {
                let aValue = a[sortConfig.key]
                let bValue = b[sortConfig.key]

                // Custom sorting for computed fields
                if (sortConfig.key === 'customPrice') {
                    aValue = customerPrices[`${selectedCustomerId}_${a.id}`] || a.price
                    bValue = customerPrices[`${selectedCustomerId}_${b.id}`] || b.price
                } else if (sortConfig.key === 'status') {
                    const aHasPrice = customerPrices[`${selectedCustomerId}_${a.id}`] !== undefined
                    const bHasPrice = customerPrices[`${selectedCustomerId}_${b.id}`] !== undefined
                    aValue = aHasPrice ? 1 : 0
                    bValue = bHasPrice ? 1 : 0
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        }
        return processed
    }, [products, selectedCustomer, searchQuery, sortConfig])

    // Note: customerPrices is NOT in the dependency array to prevent jumping while editing
    const totalPages = Math.max(1, Math.ceil(processedProducts.length / itemsPerPage))
    const paginatedProducts = processedProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Reset page on search or filter change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, selectedCustomerId])

    const handlePriceUpdate = async (productId, price) => {
        setIsSaving(true)
        try {
            if (price === '' || price === undefined) {
                await removeCustomerPrice(selectedCustomerId, productId)
            } else {
                await updateCustomerPrice(selectedCustomerId, productId, parseFloat(price))
            }
        } catch (error) {
            console.error('Error updating price:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const applyBulkDiscount = async () => {
        if (!bulkDiscount || !selectedCustomerId) return
        setIsSaving(true)
        try {
            const discountValue = parseFloat(bulkDiscount) / 100
            const customerProducts = products

            for (const product of customerProducts) {
                const discountedPrice = Math.round(product.price * (1 - discountValue))
                await updateCustomerPrice(selectedCustomerId, product.id, discountedPrice)
            }
            setShowDiscountModal(false)
            setBulkDiscount('')
        } catch (error) {
            console.error('Error applying bulk discount:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const resetAllRates = async () => {
        if (!window.confirm('Reset all custom rates for this customer?')) return
        setIsSaving(true)
        try {
            const customerProducts = products
            for (const product of customerProducts) {
                await removeCustomerPrice(selectedCustomerId, product.id)
            }
        } catch (error) {
            console.error('Error resetting rates:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const exportToCSV = () => {
        if (!selectedCustomer) return
        const customerProducts = products
        const csvRows = [
            ['Product Name', 'SKU', 'Market Rate', 'Customer Rate', 'Discount %'],
            ...customerProducts.map(p => {
                const priceKey = `${selectedCustomerId}_${p.id}`
                const customPrice = customerPrices[priceKey] || p.price
                const discount = Math.round(((p.price - customPrice) / p.price) * 100)
                return [p.name, p.sku || 'N/A', p.price, customPrice, `${discount}%`]
            })
        ]

        const csvContent = csvRows.map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `pricing_${selectedCustomer.name.replace(/\s+/g, '_').toLowerCase()}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const globalTotalCustomPrices = Object.keys(customerPrices || {}).length

    return (
        <div className="pt-2 px-10 pb-10 w-full mx-auto" style={{ minHeight: '100vh', color: 'var(--text-main)' }}>
            {/* Header Section */}
            <div className="page-header mb-8">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary border border-primary/20 shadow-premium">
                        <Tag size={40} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl lg:text-5xl font-black tracking-tighter text-main">Customer Pricing</h1>
                        <p className="text-muted text-sm lg:text-lg font-medium opacity-60">
                            Configure exclusive tiered rates for individual client accounts.
                        </p>
                    </div>
                </div>

                <div className="header-actions">
                    <div className="standard-tabs-wrapper" style={{ minWidth: '240px' }}>
                        <div
                            className="standard-tabs-indicator"
                            style={{
                                top: '6px',
                                bottom: '6px',
                                left: customerTypeFilter === 'gst' ? '6px' : 'calc(50% + 3px)',
                                width: 'calc(50% - 9px)',
                                position: 'absolute',
                                zIndex: 1,
                                height: 'calc(100% - 12px)'
                            }}
                        />
                        <button
                            className={`standard-tabs-btn ${customerTypeFilter === 'gst' ? 'active' : ''}`}
                            onClick={() => {
                                setCustomerTypeFilter('gst')
                                setSelectedCustomerId('')
                            }}
                        >
                            GST
                        </button>
                        <button
                            className={`standard-tabs-btn ${customerTypeFilter === 'nongst' ? 'active' : ''}`}
                            onClick={() => {
                                setCustomerTypeFilter('nongst')
                                setSelectedCustomerId('')
                            }}
                        >
                            NON-GST
                        </button>
                    </div>

                    {/* Global Stats */}
                    <div className="bg-glass border-subtle px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm" style={{ minWidth: '200px' }}>
                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-muted uppercase tracking-widest">Overrides</div>
                            <div className="text-2xl font-black tracking-tight text-main">{globalTotalCustomPrices}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selection Toolbar - CONSOLIDATED & REFINED */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-16 p-4 rounded-3xl bg-glass border-subtle shadow-premium relative z-[100]">

                <div className="hidden md:block" style={{ width: '1px', height: '32px', backgroundColor: 'var(--border-color)', margin: '0 8px', opacity: 0.3 }} />

                {/* Customer Selection Dropdown */}
                <div className="flex-1 relative" ref={dropdownRef}>
                    <button
                        className={`w-full h-14 flex items-center justify-between rounded-2xl px-5 transition-all bg-subtle border-subtle hover:bg-surface ${isDropdownOpen ? 'ring-2 ring-primary border-transparent' : ''}`}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        {selectedCustomer ? (
                            <div className="flex items-center justify-between w-full pr-2">
                                <div className="flex items-center gap-3">
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        background: 'linear-gradient(135deg, var(--color-primary), #4f46e5)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: '900',
                                        color: '#fff'
                                    }}>
                                        {selectedCustomer.name.charAt(0)}
                                    </div>
                                    <div className="text-left" style={{ overflow: 'hidden' }}>
                                        <div className="text-main font-bold" style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedCustomer.name}</div>
                                        <div className="text-muted font-black" style={{ fontSize: '9px', letterSpacing: '0.1em', opacity: 0.6 }}>{selectedCustomer.phone || 'NO PHONE'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCustomerId('');
                                            setIsDropdownOpen(false);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors"
                                        title="Clear Selection"
                                    >
                                        <X size={16} />
                                    </button>
                                    <ChevronDown size={18} className="text-muted" style={{ transition: '0.3s', transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }} />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 opacity-60 text-muted italic" style={{ fontSize: '14px' }}>
                                    <Search size={16} />
                                    <span>Choose the customer</span>
                                </div>
                                <ChevronDown size={18} className="text-muted" style={{ transition: '0.3s', transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }} />
                            </>
                        )}
                    </button>

                    {isDropdownOpen && dropdownRect && createPortal(
                        <div
                            ref={portalRef}
                            className="bg-glass border-subtle rounded-2xl shadow-premium"
                            style={{
                                position: 'fixed',
                                top: `${dropdownRect.bottom + 8}px`,
                                left: `${dropdownRect.left}px`,
                                width: `${dropdownRect.width}px`,
                                zIndex: 9999,
                                padding: '12px',
                                maxHeight: '350px',
                                overflowY: 'auto'
                            }}
                        >
                            <div className="px-4 py-2 mb-2 text-[10px] font-black text-muted/60 uppercase tracking-widest border-b border-subtle/50">
                                Choose the customer
                            </div>
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map(customer => (
                                    <button
                                        key={customer.id}
                                        className="w-full flex items-center justify-between rounded-xl transition-all"
                                        style={{
                                            padding: '12px 16px',
                                            marginBottom: '2px',
                                            backgroundColor: String(selectedCustomerId) === String(customer.id) ? 'var(--bg-subtle)' : 'transparent',
                                            border: String(selectedCustomerId) === String(customer.id) ? '1px solid var(--border-color)' : '1px solid transparent'
                                        }}
                                        onClick={() => {
                                            setSelectedCustomerId(customer.id.toString())
                                            setIsDropdownOpen(false)
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                backgroundColor: String(selectedCustomerId) === String(customer.id) ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '11px',
                                                fontWeight: '900',
                                                color: String(selectedCustomerId) === String(customer.id) ? '#fff' : 'var(--text-muted)'
                                            }}>
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-main font-bold" style={{ fontSize: '14px' }}>{customer.name}</div>
                                                <div className="text-muted font-black" style={{ fontSize: '9px', letterSpacing: '0.1em', opacity: 0.6 }}>{customer.phone || 'NO PHONE'}</div>
                                            </div>
                                        </div>
                                        {String(selectedCustomerId) === String(customer.id) && <Check size={14} color="var(--color-primary)" />}
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center text-muted font-black text-xs tracking-widest opacity-40">NO CUSTOMERS FOUND</div>
                            )}
                        </div>,
                        document.body
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <main className="relative" style={{ minHeight: '500px' }}>
                {!selectedCustomer ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="relative mb-10">
                            <div className="absolute inset-0 bg-primary/20 filter blur-[80px] rounded-full"></div>
                            <div className="bg-glass border-subtle rounded-3xl flex items-center justify-center relative shadow-premium w-36 h-36 transform rotate-3 hover:rotate-6 transition-all duration-500 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                                <UserCheck size={56} className="text-main opacity-40 relative z-10" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black mb-4 tracking-tight text-main brightness-125">Configuration Locked</h2>
                        <p className="text-muted font-medium max-w-xs mx-auto opacity-70">
                            Select a customer account using the toolbar above to start configuring their specialized pricing tiers.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Table Header & Controls */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-glass p-8 rounded-3xl border-subtle shadow-premium">
                            <div>
                                <div className="flex items-center gap-4 mb-2">
                                    <h3 className="text-3xl font-black italic text-main">Inventory Price Matrix</h3>
                                    {isSaving ? (
                                        <div className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black tracking-widest flex items-center gap-2 border border-primary/20">
                                            <Loader2 size={12} className="animate-spin" />
                                            SAVING TO CLOUD
                                        </div>
                                    ) : (
                                        <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-black tracking-widest flex items-center gap-2 border border-emerald-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                            CONNECTED & LIVE
                                        </div>
                                    )}
                                </div>
                                <p className="text-muted font-medium flex items-center gap-2">
                                    Editing rates for <span className="text-main font-black underline decoration-primary underline-offset-4">{selectedCustomer.name}</span>
                                </p>
                            </div>

                            <div className="bulk-actions-wrapper flex items-center gap-4 flex-wrap">
                                <button
                                    onClick={() => setShowDiscountModal(true)}
                                    className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white text-sm font-black hover:brightness-110 active:scale-95 transition-all shadow-premium"
                                >
                                    <Percent size={18} />
                                    Apply Bulk Discount
                                </button>
                                <button
                                    onClick={exportToCSV}
                                    className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-glass border-subtle text-main text-sm font-black hover:bg-subtle transition-all active:scale-95"
                                >
                                    <Download size={18} />
                                    Export CSV
                                </button>
                                <button
                                    onClick={resetAllRates}
                                    className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-subtle border-red-subtle transition-all active:scale-95 shadow-lg shadow-red-500/5 hover:brightness-110"
                                >
                                    <RotateCcw size={18} className="text-red-solid" />
                                    <span className="text-red-solid text-sm font-black">Reset Rates</span>
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex items-center group bg-glass border-subtle rounded-3xl overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 transition-all pl-8">
                            <Search className="text-muted group-focus-within:text-primary transition-colors flex-shrink-0" size={24} />
                            <input
                                type="text"
                                placeholder="Search inventory by name or SKU..."
                                className="w-full bg-transparent border-none pl-6 pr-10 py-6 text-xl focus:outline-none text-main placeholder-muted"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Product Grid */}
                        <div className="bg-glass border-subtle rounded-3xl overflow-hidden shadow-premium flex flex-col">
                            <div className="table-responsive">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-subtle border-b border-subtle">
                                            <th
                                                className="py-6 px-10 text-left text-xs font-black text-muted uppercase tracking-widest cursor-pointer hover:text-main transition-colors group select-none"
                                                onClick={() => handleSort('name')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Inventory Details
                                                    <ArrowUpDown size={14} className={`transition-opacity ${sortConfig.key === 'name' ? 'opacity-100 text-primary' : 'opacity-30 group-hover:opacity-60'}`} />
                                                </div>
                                            </th>
                                            <th
                                                className="py-6 px-10 text-right text-xs font-black text-muted uppercase tracking-widest cursor-pointer hover:text-main transition-colors group select-none"
                                                onClick={() => handleSort('price')}
                                            >
                                                <div className="flex items-center justify-end gap-2">
                                                    Market Rate
                                                    <ArrowUpDown size={14} className={`transition-opacity ${sortConfig.key === 'price' ? 'opacity-100 text-primary' : 'opacity-30 group-hover:opacity-60'}`} />
                                                </div>
                                            </th>
                                            <th
                                                className="py-6 px-10 text-left text-xs font-black text-muted uppercase tracking-widest cursor-pointer hover:text-main transition-colors group select-none"
                                                onClick={() => handleSort('customPrice')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Customer Rate
                                                    <ArrowUpDown size={14} className={`transition-opacity ${sortConfig.key === 'customPrice' ? 'opacity-100 text-primary' : 'opacity-30 group-hover:opacity-60'}`} />
                                                </div>
                                            </th>
                                            <th
                                                className="py-6 px-10 text-center text-xs font-black text-muted uppercase tracking-widest cursor-pointer hover:text-main transition-colors group select-none"
                                                onClick={() => handleSort('status')}
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    Status
                                                    <ArrowUpDown size={14} className={`transition-opacity ${sortConfig.key === 'status' ? 'opacity-100 text-primary' : 'opacity-30 group-hover:opacity-60'}`} />
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-subtle">
                                        {paginatedProducts.length > 0 ? (
                                            paginatedProducts.map(product => {
                                                const priceKey = `${selectedCustomerId}_${product.id}`
                                                const customPrice = customerPrices[priceKey]
                                                const hasCustomPrice = customPrice !== undefined && customPrice !== ''

                                                const rawDiscount = ((product.price - customPrice) / product.price) * 100
                                                const displayDiscount = customPrice > 0 && rawDiscount >= 99.5
                                                    ? "99.9"
                                                    : Math.round(rawDiscount)

                                                return (
                                                    <tr key={product.id} className="hover:bg-subtle/30 transition-all group">
                                                        <td className="py-6 px-10">
                                                            <div className="space-y-1.5">
                                                                <div className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors text-main">
                                                                    {selectedCustomer?.isGST ? (
                                                                        // GST Section: GST Name on Top, Internal below
                                                                        product.gstName ? (
                                                                            <>
                                                                                <div style={{ color: '#6366f1' }}>{product.gstName}</div>
                                                                                <div style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 500 }}>Internal: {product.name}</div>
                                                                            </>
                                                                        ) : (
                                                                            product.name
                                                                        )
                                                                    ) : (
                                                                        // Non-GST Section: Internal Name on Top, GST below
                                                                        <>
                                                                            <div>{product.name}</div>
                                                                            {product.gstName && (
                                                                                <div style={{ color: '#6366f1', fontSize: '0.8rem', opacity: 0.8, fontWeight: 500 }}>GST: {product.gstName}</div>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="px-2.5 py-0.5 bg-subtle rounded-md text-[10px] font-black text-muted border border-subtle tracking-widest uppercase">
                                                                        {product.sku || 'N/A'}
                                                                    </div>
                                                                    {product.isGST && <div className="text-[10px] font-black text-primary border border-primary/20 px-2 py-0.5 rounded-md bg-primary/10 tracking-widest">GST</div>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-6 px-10 text-right">
                                                            <div className="text-xl font-bold text-muted opacity-80 tabular-nums">₹{product.price.toLocaleString()}</div>
                                                        </td>
                                                        <td className="py-6 px-10">
                                                            <div className="relative w-full max-w-[200px]">
                                                                <input
                                                                    type="number"
                                                                    placeholder={product.price}
                                                                    className={`w-full bg-glass border-2 rounded-xl py-3 px-5 font-bold text-lg focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all ${hasCustomPrice ? 'border-primary text-main shadow-sm' : 'border-subtle text-muted'}`}
                                                                    value={hasCustomPrice ? customPrice : ''}
                                                                    onChange={(e) => handlePriceUpdate(product.id, e.target.value)}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="py-6 px-10 text-center">
                                                            {hasCustomPrice ? (
                                                                <div className="inline-flex flex-col items-center gap-1">
                                                                    <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black tracking-widest border border-primary/20">SPECIAL</div>
                                                                    <div className="text-[10px] font-black text-emerald-500">{displayDiscount}% OFF</div>
                                                                </div>
                                                            ) : (
                                                                <div className="px-3 py-1 rounded-full bg-subtle text-muted text-[10px] font-black tracking-widest border border-subtle opacity-50">DEFAULT</div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="py-20 text-center text-muted opacity-50 font-medium">
                                                    No products found matching your search.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Footer */}
                            <div className="sales-footer" style={{ borderTop: '1px solid var(--border-color)', background: 'transparent' }}>
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
                    </div>
                )}
            </main>

            {/* Bulk Discount Modal */}
            {showDiscountModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/60">
                    <div className="bg-glass border-subtle max-w-lg w-full p-6 lg:p-12 shadow-premium relative rounded-3xl">
                        <div className="space-y-3 mb-8 lg:mb-12 text-center">
                            <h3 className="text-2xl lg:text-4xl font-black text-main tracking-tighter">Bulk Discounts</h3>
                            <p className="text-muted text-sm lg:text-base font-medium opacity-60">Applying percentage reduction for <span className="text-main font-black">{selectedCustomer.name}</span>.</p>
                        </div>

                        <div className="space-y-8 lg:space-y-10">
                            <div className="relative">
                                <label className="absolute -top-3 left-8 bg-glass px-3 text-[10px] font-black text-primary uppercase tracking-widest z-10">Discount %</label>
                                <div className="relative">
                                    <Percent className="absolute left-6 lg:left-8 top-1/2 -translate-y-1/2 text-primary" size={24} />
                                    <input
                                        type="number"
                                        className="w-full h-16 lg:h-24 bg-subtle border-2 border-subtle rounded-2xl lg:rounded-3xl pl-16 lg:pl-20 pr-10 text-3xl lg:text-5xl font-black focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-main"
                                        value={bulkDiscount}
                                        onChange={(e) => setBulkDiscount(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 lg:gap-6">
                                <button
                                    onClick={() => setShowDiscountModal(false)}
                                    className="h-14 lg:h-20 rounded-2xl lg:rounded-3xl bg-glass border-subtle text-main font-black text-base lg:text-lg hover:bg-subtle transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={applyBulkDiscount}
                                    disabled={!bulkDiscount}
                                    className="h-14 lg:h-20 rounded-2xl lg:rounded-3xl bg-primary text-white font-black text-base lg:text-lg hover:brightness-110 shadow-premium transition-all disabled:opacity-50"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @media (max-width: 1024px) {
                    .p-10 { padding: 1.5rem !important; }
                    .mb-16 { margin-bottom: 2rem !important; }
                    .header-section { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
                    .stats-grid { grid-template-columns: 1fr; }
                    .toolbar-pill-group { display: none !important; }
                }

                @media (max-width: 768px) {
                    .flex-row { flex-direction: column; }
                    .flex-col-mobile { flex-direction: column; gap: 1rem; }
                    .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
                    .table-responsive table { min-width: 800px; }
                    .p-8 { padding: 1.25rem !important; }
                    .text-3xl { font-size: 1.5rem !important; }
                    .px-10 { px: 1rem !important; }
                    .bg-glass.shadow-premium { padding: 1.25rem !important; border-radius: 20px !important; }
                    .Selection-Toolbar { gap: 1rem !important; }
                    .bulk-actions-wrapper { width: 100%; display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
                    .bulk-actions-wrapper button { width: 100%; justify-content: center; padding: 1rem !important; }
                    .input-price-mobile { width: 100% !important; max-width: none !important; }
                }
            `}</style>
        </div>
    )
}

export default CustomerPricing
