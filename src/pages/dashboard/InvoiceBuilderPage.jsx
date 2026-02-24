import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import InvoiceBuilderModal from '../../components/InvoiceBuilderModal'

const InvoiceBuilderPage = () => {
    const navigate = useNavigate()
    const location = useLocation()

    // Get state from navigation
    const editingInvoiceData = location.state?.invoice
    const billingMode = location.state?.mode || (editingInvoiceData ? (editingInvoiceData.isGST ? 'GST' : 'Non-GST') : 'GST')

    const handleClose = () => {
        navigate('/admin/billing', { state: { returnBillingType: billingMode } })
    }

    return (
        <InvoiceBuilderModal
            isOpen={true}
            onClose={handleClose}
            invoice={editingInvoiceData}
            mode={billingMode}
        />
    )
}

export default InvoiceBuilderPage
