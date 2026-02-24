import { useState, useEffect } from 'react'
import { Plus, Copy, Trash2, CheckCircle, XCircle, Ticket, UserCheck, Shield, Calendar, Search, RefreshCw, Layers, Mail, MessageCircle } from 'lucide-react'
import { db } from '../../lib/firebase'
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { useAuth } from '../../context/AuthContext'

export default function InviteCodes() {
    const { user } = useAuth()
    const [codes, setCodes] = useState([])
    const [loading, setLoading] = useState(true)
    const [role, setRole] = useState('admin') // Default to 'admin' for business owners

    const fetchCodes = async () => {
        try {
            const q = query(collection(db, "invite_codes"), orderBy("createdAt", "desc"))
            const snapshot = await getDocs(q)
            setCodes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCodes()
    }, [])

    const generateCode = async () => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase()
        try {
            await addDoc(collection(db, "invite_codes"), {
                code,
                valid: true,
                role,
                createdBy: "super_admin",
                createdAt: new Date().toISOString()
            })
            fetchCodes()
        } catch (error) {
            console.error("Error generating code:", error)
        }
    }

    const deleteCode = async (id) => {
        if (!window.confirm("Are you sure you want to delete this invite code?")) return
        try {
            await deleteDoc(doc(db, "invite_codes", id))
            fetchCodes()
        } catch (error) {
            console.error("Error deleting code:", error)
        }
    }

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code)
        // Using a subtle notification would be better, but for now alerted is fine
    }

    const shareViaEmail = (code, role) => {
        const roleLabels = { admin: 'Business Owner', manager: 'Manager', production: 'Production', customer: 'Client' }
        const roleName = roleLabels[role] || 'User'
        const subject = encodeURIComponent("Secure Access Invitation — Ferwa One Platform")
        const senderName = user?.name || "Ferwa Admin"
        const senderEmail = user?.email || ""
        const signature = senderEmail ? `${senderName}\n${senderEmail}\nFerwa One` : `${senderName}\nFerwa One`
        const signupLink = `${window.location.origin}/signup`
        const body = encodeURIComponent(`Dear User,\n\nYou have been officially granted access to the Ferwa One business platform in the capacity of ${roleName}.\n\nTo complete your registration, please navigate to our portal using the link below and enter your secure access code:\n\nRegistration Link: ${signupLink}\nAccess Code: ${code}\n\nIf you require any assistance during the initial setup, please do not hesitate to reach out.\n\nBest regards,\n${signature}`)

        // Open Gmail compose window specifically
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`
        window.open(gmailUrl, '_blank', 'noopener,noreferrer')
    }

    const shareViaWhatsApp = (code, role) => {
        const roleLabels = { admin: 'Business Owner', manager: 'Manager', production: 'Production', customer: 'Client' }
        const roleName = roleLabels[role] || 'User'
        const senderName = user?.name || "Ferwa Admin"
        const signupLink = `${window.location.origin}/signup`
        const text = encodeURIComponent(`Hello,\n\nYou have been invited by ${senderName} to access the Ferwa One platform as a ${roleName}.\n\nPlease register using this link: ${signupLink}\n\nYour secure authorization code is: *${code}*\n\nPlease use this code during registration at your earliest convenience to activate your account.`)
        window.open(`https://wa.me/?text=${text}`, '_blank')
    }

    return (
        <div className="invite-codes-page">
            {/* Header Section */}
            <header className="page-header-minimal">
                <div className="title-group">
                    <div className="icon-box">
                        <Ticket size={24} />
                    </div>
                    <div>
                        <h1>Invite Codes</h1>
                        <p>Generate and manage access keys for your SaaS products</p>
                    </div>
                </div>

                <div className="header-actions">
                    <div className="action-panel container-glass">
                        <div className="role-selector">
                            <Layers size={16} />
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="admin">Business Owner (Admin)</option>
                                <option value="manager">Manager (Full Access)</option>
                                <option value="production">Production (Inventory Only)</option>
                                <option value="customer">Client (Customer)</option>
                            </select>
                        </div>
                        <button className="btn-generate" onClick={generateCode}>
                            <Plus size={18} />
                            <span>Generate</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* List Section */}
            <div className="codes-grid-container card container-glass">
                <div className="table-responsive">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Invite Key</th>
                                <th>Intended Role</th>
                                <th>Access Status</th>
                                <th>Creation Date</th>
                                <th>Redeemed By</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="skeleton-row">
                                        <td colSpan="6"><div className="skeleton-bar" /></td>
                                    </tr>
                                ))
                            ) : codes.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="empty-state">
                                        <Ticket size={48} />
                                        <p>No invite codes generated yet.</p>
                                    </td>
                                </tr>
                            ) : codes.map(item => (
                                <tr key={item.id} className="code-row">
                                    <td>
                                        <div className="key-box">
                                            <code>{item.code}</code>
                                            <button className="copy-btn" onClick={() => copyToClipboard(item.code)} title="Copy Code">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`role-pill ${item.role}`}>
                                            <Shield size={12} />
                                            <span>
                                                {item.role === 'admin' ? 'Business Owner' :
                                                    item.role === 'manager' ? 'Manager' :
                                                        item.role === 'production' ? 'Production' : 'Client'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`status-pill ${item.valid ? 'active' : 'used'}`}>
                                            <div className="dot" />
                                            <span>{item.valid ? 'Active' : 'Redeemed'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="date-cell">
                                            <Calendar size={14} />
                                            <span>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {item.usedBy ? (
                                            <div className="redeemer-cell">
                                                <UserCheck size={14} />
                                                <span>{item.usedBy.substring(0, 12)}...</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted">—</span>
                                        )}
                                    </td>
                                    <td className="text-right">
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            <button className="action-btn-styled email" onClick={() => shareViaEmail(item.code, item.role)} title="Share via Email">
                                                <Mail size={16} />
                                            </button>
                                            <button className="action-btn-styled whatsapp" onClick={() => shareViaWhatsApp(item.code, item.role)} title="Share via WhatsApp">
                                                <MessageCircle size={16} />
                                            </button>
                                            <button className="delete-btn-styled" onClick={() => deleteCode(item.id)} title="Remove Code">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .invite-codes-page {
                    animation: fadeIn 0.4s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .page-header-minimal {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
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

                .action-panel {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    border-radius: 12px;
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                }

                .role-selector {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0 1rem;
                    background: var(--bg-input);
                    border-radius: 8px;
                    height: 40px;
                    color: var(--text-muted);
                }

                .role-selector select {
                    background: transparent;
                    border: none;
                    outline: none;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-main);
                    cursor: pointer;
                }

                .btn-generate {
                    height: 40px;
                    padding: 0 1.25rem;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-generate:hover {
                    background: #4f46e5;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
                }

                .container-glass {
                    background: var(--bg-surface);
                    border-radius: 20px;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                    box-shadow: var(--shadow-lg);
                }

                .modern-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }

                .modern-table th {
                    background: var(--bg-input);
                    padding: 1.25rem 1.5rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-muted);
                    border-bottom: 1px solid var(--border-color);
                }

                .modern-table td {
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid var(--border-subtle);
                    vertical-align: middle;
                }

                .code-row:hover {
                    background: rgba(99, 102, 241, 0.02);
                }

                .key-box {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: var(--bg-input);
                    padding: 0.4rem 0.75rem;
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                    width: fit-content;
                }

                .key-box code {
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    font-weight: 800;
                    font-size: 1rem;
                    color: var(--primary);
                    letter-spacing: 0.05em;
                }

                .copy-btn {
                    padding: 4px;
                    color: var(--text-muted);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    border-radius: 4px;
                }

                .copy-btn:hover {
                    background: var(--primary-soft);
                    color: var(--primary);
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

                .role-pill.admin { background: var(--primary-soft); color: var(--primary); }
                .role-pill.manager { background: #dbeafe; color: #2563eb; }
                .role-pill.production { background: #fef3c7; color: #d97706; }
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
                .status-pill.used { background: #f1f5f9; color: var(--text-muted); }

                .status-pill .dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: currentColor;
                }

                .date-cell, .redeemer-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    color: var(--text-muted);
                }

                .action-btn-styled {
                    color: var(--text-muted);
                    background: transparent;
                    border: 1px solid var(--border-color);
                    cursor: pointer;
                    padding: 6px;
                    border-radius: 8px;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .action-btn-styled.email:hover {
                    background: rgba(99, 102, 241, 0.1);
                    color: var(--primary);
                    border-color: rgba(99, 102, 241, 0.3);
                }

                .action-btn-styled.whatsapp:hover {
                    background: rgba(34, 197, 94, 0.1);
                    color: #22c55e;
                    border-color: rgba(34, 197, 94, 0.3);
                }

                .delete-btn-styled {
                    color: var(--text-muted);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .delete-btn-styled:hover {
                    background: #fef2f2;
                    color: #dc2626;
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
            `}</style>
        </div>
    )
}
