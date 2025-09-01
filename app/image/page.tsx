'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/components/ui/use-toast'
import { Brain, Sun, Moon, ArrowLeft, Sparkles, Palette, Download, Copy, History, Trash2, Wand2 } from 'lucide-react'

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [size, setSize] = useState<'1024x1024' | '1024x1792' | '1792x1024'>('1024x1024')
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid')
  const [isDark, setIsDark] = useState(false)
  const stylePresets: Array<{ key: string; label: string; promptAddon: string; icon: string; gradient: string }> = [
    { key: 'photorealistic', label: 'ფოტორეალისტური', promptAddon: 'highly detailed photorealistic, shallow depth of field, realistic lighting', icon: '📸', gradient: 'from-blue-500 to-cyan-500' },
    { key: 'cinematic', label: 'სინემატიური', promptAddon: 'cinematic lighting, film still, dramatic composition, anamorphic bokeh', icon: '🎬', gradient: 'from-purple-500 to-pink-500' },
    { key: 'watercolor', label: 'აქვარელი', promptAddon: 'soft watercolor painting, textured paper, delicate brush strokes', icon: '🎨', gradient: 'from-teal-500 to-emerald-500' },
    { key: 'studio3d', label: '3D რენდერი', promptAddon: 'ultra-detailed 3D render, octane render, global illumination', icon: '🎯', gradient: 'from-orange-500 to-red-500' },
    { key: 'anime', label: 'ანიმე', promptAddon: 'anime style, clean line art, cel shading, vibrant colors', icon: '🌸', gradient: 'from-pink-500 to-rose-500' },
    { key: 'pixel', label: 'პიქსელ არტი', promptAddon: '8-bit pixel art, limited palette, crisp pixel edges', icon: '👾', gradient: 'from-indigo-500 to-purple-500' },
    { key: 'isometric', label: 'იზომეტრიული', promptAddon: 'isometric view, clean geometry, detailed miniature scene', icon: '🏗️', gradient: 'from-gray-500 to-slate-500' },
    { key: 'lineart', label: 'ხაზოვანი არტი', promptAddon: 'black and white line art, clean outlines, minimal shading', icon: '✏️', gradient: 'from-slate-500 to-gray-500' },
    { key: 'vintage', label: 'ვინტაჟური', promptAddon: 'vintage retro aesthetic, muted tones, film grain', icon: '📷', gradient: 'from-amber-500 to-yellow-500' },
    { key: 'surreal', label: 'სიურეალისტური', promptAddon: 'surreal dreamlike imagery, imaginative, unexpected juxtapositions', icon: '🌙', gradient: 'from-violet-500 to-purple-500' },
  ]
  const [activePresetKey, setActivePresetKey] = useState<string | null>(null)
  const [generations, setGenerations] = useState<Array<{
    id: string
    url: string
    prompt: string
    revisedPrompt: string | null
    size: '1024x1024' | '1024x1792' | '1792x1024'
    quality: 'standard' | 'hd'
    style: 'vivid' | 'natural'
    createdAt: number
  }>>([])

  // Load and save generations to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load on first mount
      const saved = localStorage.getItem('aluda-image-generations')
      if (saved && generations.length === 0) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            setGenerations(parsed)
          }
        } catch (e) {
          console.warn('Failed to parse saved generations:', e)
          localStorage.removeItem('aluda-image-generations')
        }
      }
      
      // Load current image state
      const savedCurrentImage = localStorage.getItem('aluda-current-image')
      if (savedCurrentImage) {
        try {
          const parsed = JSON.parse(savedCurrentImage)
          if (parsed.url) {
            setImageUrl(parsed.url)
            setRevisedPrompt(parsed.revisedPrompt || null)
          }
        } catch (e) {
          console.warn('Failed to parse saved current image:', e)
          localStorage.removeItem('aluda-current-image')
        }
      }
    }
  }, []) // Only run on mount

  // Save generations whenever they change (but not on initial load)
  useEffect(() => {
    if (typeof window !== 'undefined' && generations.length > 0) {
      try {
        localStorage.setItem('aluda-image-generations', JSON.stringify(generations))
      } catch (e) {
        console.warn('Failed to save generations:', e)
      }
    }
  }, [generations])

  // Save current image state whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('aluda-current-image', JSON.stringify({
          url: imageUrl,
          revisedPrompt: revisedPrompt
        }))
      } catch (e) {
        console.warn('Failed to save current image:', e)
      }
    }
  }, [imageUrl, revisedPrompt])



  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: buildPromptWithPreset(prompt, activePresetKey), size, quality, style }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to generate image')

      const url = data?.url || data?.image?.url || data?.data?.[0]?.url
      if (url) {
        setImageUrl(url)
        setRevisedPrompt(data?.revised_prompt || null)
        const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
          ? (crypto as any).randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
        setGenerations(prev => [
          {
            id,
            url,
            prompt,
            revisedPrompt: data?.revised_prompt || null,
            size,
            quality,
            style,
            createdAt: Date.now(),
          },
          ...prev,
        ])
      }
      else setError('No image URL returned')
    } catch (e: any) {
      const msg = e?.message || 'Unknown error'
      setError(msg)
      toast({ title: 'გენერაცია ვერ შესრულდა', description: msg })
    } finally {
      setIsLoading(false)
    }
  }

  function buildPromptWithPreset(base: string, presetKey: string | null): string {
    if (!presetKey) return base
    const preset = stylePresets.find(p => p.key === presetKey)
    if (!preset) return base
    return `${base}\nStyle: ${preset.promptAddon}`
  }




  useEffect(() => {
    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('aluda-theme') : null
    if (savedTheme === 'dark' || (!savedTheme && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true)
      if (typeof document !== 'undefined') document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    if (typeof document !== 'undefined') {
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('aluda-theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('aluda-theme', 'light')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:bg-chat-bg">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <a href="/chat" className="group flex items-center space-x-3" aria-label="AludaAI">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">AludaAI</span>
                <div className="text-xs text-gray-500 dark:text-gray-400">AI Image Generator</div>
              </div>
            </a>
            <div className="flex items-center gap-3">
              <a
                href="/chat"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-input-bg backdrop-blur-sm border border-gray-200/50 dark:border-gray-700 hover:bg-white dark:hover:bg-user-bubble text-sm font-medium transition-all duration-200 hover:shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>მთავარზე</span>
              </a>
              <button
                onClick={toggleTheme}
                className="p-3 rounded-xl bg-white/80 dark:bg-input-bg backdrop-blur-sm border border-gray-200/50 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-user-bubble transition-all duration-200 hover:shadow-md"
                title={isDark ? 'Light Mode' : 'Dark Mode'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          

        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          {/* Enhanced Left Panel: Controls */}
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-input-bg backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700">
              {/* Enhanced Prompt Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-500" />
                  აღწერე სურათი
                </label>
                <textarea
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-input-bg p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all duration-200 resize-none"
                  rows={5}
                  placeholder="აღწერე სურათი, რომლის გენერირებაც გინდა..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              {/* Enhanced Settings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ზომა</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value as any)}
                    className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-input-bg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all duration-200"
                  >
                    <option value="1024x1024">1024×1024 - კვადრატი</option>
                    <option value="1792x1024">1792×1024 - ჰორიზონტალური</option>
                    <option value="1024x1792">1024×1792 - ვერტიკალური</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ხარისხი</label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as any)}
                    className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-input-bg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all duration-200"
                  >
                    <option value="standard">სტანდარტული</option>
                    <option value="hd">მაღალი ხარისხი (4K)</option>
                  </select>
                </div>
              </div>

              {/* Enhanced Style Presets */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-500" />
                  სტილის პრესეტები
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {stylePresets.map(preset => (
                    <button
                      key={preset.key}
                      onClick={() => setActivePresetKey(prev => prev === preset.key ? null : preset.key)}
                      className={`group relative px-3 py-2 rounded-lg border-2 transition-all duration-300 hover:scale-102 ${
                        activePresetKey === preset.key 
                          ? `border-purple-500 bg-gradient-to-r ${preset.gradient} text-white shadow-md` 
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-input-bg hover:bg-gray-50 dark:hover:bg-user-bubble'
                      }`}
                      title={preset.promptAddon}
                    >
                                          <div className="flex items-center gap-1.5">
                      <span className="text-xs">{preset.icon}</span>
                      <span className={`text-xs font-medium leading-tight ${activePresetKey === preset.key ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {preset.label}
                      </span>
                    </div>
                      {activePresetKey === preset.key && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={!prompt || isLoading}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      მიმდინარეობს გენერაცია…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      დაგენერირე
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setPrompt(''); setError(null) }}
                  className="px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200 font-medium"
                >
                  გასუფთავება
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Right Panel: Result */}
          <div className="space-y-6">
            {!imageUrl && !isLoading && (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center bg-white/80 dark:bg-input-bg backdrop-blur-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">დაგენერირებული სურათი</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">აქ გამოჩნდება თქვენი შექმნილი ხელოვნება</p>
              </div>
            )}

            {isLoading && (
              <div className="bg-white/80 dark:bg-input-bg backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700">
                <div className="animate-pulse space-y-4">
                  <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
            )}

            {imageUrl && (
              <div className="bg-white/80 dark:bg-input-bg backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700">
                <div className="relative group mb-4">
                  <img 
                    src={imageUrl} 
                    alt="Generated" 
                    className="rounded-xl w-full shadow-lg group-hover:shadow-xl transition-all duration-300" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all duration-300"></div>
                </div>
                
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(imageUrl)
                      toast({ title: 'ბმული დაკოპირებულია!', description: 'სურათის ბმული clipboard-შია' })
                    }}
                    className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-user-bubble transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    ბმულის კოპირება
                  </button>
                  <a
                    href={imageUrl}
                    download
                    className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    ჩამოტვირთვა
                  </a>
                </div>

                {generations.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <History className="w-4 h-4 text-purple-500" />
                        გენერაციების ისტორია
                      </h3>
                      <button
                        onClick={() => {
                          setGenerations([])
                          if (typeof window !== 'undefined') {
                            localStorage.removeItem('aluda-image-generations')
                            localStorage.removeItem('aluda-current-image')
                          }
                        }}
                        className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        გასუფთავება
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {generations.map(g => (
                        <button
                          key={g.id}
                          onClick={() => { setImageUrl(g.url); setRevisedPrompt(g.revisedPrompt) }}
                          className={`group relative border-2 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 ${
                            imageUrl === g.url 
                              ? 'ring-2 ring-purple-500 border-purple-500' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                          }`}
                          title={g.prompt}
                        >
                          <img src={g.url} alt="thumb" className="aspect-square object-cover w-full" />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <div className="text-[10px] text-white flex justify-between items-center">
                              <span className="font-medium">{g.size.replace('1024x','1k×')}</span>
                              <span className={`px-1 py-0.5 rounded text-[8px] ${
                                g.quality === 'hd' 
                                  ? 'bg-purple-500 text-white' 
                                  : 'bg-gray-500 text-white'
                              }`}>
                                {g.quality === 'hd' ? 'HD' : 'Std'}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {revisedPrompt && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">დახვეწილი პრომპტი:</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                        {revisedPrompt}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


