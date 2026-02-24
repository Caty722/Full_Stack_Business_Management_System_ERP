import { ShieldCheck, TrendingUp, Users, Headphones, MapPin } from 'lucide-react'

const reasons = [
    { icon: <ShieldCheck />, title: "Reliable", desc: "99.9% Uptime guaranteed for software." },
    { icon: <TrendingUp />, title: "Affordable", desc: "Best-in-class pricing for SMBs." },
    { icon: <Users />, title: "Easy to Use", desc: "No complex training required." },
    { icon: <Headphones />, title: "Pro Support", desc: "24/7 dedicated customer service." },
    { icon: <MapPin />, title: "Built for India", desc: "Tailored for local business needs." }
]

export default function ChooseUs() {
    return (
        <section className="section bg-dark text-white">
            <div className="container">
                <div className="layout-split">
                    <div className="text-content">
                        <h2 className="title">Why businesses trust Ferwa</h2>
                        <p className="subtitle">
                            We design solutions that just work. No clutter, no confusion—just results.
                        </p>
                        <div className="stats">
                            <div className="stat-item">
                                <span className="stat-num">500+</span>
                                <span className="stat-label">Clients</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-num">10k+</span>
                                <span className="stat-label">Daily Users</span>
                            </div>
                        </div>
                    </div>

                    <div className="reasons-grid">
                        {reasons.map((item, index) => (
                            <div key={index} className="reason-card">
                                <div className="icon-box">{item.icon}</div>
                                <div>
                                    <h4>{item.title}</h4>
                                    <p>{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
        .bg-dark {
          background-color: var(--color-primary);
          color: white;
        }
        
        .text-white { color: white; }

        .layout-split {
          display: grid;
          gap: 4rem;
        }

        @media (min-width: 960px) {
          .layout-split {
            grid-template-columns: 0.8fr 1.2fr;
          }
        }

        .title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }

        .subtitle {
          font-size: 1.125rem;
          color: #94a3b8; /* Slate 400 */
          margin-bottom: 3rem;
          max-width: 400px;
        }

        .stats {
          display: flex;
          gap: 3rem;
          margin-top: 2rem;
        }

        .stat-num {
          display: block;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--color-accent);
        }

        .stat-label {
          color: #94a3b8;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .reasons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .reason-card {
          background: rgba(255, 255, 255, 0.05);
          padding: 1.5rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: background 0.2s;
        }

        .reason-card:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .icon-box {
          color: var(--color-accent);
          flex-shrink: 0;
        }

        .reason-card h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .reason-card p {
          font-size: 0.9rem;
          color: #cbd5e1; /* Slate 300 */
        }
      `}</style>
        </section>
    )
}
