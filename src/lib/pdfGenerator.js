import html2pdf from 'html2pdf.js'

/**
 * High-Speed Shadow Capture PDF Generator
 * - Eliminates "shaking" via background cloning
 * - Clarity: 2.0x Scale (Optimized for speed/quality balance)
 * - Size: JPEG 0.92 Quality + jsPDF Compression
 * - Logic: logging disabled for performance
 */

const hiddenContainerId = 'pdf-shadow-container'

const getHiddenContainer = () => {
    let container = document.getElementById(hiddenContainerId)
    if (!container) {
        container = document.createElement('div')
        container.id = hiddenContainerId
        container.style.position = 'fixed'
        container.style.left = '-9999px'
        container.style.top = '0'
        container.style.width = '794px'
        container.style.overflow = 'hidden'
        container.style.zIndex = '-1000'
        container.style.background = 'white'
        container.style.padding = '0'
        container.style.margin = '0'
        document.body.appendChild(container)
    }
    return container
}

const sanitizeClone = (clone) => {
    clone.style.width = "794px"
    clone.style.minWidth = "794px"
    clone.style.maxWidth = "794px"
    clone.style.margin = "0"
    clone.style.padding = "0"
    clone.style.display = "block"
    clone.style.background = "white"
    clone.style.boxSizing = "border-box"
    clone.style.transform = "none"
    clone.style.left = "0"
    clone.style.top = "0"
    clone.style.position = "relative"
    clone.style.textAlign = "left"

    const pages = clone.querySelectorAll('.invoice-document, .invoice-paper')
    pages.forEach((page, idx) => {
        page.style.width = "794px"
        page.style.margin = "0"
        page.style.padding = "0"
        page.style.minHeight = "auto"
        page.style.height = "auto"
        page.style.overflow = "hidden"

        if (idx === 0) {
            page.style.pageBreakBefore = "avoid"
        } else {
            page.style.pageBreakBefore = "always"
        }

        // Deep cleanup for inner layout containers
        const innerLayouts = page.querySelectorAll('.nongst-container, .gst-invoice-container, .modern-invoice-container')
        innerLayouts.forEach(layout => {
            layout.style.minHeight = "auto"
            layout.style.height = "auto"
            layout.style.margin = "0"
            layout.style.marginBottom = "0"
            layout.style.paddingBottom = "5px" // Tiny buffer to prevent overflow breaking
        })
    })
}

export const generateInvoicePdf = async (invoice, setIsGeneratingPDF, setViewInvoice) => {
    if (!invoice) return
    setIsGeneratingPDF(true)

    if (setViewInvoice) setViewInvoice(invoice)

    setTimeout(async () => {
        const sourceElement = document.getElementById('printable-invoice')
        if (!sourceElement) {
            console.error("Capture element #printable-invoice not found")
            setIsGeneratingPDF(false)
            alert("Please open the View Modal first to download the PDF.")
            return
        }

        const container = getHiddenContainer()
        const clone = sourceElement.cloneNode(true)
        sanitizeClone(clone)
        container.appendChild(clone)

        const opt = {
            margin: 0,
            filename: `Invoice_${String(invoice.id).replace(/[\/\\]/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                width: 794,
                windowWidth: 794,
                scrollY: 0,
                scrollX: 0,
                logging: false,
                backgroundColor: '#ffffff'
            },
            jsPDF: {
                unit: 'pt',
                format: 'a4',
                orientation: 'portrait',
                compress: true
            },
            pagebreak: { mode: ['css', 'legacy'] }
        }

        try {
            await html2pdf().set(opt).from(clone).save()
        } catch (error) {
            console.error("PDF Generation failed:", error)
            alert("PDF Generation failed. Please try again.")
        } finally {
            if (clone.parentNode) container.removeChild(clone)
            setIsGeneratingPDF(false)
        }
    }, 50)
}

export const generateQuotationPdf = async (quotation, setIsGeneratingPDF, setViewingQuotation) => {
    if (!quotation) return
    setIsGeneratingPDF(true)

    if (setViewingQuotation) setViewingQuotation(quotation)

    setTimeout(async () => {
        const sourceElement = document.getElementById('invoice-capture-area')
        if (!sourceElement) {
            console.error("Capture element #invoice-capture-area not found")
            setIsGeneratingPDF(false)
            alert("Please open the Quotation View first to download the PDF.")
            return
        }

        const container = getHiddenContainer()
        const clone = sourceElement.cloneNode(true)
        sanitizeClone(clone)
        container.appendChild(clone)

        const opt = {
            margin: 0,
            filename: `Quotation_${String(quotation.id).replace(/[\/\\]/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                width: 794,
                windowWidth: 794,
                scrollY: 0,
                scrollX: 0,
                logging: false,
                backgroundColor: '#ffffff'
            },
            jsPDF: {
                unit: 'pt',
                format: 'a4',
                orientation: 'portrait',
                compress: true
            },
            pagebreak: { mode: ['css', 'legacy'] }
        }

        try {
            await html2pdf().set(opt).from(clone).save()
        } catch (error) {
            console.error("PDF Generation failed:", error)
            alert("PDF Generation failed. Please try again.")
        } finally {
            if (clone.parentNode) container.removeChild(clone)
            setIsGeneratingPDF(false)
        }
    }, 50)
}
