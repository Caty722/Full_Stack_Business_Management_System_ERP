import { useState, useEffect } from 'react'
import { Users as UsersIcon, Shield, Mail, Phone, Calendar, Trash2, Edit2, Search, MoreHorizontal, UserPlus, Ban, CheckCircle } from 'lucide-react'
import { db } from '../../lib/firebase'
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'

export default function Users() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const fetchUsers = async () => {
        try {
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"))
            const snapshot = await getDocs(q)
            setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        } catch (e) {
            console.error("Error fetching users:", e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const toggleUserStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'approved' ? 'suspended' : 'approved'
        try {
            await updateDoc(doc(db, "users", userId), { status: newStatus })
            fetchUsers()
        } catch (e) {
            console.error("Error updating user:", e)
        }
    }

    const deleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, "users", userId))
            setUsers(prev => prev.filter(user => user.id !== userId))
        } catch (e) {
            console.error("Error deleting user:", e)
        }
    }

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="users-page-wrapper">
            {/* Header Section */}
            <header className="page-header-minimal">
                <div className="title-group">
                    <div className="icon-box">
                        <UsersIcon size={24} />
                    </div>
                    <div>
                        <h1>User Management</h1>
                        <p>Manage access, roles, and status for all platform users</p>
                    </div>
                </div>

                <div className="header-actions">
                    <div className="search-pill">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="users-grid-container card container-glass">
                <div className="table-responsive">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Identity</th>
                                <th>Contact Information</th>
                                <th>Access Role</th>
                                <th>System Status</th>
                                <th>Onboarding Date</th>
                                <th className="text-right">Manage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="skeleton-row">
                                        <td colSpan="6"><div className="skeleton-bar" /></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="empty-state">
                                        <UsersIcon size={48} />
                                        <p>No users found matching your search.</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="user-row">
                                    <td>
                                        <div className="identity-cell">
                                            <div className={`avatar-box ${user.role === 'super_admin' ? 'admin' : ''}`}>
                                                {user.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div className="name-details">
                                                <span className="user-name">{user.name}</span>
                                                <span className="user-id">ID: {user.id.substring(0, 8)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="contact-cell">
                                            <div className="contact-item">
                                                <Mail size={14} />
                                                <span>{user.email}</span>
                                            </div>
                                            {user.phone && (
                                                <div className="contact-item muted">
                                                    <Phone size={14} />
                                                    <span>{user.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`role-pill ${user.role}`}>
                                            <Shield size={12} />
                                            <span>{user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Business Owner' : 'Client'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`status-pill ${user.status === 'approved' ? 'active' : 'suspended'}`}>
                                            <div className="dot" />
                                            <span>{user.status === 'approved' ? 'Approved' : 'Suspended'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="date-cell">
                                            <Calendar size={14} />
                                            <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending'}</span>
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        {user.role !== 'super_admin' && (
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                <button
                                                    className={`action-btn-styled ${user.status === 'approved' ? 'suspend' : 'approve'}`}
                                                    onClick={() => toggleUserStatus(user.id, user.status)}
                                                    title={user.status === 'approved' ? 'Suspend User' : 'Approve User'}
                                                >
                                                    {user.status === 'approved' ? <Ban size={18} /> : <CheckCircle size={18} />}
                                                    <span>{user.status === 'approved' ? 'Suspend' : 'Approve'}</span>
                                                </button>
                                                <button
                                                    className="action-btn-styled delete"
                                                    onClick={() => deleteUser(user.id)}
                                                    title="Permanently Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .users-page-wrapper {
                    animation: slideIn 0.4s ease-out;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .page-header-minimal {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    max-width: 100%;
                    padding: 0 1rem;
                }

                .title-group {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                }

                .icon-box {
                    width: 48px;
                    height: 48px;
                    background: var(--primary);
                    color: white;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 16px rgba(99, 102, 241, 0.2);
                }

                .title-group h1 {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: var(--text-main);
                    margin: 0;
                    letter-spacing: -0.02em;
                }

                .title-group p {
                    font-size: 0.95rem;
                    color: var(--text-muted);
                    margin: 0;
                }

                .search-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    padding: 0.6rem 1.25rem;
                    border-radius: 99px;
                    width: 350px;
                    transition: all 0.2s;
                    box-shadow: var(--shadow-sm);
                }

                .search-pill:focus-within {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 4px var(--primary-soft);
                    width: 380px;
                }

                .search-pill input {
                    border: none;
                    background: transparent;
                    flex: 1;
                    outline: none;
                    font-size: 0.9rem;
                    color: var(--text-main);
                }

                .container-glass {
                    background: var(--bg-surface);
                    border-radius: 20px;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                    box-shadow: var(--shadow-lg);
                }

                .table-responsive {
                    width: 100%;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }

                .modern-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }

                .modern-table th {
                    background: var(--bg-input);
                    padding: 1.25rem 1rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-muted);
                    border-bottom: 1px solid var(--border-color);
                    white-space: nowrap;
                }

                .modern-table td {
                    padding: 1.25rem 1rem;
                    border-bottom: 1px solid var(--border-subtle);
                    vertical-align: middle;
                }

                .user-row {
                    transition: background 0.2s;
                }

                .user-row:hover {
                    background: rgba(99, 102, 241, 0.02);
                }

                .identity-cell {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .avatar-box {
                    width: 44px;
                    height: 44px;
                    background: var(--bg-input);
                    color: var(--primary);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1.1rem;
                    border: 1px solid var(--border-color);
                }

                .avatar-box.admin {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }

                .name-details {
                    display: flex;
                    flex-direction: column;
                }

                .user-name {
                    font-weight: 700;
                    font-size: 1rem;
                    color: var(--text-main);
                }

                .user-id {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .contact-cell {
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                }

                .contact-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    color: var(--text-main);
                    font-weight: 500;
                }

                .contact-item span {
                    max-width: 220px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .contact-item.muted {
                    color: var(--text-muted);
                    font-size: 0.85rem;
                }

                .role-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.4rem 0.8rem;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .role-pill.super_admin { background: #fee2e2; color: #dc2626; }
                .role-pill.admin { background: var(--primary-soft); color: var(--primary); }
                .role-pill.customer { background: #f1f5f9; color: #475569; }

                .status-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.4rem 0.8rem;
                    border-radius: 99px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .status-pill.active { background: #dcfce7; color: #16a34a; }
                .status-pill.suspended { background: #fef2f2; color: #dc2626; }

                .status-pill .dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: currentColor;
                }

                .date-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    color: var(--text-muted);
                }

                .action-btn-styled {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    border: 1px solid transparent;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .action-btn-styled.suspend {
                    background: #fef2f2;
                    color: #dc2626;
                }

                .action-btn-styled.suspend:hover {
                    background: #dc2626;
                    color: white;
                }

                .action-btn-styled.approve {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .action-btn-styled.approve:hover {
                    background: #16a34a;
                    color: white;
                }

                .action-btn-styled.delete {
                    background: var(--bg-surface);
                    color: var(--text-muted);
                    padding: 0.5rem;
                    border: 1px solid var(--border-color);
                }

                .action-btn-styled.delete:hover {
                    background: #fef2f2;
                    color: #dc2626;
                    border-color: #fecaca;
                }

                .text-right { text-align: right; }

                .empty-state {
                    padding: 4rem;
                    text-align: center;
                    color: var(--text-muted);
                }

                .empty-state p { margin-top: 1rem; font-size: 1rem; }

                .skeleton-row .skeleton-bar {
                    height: 12px;
                    background: var(--bg-input);
                    border-radius: 4px;
                    width: 100%;
                    animation: pulse 1.5s infinite;
                }

                @keyframes pulse {
                    0% { opacity: 0.5; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0.5; }
                }

                @media (max-width: 1024px) {
                    .modern-table th:nth-child(5),
                    .modern-table td:nth-child(5) { display: none; }
                }
            `}</style>
        </div>
    )
}
