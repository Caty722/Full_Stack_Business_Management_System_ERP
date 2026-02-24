import { db } from './firebase';
import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    query,
    orderBy,
    setDoc,
    getDoc
} from 'firebase/firestore';

export const PRODUCTS_COLLECTION = 'products';
export const INVOICES_COLLECTION = 'invoices';
export const CUSTOMERS_COLLECTION = 'customers';
export const PRICES_COLLECTION = 'customerPrices';
export const SETTINGS_COLLECTION = 'settings';
export const QUOTATIONS_COLLECTION = 'quotations';
export const STOCK_LOGS_COLLECTION = 'stock_logs';

// --- SETTINGS ---
export const fetchBrandingSettings = async () => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, 'branding');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching branding settings:", error);
        throw error;
    }
};

export const updateBrandingSettings = async (brandingData) => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, 'branding');
        await setDoc(docRef, brandingData);
        return brandingData;
    } catch (error) {
        console.error("Error updating branding settings:", error);
        throw error;
    }
};

export const fetchGlobalSettings = async () => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return { onlineStoreEnabled: true };
    } catch (error) {
        console.error("Error fetching global settings:", error);
        return { onlineStoreEnabled: true };
    }
};

export const updateGlobalSettings = async (settingsData) => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, 'global');
        await setDoc(docRef, settingsData, { merge: true });
        return settingsData;
    } catch (error) {
        console.error("Error updating global settings:", error);
        throw error;
    }
};

// --- PRODUCTS ---

// Fetch all products
export const fetchProducts = async () => {
    try {
        const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('name'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
};

// Add a new product
export const addProductToDb = async (productData) => {
    try {
        const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
            ...productData,
            createdAt: new Date().toISOString()
        });
        return { ...productData, id: docRef.id };
    } catch (error) {
        console.error("Error adding product:", error);
        throw error;
    }
};

// Update a product
export const updateProductInDb = async (productId, updates) => {
    try {
        const productRef = doc(db, PRODUCTS_COLLECTION, productId);
        await updateDoc(productRef, updates);
        return { id: productId, ...updates };
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
};

// Delete a product
export const deleteProductFromDb = async (productId) => {
    const idStr = String(productId).trim();
    console.log("db.js: deleteProductFromDb called for ID:", idStr);
    try {
        await deleteDoc(doc(db, PRODUCTS_COLLECTION, idStr));
        return productId;
    } catch (error) {
        console.error("db.js: Error deleting product:", error);
        throw error;
    }
};

// Bulk delete products
export const bulkDeleteProductsFromDb = async (ids) => {
    try {
        await Promise.all(ids.map(id => deleteDoc(doc(db, PRODUCTS_COLLECTION, String(id).trim()))));
        return ids;
    } catch (error) {
        console.error("Error bulk deleting products:", error);
        throw error;
    }
};

// --- INVOICES ---

export const fetchInvoices = async () => {
    try {
        const q = query(collection(db, INVOICES_COLLECTION), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching invoices:", error);
        throw error;
    }
};

export const createInvoiceInDb = async (invoiceData) => {
    try {
        // Use setDoc to preserve the custom generated ID (e.g. GST-001)
        await setDoc(doc(db, INVOICES_COLLECTION, invoiceData.id), {
            ...invoiceData,
            createdAt: new Date().toISOString()
        });
        return invoiceData;
    } catch (error) {
        console.error("Error creating invoice:", error);
        throw error;
    }
};

export const updateInvoiceInDb = async (id, updates) => {
    try {
        const invoiceRef = doc(db, INVOICES_COLLECTION, id);
        await updateDoc(invoiceRef, updates);
        return { id, ...updates };
    } catch (error) {
        console.error("Error updating invoice:", error);
        throw error;
    }
};

export const deleteInvoiceFromDb = async (id) => {
    try {
        await deleteDoc(doc(db, INVOICES_COLLECTION, id));
        return id;
    } catch (error) {
        console.error("Error deleting invoice:", error);
        throw error;
    }
};

// --- CUSTOMERS ---

export const fetchCustomers = async () => {
    try {
        const q = query(collection(db, CUSTOMERS_COLLECTION), orderBy('name'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching customers:", error);
        throw error;
    }
};

export const addCustomerToDb = async (customerData) => {
    try {
        const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), {
            ...customerData,
            createdAt: new Date().toISOString()
        });
        return { ...customerData, id: docRef.id };
    } catch (error) {
        console.error("Error adding customer:", error);
        throw error;
    }
};

export const updateCustomerToDb = async (customerId, updates) => {
    try {
        const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
        await updateDoc(customerRef, updates);
        return { id: customerId, ...updates };
    } catch (error) {
        console.error("Error updating customer:", error);
        throw error;
    }
};

export const deleteCustomerFromDb = async (customerId) => {
    const idStr = String(customerId).trim();
    console.log("db.js: deleteCustomerFromDb called for ID:", idStr);
    try {
        await deleteDoc(doc(db, CUSTOMERS_COLLECTION, idStr));
        console.log("db.js: deleteDoc completed for ID:", idStr);
        return customerId;
    } catch (error) {
        console.error("db.js: Error deleting customer:", error);
        throw error;
    }
};

export const bulkDeleteCustomersFromDb = async (ids) => {
    console.log("db.js: bulkDeleteCustomersFromDb called for IDs:", ids);
    try {
        await Promise.all(ids.map(id => {
            const idStr = String(id).trim();
            return deleteDoc(doc(db, CUSTOMERS_COLLECTION, idStr));
        }));
        console.log("db.js: bulkDeleteDocs completed for all IDs");
        return ids;
    } catch (error) {
        console.error("db.js: Error bulk deleting customers:", error);
        throw error;
    }
};

// --- CUSTOMER PRICES ---

export const fetchCustomerPrices = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, PRICES_COLLECTION));
        const prices = {};
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            prices[doc.id] = data.price;
        });
        return prices;
    } catch (error) {
        console.error("Error fetching customer prices:", error);
        throw error;
    }
};

