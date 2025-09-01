'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/components/ui/use-toast'
import { useSession, signIn } from 'next-auth/react'
import { Brain, Sun, Moon, ArrowLeft, Sparkles, Palette, Download, Copy, History, Trash2, Wand2, Maximize, ChevronDown, User } from 'lucide-react'
import UserSettingsModal from '@/components/UserSettingsModal'

export default function ImageGeneratorPage() {
  const { data: session, status } = useSession()
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [size, setSize] = useState<'1024x1024' | '1024x1792' | '1792x1024'>('1024x1024')
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid')
  const [isDark, setIsDark] = useState(false)
  const [translatedPrompt, setTranslatedPrompt] = useState<string>('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
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
            // Filter out generations older than 24 hours to avoid broken images
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
            const recentGenerations = parsed.filter(g => g.createdAt > oneDayAgo)
            
            if (recentGenerations.length !== parsed.length) {
              // Update localStorage with filtered generations
              localStorage.setItem('aluda-image-generations', JSON.stringify(recentGenerations))
            }
            
            setGenerations(recentGenerations)
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

  // Trigger translation when revisedPrompt changes
  useEffect(() => {
    console.log('revisedPrompt changed:', revisedPrompt)
    if (revisedPrompt) {
      translatePrompt(revisedPrompt)
    } else {
      setTranslatedPrompt('')
    }
  }, [revisedPrompt])

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
        // Set image loading state and start loading the image
        setIsImageLoading(true)
        
        // Preload the image to ensure it's fully loaded before showing
        const img = new Image()
        img.onload = () => {
          setImageUrl(url)
          setRevisedPrompt(data?.revised_prompt || null)
          setIsImageLoading(false)
          setIsLoading(false)
        }
        img.onerror = () => {
          setError('Failed to load generated image')
          setIsImageLoading(false)
          setIsLoading(false)
        }
        img.src = url
        
        // Add to generations immediately
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
      else {
        setError('No image URL returned')
        setIsLoading(false)
      }
    } catch (e: any) {
      const msg = e?.message || 'Unknown error'
      // Replace OpenAI error messages with Aluda Error
      const displayMsg = msg.includes('OpenAI') ? 'Aluda Error' : msg
      setError(displayMsg)
      toast({ title: 'გენერაცია ვერ შესრულდა', description: displayMsg })
      setIsLoading(false)
      setIsImageLoading(false)
    }
  }

  function buildPromptWithPreset(base: string, presetKey: string | null): string {
    if (!presetKey) return base
    const preset = stylePresets.find(p => p.key === presetKey)
    if (!preset) return base
    return `${base}\nStyle: ${preset.promptAddon}`
  }

  // Simple translation function using Groq API
  async function translatePrompt(englishPrompt: string): Promise<string> {
    if (!englishPrompt) return ''
    
    console.log('Starting translation for:', englishPrompt)
    console.log('API Key available:', !!process.env.NEXT_PUBLIC_GROQ_API_KEY)
    
    setIsTranslating(true)
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful translator. Translate the given English text to Georgian. Return only the Georgian translation, nothing else.'
            },
            {
              role: 'user',
              content: englishPrompt
            }
          ],
          max_tokens: 500,
          temperature: 0.1
        }),
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`Translation failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('API Response:', data)
      
      const translatedText = data.choices?.[0]?.message?.content?.trim() || englishPrompt
      console.log('Translated text:', translatedText)
      
      setTranslatedPrompt(translatedText)
      return translatedText
    } catch (error) {
      console.error('Translation error:', error)
      return englishPrompt // Fallback to original text
    } finally {
      setIsTranslating(false)
    }
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
    <div 
      className="min-h-screen"
      style={{
        background: isDark 
          ? '#171818' 
          : 'linear-gradient(to bottom right, rgb(248 250 252), rgb(239 246 255), rgb(250 245 255))'
      }}
    >
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
                <div className="text-xs text-gray-500 dark:text-gray-300">AI Image Generator</div>
              </div>
            </a>
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="/chat"
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/80 dark:bg-input-bg backdrop-blur-sm border border-gray-200/50 dark:border-gray-700 hover:bg-white dark:hover:bg-user-bubble text-xs sm:text-sm font-medium transition-all duration-200 hover:shadow-md"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">მთავარზე</span>
              </a>
              <button
                onClick={toggleTheme}
                className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/80 dark:bg-input-bg backdrop-blur-sm border border-gray-200/50 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-user-bubble transition-all duration-200 hover:shadow-md"
                title={isDark ? 'Light Mode' : 'Dark Mode'}
              >
                {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <button
                onClick={() => session ? setIsSettingsOpen(true) : signIn()}
                className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/80 dark:bg-input-bg backdrop-blur-sm border border-gray-200/50 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-user-bubble transition-all duration-200 hover:shadow-md"
                title={session ? 'პარამეტრები' : 'შესვლა'}
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
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

              {/* Mobile: Advanced Settings Toggle */}
              <div className="mb-4 sm:hidden">
                <button
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-input-bg hover:bg-gray-50 dark:hover:bg-user-bubble transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">დამატებითი პარამეტრები</span>
                  </div>
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showAdvancedSettings ? 'rotate-180' : ''}`} 
                  />
                </button>
              </div>

              {/* Desktop: Always Visible Settings */}
              <div className="hidden sm:block space-y-4 mb-6">
                {/* Enhanced Settings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Maximize className="w-4 h-4 text-purple-500" />
                      ზომა
                    </label>
                    <select
                      value={size}
                      onChange={(e) => setSize(e.target.value as any)}
                      className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-input-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all duration-200"
                    >
                      <option value="1024x1024">1024×1024 - კვადრატი</option>
                      <option value="1792x1024">1792×1024 - ჰორიზონტალური</option>
                      <option value="1024x1792">1024×1792 - ვერტიკალური</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      ხარისხი
                    </label>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value as any)}
                      className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-input-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all duration-200"
                    >
                      <option value="standard">სტანდარტული</option>
                      <option value="hd">მაღალი ხარისხი (4K)</option>
                    </select>
                  </div>
                </div>

                {/* Enhanced Style Presets */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-500" />
                    სტილი
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
              </div>

              {/* Mobile: Collapsible Advanced Settings */}
              <div className={`sm:hidden space-y-4 mb-6 ${showAdvancedSettings ? 'block' : 'hidden'}`}>
                {/* Enhanced Settings Grid */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Maximize className="w-4 h-4 text-purple-500" />
                      ზომა
                    </label>
                    <select
                      value={size}
                      onChange={(e) => setSize(e.target.value as any)}
                      className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-input-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all duration-200"
                    >
                      <option value="1024x1024">1024×1024 - კვადრატი</option>
                      <option value="1792x1024">1792×1024 - ჰორიზონტალური</option>
                      <option value="1024x1792">1024×1792 - ვერტიკალური</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      ხარისხი
                    </label>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value as any)}
                      className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-input-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all duration-200"
                    >
                      <option value="standard">სტანდარტული</option>
                      <option value="hd">მაღალი ხარისხი (4K)</option>
                    </select>
                  </div>
                </div>

                {/* Enhanced Style Presets */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-500" />
                    სტილი
                  </label>
                  <div className="grid grid-cols-2 gap-2">
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
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={!prompt || isLoading || isImageLoading}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  {(isLoading || isImageLoading) ? (
                    <>
                      <div className="relative">
                        <div className="w-5 h-5 border-2 border-white/20 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-5 h-5 border-2 border-transparent border-t-white rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
                      </div>
                      <span className="text-sm">მიმდინარეობს...</span>
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
                  className="px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
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
            {!imageUrl && !isLoading && !isImageLoading && (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center bg-white/80 dark:bg-input-bg backdrop-blur-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">დაგენერირებული სურათი</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">აქ გამოჩნდება თქვენი შექმნილი ხელოვნება</p>
              </div>
            )}

            {(isLoading || isImageLoading) && (
              <div className="bg-white/80 dark:bg-input-bg backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700">
                <div className="flex flex-col items-center justify-center space-y-6">
                  {/* Cool loading animation */}
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                    <div className="absolute inset-2 w-12 h-12 border-2 border-blue-200 dark:border-blue-800 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
                  </div>
                  
                  {/* Loading text */}
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">AI ქმნის თქვენს ხელოვნებას</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">გთხოვთ დაელოდოთ...</p>
                  </div>
                  
                  {/* Progress dots */}
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
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
                          <img 
                            src={g.url} 
                            alt="thumb" 
                            className="aspect-square object-cover w-full"
                            onError={(e) => {
                              // Hide the entire button when image fails to load
                              if (e.currentTarget.parentElement) {
                                e.currentTarget.parentElement.style.display = 'none'
                              }
                            }}
                          />
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
                      <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">დახვეწილი პრომპტი:</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {isTranslating ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                            <span>თარგმნა მიმდინარეობს...</span>
                          </div>
                        ) : (
                          translatedPrompt || revisedPrompt
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* User Settings Modal */}
      {isSettingsOpen && (
        <UserSettingsModal 
          open={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          userEmail={session?.user?.email} 
        />
      )}
    </div>
  )
}
