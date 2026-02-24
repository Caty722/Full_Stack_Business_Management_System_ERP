import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import {
    createInvoiceInDb,
    fetchInvoices,
    updateInvoiceInDb,
    deleteInvoiceFromDb,
    fetchProducts,
    addProductToDb,
    updateProductInDb,
    deleteProductFromDb,
    bulkDeleteProductsFromDb,
    fetchCustomers,
    addCustomerToDb,
    updateCustomerToDb,
    deleteCustomerFromDb,
    bulkDeleteCustomersFromDb,
    fetchCustomerPrices,
    updateCustomerPriceInDb,
    removeCustomerPriceFromDb,
    updateProductStock,
    fetchBrandingSettings,
    updateBrandingSettings,
    updateGlobalSettings,
    addStockLog,
    PRODUCTS_COLLECTION,
    INVOICES_COLLECTION,
    CUSTOMERS_COLLECTION,
    PRICES_COLLECTION,
    SETTINGS_COLLECTION,
    QUOTATIONS_COLLECTION,
    STOCK_LOGS_COLLECTION
} from '../lib/db'
import { onSnapshot, collection, query, orderBy, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const ShopContext = createContext()

export const BRANDS = {
    GST: {
        name: "Ferwa Regal Clean",
        address: "Near Town Railway Station, Salem East, TAMIL NADU, 636001",
        address1: "Near Town Railway Station,",
        address2: "Salem East, TAMIL NADU, 636001",
        mobile: "+91 9003668877",
        email: "ferwa.regal@gmail.com",
        gstin: "33ACSPF1494M1Z6",
        state: "Tamil Nadu",
        stateCode: "33",
        bankName: "Union Bank Of India",
        accountName: "Ferwa Regal Clean",
        accountNo: "584101010050477",
        ifsc: "UBIN0558419",
        branch: "Ramakrishana Road Hasthampatti salem",
        prefix: "GST",
        city: "Salem",
        pincode: "636001",
        place: "Salem"
    },
    NON_GST: {
        name: "Ferwa One",
        address: "Near Town Railway Station, Salem East, TAMIL NADU, 636001",
        address1: "Near Town Railway Station,",
        address2: "Salem East, TAMIL NADU, 636001",
        mobile: "+91 9003668877",
        email: "ferwa.one@gmail.com",
        gstin: "",
        state: "Tamil Nadu",
        stateCode: "33",
        bankName: "Union Bank Of India",
        accountName: "Ferwa One",
        accountNo: "584101010050477",
        ifsc: "UBIN0558419",
        branch: "Ramakrishana Road Hasthampatti salem",
        prefix: "INV",
        city: "Salem",
        pincode: "636001",
        place: "Salem"
    }
}

export function useShop() {
    return useContext(ShopContext)
}

export function ShopProvider({ children }) {
    const [products, setProducts] = useState([])
    const [cart, setCart] = useState([])
    const [customers, setCustomers] = useState([])
    const [invoices, setInvoices] = useState([])
    const [quotations, setQuotations] = useState([])
    const [stockLogs, setStockLogs] = useState([])
    const [customerPrices, setCustomerPrices] = useState({})
    const [brands, setBrands] = useState(BRANDS)
    const [globalSettings, setGlobalSettings] = useState({ onlineStoreEnabled: true })

    // Real-Time Sync from Firestore
    useEffect(() => {
        // Branding Settings Listener
        const unsubBranding = onSnapshot(
            doc(db, SETTINGS_COLLECTION, 'branding'),
            (snapshot) => {
                if (snapshot.exists()) {
                    setBrands(snapshot.data())
                }
            },
            (err) => console.error("Branding listener error:", err)
        )

        // Products Listener
        const unsubProducts = onSnapshot(
            query(collection(db, PRODUCTS_COLLECTION), orderBy('name')),
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                setProducts(data)
            },
            (err) => console.error("Products listener error:", err)
        )

        // Customers Listener
        const unsubCustomers = onSnapshot(
            query(collection(db, CUSTOMERS_COLLECTION), orderBy('name')),
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                setCustomers(data)
            },
            (err) => console.error("Customers listener error:", err)
        )

        // Invoices Listener
        const unsubInvoices = onSnapshot(
            query(collection(db, INVOICES_COLLECTION), orderBy('date', 'desc')),
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                setInvoices(data)
            },
            (err) => console.error("Invoices listener error:", err)
        )

        // Quotations Listener
        const unsubQuotations = onSnapshot(
            query(collection(db, QUOTATIONS_COLLECTION), orderBy('date', 'desc')),
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                setQuotations(data)
            },
            (err) => console.error("Quotations listener error:", err)
        )

        // Stock Logs Listener
        const unsubStockLogs = onSnapshot(
            query(collection(db, STOCK_LOGS_COLLECTION), orderBy('timestamp', 'desc')),
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                setStockLogs(data)
            },
            (err) => console.error("Stock logs listener error:", err)
        )

        // Customer Prices Listener
        const unsubPrices = onSnapshot(
            collection(db, PRICES_COLLECTION),
            (snapshot) => {
                const prices = {}
                snapshot.forEach((doc) => {
                    prices[doc.id] = doc.data().price
                })
                setCustomerPrices(prices)
            },
        )

        // Global Settings Listener
        const unsubGlobal = onSnapshot(
            doc(db, SETTINGS_COLLECTION, 'global'),
            (snapshot) => {
                if (snapshot.exists()) {
                    setGlobalSettings(snapshot.data())
                }
            },
            (err) => console.error("Global settings listener error:", err)
        )

        return () => {
            unsubBranding()
            unsubGlobal()
            unsubProducts()
            unsubCustomers()
            unsubInvoices()
            unsubQuotations()
            unsubStockLogs()
            unsubPrices()
        }
    }, [])

    const addProduct = async (product) => {
        try {
            await addProductToDb(product)
        } catch (error) {
            console.error("Failed to add product to DB:", error)
        }
    }

    const createInvoice = async (invoiceData) => {
        try {
            await createInvoiceInDb(invoiceData)

            // Deduct stock if NOT a draft
            if (invoiceData.status !== 'Draft' && invoiceData.items && invoiceData.items.length > 0) {
                // Aggregate changes first
                const aggregatedChanges = {}
                invoiceData.items.forEach(item => {
                    if (item.productId) {
                        aggregatedChanges[item.productId] = (aggregatedChanges[item.productId] || 0) + (item.quantity || 0)
                    }
                })

                for (const [productId, totalQty] of Object.entries(aggregatedChanges)) {
                    const product = products.find(p => String(p.id) === String(productId))
                    if (product) {
                        const newStock = (product.stock || 0) - totalQty
                        await updateProductInDb(product.id, { stock: newStock })
                        // Add Log
                        await addStockLog({
                            productId: product.id,
                            productName: product.name,
                            quantity: totalQty,
                            type: 'out',
                            reason: `Invoice ${invoiceData.id}`,
                            notes: 'Stock deducted on invoice creation'
                        })
                    }
                }
            }
        } catch (error) {
            console.error("Failed to create invoice in DB:", error)
        }
    }

    const addCustomer = async (customer) => {
        try {
            await addCustomerToDb(customer)
        } catch (error) {
            console.error("Failed to add customer to DB:", error)
        }
    }

    const updateCustomer = async (updatedCustomer) => {
        try {
            await updateCustomerToDb(updatedCustomer.id, updatedCustomer)
        } catch (error) {
            console.error("Failed to update customer in DB:", error)
        }
    }

    const deleteProduct = async (id) => {
        const idStr = String(id).trim()
        console.log("ShopContext: deleteProduct called with ID:", idStr)
        try {
            await deleteProductFromDb(idStr)
            console.log("ShopContext: deleteProduct completed successfully for ID:", idStr)
        } catch (error) {
            alert("Error deleting product: " + error.message)
            console.error("ShopContext: Failed to delete product from DB:", error)
        }
    }

    const updateProduct = async (updatedProduct) => {
        try {
            await updateProductInDb(updatedProduct.id, updatedProduct)
        } catch (error) {
            console.error("Failed to update product in DB:", error)
        }
    }

    const bulkDeleteProducts = async (ids) => {
        try {
            await bulkDeleteProductsFromDb(ids)
        } catch (error) {
            console.error("Failed to bulk delete products from DB:", error)
        }
    }

    const deleteCustomer = async (id) => {
        const idStr = String(id).trim()
        console.log("ShopContext: deleteCustomer called with ID:", idStr)
        try {
            await deleteCustomerFromDb(idStr)
            console.log("ShopContext: deleteCustomer completed successfully for ID:", idStr)
        } catch (error) {
            alert("Error deleting customer: " + error.message)
            console.error("ShopContext: Failed to delete customer from DB:", error)
        }
    }

    const bulkDeleteCustomers = async (ids) => {
        console.log("ShopContext: bulkDeleteCustomers called with IDs:", ids)
        try {
            await bulkDeleteCustomersFromDb(ids.map(id => String(id).trim()))
            console.log("ShopContext: bulkDeleteCustomers completed successfully")
        } catch (error) {
            alert("Error bulk deleting customers: " + error.message)
            console.error("ShopContext: Failed to bulk delete customers from DB:", error)
        }
    }

    const updateInvoice = async (id, updates) => {
        try {
            const oldInvoice = invoices.find(inv => String(inv.id) === String(id))
            if (!oldInvoice) return

            const newItems = updates.items || oldInvoice.items || []
            const oldItems = oldInvoice.items || []
            const wasDraft = oldInvoice.status === 'Draft'
            const isNowDraft = (updates.status || oldInvoice.status) === 'Draft'

            // STOCK ADJUSTMENT LOGIC
            const isDeducted = (s) => ['Pending', 'Paid', 'Partially Paid'].includes(s)
            const wasDeducted = isDeducted(oldInvoice.status)
            const isNowDeducted = isDeducted(updates.status || oldInvoice.status)

            const stockUpdates = {} // productId -> qty change (+ for restore, - for deduct)

            if (!wasDeducted && isNowDeducted) {
                // New deduction
                newItems.forEach(item => {
                    if (item.productId) stockUpdates[item.productId] = (stockUpdates[item.productId] || 0) - (item.quantity || 0)
                })
            } else if (wasDeducted && !isNowDeducted) {
                // Restore old
                oldItems.forEach(item => {
                    if (item.productId) stockUpdates[item.productId] = (stockUpdates[item.productId] || 0) + (item.quantity || 0)
                })
            } else if (wasDeducted && isNowDeducted) {
                // Adjust difference between old items and new items
                oldItems.forEach(item => {
                    if (item.productId) stockUpdates[item.productId] = (stockUpdates[item.productId] || 0) + (item.quantity || 0)
                })
                newItems.forEach(item => {
                    if (item.productId) stockUpdates[item.productId] = (stockUpdates[item.productId] || 0) - (item.quantity || 0)
                })
            }

            // Apply stock updates
            for (const [productId, diff] of Object.entries(stockUpdates)) {
                if (diff === 0) continue
                const product = products.find(p => String(p.id) === String(productId))
                if (product) {
                    const newStock = (product.stock || 0) + diff
                    const newTotalStock = Math.max(product.totalStock || 0, newStock)
                    await updateProductInDb(product.id, { stock: newStock, totalStock: newTotalStock })
                    // Log
                    await addStockLog({
                        productId: product.id,
                        productName: product.name,
                        quantity: Math.abs(diff),
                        type: diff > 0 ? 'in' : 'out',
                        reason: `Invoice ${id} Update`,
                        notes: `Adjusted qty for item update`
                    })
                }
            }

            const oldId = String(id)
            const newId = String(updates.id || oldId)
            const isIdChanging = oldId !== newId

            if (isIdChanging) {
                await createInvoiceInDb({ ...oldInvoice, ...updates, id: newId })
                await deleteInvoiceFromDb(oldId)
            } else {
                await updateInvoiceInDb(id, updates)
            }
        } catch (error) {
            console.error("Failed to update invoice in DB:", error)
        }
    }

    const deleteInvoice = async (id) => {
        try {
            const invoiceToDelete = invoices.find(inv => String(inv.id) === String(id))

            // Restore stock if it was in a deducted state (NOT Draft or Cancelled)
            const isDeducted = (s) => ['Pending', 'Paid', 'Partially Paid'].includes(s)
            if (invoiceToDelete && isDeducted(invoiceToDelete.status) && invoiceToDelete.items) {
                // Aggregate changes first
                const aggregatedChanges = {}
                invoiceToDelete.items.forEach(item => {
                    if (item.productId) {
                        aggregatedChanges[item.productId] = (aggregatedChanges[item.productId] || 0) + (item.quantity || 0)
                    }
                })

                for (const [productId, totalQty] of Object.entries(aggregatedChanges)) {
                    const product = products.find(p => String(p.id) === String(productId))
                    if (product) {
                        const newStock = (product.stock || 0) + totalQty
                        const newTotalStock = Math.max(product.totalStock || 0, newStock)
                        await updateProductInDb(product.id, { stock: newStock, totalStock: newTotalStock })
                        // Add Log
                        await addStockLog({
                            productId: product.id,
                            productName: product.name,
                            quantity: totalQty,
                            type: 'in',
                            reason: `Delete Invoice ${id}`,
                            notes: 'Stock restored on invoice deletion'
                        })
                    }
                }
            }

            await deleteInvoiceFromDb(id)
        } catch (error) {
            console.error("Failed to delete invoice from DB:", error)
        }
    }

    const updateCustomerPrice = async (customerId, productId, price) => {
        const key = `${String(customerId)}_${String(productId)}`
        setCustomerPrices(prev => ({ ...prev, [key]: parseFloat(price) }))
        try {
            await updateCustomerPriceInDb(customerId, productId, price)
        } catch (error) {
            console.error("Failed to update customer price in DB:", error)
        }
    }

    const removeCustomerPrice = async (customerId, productId) => {
        const key = `${String(customerId)}_${String(productId)}`
        setCustomerPrices(prev => {
            const newState = { ...prev }
            delete newState[key]
            return newState
        })
        try {
            await removeCustomerPriceFromDb(customerId, productId)
        } catch (error) {
            console.error("Failed to remove customer price from DB:", error)
        }
    }

    const getProductPrice = (product, customerId) => {
        if (!customerId) return product.price
        const key = `${String(customerId)}_${String(product.id)}`
        return customerPrices[key] !== undefined ? customerPrices[key] : product.price
    }
    const contextValue = useMemo(() => ({
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        bulkDeleteProducts,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        bulkDeleteCustomers,
        invoices,
        createInvoice,
        updateInvoice,
        deleteInvoice,
        customerPrices,
        updateCustomerPrice,
        removeCustomerPrice,
        getProductPrice,
        brands,
        updateBranding: updateBrandingSettings,
        quotations,
        createQuotation: async (data) => {
            const { createQuotationInDb } = await import('../lib/db')
            await createQuotationInDb(data)
        },
        updateQuotation: async (id, updates) => {
            const { updateQuotationInDb } = await import('../lib/db')
            await updateQuotationInDb(id, updates)
        },
        deleteQuotation: async (id) => {
            const { deleteQuotationFromDb } = await import('../lib/db')
            await deleteQuotationFromDb(id)
        },
        stockLogs,
        addStockLogEntry: async (log) => {
            const { addStockLog, updateProductInDb } = await import('../lib/db')
            await addStockLog(log)
            const product = products.find(p => p.id === log.productId)
            if (product) {
                const newStock = log.type === 'in' ? (product.stock || 0) + log.quantity : (product.stock || 0) - log.quantity
                const newTotalStock = log.type === 'in' ? Math.max(product.totalStock || 0, newStock) : (product.totalStock || Math.max(0, product.stock || 0))
                await updateProductInDb(log.productId, { stock: newStock, totalStock: newTotalStock })
            }
        },
        globalSettings,
        updateGlobalSettings: async (settings) => { await updateGlobalSettings(settings) },
        wipeApplicationData: async () => {
            const { wipeAllApplicationData } = await import('../lib/db')
            await wipeAllApplicationData()
        }
    }), [
        products, customers, invoices, quotations, stockLogs, customerPrices, brands, globalSettings,
        addProduct, updateProduct, deleteProduct, bulkDeleteProducts,
        addCustomer, updateCustomer, deleteCustomer, bulkDeleteCustomers,
        createInvoice, updateInvoice, deleteInvoice,
        updateCustomerPrice, removeCustomerPrice, getProductPrice
    ])

    return (
        <ShopContext.Provider value={contextValue}>
            {children}
        </ShopContext.Provider>
    )
}
