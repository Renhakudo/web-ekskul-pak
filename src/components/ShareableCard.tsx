'use client'

import React, { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

interface ShareableCardProps {
  children: React.ReactNode
  username: string
}

export default function ShareableCard({ children, username }: ShareableCardProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadImage = async () => {
    const element = printRef.current
    if (!element) return

    setIsDownloading(true)
    try {
      const dataUrl = await toPng(element, {
        pixelRatio: 2, // Resolusi tinggi
        cacheBust: true, // Bypass cache gambar untuk avatar silang domain (cors)
        backgroundColor: 'rgba(0,0,0,0)', // Transparan
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      })
      
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `ekskulpak-${username || 'profil'}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error) {
      console.error('Failed to generate image', error)
      toast.error("Gagal mengekstrak gambar, coba lagi nanti.")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex flex-col w-full h-full relative">
       {/* Tombol Ekstrak */}
       <div className="absolute -top-16 right-0 md:static md:mb-4 md:flex md:justify-end z-20">
         <Button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            variant="outline"
            className="bg-yellow-300 border-4 border-slate-900 font-black text-slate-900 shadow-[4px_4px_0px_#0f172a] hover:bg-yellow-400 hover:-translate-y-1 transition-transform rounded-2xl h-12"
          >
            <Download className="w-5 h-5 mr-2" /> 
            {isDownloading ? 'Mengekstrak...' : 'Unduh Kartu (PNG)'}
          </Button>
       </div>

       {/* Wrap Card Elements In This Div */}
       <div ref={printRef} className="rounded-[48px] overflow-hidden w-full h-full flex items-center justify-center p-4 -m-4 bg-[#FDFBF7]">
          {children}
       </div>
    </div>
  )
}
