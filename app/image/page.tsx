'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/components/ui/use-toast'
import { Brain, Sun, Moon, ArrowLeft } from 'lucide-react'

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
  const stylePresets: Array<{ key: string; label: string; promptAddon: string }> = [
    { key: 'photorealistic', label: 'Photorealistic', promptAddon: 'highly detailed photorealistic, shallow depth of field, realistic lighting' },
    { key: 'cinematic', label: 'Cinematic', promptAddon: 'cinematic lighting, film still, dramatic composition, anamorphic bokeh' },
    { key: 'watercolor', label: 'Watercolor', promptAddon: 'soft watercolor painting, textured paper, delicate brush strokes' },
    { key: 'studio3d', label: '3D Render', promptAddon: 'ultra-detailed 3D render, octane render, global illumination' },
    { key: 'anime', label: 'Anime', promptAddon: 'anime style, clean line art, cel shading, vibrant colors' },
    { key: 'pixel', label: 'Pixel Art', promptAddon: '8-bit pixel art, limited palette, crisp pixel edges' },
    { key: 'isometric', label: 'Isometric', promptAddon: 'isometric view, clean geometry, detailed miniature scene' },
    { key: 'lineart', label: 'Line Art', promptAddon: 'black and white line art, clean outlines, minimal shading' },
    { key: 'vintage', label: 'Vintage', promptAddon: 'vintage retro aesthetic, muted tones, film grain' },
    { key: 'surreal', label: 'Surreal', promptAddon: 'surreal dreamlike imagery, imaginative, unexpected juxtapositions' },
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
      toast({ title: 'Generation failed', description: msg })
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
    <div className="max-w-6xl mx-auto p-6">
      {/* Top bar with logo, back, theme toggle */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-800 pb-3">
        <div className="flex items-center justify-between">
          <a href="/chat" className="flex items-center" aria-label="AludaAI">
            <div className="w-7 h-7 logo-gradient rounded-lg flex items-center justify-center mr-2">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">AludaAI</span>
          </a>
          <div className="flex items-center gap-2">
            <a
              href="/chat"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1b1b1b] text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> <span>მთავარზე</span>
            </a>
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-lg transition-all"
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-fuchsia-600 bg-clip-text text-transparent">Aluda სურათების გენერატორი</h1>
        <div className="mt-3 h-[2px] w-full bg-gradient-to-r from-blue-500/40 via-fuchsia-500/40 to-pink-500/40 rounded-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Controls */}
        <div className="space-y-4 border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-white/60 dark:bg-[#121212]/60 backdrop-blur-sm shadow-sm">
          <textarea
            className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#171717] p-4 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
            rows={6}
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs mb-1 text-gray-600 dark:text-gray-300">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as any)}
                className="w-full border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#171717] p-2.5 text-sm"
              >
                <option value="1024x1024">1024x1024</option>
                <option value="1792x1024">1792x1024 (landscape)</option>
                <option value="1024x1792">1024x1792 (portrait)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1 text-gray-600 dark:text-gray-300">Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as any)}
                className="w-full border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#171717] p-2.5 text-sm"
              >
                <option value="standard">Standard</option>
                <option value="hd">HD</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1 text-gray-600 dark:text-gray-300">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as any)}
                className="w-full border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#171717] p-2.5 text-sm"
              >
                <option value="vivid">Vivid</option>
                <option value="natural">Natural</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-2 text-gray-600 dark:text-gray-300">Style presets</label>
            <div className="flex flex-wrap gap-2">
              {stylePresets.map(p => (
                <button
                  key={p.key}
                  onClick={() => setActivePresetKey(prev => prev === p.key ? null : p.key)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${activePresetKey === p.key ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}
                  title={p.promptAddon}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={!prompt || isLoading}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-fuchsia-600 text-white disabled:opacity-50 shadow-sm hover:shadow transition-shadow"
            >
              {isLoading ? 'Generating…' : 'Generate'}
            </button>
            <button
              onClick={() => { setPrompt(''); setImageUrl(null); setRevisedPrompt(null); setError(null) }}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1b1b1b]"
            >
              Clear
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
        </div>

        {/* Right: Result */}
        <div className="space-y-4">
          {!imageUrl && !isLoading && (
            <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center text-sm text-gray-500 dark:text-gray-400 bg-white/40 dark:bg-[#111111]/40 backdrop-blur-sm">
              Generated image will appear here
            </div>
          )}

          {isLoading && (
            <div className="animate-pulse border border-gray-200 dark:border-gray-800 rounded-xl h-80 bg-gray-100 dark:bg-[#1f1f1f]" />
          )}

          {imageUrl && (
            <div className="space-y-4 border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-white/60 dark:bg-[#121212]/60 backdrop-blur-sm shadow-sm">
              {revisedPrompt && (
                <div className="text-xs text-gray-500 dark:text-gray-400">Revised prompt: {revisedPrompt}</div>
              )}
              <img src={imageUrl} alt="Generated" className="rounded-lg w-full" />
              <div className="flex gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(imageUrl)}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 text-sm hover:bg-gray-50 dark:hover:bg-[#1b1b1b]"
                >
                  Copy URL
                </button>
                <a
                  href={imageUrl}
                  download
                  className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm dark:bg-white dark:text-black"
                >
                  Download
                </a>
              </div>
              {generations.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">History</h2>
                    <button
                      onClick={() => setGenerations([])}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {generations.map(g => (
                      <button
                        key={g.id}
                        onClick={() => { setImageUrl(g.url); setRevisedPrompt(g.revisedPrompt) }}
                        className={`group relative border rounded-lg overflow-hidden transition-all ${imageUrl === g.url ? 'ring-2 ring-fuchsia-500' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}
                        title={g.prompt}
                      >
                        <img src={g.url} alt="thumb" className="aspect-square object-cover w-full" />
                        <div className="absolute bottom-0 left-0 right-0 text-[10px] px-1 py-0.5 bg-black/50 text-white flex justify-between">
                          <span>{g.size.replace('1024x','1k×')}</span>
                          <span>{g.quality === 'hd' ? 'HD' : 'Std'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


