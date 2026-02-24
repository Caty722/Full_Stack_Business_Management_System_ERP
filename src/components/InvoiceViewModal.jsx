import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, Download, X } from 'lucide-react'
import GSTInvoiceLayout, { numberToWords, formatEliteDate } from './GSTInvoiceLayout'
import NonGSTInvoiceLayout from './NonGSTInvoiceLayout'
import regalCleanLogo from '../assets/ferwa_regal_clean_logo.png'

const InvoiceViewModal = ({ inv, onClose, products, customers, onDownloadPDF, isGeneratingPDF, brands, isHidden }) => {
    const [activeTemplate, setActiveTemplate] = useState('modern')
    const [visibleSections, setVisibleSections] = useState({
        customer: true,
        transport: false,
        supplier: false,
        delivery: false
    })
    const [showWatermark, setShowWatermark] = useState(false)
    const [accentColor] = useState('#6366f1')
    const [fontFamily] = useState('sans')
    const [density] = useState('compact')
    const [backgroundTexture] = useState('none')

    if (!inv) return null

    // Use dynamic store info from brands config if available, fallback to hardcoded (for safety)
    const storeInfo = (brands ? (inv.isGST ? brands.GST : brands.NON_GST) : null) || {
        name: inv.isGST ? "Ferwa Regal Clean" : "Ferwa One",
        address: "Near Town Railway Station, Salem East, TAMIL NADU, 636001",
        address1: "Near Town Railway Station,",
        address2: "Salem East, TAMIL NADU, 636001",
        mobile: "+91 9003668877",
        email: inv.isGST ? "ferwa.regal@gmail.com" : "ferwa.one@gmail.com",
        gstin: inv.isGST ? "33ACSPF1494M1Z6" : "",
        state: "Tamil Nadu",
        stateCode: "33",
        bankName: "Union Bank Of India",
        accountNo: "584101010050477",
        ifsc: "UBIN0558419",
        branch: "Ramakrishana Road Hasthampatti salem",
        city: "Salem",
        pincode: "636001"
    }

    const customerData = customers?.find(c =>
        c.name?.trim().toLowerCase() === inv.customer?.trim().toLowerCase()
    )
    const billingAddr = inv.customerAddress || customerData?.address || "Address not provided"

    const displayItems = inv.items || [
        { productId: 1, name: "Service/Product", price: inv.total, quantity: 1 }
    ]

    const templates = [
        { id: 'modern', name: 'Modern Regal', icon: '✨' }
    ]

    if (isHidden) {
        return createPortal(
            <div style={{ position: 'fixed', left: '-9999px', top: '0', pointerEvents: 'none', zIndex: -1000, opacity: 0 }}>
                <div id="printable-invoice" className="multi-copy-container">
                    <div
                        className={`invoice-document ${activeTemplate} font-${fontFamily} density-${density} texture-${backgroundTexture}`}
                        style={{ '--accent': accentColor, '--accent-light': `${accentColor}cc`, '--accent-alpha': `${accentColor}40` }}
                    >
                        {inv.isGST ? (
                            <GSTInvoiceLayout
                                inv={inv}
                                storeInfo={storeInfo}
                                customerData={customerData}
                                billingAddr={billingAddr}
                                displayItems={displayItems}
                                products={products}
                                numberToWords={numberToWords}
                                copyKey="customer"
                                formatEliteDate={formatEliteDate}
                            />
                        ) : (
                            <NonGSTInvoiceLayout
                                inv={inv}
                                storeInfo={storeInfo}
                                customerData={customerData}
                                billingAddr={billingAddr}
                                displayItems={displayItems}
                                products={products}
                                copyKey="customer"
                            />
                        )}
                    </div>
                </div>
            </div>,
            document.body
        )
    }

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content view-invoice-complex glass-card" onClick={e => e.stopPropagation()}>

                {/* Superior Toolbar */}
                <div className="view-modal-toolbar">
                    <div className="toolbar-left">
                        <div className="header-badge">Preview Mode</div>
                        <h2 className="modal-title">Invoice {inv.id}</h2>
                    </div>
                    <div className="toolbar-right">
                        <button className="toolbar-btn primary" onClick={() => window.print()}>
                            <Printer size={16} /> Print
                        </button>
                        <button className="toolbar-btn secondary" onClick={() => onDownloadPDF(inv)}>
                            <Download size={16} /> Download
                        </button>
                        <button className="close-btn-v2" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="view-modal-main">
                    {/* Left Sidebar Controls */}
                    <aside className="view-sidebar">
                        <div className="sidebar-section">
                            <h4 className="section-label">Selected Template</h4>
                            <div className="template-card active" style={{ cursor: 'default' }}>
                                <span className="template-icon">✨</span>
                                <span className="template-name">Modern Regal</span>
                            </div>
                        </div>

                        <div className="sidebar-section">
                            <h4 className="section-label">Copies to Print</h4>
                            <div className="toggle-list">
                                {Object.keys(visibleSections).map(key => (
                                    <label key={key} className="premium-toggle">
                                        <span className="toggle-label">{key.charAt(0).toUpperCase() + key.slice(1)} copy</span>
                                        <input
                                            type="checkbox"
                                            checked={visibleSections[key]}
                                            onChange={() => setVisibleSections({ ...visibleSections, [key]: !visibleSections[key] })}
                                        />
                                        <div className="toggle-switch-ui"></div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="sidebar-section">
                            <label className="premium-toggle">
                                <span className="toggle-label">Enable Watermark</span>
                                <input
                                    type="checkbox"
                                    checked={showWatermark}
                                    onChange={() => setShowWatermark(!showWatermark)}
                                />
                                <div className="toggle-switch-ui"></div>
                            </label>
                        </div>
                    </aside>

                    {/* Document Preview Area */}
                    <div className="document-preview-area">
                        <div id="printable-invoice" className="multi-copy-container">
                            {Object.keys(visibleSections).filter(key => visibleSections[key]).map((copyKey, index) => (
                                <div
                                    key={copyKey}
                                    className={`invoice-document ${activeTemplate} ${index > 0 ? 'print-page-break' : ''} font-${fontFamily} density-${density} texture-${backgroundTexture}`}
                                    style={{ '--accent': accentColor, '--accent-light': `${accentColor}cc`, '--accent-alpha': `${accentColor}40` }}
                                >
                                    {showWatermark && <div className="watermark-overlay">FERWA ORIGINAL</div>}

                                    {inv.isGST ? (
                                        <GSTInvoiceLayout
                                            inv={inv}
                                            storeInfo={storeInfo}
                                            customerData={customerData}
                                            billingAddr={billingAddr}
                                            displayItems={displayItems}
                                            products={products}
                                            numberToWords={numberToWords}
                                            copyKey={copyKey}
                                            formatEliteDate={formatEliteDate}
                                        />
                                    ) : (
                                        <NonGSTInvoiceLayout
                                            inv={inv}
                                            storeInfo={storeInfo}
                                            customerData={customerData}
                                            billingAddr={billingAddr}
                                            displayItems={displayItems}
                                            products={products}
                                            copyKey={copyKey}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}

export default InvoiceViewModal
