import { ArrowUpRight } from 'lucide-react'

export default function Products() {
    return (
        <section id="products" className="section bg-surface">
            <div className="container">
                <div className="header-flex">
                    <div>
                        <h2 className="section-title">Product Showcase</h2>
                        <p className="subtitle">Built for impact. Designed for you.</p>
                    </div>
                    <a href="#" className="view-all">View All Products <ArrowUpRight size={18} /></a>
                </div>

                <div className="bento-grid">
                    {/* Main Feature Product */}
                    <div className="card large-card">
                        <div className="card-content">
                            <span className="tag">Featured</span>
                            <h3>Ferwa BillPro</h3>
                            <p>The ultimate smart billing & inventory software for retail.</p>
                            <button className="btn-link">Learn more</button>
                        </div>
                        <div className="card-media media-1"></div>
                    </div>

                    {/* Secondary Product */}
                    <div className="card medium-card">
                        <div className="card-content">
                            <h3>CleanMate 360</h3>
                            <p>Automated hygiene management.</p>
                        </div>
                        <div className="card-media media-2"></div>
                    </div>

                    {/* Tertiary Product */}
                    <div className="card medium-card">
                        <div className="card-content">
                            <h3>HomeSmart Hub</h3>
                            <p>IoT control center.</p>
                        </div>
                        <div className="card-media media-3"></div>
                    </div>
                </div>
            </div>

            <style>{`
        .header-flex {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 3rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .section-title {
          font-size: 2.25rem;
          font-weight: 700;
          color: var(--color-primary);
          margin-bottom: 0.5rem;
        }

        .subtitle { color: var(--text-muted); }

        .view-all {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: var(--color-accent);
        }

        .bento-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .bento-grid {
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(2, 300px);
          }
          
          .large-card {
            grid-column: span 2;
            grid-row: span 2;
          }
        }

        .card {
          background: white;
          border-radius: var(--radius-lg);
          overflow: hidden;
          position: relative;
          box-shadow: var(--shadow-sm);
          transition: transform 0.3s;
          border: 1px solid rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
        }

        .card-content {
          padding: 2rem;
          z-index: 2;
        }

        .large-card .card-content {
          max-width: 60%;
        }

        .tag {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-accent);
          background: #eff6ff;
          padding: 0.25rem 0.75rem;
          border-radius: full;
          margin-bottom: 1rem;
          display: inline-block;
          border-radius: 99px;
        }

        .card h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--color-primary);
        }

        .card p {
          color: var(--text-muted);
          margin-bottom: 1.5rem;
        }

        .btn-link {
          font-weight: 600;
          color: var(--color-primary);
          text-decoration: underline;
        }

        .card-media {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 50%;
          height: 100%;
          background: #e2e8f0;
        }

        .large-card .card-media {
          width: 40%;
          background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
        }

        .medium-card .card-media {
          width: 100%;
          height: 50%;
          bottom: 0;
          top: auto;
        }

        .media-1 { background-color: #dbeafe !important; }
        .media-2 { background-color: #f1f5f9 !important; }
        .media-3 { background-color: #f8fafc !important; }

      `}</style>
        </section>
    )
}
