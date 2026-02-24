import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function PremiumCalendar({
    selectedDate, // For single mode: 'YYYY-MM-DD'
    range,        // For range mode: { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
    onSelect,     // Callback: (dateStr) or (rangeObj)
    mode = 'single' // 'single' or 'range'
}) {
    const [viewDate, setViewDate] = useState(() => {
        const initialDate = mode === 'single' ? (selectedDate ? new Date(selectedDate) : new Date()) : (range?.start ? new Date(range.start) : new Date())
        return isNaN(initialDate.getTime()) ? new Date() : initialDate
    })
    const [viewMode, setViewMode] = useState('days') // 'days', 'months', 'years'

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    const currentRealYear = new Date().getFullYear()
    const yearRange = Array.from({ length: 16 }, (_, i) => (currentRealYear - 8) + i)

    const formatToYYYYMMDD = (date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    const handleDateClick = (date) => {
        const dateStr = formatToYYYYMMDD(date)

        if (mode === 'single') {
            onSelect(dateStr)
        } else {
            if (!range.start || (range.start && range.end)) {
                onSelect({ start: dateStr, end: '' })
            } else {
                const startDate = new Date(range.start)
                if (date < startDate) {
                    onSelect({ start: dateStr, end: range.start })
                } else {
                    onSelect({ ...range, end: dateStr })
                }
            }
        }
    }

    const isSelected = (date) => {
        if (!date) return false
        const ds = formatToYYYYMMDD(date)
        if (mode === 'single') return ds === selectedDate
        return ds === range.start || ds === range.end
    }

    const isInRange = (date) => {
        if (!date || mode !== 'range' || !range.start || !range.end) return false
        const d = date.getTime()
        const s = new Date(range.start).getTime()
        const e = new Date(range.end).getTime()
        return d > s && d < e
    }

    return (
        <div className="premium-calendar shared-calendar">
            <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span
                        className="picker-trigger"
                        onClick={() => setViewMode(viewMode === 'months' ? 'days' : 'months')}
                        style={{ fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-main)', padding: '4px 8px', borderRadius: '6px', background: viewMode === 'months' ? 'rgba(99,102,241,0.1)' : 'transparent' }}
                    >
                        {monthNames[month]}
                    </span>
                    <span
                        className="picker-trigger"
                        onClick={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
                        style={{ fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-main)', padding: '4px 8px', borderRadius: '6px', background: viewMode === 'years' ? 'rgba(99,102,241,0.1)' : 'transparent' }}
                    >
                        {year}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setViewDate(new Date(year, month - 1))} className="cal-nav-btn shared-nav"><ChevronLeft size={16} /></button>
                    <button onClick={() => setViewDate(new Date(year, month + 1))} className="cal-nav-btn shared-nav"><ChevronRight size={16} /></button>
                </div>
            </div>

            {viewMode === 'days' && (
                <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', animation: 'fadeIn 0.2s ease-out' }}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} style={{ fontSize: '0.7rem', fontWeight: 700, textAlign: 'center', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>{d}</div>
                    ))}
                    {(Array.from({ length: firstDayOfMonth(year, month) }, () => null).concat(
                        Array.from({ length: daysInMonth(year, month) }, (_, i) => new Date(year, month, i + 1))
                    )).map((date, idx) => {
                        const selected = isSelected(date)
                        const inRange = isInRange(date)
                        return (
                            <div
                                key={idx}
                                onClick={() => date && handleDateClick(date)}
                                style={{
                                    height: '34px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.85rem',
                                    fontWeight: selected ? '800' : '500',
                                    cursor: date ? 'pointer' : 'default',
                                    borderRadius: selected ? '8px' : '0',
                                    background: selected ? 'var(--color-primary)' : inRange ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                                    color: selected ? 'white' : date ? 'var(--text-main)' : 'transparent',
                                    transition: 'all 0.15s'
                                }}
                                className={date ? 'cal-day transition-all hover:bg-indigo-50 dark:hover:bg-zinc-800' : ''}
                            >
                                {date?.getDate()}
                            </div>
                        )
                    })}
                </div>
            )}

            {viewMode === 'months' && (
                <div className="months-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', animation: 'fadeIn 0.2s ease-out' }}>
                    {monthNames.map((name, i) => (
                        <button
                            key={name}
                            onClick={() => { setViewDate(new Date(year, i)); setViewMode('days'); }}
                            className="picker-btn"
                            style={{
                                padding: '10px 4px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.05)',
                                background: month === i ? 'var(--color-primary)' : 'rgba(0,0,0,0.02)',
                                color: month === i ? 'white' : 'var(--text-main)',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                            }}
                        >
                            {name.substring(0, 3)}
                        </button>
                    ))}
                </div>
            )}

            {viewMode === 'years' && (
                <div className="years-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', animation: 'fadeIn 0.2s ease-out' }}>
                    {yearRange.map(y => (
                        <button
                            key={y}
                            onClick={() => { setViewDate(new Date(y, month)); setViewMode('days'); }}
                            className="picker-btn"
                            style={{
                                padding: '10px 4px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.05)',
                                background: year === y ? 'var(--color-primary)' : 'rgba(0,0,0,0.02)',
                                color: year === y ? 'white' : 'var(--text-main)',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                            }}
                        >
                            {y}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
