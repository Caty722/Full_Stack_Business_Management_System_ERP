import { Instagram, Linkedin, Twitter, Facebook } from 'lucide-react'

export default function Footer() {
    return (
        <footer id="contact" className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <a href="#" className="footer-logo">Ferwa</a>
                        <p>Rule Your Space.</p>
                        <div className="socials">
                            <a href="#"><Twitter size={20} /></a>
                            <a href="#"><Linkedin size={20} /></a>
                            <a href="#"><Instagram size={20} /></a>
                            <a href="#"><Facebook size={20} /></a>
                        </div>
                    </div>

                    <div className="footer-links">
                        <div>
                            <h4>Company</h4>
                            <ul>
                                <li><a href="#about">About Us</a></li>
                                <li><a href="#">Careers</a></li>
                                <li><a href="#">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4>Solutions</h4>
                            <ul>
                                <li><a href="#products">Billing Software</a></li>
                                <li><a href="#products">Automation</a></li>
                                <li><a href="#products">Cleaning</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4>Resources</h4>
                            <ul>
                                <li><a href="#">Blog</a></li>
                                <li><a href="#">Support</a></li>
                                <li><a href="#">Privacy Policy</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} Ferwa One. All rights reserved.</p>
                </div>
            </div>

            <style>{`
        .footer {
          background-color: #0f172a;
          color: white;
          padding: 5rem 0 2rem;
          margin-top: 4rem;
        }

        .footer-grid {
          display: grid;
          gap: 4rem;
          margin-bottom: 4rem;
        }

        @media (min-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 2fr;
          }
        }

        .footer-logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          display: inline-block;
          margin-bottom: 1rem;
        }

        .footer-brand p {
          color: #94a3b8;
          margin-bottom: 1.5rem;
        }

        .socials {
          display: flex;
          gap: 1rem;
        }

        .socials a {
          color: #94a3b8;
          transition: color 0.2s;
        }

        .socials a:hover {
          color: white;
        }

        .footer-links {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        @media (max-width: 640px) {
          .footer-links {
            grid-template-columns: 1fr;
          }
        }

        .footer-links h4 {
          font-weight: 600;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .footer-links ul {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .footer-links a {
          color: #cbd5e1;
          font-size: 0.95rem;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: white;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 2rem;
          text-align: center;
          color: #64748b;
          font-size: 0.875rem;
        }
      `}</style>
        </footer>
    )
}
