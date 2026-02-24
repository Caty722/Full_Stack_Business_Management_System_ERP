import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getFiscalYearPresets } from '../lib/dateUtils';
import PremiumCalendar from './PremiumCalendar';

export default function DateRangeModal({ onClose, onSelect, selected, customRange }) {
    const [isCustom, setIsCustom] = useState(selected === 'Custom');
    const [tempStart, setTempStart] = useState(customRange?.start || '');
    const [tempEnd, setTempEnd] = useState(customRange?.end || '');

    const presets = [
        "All", "Today", "Yesterday", "This Week",
        "Last Week", "This Month", "Last Month",
        "Last 30 Days", "This Year", "Last Year",
        "Last Quarter", ...getFiscalYearPresets()
    ];

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="date-modal"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
            >
                <button className="modal-close" onClick={onClose}>
                    <X size={20} />
                </button>
                <h2 className="modal-title">Select Date Range</h2>

                <div className="modal-body-scrollable">
                    <p className="modal-section-title">Presets</p>
                    <div className="presets-grid">
                        {presets.map(preset => (
                            <button
                                key={preset}
                                className={`preset-chip ${!isCustom && selected === preset ? 'active' : ''}`}
                                onClick={() => {
                                    setIsCustom(false);
                                    onSelect(preset);
                                }}
                            >
                                {preset}
                            </button>
                        ))}
                    </div>

                    <div className="custom-section">
                        <button
                            className={`custom-range-btn ${isCustom ? 'active' : ''}`}
                            onClick={() => setIsCustom(true)}
                        >
                            Custom Range
                        </button>

                        <AnimatePresence>
                            {isCustom && (
                                <motion.div
                                    className="custom-inputs"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                >
                                    <PremiumCalendar
                                        range={{ start: tempStart, end: tempEnd }}
                                        onSelect={(r) => {
                                            setTempStart(r.start);
                                            setTempEnd(r.end);
                                        }}
                                        mode="range"
                                    />
                                    <button
                                        className="btn btn-primary w-full mt-6"
                                        disabled={!tempStart || !tempEnd}
                                        onClick={() => onSelect('Custom', { start: tempStart, end: tempEnd })}
                                        style={{
                                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                            border: 'none',
                                            borderRadius: '14px',
                                            padding: '14px',
                                            fontWeight: 800,
                                            boxShadow: (tempStart && tempEnd) ? '0 4px 15px rgba(79, 70, 229, 0.4)' : 'none'
                                        }}
                                    >
                                        Apply Custom Range
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
            <style>{`
        /* Date Range Modal Styles */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(8px);
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
        }
        .date-modal {
            background: var(--bg-surface);
            border: 1px solid var(--border-color);
            border-radius: 28px;
            width: 100%;
            max-width: 440px;
            padding: 2rem;
            box-shadow: var(--shadow-lg);
            position: relative;
        }
        .modal-close {
            position: absolute;
            top: 1.5rem;
            right: 1.5rem;
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.2s;
        }
        .modal-close:hover { opacity: 1; }
        .modal-title { font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem; }
        .modal-section-title { font-size: 0.9rem; font-weight: 700; color: var(--text-main); margin: 1.5rem 0 1rem 0; }
        
        .presets-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.6rem;
        }
        .preset-chip {
            padding: 0.5rem 1rem;
            border-radius: 99px;
            background: var(--bg-input);
            border: 1px solid var(--border-color);
            color: var(--text-main);
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .preset-chip:hover { border-color: var(--primary); transform: translateY(-1px); }
        .preset-chip.active {
            background: var(--primary);
            border-color: var(--primary);
            color: white;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        
        .modal-body-scrollable {
            max-height: 60vh;
            overflow-y: auto;
            margin: 0 -0.5rem;
            padding: 0 0.5rem;
        }
        .modal-body-scrollable::-webkit-scrollbar { width: 4px; }
        .modal-body-scrollable::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }

        .custom-section {
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--border-color);
        }

        .custom-range-btn {
            width: 100%;
            padding: 0.85rem;
            background: transparent;
            border: 1px solid var(--border-color);
            border-radius: 14px;
            color: var(--text-main);
            font-weight: 700;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        .custom-range-btn:hover { background: var(--bg-input); border-color: var(--text-muted); }
        .custom-range-btn.active {
            background: var(--primary);
            border-color: var(--primary);
            color: white;
        }

        .custom-inputs {
            margin-top: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            overflow: hidden;
        }
        .input-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .input-group label {
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--text-muted);
        }
        .input-group input {
            background: var(--bg-input);
            border: 1px solid var(--border-color);
            color: var(--text-main);
            padding: 0.75rem 1rem;
            border-radius: 12px;
            font-size: 0.9rem;
            outline: none;
            transition: border-color 0.2s;
        }
        .input-group input:focus { border-color: var(--primary); }
        .w-full { width: 100%; }
        .mt-4 { margin-top: 1rem; }
      `}</style>
        </motion.div>
    );
}
