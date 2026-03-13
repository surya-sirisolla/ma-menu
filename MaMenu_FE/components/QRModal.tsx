'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Download, Printer } from 'lucide-react'
import QRCode from 'qrcode'

interface Props {
  open: boolean
  onClose: () => void
  tableNumber: number
  tableLabel?: string
  qrValue: string   // the URL string from backend
  hotelName?: string
}

export default function QRModal({ open, onClose, tableNumber, tableLabel, qrValue, hotelName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    if (!open || !qrValue) return
    // Normalise legacy paths that pointed at the API instead of the frontend page
    const path = qrValue.replace(/^\/api\/v1\/public\/menu\//, '/menu/')
    const fullUrl = `${window.location.origin}${path}`
    QRCode.toCanvas(canvasRef.current!, fullUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
    QRCode.toDataURL(fullUrl, { width: 280, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
      .then(setDataUrl)
  }, [open, qrValue])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function handleDownload() {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `table-${tableNumber}-qr.png`
    a.click()
  }

  function handlePrint() {
    if (!dataUrl) return
    const win = window.open('', '_blank')!
    win.document.write(`
      <html>
        <head>
          <title>Table ${tableNumber} QR Code</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; background: #fff; }
            .card { border: 2px solid #e2e8f0; border-radius: 16px; padding: 32px; text-align: center; max-width: 360px; }
            h2 { margin: 0 0 4px; font-size: 22px; color: #0f172a; }
            p  { margin: 0 0 20px; font-size: 14px; color: #64748b; }
            img { width: 240px; height: 240px; }
            .tag { margin-top: 16px; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body onload="window.print(); window.close()">
          <div class="card">
            <h2>${hotelName ?? 'Restaurant'}</h2>
            <p>${tableLabel || `Table ${tableNumber}`}</p>
            <img src="${dataUrl}" />
            <p class="tag">Scan to view menu</p>
          </div>
        </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {tableLabel || `Table ${tableNumber}`} — QR Code
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Scan to access digital menu</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* qr */}
        <div className="flex flex-col items-center px-6 py-6 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-inner">
            <canvas ref={canvasRef} className="block" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              {tableLabel || `Table ${tableNumber}`}
            </p>
            {hotelName && <p className="text-xs text-slate-400 mt-0.5">{hotelName}</p>}
          </div>
        </div>

        {/* actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={handleDownload}
            className="btn-secondary flex-1"
          >
            <Download size={15} />
            Download PNG
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary flex-1"
          >
            <Printer size={15} />
            Print
          </button>
        </div>
      </div>
    </div>
  )
}
