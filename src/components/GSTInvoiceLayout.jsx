/*
 * --------------------------------------------------------------------------
 * LOCKED: This file contains the finalized GST Invoice Layout.
 * DO NOT MODIFY THIS FILE unless explicitly instructed by the user.
 * Any changes here risk breaking the carefully aligned layout.
 * --------------------------------------------------------------------------
 */
import React from 'react'

// --- Helpers ---
export const numberToWords = (num) => {
    if (num === null || num === undefined) return ''
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

    const inWords = (n) => {
        if (n < 20) return a[n]
        const digit = n % 10
        if (n < 100) return b[Math.floor(n / 10)] + (digit !== 0 ? ' ' + a[digit] : '')
        if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + inWords(n % 100) : '')
        if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '')
        if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '')
        return n.toString()
    }

    const parts = num.toString().split('.')
    const rupees = parseInt(parts[0])
    const paise = parts[1] ? parseInt(parts[1].slice(0, 2).padEnd(2, '0')) : 0

    let res = 'Rupees ' + inWords(rupees)
    if (paise > 0) {
        res += ' Paise ' + inWords(paise)
    }
    return res + ' Only'
}

export const formatEliteDate = (dateStr) => {
    if (!dateStr) return ''
    try {
        const d = new Date(dateStr)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
    } catch (e) {
        return dateStr
    }
}

export const toTitleCase = (str) => {
    if (!str) return ''
    return str.toLowerCase().replace(/(^|\s)\S/g, (L) => L.toUpperCase())
}

