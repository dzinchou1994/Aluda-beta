"use client"

import { useState, useEffect } from 'react'

type Props = {
  value?: 'mini' | 'aluda2'
  onChange?: (value: 'mini' | 'aluda2') => void
  disabledAluda2?: boolean
}

export default function ModelSwitcher({ value = 'mini', onChange, disabledAluda2 = false }: Props) {
  const [model, setModel] = useState<'mini' | 'aluda2'>(value)

  useEffect(() => setModel(value), [value])

  const select = (v: 'mini' | 'aluda2') => {
    if (v === 'aluda2' && disabledAluda2) return
    setModel(v)
    onChange?.(v)
  }

  return (
    <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1">
      <button
        onClick={() => select('mini')}
        className={`px-3 py-1 text-sm rounded-full ${model==='mini' ? 'bg-white dark:bg-gray-900 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
      >Aluda mini</button>
      <button
        onClick={() => select('aluda2')}
        className={`px-3 py-1 text-sm rounded-full ml-1 ${model==='aluda2' ? 'bg-white dark:bg-gray-900 shadow text-gray-900 dark:text-white' : (disabledAluda2 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300')}`}
        title={disabledAluda2 ? 'გაიარეთ ავტორიზაცია Aluda 2.0-ისთვის' : 'Aluda 2.0'}
      >Aluda 2.0</button>
    </div>
  )
}


