/*
 * --------------------------------------------------------------------------
 * LOCKED: This file contains the finalized Non-GST Invoice Layout.
 * DO NOT MODIFY THIS FILE unless explicitly instructed by the user.
 * Any changes here risk breaking the carefully aligned layout.
 * --------------------------------------------------------------------------
 */
import React from 'react'
import { CheckCircle, MapPin, Phone, Mail, Globe, Hash, Calendar, ShoppingBag } from 'lucide-react'
import { numberToWords, formatEliteDate } from './GSTInvoiceLayout'

const NonGSTInvoiceLayout = ({ inv, storeInfo, customerData, billingAddr, displayItems, products, brands }) => {
    const totalQty = displayItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0)
    const finalTotal = inv.total || 0

    const isPaid = inv.status === 'Paid'
    const paymentDetails = isPaid ? `${finalTotal.toLocaleString('en-IN')} Paid via ${inv.paymentMode || 'Cash'} on ${formatEliteDate(inv.paymentDate || inv.date)}` : null

    return (
        <div className="nongst-container">
            {/* Reference-Matched Header */}
            <div className="nongst-header-stack">
                <div className="nongst-top-row">
                    <div className="nongst-invoice-label">INVOICE</div>
                </div>

                <div className="nongst-header-main">
                    <div className="nongst-company-details">
                        <div className="nongst-brand-name">{storeInfo.name}</div>
                        <div className="nongst-header-address">
                            {storeInfo.address1 || storeInfo.address}<br />
                            {storeInfo.address2 || [storeInfo.place || storeInfo.city, storeInfo.state, storeInfo.pincode].filter(Boolean).join(', ')}
                        </div>
                        <div className="nongst-header-contact">
                            <div className="contact-line"><strong>Mobile</strong> {storeInfo.mobile}</div>
                            <div className="contact-line"><strong>Email</strong> {storeInfo.email}</div>
                        </div>
                    </div>

                    <div className="nongst-logo-container">
                        {storeInfo.logo ? (
                            <img src={storeInfo.logo} style={{ maxHeight: '100px', maxWidth: '200px', objectFit: 'contain' }} alt="Company Logo" />
                        ) : (
                            <div className="logo-placeholder">COMPANY LOGO</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Split Information Section */}
            <div className="nongst-info-section">
                <div className="nongst-info-block">
                    <div className="block-label">BILLED TO</div>
                    <div className="block-value-main">{inv.customer}</div>
                    <div className="block-value-sub">
                        {billingAddr || 'Address not provided'}<br />
                        {customerData?.city && <span>{customerData.city}, </span>}
                        {customerData?.state && <span>{customerData.state} </span>}
                        {customerData?.stateCode && <span>({customerData.stateCode})</span>}
                        {customerData?.pincode && <span> - {customerData.pincode}</span>}
                    </div>
                </div>
                <div className="nongst-info-block text-right">
                    <div className="nongst-header-meta">
                        <div className="meta-row">
                            <span className="meta-label">INVOICE NO</span>
                            <span className="meta-value">{inv.id}</span>
                        </div>
                        <div className="meta-row">
                            <span className="meta-label">DATE</span>
                            <span className="meta-value">{formatEliteDate(inv.date)}</span>
                        </div>
                        <div className="meta-row">
                            <span className="meta-label">DUE DATE</span>
                            <span className="meta-value">{formatEliteDate(inv.dueDate || inv.date)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Items Table */}
            <div className="nongst-table-wrapper">
                <table className="nongst-table">
                    <thead>
                        <tr>
                            <th className="text-center" style={{ width: '40px' }}>#</th>
                            <th className="text-left">DESCRIPTION</th>
                            <th className="text-left" style={{ width: '100px' }}>SKU</th>
                            <th className="text-right" style={{ width: '110px' }}>UNIT PRICE</th>
                            <th className="text-center" style={{ width: '60px' }}>QTY</th>
                            <th className="text-center" style={{ width: '60px' }}>UNIT</th>
                            <th className="text-right" style={{ width: '110px' }}>TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayItems.map((item, idx) => {
                            const product = products.find(p => String(p.id) === String(item.productId))
                            const itemTotal = parseFloat(item.price || 0) * parseFloat(item.quantity || 0)
                            return (
                                <tr key={idx}>
                                    <td className="text-center">{String(idx + 1).padStart(2, '0')}</td>
                                    <td className="text-left">
                                        <div className="item-name">{product?.name || item.name}</div>
                                        {product?.description && <div className="item-description">{product.description}</div>}
                                    </td>
                                    <td className="text-left"><span className="sku-cell">{product?.sku || '---'}</span></td>
                                    <td className="text-right">₹{parseFloat(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td className="text-center">{item.quantity}</td>
                                    <td className="text-center">{product?.unit || item.unit || 'PCS'}</td>
                                    <td className="text-right font-bold">₹{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Elegant Summary Block */}
            <div className="nongst-summary-container">
                <div className="nongst-payment-info">
                    {isPaid && (
                        <div className="payment-received-banner">
                            <CheckCircle size={14} />
                            <span>Payment Received - Fully Paid</span>
                        </div>
                    )}
                    <div className="words-box">
                        <div className="words-label">AMOUNT IN WORDS</div>
                        <div className="words-content">{numberToWords(finalTotal).toUpperCase()} ONLY</div>
                    </div>
                </div>
                <div className="nongst-totals-card">
                    <div className="total-row">
                        <span className="total-label">Subtotal</span>
                        <span className="total-value">₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="total-row total-highlight">
                        <span className="total-label-big">NET TOTAL</span>
                        <span className="total-value-big">₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            {/* Signature Section */}
            <div className="nongst-signature-section">
                <div className="signature-block">
                    <div className="signature-line"></div>
                    <div className="signature-label">Receiver's Signature</div>
                </div>
                <div className="signature-block text-right">
                    <div className="signature-label">For {storeInfo.name}</div>
                    <div className="signature-space"></div>
                    <div className="signature-line"></div>
                    <div className="signature-label">Authorised Signatory</div>
                </div>
            </div>

            {/* Minimalist Footer */}
            <div className="nongst-footer">
                <div className="footer-tagline">Generated by {storeInfo.name}</div>
            </div>
        </div>
    )
}

export default NonGSTInvoiceLayout
