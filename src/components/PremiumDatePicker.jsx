import React, { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import PremiumCalendar from './PremiumCalendar'
import { createPortal } from 'react-dom'

export default function PremiumDatePicker({
    value,
    onChange,
    label,
    placeholder = 'Select Date',
    className = ''
}) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef(null)
    const [coords, setCoords] = useState({ top: 0, left: 0 })

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const [y, m, d] = dateStr.split('-')
        return `${d}/${m}/${y}`
    }

    const handleClick = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            setCoords({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX
            })
        }
        setIsOpen(!isOpen)
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target) && !event.target.closest('.datepicker-portal')) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className={`premium-datepicker-container ${className}`} ref={containerRef} style={{ position: 'relative' }}>
            {label && <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>}
            <div
                className={`premium-date-input-trigger ${isOpen ? 'active' : ''}`}
                onClick={handleClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    height: '42px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.9rem',
                    color: value ? 'var(--text-main)' : 'var(--text-muted)'
                }}
            >
                <span>{value ? formatDate(value) : placeholder}</span>
                <CalendarIcon size={16} style={{ color: isOpen ? 'var(--color-primary)' : 'var(--text-muted)' }} />
            </div>

            {isOpen && createPortal(
                <div
                    className="datepicker-portal"
                    style={{
                        position: 'absolute',
                        top: coords.top,
                        left: coords.left,
                        zIndex: 10005,
                        minWidth: '280px',
                        background: 'var(--bg-card)',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '16px',
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                >
                    <PremiumCalendar
                        selectedDate={value}
                        onSelect={(date) => {
                            onChange(date)
                            setIsOpen(false)
                        }}
                        mode="single"
                    />
                </div>,
                document.body
            )}
        </div>
    )
}
