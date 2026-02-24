import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const addHeader = (doc, title, dateLabel, brandName) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(33, 33, 33)
    doc.text(brandName || 'Ferwa Billing', 14, 22)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(title, 14, 30)
    doc.text(`Period: ${dateLabel}`, 14, 36)

    doc.setDrawColor(230, 230, 230)
    doc.line(14, 42, 196, 42)
}

export const generateTaxReportPdf = async (analytics, dateLabel, brandName) => {
    try {
        const doc = new jsPDF()
        addHeader(doc, 'Tax & Performance Report', dateLabel, brandName)

        // Summary Stats
        const stats = [
            ['Total Sales (Revenue)', `INR ${analytics.totalSales.toLocaleString()}`],
            ['Total GST Collected', `INR ${analytics.totalTax.toLocaleString()}`],
            ['Total Profit', `INR ${analytics.totalProfit.toLocaleString()}`],
            ['Total GST Bills', analytics.gstInvoices.length.toString()]
        ]

        autoTable(doc, {
            startY: 50,
            head: [['Financial Summary', 'Value']],
            body: stats,
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241] }
        })

        // GST Details
        doc.setFontSize(14)
        doc.text('GST Transaction Ledger', 14, doc.lastAutoTable.finalY + 15)

        const tableData = analytics.gstInvoices.map(inv => [
            inv.id || inv.invoiceNumber,
            typeof inv.customer === 'object' ? inv.customer.name : inv.customer,
            new Date(inv.date).toLocaleDateString(),
            `INR ${(inv.subtotal || inv.total || 0).toLocaleString()}`,
            `INR ${(inv.tax || 0).toLocaleString()}`,
            `INR ${(inv.total || 0).toLocaleString()}`
        ])

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Inv No', 'Customer Name', 'Date', 'Amount', 'GST', 'Total']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241] }
        })

        doc.save(`GST_Tax_Report_${dateLabel.replace(/\s/g, '_')}.pdf`)
    } catch (e) {
        console.error("PDF Error:", e)
        alert("Export failed. Please try again.")
    }
}

export const generateGstProfitReportPdf = async (analytics, dateLabel, brandName) => {
    try {
        const doc = new jsPDF()
        addHeader(doc, 'Profit Analysis: GST Segment', dateLabel, brandName)

        const segmentRevenue = analytics.gstInvoices.reduce((s, i) => s + (i.subtotal || i.total || 0), 0)
        const stats = [
            ['GST Segment Revenue', `INR ${segmentRevenue.toLocaleString()}`],
            ['Net Profit (GST)', `INR ${analytics.gstProfit.toLocaleString()}`],
            ['GST Profit Margin', `${((analytics.gstProfit / (segmentRevenue || 1)) * 100).toFixed(1)}%`]
        ]

        autoTable(doc, {
            startY: 50,
            head: [['GST Analytics Overview', 'Value']],
            body: stats,
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241] }
        })

        // ... rest of the function (no changes needed for products/customers logic)
        doc.setFontSize(14)
        doc.text('Most Profitable GST Products', 14, doc.lastAutoTable.finalY + 15)
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Rank', 'Product Name', 'Profit Contribution']],
            body: analytics.gstTopProducts.map((p, i) => [`#${i + 1}`, p.name, `INR ${p.profit.toLocaleString()}`]),
            headStyles: { fillColor: [99, 102, 241] }
        })

        doc.setFontSize(14)
        doc.text('Top GST Customers', 14, doc.lastAutoTable.finalY + 15)
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Rank', 'Customer Name', 'Net Profit']],
            body: analytics.gstTopCustomers.map((c, i) => [`#${i + 1}`, c.name, `INR ${c.profit.toLocaleString()}`]),
            headStyles: { fillColor: [99, 102, 241] }
        })

        doc.save(`GST_Profit_Report_${dateLabel.replace(/\s/g, '_')}.pdf`)
    } catch (e) { console.error(e); alert("Failed."); }
}

export const generateRetailProfitReportPdf = async (analytics, dateLabel, brandName) => {
    try {
        const doc = new jsPDF()
        addHeader(doc, 'Profit Analysis: Retail (Non-GST)', dateLabel, brandName)

        const retailRevenue = analytics.totalSales - analytics.gstInvoices.reduce((s, i) => s + (i.subtotal || i.total || 0), 0)
        const stats = [
            ['Retail Segment Revenue', `INR ${retailRevenue.toLocaleString()}`],
            ['Net Profit (Retail)', `INR ${analytics.nonGstProfit.toLocaleString()}`],
            ['Retail Profit Margin', `${((analytics.nonGstProfit / (retailRevenue || 1)) * 100).toFixed(1)}%`]
        ]

        autoTable(doc, {
            startY: 50,
            head: [['Retail Analytics Overview', 'Value']],
            body: stats,
            theme: 'striped',
            headStyles: { fillColor: [249, 115, 22] }
        })

        // Top Products
        doc.setFontSize(14)
        doc.text('Most Profitable Retail Products', 14, doc.lastAutoTable.finalY + 15)
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Rank', 'Product Name', 'Profit Value']],
            body: analytics.nonGstTopProducts.map((p, i) => [`#${i + 1}`, p.name, `INR ${p.profit.toLocaleString()}`]),
            headStyles: { fillColor: [249, 115, 22] }
        })

        // Top Customers
        doc.setFontSize(14)
        doc.text('Top Retail Customers', 14, doc.lastAutoTable.finalY + 15)
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Rank', 'Customer Name', 'Profit Value']],
            body: analytics.nonGstTopCustomers.map((c, i) => [`#${i + 1}`, c.name, `INR ${c.profit.toLocaleString()}`]),
            headStyles: { fillColor: [249, 115, 22] }
        })

        doc.save(`Retail_Profit_Report_${dateLabel.replace(/\s/g, '_')}.pdf`)
    } catch (e) { console.error(e); alert("Failed."); }
}




