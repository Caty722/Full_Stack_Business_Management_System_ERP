import React from 'react'
import { formatEliteDate, numberToWords } from './GSTInvoiceLayout'

const QuotationLayout = ({ quotation, storeInfo, customerData, billingAddr, displayItems, products }) => {
    const totalQty = displayItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0)

    // Tax calculation logic should match QuotationBuilderModal
    const subtotal = displayItems.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseFloat(item.quantity || 0)), 0)

    let discountAmount = 0
    if (quotation.hasDiscount) {
        if (quotation.discountType === 'percentage') {
            discountAmount = (subtotal * (parseFloat(quotation.discountValue) || 0)) / 100
        } else {
            discountAmount = parseFloat(quotation.discountValue) || 0
        }
    }

    let taxAmount = 0
    if (quotation.hasTax || quotation.isGST) {
        if (quotation.taxType === 'percentage' || !quotation.taxType) {
            taxAmount = ((subtotal - discountAmount) * (parseFloat(quotation.taxValue || quotation.tax) || 0)) / 100
        } else {
            taxAmount = parseFloat(quotation.taxValue || quotation.tax) || 0
        }
    }

    const finalTotal = subtotal - discountAmount + taxAmount

    const halfTaxPercent = (parseFloat(quotation.taxValue || quotation.tax) || 0) / 2
    const cgstAmount = taxAmount / 2
    const sgstAmount = taxAmount / 2

    return (
        <div className="gst-invoice-container quotation-layout">
            <div className="gst-main-header">QUOTATION / ESTIMATE</div>

            <div className="gst-grid" style={{ display: 'flex', flexDirection: 'column', minHeight: 'auto' }}>
                {/* Top Info Section */}
                <div className="gst-row" style={{ height: 'auto' }}>
                    <div className="gst-col gst-col-60" style={{ padding: '4px 12px' }}>
                        <div className="gst-company-name">{storeInfo.name}</div>
                        <table className="gst-high-density-table">
                            <tbody>
                                <tr>
                                    <td className="label-col">Address</td>
                                    <td className="colon-col">:</td>
                                    <td className="value-col">{storeInfo.address}</td>
                                </tr>
                                <tr>
                                    <td className="label-col">Place</td>
                                    <td className="colon-col">:</td>
                                    <td className="value-col">{storeInfo.place || storeInfo.city} - {storeInfo.pincode}</td>
                                </tr>
                                {storeInfo.gstin && (
                                    <tr>
                                        <td className="label-col">GSTIN/UIN</td>
                                        <td className="colon-col">:</td>
                                        <td className="value-col">{storeInfo.gstin}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td className="label-col">State</td>
                                    <td className="colon-col">:</td>
                                    <td className="value-col">{storeInfo.state}, Code : {storeInfo.stateCode}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="gst-col gst-col-40" style={{ padding: 0 }}>
                        <div className="gst-row" style={{ borderBottom: '1.5px solid #000', flex: 1 }}>
                            <div className="gst-col" style={{ flex: 1, padding: '12px 0px', justifyContent: 'center' }}>
                                <table className="gst-high-density-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                                    <tbody>
                                        <tr style={{ height: '30px' }}>
                                            <td className="label-col" style={{ paddingLeft: '12px', width: '90px', fontSize: '0.9rem', fontWeight: '900', verticalAlign: 'middle' }}>Quote No</td>
                                            <td className="colon-col" style={{ width: '20px', textAlign: 'center', fontWeight: '900', fontSize: '0.9rem', verticalAlign: 'middle' }}>:</td>
                                            <td className="gst-invoice-detail-value" style={{ fontSize: '1rem', fontWeight: '900', whiteSpace: 'nowrap', verticalAlign: 'middle', paddingLeft: '4px' }}>{quotation.id}</td>
                                        </tr>
                                        <tr style={{ height: '30px' }}>
                                            <td className="label-col" style={{ paddingLeft: '12px', width: '90px', fontSize: '0.9rem', fontWeight: '900', verticalAlign: 'middle' }}>Date</td>
                                            <td className="colon-col" style={{ textAlign: 'center', fontWeight: '900', fontSize: '0.9rem', verticalAlign: 'middle' }}>:</td>
                                            <td className="gst-invoice-detail-value" style={{ fontSize: '1.1rem', fontWeight: '800', verticalAlign: 'middle', paddingLeft: '4px', color: '#000' }}>{formatEliteDate(quotation.date)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="gst-row" style={{ borderBottom: 'none', flex: 1 }}>
                            <div className="gst-col" style={{ padding: '8px 12px', flex: 1, justifyContent: 'center' }}>
                                <div style={{ fontSize: '0.62rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Valid Until</div>
                                <div style={{ fontSize: '1rem', fontWeight: '800', marginTop: '2px', color: '#000' }}>{formatEliteDate(quotation.validUntil) || '---'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="gst-row" style={{ borderBottom: '1.5px solid #000', alignItems: 'stretch' }}>
                    {/* Left Column (60%) */}
                    <div className="gst-col gst-col-60" style={{ padding: 0, borderRight: '1.5px solid #000' }}>
                        <div style={{ background: '#e2e8f0', width: '100%', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1.5px solid #000' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', color: '#1e293b' }}>QUOTED TO</div>
                        </div>
                        <div style={{ padding: '0 12px 4px 12px', minHeight: '120px' }}>
                            <div style={{ marginBottom: '0' }}>
                                <span style={{ fontSize: '0.62rem', fontWeight: '900', textTransform: 'uppercase', color: '#64748b' }}>CUSTOMER</span>
                                <div style={{ fontWeight: '900', fontSize: '1.25rem', color: '#000', marginTop: '-4px', lineHeight: '1.1' }}>{quotation.customer}</div>
                            </div>
                            <table className="gst-high-density-table">
                                <tbody>
                                    <tr>
                                        <td className="label-col">Address</td>
                                        <td className="colon-col">:</td>
                                        <td className="value-col">{billingAddr}</td>
                                    </tr>
                                    <tr>
                                        <td className="label-col">Place</td>
                                        <td className="colon-col">:</td>
                                        <td className="value-col">{String(customerData?.city || billingAddr?.match(/([a-zA-Z]+)[\s,-]+(\d{6})/)?.[1] || 'SALEM')?.toUpperCase()} - {customerData?.pincode?.replace(/(\d{3})(\d{3})/, '$1 $2') || billingAddr?.match(/(\d{6})/)?.[0]?.replace(/(\d{3})(\d{3})/, '$1 $2') || '636 009'}.</td>
                                    </tr>
                                    <tr>
                                        <td className="label-col">GSTIN/UIN</td>
                                        <td className="colon-col">:</td>
                                        <td className="value-col">{customerData?.gstin || '---'}</td>
                                    </tr>
                                    <tr>
                                        <td className="label-col">State</td>
                                        <td className="colon-col">:</td>
                                        <td className="value-col" style={{ textTransform: 'uppercase' }}>{customerData?.state?.toUpperCase() || 'TAMIL NADU'} . CODE {customerData?.stateCode || '33'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Column (40%) - Filled with Payment Methods */}
                    <div className="gst-col gst-col-40" style={{ padding: '8px 12px' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: '600', color: '#1e293b', textTransform: 'uppercase', marginBottom: '4px' }}>Payment Will be acceptables are</div>
                        <div style={{ paddingLeft: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '500', marginBottom: '2px' }}>
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#000' }}></span>
                                Bank Transfer
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '500', marginBottom: '2px' }}>
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#000' }}></span>
                                Cheque
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '500', marginBottom: '2px' }}>
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#000' }}></span>
                                Cash
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '500', marginBottom: '2px' }}>
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#000' }}></span>
                                RTGS
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="gst-items-table-wrapper">
                    <table className="gst-items-table">
                        <thead>
                            <tr>
                                <th style={{ width: '35px' }}>SI NO</th>
                                <th>Description Of Goods</th>
                                <th style={{ width: '100px' }}>HSN/SAC</th>
                                <th style={{ width: '40px' }}>QTY</th>
                                <th style={{ width: '55px' }}>UNIT</th>
                                <th style={{ width: '70px' }}>RATE</th>
                                <th style={{ width: '90px' }}>AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayItems.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>{(() => {
                                        const product = products.find(p => String(p.id) === String(item.productId))
                                        return (quotation.isGST && product?.gstName) ? product.gstName : (product?.name || item.name)
                                    })()}</td>
                                    <td>{products.find(p => String(p.id) === String(item.productId))?.hsn || item.hsn || '---'}</td>
                                    <td>{item.quantity}</td>
                                    <td>{products.find(p => String(p.id) === String(item.productId))?.unit || item.unit || 'NOS'}</td>
                                    <td style={{ textAlign: 'right', paddingRight: '8px' }}>₹{parseFloat(item.price || 0).toFixed(2)}</td>
                                    <td style={{ textAlign: 'center' }}>₹{(parseFloat(item.price || 0) * parseFloat(item.quantity || 0)).toFixed(2)}</td>
                                </tr>
                            ))}
                            {[...Array(Math.max(0, 10 - displayItems.length))].map((_, i) => (
                                <tr key={`empty-${i}`}>
                                    <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="gst-total-row">
                                <td colSpan="3" style={{ textAlign: 'right', paddingRight: '12px', borderTop: '2px solid black' }}>TOTAL</td>
                                <td style={{ borderTop: '2px solid black' }}>{totalQty}</td>
                                <td style={{ borderTop: '2px solid black' }}></td>
                                <td style={{ borderTop: '2px solid black' }}></td>
                                <td style={{ textAlign: 'center', background: '#f8fafc', borderTop: '2px solid black' }}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Summary Section */}
                <div className="gst-row" style={{ borderBottom: '2px solid #000', borderTop: '2px solid #000' }}>
                    <div className="gst-col" style={{ flex: 1.5, borderRight: '2px solid #000', padding: 0 }}>
                        <div style={{ padding: '4px 10px', borderBottom: '1.5px solid #000' }}>
                            <div style={{ fontSize: '0.62rem', fontWeight: '600', color: '#1e293b', textTransform: 'uppercase', marginBottom: '2px' }}>AMOUNT IN WORDS :</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '500', color: '#000' }}>{numberToWords(finalTotal)}</div>
                        </div>
                        <div style={{ padding: '4px 10px' }}>
                            <div style={{ fontSize: '0.62rem', fontWeight: '600', color: '#1e293b', textTransform: 'uppercase', marginBottom: '2px' }}>TAX AMOUNT IN WORDS :</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '500', color: '#000' }}>{numberToWords(taxAmount)}</div>
                        </div>
                    </div>
                    <div className="gst-col" style={{ flex: 1.5, padding: 0 }}>
                        <div className="gst-summary-side">
                            <div className="gst-summary-row" style={{ padding: '4px 12px' }}>
                                <span style={{ fontWeight: '600' }}>CGST - {halfTaxPercent}%</span>
                                <span style={{ fontWeight: '600' }}>₹{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="gst-summary-row" style={{ padding: '4px 12px' }}>
                                <span style={{ fontWeight: '600' }}>SGST - {halfTaxPercent}%</span>
                                <span style={{ fontWeight: '600' }}>₹{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="gst-summary-total-v2" style={{ border: 'none', borderTop: '2px solid #000', marginTop: 'auto', background: '#eef2f6', padding: '8px 12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Total Amount</span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: '600' }}>After Tax</span>
                                </div>
                                <span style={{ fontSize: '1.6rem', fontWeight: '600' }}>₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* NOTES / TERMS Section - Filling the Gap */}
                <div className="gst-row" style={{ borderBottom: 'none', borderTop: 'none', padding: '8px 24px' }}>
                    <div className="gst-col">
                        <div style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#000',
                            textDecoration: 'underline',
                            marginBottom: '6px'
                        }}>Notes :</div>
                        <div style={{ fontSize: '0.9rem', lineHeight: '1.4', fontWeight: '500', color: '#1e293b', whiteSpace: 'pre-line' }}>
                            {quotation.terms || (
                                <div>
                                    <div style={{ marginBottom: '8px' }}>
                                        * Estimated delivery 1 - 5 Days from order confirmation.<br />
                                        * Please pay within 7 days from the date of Invoice bill will be delivered.
                                    </div>
                                    <div style={{ fontSize: '0.85rem' }}>
                                        * Prices include GST at the rate of (CGST-{halfTaxPercent}% & SGST-{halfTaxPercent}%) {(halfTaxPercent * 2)}%. The GST amount is included in the final total.<br />
                                        * Delivery charges are not included in the above total, Because delivery Charge should be Free.<br />
                                        * Any changes to the order may result in revised pricing and GST adjustments.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="gst-row" style={{ borderBottom: 'none', minHeight: '140px', borderTop: '2px solid #000', marginTop: '20px' }}>
                    <div className="gst-col" style={{ width: '100%', padding: '12px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontWeight: '500', fontSize: '0.85rem' }}>For {storeInfo.name}</div>
                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '10px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                This is a computer generated document.
                            </div>
                            <div style={{ textAlign: 'center', position: 'relative', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                {quotation.signature ? (
                                    <img
                                        src={quotation.signature}
                                        alt="Signature"
                                        style={{
                                            position: 'absolute',
                                            bottom: '25px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            maxHeight: '100px',
                                            maxWidth: '200px',
                                            pointerEvents: 'none'
                                        }}
                                    />
                                ) : (
                                    <div style={{ padding: '30px 0' }}></div>
                                )}
                                <div style={{ padding: '0 60px', borderBottom: '1px solid #000', width: '220px', margin: '0 auto' }}></div>
                                <div style={{ fontWeight: '500', fontSize: '0.85rem', marginTop: '8px' }}>Authorised Signatory</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default QuotationLayout
