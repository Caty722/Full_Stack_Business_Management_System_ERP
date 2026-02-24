import { useAuth } from '../../context/AuthContext'
import { User, Mail, Shield, Calendar, MapPin, Phone, Briefcase } from 'lucide-react'

export default function Profile() {
    const { user, role } = useAuth()

    const displayName = user?.name || user?.displayName || user?.email?.split('@')[0] || "User"
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'Joined recently'

    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* Header Card */}
                <div className="profile-header-card glass-card">
                    <div className="header-content">
                        <div className="profile-avatar">
                            {initials}
                        </div>
                        <div className="header-info">
                            <h1>{displayName}</h1>
                            <div className="role-badge">
                                <Shield size={14} />
                                <span>{role === 'super_admin' ? 'Super Admin' : 'Business Owner'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-sections-grid">
                    {/* Account Details */}
                    <div className="profile-card glass-card">
                        <div className="card-header">
                            <User size={20} className="header-icon" />
                            <h3>Account Information</h3>
                        </div>
                        <div className="info-list">
                            <div className="info-item">
                                <div className="info-label">
                                    <Mail size={16} />
                                    <span>Email Address</span>
                                </div>
                                <div className="info-value">{user?.email}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">
                                    <Phone size={16} />
                                    <span>Mobile Number</span>
                                </div>
                                <div className="info-value">{user?.phoneNumber || 'Not provided'}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">
                                    <Calendar size={16} />
                                    <span>Member Since</span>
                                </div>
                                <div className="info-value">{joinDate}</div>
                            </div>
                        </div>
                    </div>

                    {/* Permissions / Role Info */}
                    <div className="profile-card glass-card">
                        <div className="card-header">
                            <Shield size={20} className="header-icon" />
                            <h3>Role & Permissions</h3>
                        </div>
                        <div className="role-details">
                            <p className="role-description">
                                You are logged in as a <strong>{role?.replace('_', ' ')}</strong>.
                                This grants you full access to business management, reports, and brand configurations.
                            </p>
                            <div className="permission-list">
                                <div className="permission-chip">Invoice Management</div>
                                <div className="permission-chip">Product Control</div>
                                <div className="permission-chip">Customer Relations</div>
                                <div className="permission-chip">Analytics Access</div>
                                {role === 'super_admin' && <div className="permission-chip admin">System Settings</div>}
                            </div>
                        </div>
                    </div>

                    {/* Business Context (Brief) */}
                    <div className="profile-card glass-card full-width">
                        <div className="card-header">
                            <Briefcase size={20} className="header-icon" />
                            <h3>Associated Business</h3>
                        </div>
                        <div className="business-summary">
                            <p>This account is linked to the primary business dashboard. All transactions and reports generated under this profile will reflect the branding configured in your Brand Management settings.</p>
                            <div className="business-stats">
                                <div className="stat-box">
                                    <span className="stat-label">Active Brands</span>
                                    <span className="stat-val">2 (GST & Non-GST)</span>
                                </div>
                                <div className="stat-box">
                                    <span className="stat-label">Location Persistence</span>
                                    <span className="stat-val">Enabled</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .profile-page {
                    animation: fadeIn 0.4s ease-out;
                    max-width: 1000px;
                    margin: 0 auto;
                    padding-bottom: 3rem;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .profile-header-card {
                    padding: 2.5rem;
                    border-radius: 24px;
                    margin-bottom: 2rem;
                    background: linear-gradient(135deg, var(--primary-soft) 0%, transparent 100%);
                    border: 1px solid var(--primary-soft);
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                }

                .profile-avatar {
                    width: 100px;
                    height: 100px;
                    background: var(--primary);
                    color: white;
                    border-radius: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    font-weight: 700;
                    box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
                }

                .header-info h1 {
                    font-size: 2.25rem;
                    font-weight: 800;
                    color: var(--text-main);
                    margin-bottom: 0.5rem;
                    letter-spacing: -0.02em;
                }

                .role-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: var(--primary-soft);
                    color: var(--primary);
                    border-radius: 99px;
                    font-size: 0.9rem;
                    font-weight: 600;
                }

                .profile-sections-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                }

                .profile-card {
                    padding: 1.75rem;
                    border-radius: 20px;
                }

                .profile-card.full-width {
                    grid-column: span 2;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 1rem;
                }

                .header-icon { color: var(--primary); }
                .card-header h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-main); }

                .info-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                .info-item .info-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    margin-bottom: 0.25rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .info-item .info-value {
                    font-size: 1.05rem;
                    font-weight: 500;
                    color: var(--text-main);
                    padding-left: 1.5rem;
                }

                .role-description {
                    color: var(--text-muted);
                    line-height: 1.6;
                    margin-bottom: 1.5rem;
                }

                .permission-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                }

                .permission-chip {
                    padding: 0.4rem 0.8rem;
                    background: var(--bg-input);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--text-main);
                }

                .permission-chip.admin {
                    background: #fef2f2;
                    border-color: #fee2e2;
                    color: #dc2626;
                }

                .business-summary p {
                    color: var(--text-muted);
                    margin-bottom: 1.5rem;
                }

                .business-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .stat-box {
                    padding: 1rem;
                    background: var(--bg-input);
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .stat-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
                .stat-val { font-size: 1rem; color: var(--text-main); font-weight: 700; }

                @media (max-width: 768px) {
                    .profile-sections-grid { grid-template-columns: 1fr; }
                    .profile-card.full-width { grid-column: span 1; }
                    .header-content { flex-direction: column; text-align: center; }
                }
            `}</style>
        </div>
    )
}
