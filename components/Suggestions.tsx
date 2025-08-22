'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

interface SuggestionsProps {
  onPick: (suggestion: string) => void;
}

export default function Suggestions({ onPick }: SuggestionsProps) {
  const [topics, setTopics] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const res = await fetch(`/api/suggestions?ts=${Date.now()}`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({ suggestions: [] }))
        const list: string[] = Array.isArray(data?.suggestions) ? data.suggestions : []
        if (isMounted) setTopics((list || []).slice(0, 4))
      } catch {
        if (isMounted) setTopics([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    // initial load
    load()
    // refresh every 10 minutes
    refreshTimerRef.current = setInterval(load, 10 * 60 * 1000)
    return () => { 
      isMounted = false
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }
  }, [])

  const fallbackPool = useMemo(() => [
    'მირჩიე ფილმი საღამოსთვის',
    'რა ხდება საქართველოში?',
    'მასწავლე საინტერესო ფაქტი',
    'მირჩიე ადგილი ტურიზმისთვის',
    'როგორ გავაუმჯობესო ძილის ხარისხი?',
    'რას მირჩევ კარიერულ განვითარებაში?',
    'მასწავლე ახალი ქართული ანდაზა',
    'რა მოვამზადო სწრაფად და გემრიელად?',
    'მირჩიე სასარგებლო წიგნი',
    'მასწავლე რაღაცა ტექნოლოგიებზე',
    'მირჩიე ექსკურსიის მარშრუტი',
    'რა ვარჯიშები გავაკეთო სახლში?'
  ], [])
  
  const randomizedFallback = useMemo(() => {
    const arr = [...fallbackPool]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr.slice(0, 4)
  }, [fallbackPool])
  
  const items = (topics && topics.length > 0 ? topics : randomizedFallback).slice(0, 4)

  return (
    <div className="mt-6 flex flex-wrap gap-3 justify-center">
      {items.map((suggestion, index) => (
        <button
          key={`${suggestion}-${index}`}
          onClick={() => onPick(suggestion)}
          className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 shadow-sm hover:shadow-md animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
          disabled={loading}
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
