import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children, roleRequired, allowedRoles }) {
    const { user, role, loading } = useAuth()

    // 1. Loading State (Auth Initializing OR User logged in but Role not fetched yet)
    if (loading || (user && !role)) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'var(--bg-body)',
                color: 'var(--color-brand)'
            }}>
                <div className="animate-pulse" style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                    Loading...
                </div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    // RBAC Check
    if (allowedRoles) {
        if (!allowedRoles.includes(role)) {
            if (role === 'super_admin' || role === 'admin' || role === 'manager') return <Navigate to="/admin" replace />
            if (role === 'production') return <Navigate to="/admin/inventory" replace />
            return <Navigate to="/store" replace />
        }
    } else if (roleRequired && role !== roleRequired) {
        // Redirect logic if unauthorized
        if (role === 'super_admin' || role === 'admin' || role === 'manager') return <Navigate to="/admin" replace />
        if (role === 'production') return <Navigate to="/admin/inventory" replace />
        return <Navigate to="/store" replace />
    }

    return children
}
