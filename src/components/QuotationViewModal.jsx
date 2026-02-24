import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, Download, X } from 'lucide-react'
import QuotationLayout from './QuotationLayout'
import { numberToWords } from './GSTInvoiceLayout'

const QuotationViewModal = ({ quotation, onClose, products, customers, onDownloadPDF, isGeneratingPDF, brands, isHidden }) => {
    if (!quotation) return null

    // ... (rest remains unchanged)
    const storeInfo = (brands ? brands.GST : null) || {
        name: "Bawa Kunangudi Packaging", // Hardcoded from image
        address: "104-1, Omalur Main Road",
        address1: "104-1, Omalur Main Road",
        city: "Salem",
        pincode: "636 007",
        gstin: "33ACSPF1494M1Z6",
        state: "Tamil Nadu",
        stateCode: "33",
        // Fallbacks
        mobile: "+91 9003668877",
        email: "ferwa.regal@gmail.com",
    }

    const activeStorevInfo = (brands ? brands.GST : null) || {
        name: "Ferwa Regal Clean",
        address: "Near Town Railway Station, Salem East, TAMIL NADU, 636001",
        address1: "Near Town Railway Station,",
        address2: "Salem East, TAMIL NADU, 636001",
        mobile: "+91 9003668877",
        email: "ferwa.regal@gmail.com",
        gstin: "33ACSPF1494M1Z6",
        state: "Tamil Nadu",
        stateCode: "33",
        city: "Salem",
        pincode: "636001"
    }

    const customerData = customers?.find(c =>
        c.name?.trim().toLowerCase() === quotation.customer?.trim().toLowerCase()
    )
    const billingAddr = quotation.customerAddress || customerData?.address || "Address not provided"

    // Construct display items with product details
    const displayItems = (quotation.items || []).map(item => {
        // If product ID exists, get details, else use item details
        // Layout handles lookup, so just pass item 
        return item
    })

    if (isHidden) {
        return createPortal(
            <div style={{ position: 'fixed', left: '-9999px', top: '0', pointerEvents: 'none', zIndex: -1000, opacity: 0 }}>
                <div id="invoice-capture-area" className="invoice-paper">
                    <QuotationLayout
                        quotation={quotation}
                        storeInfo={activeStorevInfo}
                        customerData={customerData}
                        billingAddr={billingAddr}
                        displayItems={displayItems}
                        products={products}
                    />
                </div>
                <style>{`.invoice-paper { width: 100%; max-width: 794px; min-height: auto; background: white; padding: 0; position: relative; margin: 0 auto; }`}</style>
            </div>,
            document.body
        )
    }

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content view-invoice-complex glass-card" onClick={e => e.stopPropagation()}>

                {/* Toolbar */}
                <div className="view-modal-toolbar">
                    <div className="toolbar-left">
                        <div className="header-badge">Quotation</div>
                        <h2 className="modal-title">{quotation.id}</h2>
                    </div>
                    <div className="toolbar-right">
                        <button className="toolbar-btn primary" onClick={() => window.print()}>
                            <Printer size={16} /> Print
                        </button>
                        <button className="toolbar-btn secondary" onClick={() => onDownloadPDF(quotation)}>
                            <Download size={16} /> Download PDF
                        </button>
                        <button className="close-btn-v2" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="view-modal-main" style={{ justifyContent: 'center' }}>
                    {/* Preview Area - Centered, no sidebar */}
                    <div className="invoice-preview-wrapper" style={{ margin: '0 auto' }}>
                        <div id="invoice-capture-area" className="invoice-paper">
                            <QuotationLayout
                                quotation={quotation}
                                storeInfo={activeStorevInfo}
                                customerData={customerData}
                                billingAddr={billingAddr}
                                displayItems={displayItems}
                                products={products}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
                .view-invoice-complex { width: 95vw; height: 95vh; display: flex; flex-direction: column; background: var(--bg-body); border-radius: 16px; overflow: hidden; }
                .view-modal-toolbar { padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); border-bottom: 1px solid var(--border-color); }
                .view-modal-main { flex: 1; display: flex; overflow: hidden; background: #525659; padding: 2rem; overflow-y: auto; }
                .invoice-preview-wrapper { background: white; box-shadow: 0 0 20px rgba(0,0,0,0.3); transform-origin: top center; transition: transform 0.2s; }
                .invoice-paper { width: 100%; max-width: 794px; min-height: auto; background: white; padding: 0; position: relative; margin: 0 auto; }
                
                .toolbar-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; transition: 0.2s; }
                .toolbar-btn.primary { background: #6366f1; color: white; }
                .toolbar-btn.secondary { background: var(--bg-subtle); color: var(--text-main); }
                .close-btn-v2 { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.5rem; }
                
                @media print {
                    .view-modal-toolbar, .modal-overlay { display: none !important; }
                    .modal-content { position: static; width: auto; height: auto; background: white; overflow: visible; }
                    .view-modal-main { padding: 0; background: white; overflow: visible; display: block; }
                    .invoice-preview-wrapper { box-shadow: none; margin: 0; }
                    @page { size: A4; margin: 10mm; }
                    body { visibility: hidden; }
                    #invoice-capture-area { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; }
                }
            `}</style>
        </div>,
        document.body
    )
}

export default QuotationViewModal
