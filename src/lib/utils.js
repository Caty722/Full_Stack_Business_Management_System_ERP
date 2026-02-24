/**
 * Formats a date string or object into DD/MM/YYYY format.
 * @param {string|Date} date - The date to format.
 * @returns {string} - The formatted date string.
 */
export const formatDateDDMMYYYY = (date) => {
    if (!date) return '';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return date;

        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();

        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error("Error formatting date:", error);
        return date;
    }
};

/**
 * Calculates the next sequential invoice ID based on existing invoices and a prefix.
 * @param {Array} invoices - The list of existing invoices.
 * @param {string} prefix - The prefix to use (e.g., 'GST' or 'INV').
 * @returns {string} - The next suggested invoice ID.
 */
export const getNextInvoiceId = (invoices, prefix) => {
    if (!invoices || !Array.isArray(invoices) || invoices.length === 0) return 1;

    // Strategy: Look at the most recent invoices (already sorted by date desc in context)
    // Find the first one that has a numeric part we can increment.
    for (const inv of invoices) {
        const id = String(inv.id || '');
        // If it matches prefix (e.g. GST-001) or is purely numeric (e.g. 23)
        if (id.startsWith(prefix) || /^\d+$/.test(id)) {
            const match = id.match(/(\d+)$/);
            if (match) {
                return parseInt(match[0]) + 1;
            }
        }
    }

    return 1;
};