export const updateCustomerPriceInDb = async (customerId, productId, price) => {
    try {
        const key = `${customerId}_${productId}`;
        await setDoc(doc(db, PRICES_COLLECTION, key), {
            customerId,
            productId,
            price: parseFloat(price),
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error updating customer price:", error);
        throw error;
    }
};

export const removeCustomerPriceFromDb = async (customerId, productId) => {
    try {
        const key = `${customerId}_${productId}`;
        await deleteDoc(doc(db, PRICES_COLLECTION, key));
    } catch (error) {
        console.error("Error removing customer price:", error);
        throw error;
    }
};

// Update product stock (for checkout or edits)
export const updateProductStock = async (productId, newStock) => {
    try {
        const productRef = doc(db, PRODUCTS_COLLECTION, productId);
        await updateDoc(productRef, { stock: newStock });
    } catch (error) {
        console.error("Error updating stock:", error);
        throw error;
    }
}

// --- QUOTATIONS ---

export const fetchQuotations = async () => {
    try {
        const q = query(collection(db, QUOTATIONS_COLLECTION), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching quotations:", error);
        throw error;
    }
};

export const createQuotationInDb = async (quotationData) => {
    try {
        await setDoc(doc(db, QUOTATIONS_COLLECTION, quotationData.id), {
            ...quotationData,
            createdAt: new Date().toISOString()
        });
        return quotationData;
    } catch (error) {
        console.error("Error creating quotation:", error);
        throw error;
    }
};

export const updateQuotationInDb = async (id, updates) => {
    try {
        const docRef = doc(db, QUOTATIONS_COLLECTION, id);
        await updateDoc(docRef, updates);
        return { id, ...updates };
    } catch (error) {
        console.error("Error updating quotation:", error);
        throw error;
    }
};

export const deleteQuotationFromDb = async (id) => {
    try {
        await deleteDoc(doc(db, QUOTATIONS_COLLECTION, id));
        return id;
    } catch (error) {
        console.error("Error deleting quotation:", error);
        throw error;
    }
};

// --- STOCK LOGS ---

export const addStockLog = async (logData) => {
    try {
        const docRef = await addDoc(collection(db, STOCK_LOGS_COLLECTION), {
            ...logData,
            timestamp: new Date().toISOString()
        });
        return { ...logData, id: docRef.id };
    } catch (error) {
        console.error("Error adding stock log:", error);
        throw error;
    }
}

export const fetchStockLogs = async () => {
    try {
        const q = query(collection(db, STOCK_LOGS_COLLECTION), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching stock logs:", error);
        throw error;
    }
}

// --- SYSTEM ADMINISTRATION ---
export const wipeAllApplicationData = async () => {
    try {
        const collectionsToClear = [
            PRODUCTS_COLLECTION,
            INVOICES_COLLECTION,
            CUSTOMERS_COLLECTION,
            QUOTATIONS_COLLECTION,
            STOCK_LOGS_COLLECTION,
            PRICES_COLLECTION
        ];

        for (const collectionName of collectionsToClear) {
            const querySnapshot = await getDocs(collection(db, collectionName));
            const deletePromises = querySnapshot.docs.map(document =>
                deleteDoc(doc(db, collectionName, document.id))
            );
            await Promise.all(deletePromises);
        }
        return true;
    } catch (error) {
        console.error("Error wiping application data:", error);
        throw error;
    }
}
