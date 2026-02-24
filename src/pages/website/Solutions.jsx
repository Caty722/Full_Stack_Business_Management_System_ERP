import { motion } from 'framer-motion'
import { Sparkles, FileText, Cpu, Code2 } from 'lucide-react'

const solutions = [
    {
        icon: <Sparkles size={32} />,
        title: "Cleaning & Care",
        desc: "Premium cleaning solutions designed for modern spaces and hygiene."
    },
    {
        icon: <FileText size={32} />,
        title: "Billing Software",
        desc: "Smart invoicing and business management software for retail and enterprise."
    },
    {
        icon: <Cpu size={32} />,
        title: "Smart Automation",
        desc: "Intelligent systems to automate your daily operations and control."
    },
    {
        icon: <Code2 size={32} />,
        title: "Custom Tech",
        desc: "Tailored technology solutions built specifically for your business needs."
    }
]

export default function Solutions() {
    return (
        <section id="solutions" className="section">
            <div className="container">
                <div className="text-center mb-12">
                    <h2 className="section-title">Our Solutions</h2>
                    <p className="section-subtitle">Comprehensive tools for your business space</p>
                </div>

                <div className="solutions-grid">
                    {solutions.map((item, index) => (
                        <div key={index} className="solution-card">
                            <div className="icon-wrapper">
                                {item.icon}
                            </div>
                            <h3>{item.title}</h3>
                            <p>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
        .mb-12 { margin-bottom: 3rem; }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--color-primary);
          margin-bottom: 1rem;
        }

        .section-subtitle {
          color: var(--text-muted);
          font-size: 1.125rem;
        }

        .solutions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }

        .solution-card {
          background: white;
          padding: 2rem;
          border-radius: var(--radius-md);
          border: 1px solid rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }

        .solution-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
          border-color: rgba(37, 99, 235, 0.2);
        }

        .icon-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          background: var(--bg-surface);
          color: var(--color-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .solution-card h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: var(--color-primary);
        }

        .solution-card p {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.6;
        }
      `}</style>
        </section>
    )
}
