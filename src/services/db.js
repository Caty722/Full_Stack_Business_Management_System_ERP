import { db } from '../lib/firebase'
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, query, where, addDoc } from 'firebase/firestore'

/**
 * Validates an invite code.
 * @param {string} code 
 * @returns {Promise<{isValid: boolean, codeId: string | null}>}
 */
export async function validateInviteCode(code) {
    try {
        const q = query(collection(db, "invite_codes"), where("code", "==", code), where("valid", "==", true))
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
            return { isValid: false, codeId: null, role: null }
        }

        // Return the first matching valid code
        const data = snapshot.docs[0].data()
        return { isValid: true, codeId: snapshot.docs[0].id, role: data.role || 'customer' }
    } catch (error) {
        console.error("Error validating code:", error)
        return { isValid: false, codeId: null, role: null }
    }
}

/**
 * Creates a new user document in Firestore.
 * @param {string} uid - Firebase Auth UID
 * @param {object} userData - { name, email, phone, role, status }
 */
export async function createUserDocument(uid, userData) {
    try {
        await setDoc(doc(db, "users", uid), {
            ...userData,
            createdAt: new Date().toISOString()
        })
    } catch (error) {
        console.error("Error creating user doc:", error)
        throw error
    }
}

/**
 * Marks an invite code as used.
 * @param {string} codeId 
 * @param {string} usedByUid 
 */
export async function markInviteCodeUsed(codeId, usedByUid) {
    try {
        await updateDoc(doc(db, "invite_codes", codeId), {
            valid: false,
            usedBy: usedByUid,
            usedAt: new Date().toISOString()
        })
    } catch (error) {
        console.error("Error updating invite code:", error)
    }
}

/**
 * Creates a generic collection entry (helper).
 */
/**
 * Fetches products with custom pricing for a specific customer.
 * @param {string} customerId 
 * @returns {Promise<Array>} List of products with 'price' (base or custom)
 */
export async function getProductsWithPricing(customerId, userEmail) {
    try {
        let isCustomerGST = null;

        // Try to determine if the logged in user is a GST customer
        if (userEmail) {
            const customersQ = query(collection(db, 'customers'), where('email', '==', userEmail));
            const cSnap = await getDocs(customersQ);
            if (!cSnap.empty) {
                isCustomerGST = cSnap.docs[0].data().isGST;
            }
        }

        // 1. Fetch all products
        const productsSnap = await getDocs(collection(db, 'products'));
        let products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter products by GST strictly matching the customer's GST status (if identified)
        if (isCustomerGST !== null) {
            products = products.filter(p => !!p.isGST === !!isCustomerGST);
        }

        // 2. Fetch custom prices for this customer
        const pricesQ = query(collection(db, 'customer_prices'), where('customerId', '==', customerId));
        const pricesSnap = await getDocs(pricesQ);
        const customPrices = {};
        pricesSnap.forEach(doc => {
            const data = doc.data();
            customPrices[data.productId] = data.customPrice;
        });

        // 3. Merge prices
        return products.map(p => ({
            ...p,
            price: customPrices[p.id] ? customPrices[p.id] : p.basePrice,
            isCustomPrice: !!customPrices[p.id]
        }));

    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

