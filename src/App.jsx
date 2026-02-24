import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ShopProvider } from './context/ShopContext'
import { ThemeProvider } from './context/ThemeContext'
import GlobalStyles from './styles/GlobalStyles'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'

import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Lazy load pages
const Login = lazy(() => import('./pages/auth/Login'))
const Signup = lazy(() => import('./pages/auth/Signup'))
const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome'))
const Billing = lazy(() => import('./pages/dashboard/Billing'))
const Store = lazy(() => import('./pages/dashboard/Store'))
const Products = lazy(() => import('./pages/dashboard/Products'))
const Customers = lazy(() => import('./pages/dashboard/Customers'))
const CustomerPricing = lazy(() => import('./pages/dashboard/CustomerPricing'))
const Reports = lazy(() => import('./pages/dashboard/Reports'))
const Settings = lazy(() => import('./pages/dashboard/Settings'))
const Profile = lazy(() => import('./pages/dashboard/Profile'))
const Users = lazy(() => import('./pages/admin/Users'))
const InviteCodes = lazy(() => import('./pages/admin/InviteCodes'))
const Inventory = lazy(() => import('./pages/dashboard/Inventory'))
const Quotations = lazy(() => import('./pages/dashboard/Quotations'))
const InvoiceBuilderPage = lazy(() => import('./pages/dashboard/InvoiceBuilderPage'))
const StoreOrders = lazy(() => import('./pages/admin/StoreOrders'))

// Loading component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'var(--bg-body)',
    color: 'var(--color-brand)'
  }}>
    <div className="animate-pulse">Loading...</div>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <ThemeProvider>
          <Router>
            <ScrollToTop />
            <GlobalStyles />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Authentication Routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                </Route>

                {/* Admin Routes (Super Admin & Business Owner) */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'production']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                      <DashboardHome />
                    </ProtectedRoute>
                  } />
                  <Route path="billing" element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                      <Billing />
                    </ProtectedRoute>
                  } />
                  <Route path="billing/new" element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                      <InvoiceBuilderPage />
                    </ProtectedRoute>
                  } />
                  <Route path="products" element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                      <Products isAdmin={true} />
                    </ProtectedRoute>
                  } />
                  <Route path="customers" element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                      <Customers />
                    </ProtectedRoute>
                  } />
                  <Route path="customer-pricing" element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                      <CustomerPricing />
                    </ProtectedRoute>
                  } />
                  <Route path="reports" element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                      <Reports />
                    </ProtectedRoute>
                  } />
                  <Route path="settings" element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="profile" element={<Profile />} />
                  <Route path="users" element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                      <Users />
                    </ProtectedRoute>
                  } />
                  <Route path="invites" element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                      <InviteCodes />
                    </ProtectedRoute>
                  } />
                  <Route path="inventory" element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'production']}>
                      <Inventory />
                    </ProtectedRoute>
                  } />
                  <Route path="quotations" element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                      <Quotations />
                    </ProtectedRoute>
                  } />
                  <Route path="online-orders" element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                      <StoreOrders />
                    </ProtectedRoute>
                  } />
                </Route>

                {/* Store Routes (Customer Only) */}
                <Route path="/store" element={
                  <ProtectedRoute roleRequired="customer">
                    <DashboardLayout role="customer" />
                  </ProtectedRoute>
                }>
                  <Route index element={<Store />} />
                  <Route path="profile" element={<div>Profile Page</div>} />
                </Route>

                {/* Default Redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </ThemeProvider>
      </ShopProvider>
    </AuthProvider>
  )
}

export default App
