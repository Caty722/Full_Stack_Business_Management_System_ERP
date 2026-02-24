import React, { useRef, useEffect, useState } from 'react'

export default function SignaturePad({ onSave, initialData }) {
    const canvasRef = useRef(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        ctx.strokeStyle = '#000080' // Navy Blue
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        if (initialData) {
            const img = new Image()
            img.onload = () => {
                ctx.drawImage(img, 0, 0)
                setHasStarted(true)
            }
            img.src = initialData
        }
    }, [initialData])

    const startDrawing = (e) => {
        const { offsetX, offsetY } = e.nativeEvent
        const ctx = canvasRef.current.getContext('2d')
        ctx.beginPath()
        ctx.moveTo(offsetX, offsetY)
        setIsDrawing(true)
        setHasStarted(true)
    }

    const draw = (e) => {
        if (!isDrawing) return
        const { offsetX, offsetY } = e.nativeEvent
        const ctx = canvasRef.current.getContext('2d')
        ctx.lineTo(offsetX, offsetY)
        ctx.stroke()
    }

    const stopDrawing = () => {
        setIsDrawing(false)
        const dataURL = canvasRef.current.toDataURL()
        onSave(dataURL)
    }

    const clear = () => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setHasStarted(false)
        onSave(null)
    }

    return (
        <div className="signature-pad-container" style={{ position: 'relative' }}>
            <canvas
                ref={canvasRef}
                width={400}
                height={150}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                style={{
                    border: '1px dashed var(--border-color)',
                    borderRadius: '8px',
                    background: '#fff',
                    cursor: 'crosshair',
                    width: '100%',
                    height: '150px'
                }}
            />
            {hasStarted && (
                <button
                    onClick={clear}
                    style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        background: 'rgba(0,0,0,0.1)',
                        borderRadius: '4px',
                        fontWeight: '700'
                    }}
                >
                    Clear
                </button>
            )}
        </div>
    )
}
