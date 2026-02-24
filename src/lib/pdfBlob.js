import html2pdf from 'html2pdf.js'

export const getPdfBlob = async (elementId, filename) => {
    return new Promise((resolve, reject) => {
        const sourceElement = document.getElementById(elementId)
        if (!sourceElement) {
            reject(new Error("Capture element not found"))
            return
        }

        const hiddenContainerId = 'pdf-shadow-container'
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
        } else {
            container.innerHTML = '' // Clear previous clones
        }

        const clone = sourceElement.cloneNode(true)

        // Force absolute standardization for PDF capture to fix alignment
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

            // Critical: Proper page breaking for multi-copy
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
                layout.style.paddingBottom = "5px" // Tiny buffer
            })
        })

        container.appendChild(clone)

        const opt = {
            margin: 0,
            filename: filename,
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

        html2pdf().set(opt).from(clone).toPdf().get('pdf').then((pdf) => {
            const blob = pdf.output('blob')
            container.removeChild(clone)
            resolve(blob)
        }).catch(err => {
            if (clone.parentNode) container.removeChild(clone)
            reject(err)
        })
    })
}
