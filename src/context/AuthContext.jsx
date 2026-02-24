import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const AuthContext = createContext()

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [role, setRole] = useState(null) // 'super_admin' | 'customer'
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        console.log("[AuthContext] Initializing initialization...");

        // Failsafe timeout: force loading to false if Firebase takes > 8 seconds
        const failsafeTimeout = setTimeout(() => {
            if (loading) {
                console.warn("[AuthContext] Initialization timed out after 8s. Forcing loading to false.");
                setLoading(false);
            }
        }, 8000);

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("[AuthContext] Auth state changed:", currentUser ? "User Logged In" : "Logged Out");

            if (currentUser) {
                try {
                    console.log("[AuthContext] Fetching Firestore data for:", currentUser.uid);
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));

                    if (userDoc.exists()) {
                        console.log("[AuthContext] User document found.");
                        const userData = userDoc.data();
                        setUser({ ...currentUser, ...userData });
                        setRole(userData.role || 'customer');
                    } else {
                        console.warn("[AuthContext] No user document found in Firestore.");
                        setUser(currentUser);
                        setRole('customer');
                    }
                } catch (error) {
                    console.error("[AuthContext] Error fetching user role:", error);
                    setUser(currentUser);
                    setRole('customer');
                }
            } else {
                setUser(null);
                setRole(null);
            }

            clearTimeout(failsafeTimeout);
            setLoading(false);
            console.log("[AuthContext] Initialization complete.");
        });

        return () => {
            unsubscribe();
            clearTimeout(failsafeTimeout);
        };
    }, []);

    const logout = () => {
        return signOut(auth)
    }

    const value = {
        user,
        role,
        loading,
        logout,
        isAdmin: role === 'super_admin'
    }

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    background: 'var(--bg-body)',
                    color: 'var(--color-brand)'
                }}>
                    <div className="animate-pulse" style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                        Loading Ferwa One...
                    </div>
                </div>
            ) : children}
        </AuthContext.Provider>
    )
}
