import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  ShoppingCart,
  Package,
  Users,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Moon,
  Sun,
  Calendar,
  ChevronDown,
  Settings,
  User,
  BarChart2,
  Ticket,
  ClipboardList,
  History,
  Activity
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useShop } from '../context/ShopContext'

export default function DashboardLayout({ role: propRole }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { invoices, products, customers } = useShop()
  const { logout, user, role: contextRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const profileRef = useRef(null)
  const notificationRef = useRef(null)




  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }


    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const displayRole = contextRole || propRole
  const displayName = user?.name || user?.displayName || user?.email?.split('@')[0] || "User"
  const displayEmail = user?.email || ""
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  // Computed Values
  const todayDate = useMemo(() => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), [])

  const pendingInvoices = useMemo(() => invoices ? invoices.filter(inv => inv.status === 'Pending') : [], [invoices])
  const totalPending = useMemo(() => pendingInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0), [pendingInvoices])

  // Compute Notifications
  const lowStockProducts = useMemo(() => products ? products.filter(p => p.stock > 0 && p.stock <= 5) : [], [products])
  const outOfStockProducts = useMemo(() => products ? products.filter(p => p.stock === 0) : [], [products])

  const notifications = useMemo(() => [
    ...outOfStockProducts.map(p => ({
      id: `oos_${p.id}`,
      type: 'error',
      text: `${p.name} is entirely out of stock.`,
      path: `/admin/products?q=${encodeURIComponent(p.name)}`
    })),
    ...lowStockProducts.map(p => ({
      id: `low_${p.id}`,
      type: 'warning',
      text: `${p.name} is running low (${p.stock} left).`,
      path: `/admin/products?q=${encodeURIComponent(p.name)}`
    })),
    ...pendingInvoices.map(inv => ({
      id: `inv_${inv.id}`,
      type: 'info',
      text: `Inv #${inv.id} for ${inv.customer}: ₹${(inv.balanceDue || 0).toLocaleString('en-IN')} due (Total: ₹${(inv.total || 0).toLocaleString('en-IN')})`,
      path: `/admin/billing?q=${encodeURIComponent(inv.id)}`
    }))
  ], [outOfStockProducts, lowStockProducts, pendingInvoices])

  const handleNotificationClick = (note) => {
    if (note.path) {
      navigate(note.path)
      setNotificationsOpen(false)
    }
  }

  return (
    <div className="dashboard-app">
      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>

        {/* Brand */}
        <div className="sidebar-header">
          <div className="brand-logo">
            <img
              src={logo}
              alt="Ferwa"
              className="logo-icon-img"
            />
            <div className="brand-text">
              <span className="font-bold">Ferwa</span>
              <span className="font-light text-muted ml-1">
                {displayRole === 'admin' || displayRole === 'super_admin' ? 'Billing' : 'One'}
              </span>
            </div>
          </div>
          <button className="sidebar-close-btn" style={{ display: 'none' }} onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>


        {/* Navigation */}
        <nav className="sidebar-nav">
          {(displayRole === 'super_admin' || displayRole === 'admin' || displayRole === 'manager') && (
            <>
              <div className="nav-group">
                <NavLink to="/admin" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <LayoutDashboard size={20} />
                  <span>Dashboard</span>
                </NavLink>
              </div>

              <div className="nav-label mobile-hidden">Management</div>
              <div className="nav-group">

                <NavLink to="/admin/products" className={({ isActive }) => `nav-item mobile-hidden ${isActive ? 'active' : ''}`}>
                  <Package size={20} />
                  <span>Products</span>
                </NavLink>
                <NavLink to="/admin/customers" className={({ isActive }) => `nav-item mobile-hidden ${isActive ? 'active' : ''}`}>
                  <Users size={20} />
                  <span>Customers</span>
                </NavLink>
                <NavLink to="/admin/customer-pricing" className={({ isActive }) => `nav-item mobile-hidden ${isActive ? 'active' : ''}`}>
                  <CreditCard size={20} />
                  <span>Customer Pricing</span>
                </NavLink>
                <NavLink to="/admin/inventory" className={({ isActive }) => `nav-item mobile-hidden ${isActive ? 'active' : ''}`}>
                  <Activity size={20} />
                  <span>Inventory Master</span>
                </NavLink>
              </div>

              <div className="nav-label mobile-hidden">Finance</div>
              <div className="nav-group">
                <NavLink to="/admin/billing" className={({ isActive }) => `nav-item mobile-hidden ${isActive ? 'active' : ''}`}>
                  <FileText size={20} />
                  <span>Invoices</span>
                </NavLink>
                <NavLink to="/admin/quotations" className={({ isActive }) => `nav-item mobile-hidden ${isActive ? 'active' : ''}`}>
                  <ClipboardList size={20} />
                  <span>Quotations</span>
                </NavLink>
                <NavLink to="/admin/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <BarChart2 size={20} />
                  <span>Reports</span>
                </NavLink>
              </div>
            </>
          )}

          {displayRole === 'production' && (
            <>
              <div className="nav-label mobile-hidden">Operations</div>
              <div className="nav-group">
                <NavLink to="/admin/inventory" className={({ isActive }) => `nav-item mobile-hidden ${isActive ? 'active' : ''}`}>
                  <Activity size={20} />
                  <span>Inventory Master</span>
                </NavLink>
              </div>
            </>
          )}

          {(displayRole === 'super_admin' || displayRole === 'admin' || displayRole === 'manager') && (
            <div className="mobile-hidden">
              <div className="nav-label">System</div>
              <div className="nav-group">
                <NavLink to="/admin/invites" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Ticket size={20} />
                  <span>Invite Codes</span>
                </NavLink>
                <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Users size={20} />
                  <span>User Management</span>
                </NavLink>
              </div>
            </div>
          )}

          <div className="nav-label">Configuration</div>
          <div className="nav-group">
            <NavLink to="/admin/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Settings size={20} />
              <span>Brand Management</span>
            </NavLink>
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="sidebar-footer">
          <div className="nav-label">INSIGHTS</div>
          <div className="activity-graph-placeholder" /> {/* Visual Divider */}
          <button
            className="nav-item text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
          <NavLink to={displayRole === 'super_admin' || displayRole === 'admin' ? "/admin/profile" : "/store/profile"} className={({ isActive }) => `nav-item mt-2 ${isActive ? 'active' : ''}`}>
            <User size={20} />
            <span>User Profile</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>

          <div className="flex-1" />

          {/* Right Actions */}
          <div className="top-actions">

            {/* Context Pills */}
            <div className="toolbar-pill-group hidden md:flex">
              <div className="toolbar-pill">
                <Calendar size={15} className="text-muted" />
                <span className="text-sm font-semibold text-main">{todayDate}</span>
              </div>

              <div className="toolbar-pill highlight">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Pending</span>
                <span className="text-sm font-bold text-main">₹{totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="toolbar-divider hidden md:block" />

            {/* Icons */}
            <div className="action-icons">
              <button className="icon-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className="notifications-container" style={{ position: 'relative' }} ref={notificationRef}>
                <button
                  className="icon-btn relative"
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen)
                    if (profileDropdownOpen) setProfileDropdownOpen(false)
                  }}
                >
                  <Bell size={18} />
                  {notifications.length > 0 && (
                    <span className="notification-dot"></span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="notifications-dropdown-menu">
                    <div className="dropdown-header">
                      <p className="font-semibold text-main text-sm">Notifications ({notifications.length})</p>
                    </div>
                    <div className="notifications-list">
                      {notifications.length === 0 ? (
                        <div className="p-3 text-center text-sm text-muted">No new notifications.</div>
                      ) : (
                        notifications.map(note => (
                          <div
                            key={note.id}
                            className={`notification-item ${note.type}`}
                            onClick={() => handleNotificationClick(note)}
                          >
                            <div className="notification-indicator"></div>
                            <p className="text-sm">{note.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-pill-container" ref={profileRef}>
              <div
                className="profile-pill"
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen)
                  if (notificationsOpen) setNotificationsOpen(false)
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="avatar-circle">{initials || 'U'}</div>
                <div className="hidden md:block text-sm text-right mr-2">
                  <p className="font-semibold leading-none text-main">{displayName}</p>
                  <p className="text-xs text-muted">{displayRole === 'super_admin' ? 'Premium' : 'Store'}</p>
                </div>
              </div>

              {profileDropdownOpen && (
                <div className="profile-dropdown-menu">
                  <div className="dropdown-header">
                    <p className="user-email">{displayEmail}</p>
                  </div>
                  <NavLink to={displayRole === 'super_admin' || displayRole === 'admin' ? "/admin/profile" : "/store/profile"} className="dropdown-item" onClick={() => setProfileDropdownOpen(false)}>
                    <User size={16} /> User Profile
                  </NavLink>
                  <NavLink to="/admin/settings" className="dropdown-item" onClick={() => setProfileDropdownOpen(false)}>
                    <Settings size={16} /> Preferences
                  </NavLink>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>

      <style>{`
        /* Styles using CSS Variables for Theming */
        :root {
            --primary: #6366f1;
            --primary-soft: #e0e7ff;
            --bg-body: #f8fafc;
            --bg-sidebar: #ffffff;
            --bg-header: #ffffff;
            --bg-input: #f1f5f9;
            --bg-surface: #ffffff;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --border-color: #e2e8f0;
        }

        :root.dark {
            --primary: #818cf8;
            --primary-soft: rgba(99, 102, 241, 0.15);
            --bg-body: #09090b; /* Zinc 950 */
            
            /* Glassy Backgrounds with better contrast */
            --bg-sidebar: rgba(15, 15, 18, 0.9); 
            --bg-header: rgba(15, 15, 18, 0.85);
            --bg-surface: #1c1c1e; /* Solid background for dropdowns for better visibility */
            --bg-input: rgba(39, 39, 42, 0.6);
            
            --text-main: #fafafa;
            --text-muted: #a1a1aa;
            --border-color: rgba(255, 255, 255, 0.05);
            --border-subtle: rgba(255, 255, 255, 0.03);
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        }
        
        /* Transparent Scrollbars */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

        /* Add Blur to Glass Elements */
        .sidebar, .topbar {
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
        }

        .dashboard-app {
            display: flex;
            min-height: 100vh;
            background-color: var(--bg-body);
            font-family: 'Inter', system-ui, sans-serif;
            color: var(--text-main);
        }

        /* SIDEBAR */
        .sidebar {
            width: 260px;
            background: var(--bg-sidebar);
            border-right: 1px solid var(--border-subtle);
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            bottom: 0;
            z-index: 50;
            transition: transform 0.3s ease, visibility 0.3s;
            box-shadow: var(--shadow-sm);
        }

        .sidebar-header {
            padding: 1.5rem;
            display: flex;
            align-items: center;
        }

        .brand-logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            text-decoration: none;
        }

        .logo-icon-img {
            height: 32px;
            width: auto;
            object-fit: contain;
        }
        
        /* Dark Mode Logo Inversion */
        :root.dark .logo-icon-img {
            filter: invert(1) brightness(2);
        }


        .brand-text {
            display: flex;
            align-items: baseline;
            font-size: 1.1rem;
            line-height: 1;
        }
        
        .font-bold {
            font-weight: 700;
            color: var(--text-main);
        }

        .font-light {
            font-weight: 400;
            color: var(--text-muted);
        }

        .ml-1 { margin-left: 0.25rem; }

        .user-snippet {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.5rem;
        }

        .avatar-small {
            width: 40px;
            height: 40px;
            background: var(--primary);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 0.9rem;
        }

        .user-info .name { font-weight: 600; font-size: 0.95rem; color: var(--text-main); }
        .user-info .role { font-size: 0.8rem; color: var(--text-muted); }

        .sidebar-nav {
            flex: 1;
            padding: 0 1rem;
            overflow-y: auto;
        }

        .nav-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-muted);
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
            padding-left: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            opacity: 0.7;
        }

        .nav-group {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .nav-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.65rem 0.75rem;
            border-radius: 8px;
            color: var(--text-muted);
            font-weight: 500;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
        }

        .nav-item:hover {
            background-color: var(--bg-input);
            color: var(--text-main);
        }

        .nav-item.active {
            background-color: var(--primary-soft);
            color: var(--primary);
            font-weight: 600;
        }

        .badge-plus {
            margin-left: auto;
            background: var(--primary);
            color: white;
            width: 20px;
            height: 20px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            line-height: 1;
        }

        .sidebar-footer {
            padding: 1.5rem;
            border-top: 1px solid var(--border-color);
        }

        /* TOPBAR */
        .main-wrapper {
            flex: 1;
            margin-left: 260px;
            width: calc(100% - 260px);
        }

        .topbar {
            height: 72px;
            background: var(--bg-header);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 2rem;
            position: sticky;
            top: 0;
            z-index: 40;
            min-width: 0;
        }


        .kbd {
            font-size: 0.75rem;
            color: var(--text-muted);
            font-weight: 600;
            border: 1.5px solid var(--border-color);
            padding: 2px 6px;
            border-radius: 6px;
            background: rgba(0, 0, 0, 0.05);
            margin-left: auto;
        }
        :root.dark .kbd {
            background: rgba(255, 255, 255, 0.1);
        }

        .top-actions {
            display: flex;
            align-items: center;
            gap: 1.25rem;
        }



        .toolbar-pill-group {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .toolbar-pill {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.4rem 0.85rem;
            background: var(--bg-input);
            border: 1px solid var(--border-color);
            border-radius: 99px;
            height: 38px;
            transition: all 0.2s;
        }

        .toolbar-pill.highlight {
            background: var(--primary-soft);
            border-color: transparent;
        }
        
        .toolbar-pill.highlight .text-main {
            color: var(--primary);
        }

        .toolbar-divider {
            width: 1px;
            height: 24px;
            background: var(--border-color);
        }

        .action-icons {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .profile-pill-container {
            position: relative;
        }

        .profile-dropdown-menu {
          position: absolute;
          top: 115%;
          right: 0;
          width: 220px;
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
          padding: 0.5rem;
          z-index: 50;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          animation: slideDown 0.2s ease-out;
        }

        .dropdown-header {
          padding: 0.5rem 0.75rem;
          margin-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-subtle);
        }

        .user-email {
          font-size: 0.8rem;
          color: var(--text-muted);
          word-break: break-all;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-main);
          text-decoration: none;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .dropdown-item:hover {
          background: var(--bg-input);
        }

        .dropdown-item.logout {
          color: #dc2626;
          margin-top: 0.25rem;
        }

        .dropdown-item.logout:hover {
          background: rgba(220, 38, 38, 0.1);
        }

        .notifications-dropdown-menu {
          position: absolute;
          top: 115%;
          right: 0;
          width: 300px;
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
          padding: 0.5rem;
          z-index: 50;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          animation: slideDown 0.2s ease-out;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .notification-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 8px;
          background: var(--bg-input);
          color: var(--text-main);
          cursor: pointer;
          transition: all 0.2s;
        }

        .notification-item:hover {
          background: var(--primary-soft);
          transform: translateX(4px);
        }

        .notification-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .notification-item.error .notification-indicator { background: #ef4444; }
        .notification-item.warning .notification-indicator { background: #f59e0b; }
        .notification-item.info .notification-indicator { background: #3b82f6; }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .text-main { color: var(--text-main); }
        .text-muted { color: var(--text-muted); }

        .icon-btn {
            color: var(--text-muted);
            padding: 0.5rem;
            border-radius: 50%;
            transition: background 0.2s;
        }
        .icon-btn:hover { background: var(--bg-input); color: var(--text-main); }

        .notification-dot {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 8px;
            height: 8px;
            background: #ef4444;
            border-radius: 50%;
            border: 2px solid var(--bg-header);
        }

        .profile-pill {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: var(--bg-input);
            padding: 0.25rem 0.25rem 0.25rem 1rem;
            border-radius: 99px;
            border: 1px solid var(--border-color);
            cursor: pointer;
        }

        .avatar-circle {
            width: 36px;
            height: 36px;
            background: var(--primary);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
        }

        .content-area {
            padding: 1.5rem;
            background: var(--bg-body);
        }

        .menu-btn { display: none; }

        @media (max-width: 1024px) {
            .mobile-hidden { display: none !important; }
            .sidebar { transform: translateX(-100%); width: 280px; visibility: hidden; }
            .sidebar.open { transform: translateX(0); visibility: visible; }
            .sidebar-overlay { 
                position: fixed; 
                top: 0; left: 0; right: 0; bottom: 0; 
                background: rgba(0,0,0,0.4); 
                backdrop-filter: blur(4px);
                z-index: 45;
                animation: fadeIn 0.2s ease;
            }
            .sidebar-close-btn { display: flex !important; margin-left: auto; color: var(--text-muted); cursor: pointer; }
            .main-wrapper { margin-left: 0; width: 100%; min-width: 0; }
            .menu-btn { display: block; margin-right: 1rem; color: var(--text-main); }
            .search-bar { display: none !important; }
            .topbar { padding: 0 1rem; width: 100%; min-width: 0; }
            .action-icons .theme-toggle { display: none; }
            .user-snippet { padding: 1rem; }
            .content-area { padding: 1rem; width: 100%; min-width: 0; }
            .toolbar-pill-group { display: none !important; }
            .toolbar-divider { display: none !important; }
            .user-info .name { display: none; }
            .brand-text { font-size: 1rem; }
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
