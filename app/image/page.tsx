'use client'

import { useState } from 'react'

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    setImageUrl(null)
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to generate image')

      const url = data?.image?.url || data?.data?.[0]?.url
      if (url) setImageUrl(url)
      else setError('No image URL returned')
    } catch (e: any) {
      setError(e?.message || 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">AI Image Generator</h1>
      <div className="space-y-4">
        <textarea
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#171717] p-3 text-sm"
          rows={4}
          placeholder="Describe the image you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          onClick={handleGenerate}
          disabled={!prompt || isLoading}
          className="px-4 py-2 rounded-md bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white disabled:opacity-50"
        >
          {isLoading ? 'Generating…' : 'Generate'}
        </button>
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}
        {imageUrl && (
          <div className="mt-4">
            <img src={imageUrl} alt="Generated" className="rounded-lg max-w-full" />
          </div>
        )}
      </div>
    </div>
  )
}