const GSTInvoiceLayout = ({ inv, storeInfo, customerData, billingAddr, displayItems, products, copyKey }) => {
    const totalQty = displayItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0)
    const taxableValue = (inv.subtotal || inv.total - (inv.tax || 0)) || 0
    const cgstAmount = (inv.tax || 0) / 2
    const sgstAmount = (inv.tax || 0) / 2

    // Precise Rounding Logic Removed - Showing Exact Total
    const exactTotal = taxableValue + cgstAmount + sgstAmount
    const finalTotal = exactTotal
    // const roundOffValue = finalTotal - exactTotal // Removed

    const totalTaxPercent = taxableValue > 0 ? ((inv.tax || 0) / taxableValue) * 100 : 0
    const halfTaxPercent = (totalTaxPercent / 2).toFixed(1)

    // ... (rest of the code) ...

    {/* Summary Section */ }
    {/* ... */ }
    <div className="gst-summary-row" style={{ padding: '2px 12px' }}>
        <span>SGST - {halfTaxPercent}%</span>
        <span>₹{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    </div>
    {/* Round Off Row Removed */ }
    <div className="gst-summary-total-v2" style={{ border: 'none', borderTop: '2px solid #000', marginTop: 'auto', background: '#eef2f6', padding: '4px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '900' }}>Total Amount</span>
            <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>After Tax</span>
        </div>
        <span style={{ fontSize: '1.5rem', fontWeight: '900' }}>₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    </div>

    // Aggregating HSNs for the summary table
    // Aggregating HSNs for the summary table (Consolidated View)
    const uniqueHsns = new Set()
    let hsnTaxableValue = 0
    let hsnTaxAmount = 0

    displayItems.forEach(item => {
        if (!item.name && !item.productId && !item.hsn) return
        const prod = products.find(p => String(p.id) === String(item.productId))
        const hsn = prod?.hsn || item.hsn
        if (hsn && hsn !== '---') uniqueHsns.add(hsn)

        const itemValue = (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0)
        hsnTaxableValue += itemValue

        const denominator = (inv.subtotal || (inv.total - (inv.tax || 0))) || 1
        const itemTax = (itemValue / denominator) * (inv.tax || 0)
        hsnTaxAmount += itemTax
    })

    const consolidatedHsn = {
        hsn: Array.from(uniqueHsns).join(', ') || '---',
        taxableValue: hsnTaxableValue || (inv.subtotal || (inv.total - (inv.tax || 0))),
        tax: hsnTaxAmount || (inv.tax || 0)
    }

    return (
        <div className="gst-invoice-container">
            <div className="gst-main-header tax-main-header">TAX INVOICE</div>

            <div className="gst-grid">
                {/* Top Info Section */}
                <div className="gst-row" style={{ height: 'auto' }}>
                    <div className="gst-col gst-col-60" style={{ padding: '4px 12px' }}>
                        <div className="gst-company-name">{storeInfo.name}</div>
                        <table className="gst-high-density-table">
                            <tbody>
                                <tr>
                                    <td className="label-col">Address</td>
                                    <td className="colon-col">:</td>
                                    <td className="value-col">{storeInfo.name === 'Ferwa Regal Clean' ? 'Near Town Railway Station, Salem East, TAMIL NADU, 636001' : storeInfo.address}</td>
                                </tr>
                                <tr>
                                    <td className="label-col">Place</td>
                                    <td className="colon-col">:</td>
                                    <td className="value-col">{storeInfo.place || storeInfo.city || (storeInfo.address?.match(/([a-zA-Z]+)[\s,-]+(\d{6})/)?.[1] || 'Salem')} - {storeInfo.pincode || (storeInfo.address?.match(/(\d{6})/)?.[0] || '636001')}</td>
                                </tr>
                                <tr>
                                    <td className="label-col">GSTIN/UIN</td>
                                    <td className="colon-col">:</td>
                                    <td className="value-col">{storeInfo.gstin}</td>
                                </tr>
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
                                            <td className="label-col" style={{ paddingLeft: '12px', width: '90px', fontSize: '0.9rem', fontWeight: '900', verticalAlign: 'middle' }}>Invoice No</td>
                                            <td className="colon-col" style={{ width: '20px', textAlign: 'center', fontWeight: '900', fontSize: '0.9rem', verticalAlign: 'middle' }}>:</td>
                                            <td className="gst-invoice-detail-value" style={{ fontSize: '1rem', fontWeight: '900', whiteSpace: 'nowrap', verticalAlign: 'middle', paddingLeft: '4px' }}>GST/{inv.id?.toString().replace(/^GST-?/gi, '')}/{inv.financialYear || '25-26'}</td>
                                        </tr>
                                        <tr style={{ height: '30px' }}>
                                            <td className="label-col" style={{ paddingLeft: '12px', width: '90px', fontSize: '0.9rem', fontWeight: '900', verticalAlign: 'middle' }}>Date</td>
                                            <td className="colon-col" style={{ textAlign: 'center', fontWeight: '900', fontSize: '0.9rem', verticalAlign: 'middle' }}>:</td>
                                            <td className="gst-invoice-detail-value" style={{ fontSize: '1.1rem', fontWeight: '800', verticalAlign: 'middle', paddingLeft: '4px' }}>{formatEliteDate(inv.date)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="gst-row" style={{ borderBottom: 'none', flex: 1 }}>
                            <div className="gst-col" style={{ padding: '8px 12px', flex: 1, justifyContent: 'center' }}>
                                <div style={{ fontSize: '0.62rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>P.O. NO.</div>
                                <div style={{ fontSize: '1rem', fontWeight: '800', marginTop: '2px' }}>{inv.poNumber || inv.referenceNo || '---'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="gst-row" style={{ borderBottom: '1.5px solid #000', alignItems: 'stretch' }}>
                    {/* Left Column (60%) */}
                    <div className="gst-col gst-col-60" style={{ padding: 0, borderRight: '1.5px solid #000' }}>
                        <div style={{ background: '#e2e8f0', width: '100%', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1.5px solid #000' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', color: '#1e293b' }}>CUSTOMER DETAILS</div>
                        </div>
                        <div style={{ padding: '0 12px 4px 12px' }}>
                            <div style={{ marginBottom: '0' }}>
                                <span style={{ fontSize: '0.62rem', fontWeight: '900', textTransform: 'uppercase', color: '#64748b' }}>BUYER</span>
                                <div style={{ fontWeight: '900', fontSize: '1.25rem', color: '#000', marginTop: '-4px', lineHeight: '1.1' }}>{toTitleCase(inv.customer)}</div>
                            </div>
                            <table className="gst-high-density-table">
                                <tbody>
                                    <tr>
                                        <td className="label-col">Address</td>
                                        <td className="colon-col">:</td>
                                        <td className="value-col">{toTitleCase(billingAddr)}</td>
                                    </tr>
                                    <tr>
                                        <td className="label-col">Place</td>
                                        <td className="colon-col">:</td>
                                        <td className="value-col">{toTitleCase(String(customerData?.city || billingAddr?.match(/([a-zA-Z]+)[\s,-]+(\d{6})/)?.[1] || 'SALEM'))} - {customerData?.pincode?.replace(/(\d{3})(\d{3})/, '$1 $2') || billingAddr?.match(/(\d{6})/)?.[0]?.replace(/(\d{3})(\d{3})/, '$1 $2') || '636 009'}.</td>
                                    </tr>
                                    <tr>
                                        <td className="label-col">GSTIN/UIN</td>
                                        <td className="colon-col">:</td>
                                        <td className="value-col">{customerData?.gstin || '---'}</td>
                                    </tr>
                                    <tr>
                                        <td className="label-col">State</td>
                                        <td className="colon-col">:</td>
                                        <td className="value-col" style={{ textTransform: 'none' }}>{toTitleCase(customerData?.state || 'TAMIL NADU')} . CODE {customerData?.stateCode || '33'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Column (40%) */}
                    <div className="gst-col gst-col-40" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
                        <div className="gst-row" style={{ borderBottom: '1.5px solid #000', margin: 0 }}>
                            <div className="gst-col gst-col-50" style={{ padding: '4px 12px', minHeight: '65px', borderRight: '1.5px solid #000' }}>
                                <div style={{ fontSize: '0.62rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>VEHICLE NUMBER</div>
                                <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{inv.vehicleNumber || '---'}</div>
                            </div>
                            <div className="gst-col gst-col-50" style={{ padding: '4px 12px', minHeight: '65px' }}>
                                <div style={{ fontSize: '0.62rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>TERMS OF DELIVERY</div>
                                <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{inv.deliveryTerms || '---'}</div>
                            </div>
                        </div>
                        <div className="gst-row" style={{ borderBottom: 'none', margin: 0, flex: 1 }}>
                            <div className="gst-col gst-col-50" style={{ padding: '6px 12px', borderRight: '1.5px solid #000' }}>
                                <div style={{ fontSize: '0.62rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>DELIVERY DATE</div>
                                <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{formatEliteDate(inv.deliveryDate) || '---'}</div>
                            </div>
                            <div className="gst-col gst-col-50" style={{ padding: '6px 12px' }}>
                                <div style={{ fontSize: '0.62rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>MODE/TERMS OF PAYMENT</div>
                                <div style={{ fontWeight: '900', fontSize: '1.1rem', color: '#000' }}>{inv.paymentMethod || inv.paymentMode || 'Cash'}</div>
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
                            {displayItems.slice(0, 13).map((item, idx) => (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>{(() => {
                                        const product = products.find(p => String(p.id) === String(item.productId))
                                        return product?.gstName || product?.name || item.name
                                    })()}</td>
                                    <td>{products.find(p => String(p.id) === String(item.productId))?.hsn || item.hsn || '---'}</td>
                                    <td>{item.quantity}</td>
                                    <td>{products.find(p => String(p.id) === String(item.productId))?.unit || item.unit || 'NOS'}</td>
                                    <td style={{ textAlign: 'right', paddingRight: '8px' }}>₹{item.price.toFixed(2)}</td>
                                    <td style={{ textAlign: 'center' }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                            {[...Array(Math.max(0, 13 - displayItems.length))].map((_, i) => (
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
                                <td style={{ textAlign: 'center', background: '#f8fafc', borderTop: '2px solid black' }}>₹{taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Summary Section */}
                <div className="gst-row" style={{ borderBottom: 'none', borderTop: '2px solid #000' }}>
                    <div className="gst-col" style={{ flex: 1.5, borderRight: '2px solid #000', padding: 0 }}>
                        <div style={{ padding: '2px 10px', paddingBottom: '10px', borderBottom: '1.5px solid #000' }}>
                            <div className="gst-label-row"><b>Amount In Words :</b></div>
                            <div className="gst-words-val" style={{ fontSize: '0.75rem', fontWeight: '700' }}>{numberToWords(finalTotal)}</div>
                        </div>
                        <div style={{ padding: '2px 10px' }}>
                            <div className="gst-label-row"><b>Tax Amount In Words :</b></div>
                            <div className="gst-words-val" style={{ fontSize: '0.75rem', fontWeight: '700' }}>{numberToWords(inv.tax || 0)}</div>
                        </div>
                    </div>
                    <div className="gst-col" style={{ flex: 1.5, padding: 0 }}>
                        <div className="gst-summary-side">
                            <div className="gst-summary-row" style={{ padding: '8px 12px' }}>
                                <span>CGST - {halfTaxPercent}%</span>
                                <span>₹{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="gst-summary-row" style={{ padding: '8px 12px' }}>
                                <span>SGST - {halfTaxPercent}%</span>
                                <span>₹{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="gst-summary-total-v2" style={{ border: 'none', borderTop: '2px solid #000', marginTop: 'auto', background: '#eef2f6', padding: '8px 12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '900' }}>Total Amount</span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: '800' }}>After Tax</span>
                                </div>
                                <span style={{ fontSize: '1.6rem', fontWeight: '900' }}>₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* HSN Summary Table */}
                <div className="gst-hsn-summary-wrapper">
                    <table className="gst-hsn-table">
                        <thead>
                            <tr>
                                <th rowSpan="2" style={{ width: '40%' }}>HSN / SAC</th>
                                <th rowSpan="2" style={{ width: '12%' }}>Taxable<br />Value</th>
                                <th colSpan="2" style={{ width: '16%' }}>Central Tax</th>
                                <th colSpan="2" style={{ width: '16%' }}>State Tax</th>
                                <th rowSpan="2" style={{ width: '16%' }}>Total Tax Amount</th>
                            </tr>
                            <tr>
                                <th style={{ width: '6%' }}>%</th>
                                <th style={{ width: '10%' }}>Amount</th>
                                <th style={{ width: '6%' }}>%</th>
                                <th style={{ width: '10%' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ textAlign: 'left', fontSize: consolidatedHsn.hsn.length > 60 ? '0.75rem' : '0.85rem', lineHeight: consolidatedHsn.hsn.length > 60 ? '1.1' : '1.3' }}>{consolidatedHsn.hsn}</td>
                                <td style={{ textAlign: 'center' }}>₹{consolidatedHsn.taxableValue.toFixed(2)}</td>
                                <td>{halfTaxPercent}%</td>
                                <td style={{ textAlign: 'center' }}>₹{(consolidatedHsn.tax / 2).toFixed(2)}</td>
                                <td>{halfTaxPercent}%</td>
                                <td style={{ textAlign: 'center' }}>₹{(consolidatedHsn.tax / 2).toFixed(2)}</td>
                                <td style={{ textAlign: 'center' }}>₹{consolidatedHsn.tax.toFixed(2)}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td style={{ textAlign: 'center', fontWeight: '900', borderTop: '2px solid black' }}>Total</td>
                                <td style={{ textAlign: 'center', fontWeight: '900', borderTop: '2px solid black' }}>₹{taxableValue.toFixed(2)}</td>
                                <td style={{ borderTop: '2px solid black' }}></td>
                                <td style={{ textAlign: 'center', fontWeight: '900', borderTop: '2px solid black' }}>₹{cgstAmount.toFixed(2)}</td>
                                <td style={{ borderTop: '2px solid black' }}></td>
                                <td style={{ textAlign: 'center', fontWeight: '900', borderTop: '2px solid black' }}>₹{sgstAmount.toFixed(2)}</td>
                                <td style={{ textAlign: 'center', fontWeight: '900', borderTop: '2px solid black' }}>₹{(inv.tax || 0).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer Section */}
                <div className="gst-row" style={{ minHeight: '110px', borderTop: '2px solid #000', borderBottom: 'none' }}>
                    <div className="gst-col" style={{ width: '60%', padding: '12px 8px 8px 12px', display: 'flex', flexDirection: 'column', borderRight: '2px solid #000' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>For {storeInfo.name}</div>
                        <div className="gst-signature-area" style={{ marginTop: 'auto', paddingBottom: '4px' }}>
                            <div style={{ fontWeight: '800', fontSize: '1rem' }}>Authorised Signatory</div>
                        </div>
                    </div>
                    <div className="gst-col" style={{ width: '40%', padding: 0 }}>
                        <div className="gst-bank-info-box">
                            <div className="gst-bank-header" style={{ fontSize: '0.7rem', fontWeight: '800', background: '#f8fafc', borderBottom: '2px solid #000' }}>COMPANY BANK DETAILS :</div>
                            <div className="gst-bank-info" style={{ padding: '8px 12px' }}>
                                <table className="gst-high-density-table" style={{ fontSize: '0.75rem' }}>
                                    <tbody>
                                        <tr>
                                            <td className="label-col" style={{ width: '100px', fontWeight: '800' }}>A/C Holder Name</td>
                                            <td className="colon-col" style={{ width: '15px', fontWeight: '800' }}>:</td>
                                            <td className="value-col" style={{ fontWeight: '500' }}>{storeInfo.accountName || storeInfo.name}</td>
                                        </tr>
                                        <tr>
                                            <td className="label-col" style={{ fontWeight: '800' }}>Bank Name</td>
                                            <td className="colon-col" style={{ fontWeight: '800' }}>:</td>
                                            <td className="value-col" style={{ fontWeight: '500' }}>{storeInfo.bankName}</td>
                                        </tr>
                                        <tr>
                                            <td className="label-col" style={{ fontWeight: '800' }}>A/C NO</td>
                                            <td className="colon-col" style={{ fontWeight: '800' }}>:</td>
                                            <td className="value-col" style={{ fontWeight: '500' }}>{storeInfo.accountNo}</td>
                                        </tr>
                                        <tr>
                                            <td className="label-col" style={{ fontWeight: '800' }}>IFSC Code</td>
                                            <td className="colon-col" style={{ fontWeight: '800' }}>:</td>
                                            <td className="value-col" style={{ fontWeight: '500' }}>{storeInfo.ifsc}</td>
                                        </tr>
                                        <tr>
                                            <td className="label-col" style={{ fontWeight: '800' }}>Branch</td>
                                            <td className="colon-col" style={{ fontWeight: '800' }}>:</td>
                                            <td className="value-col" style={{ fontWeight: '500' }}>{storeInfo.branch}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GSTInvoiceLayout
