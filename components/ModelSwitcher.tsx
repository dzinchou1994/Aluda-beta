'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Check, Zap } from 'lucide-react';
import { useModel } from '@/context/ModelContext';
import { useTokens } from '@/context/TokensContext';
import { useRouter } from 'next/navigation';

export default function ModelSwitcher() {
  const { model, setModel } = useModel();
  const { actor } = useTokens();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if user has premium access
  const hasPremium = actor?.plan === 'PREMIUM';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModelSelect = (newModel: 'mini' | 'aluda2' | 'test') => {
    setModel(newModel);
    setIsOpen(false);
  };

  const handleUpgrade = () => {
    router.push('/buy');
    setIsOpen(false);
  };

  const getModelDisplayName = (modelName: 'mini' | 'aluda2' | 'test') => {
    switch (modelName) {
      case 'mini':
        return 'Aluda mini';
      case 'aluda2':
        return 'Aluda 2.0';
      case 'test':
        return 'Aluda Test';
      default:
        return 'Aluda mini';
    }
  };

  const getModelDescription = (modelName: 'mini' | 'aluda2' | 'test') => {
    switch (modelName) {
      case 'mini':
        return 'Great for everyday tasks';
      case 'aluda2':
        return 'Our smartest model & more';
      case 'test':
        return 'Free unlimited testing model';
      default:
        return 'Great for everyday tasks';
    }
  };

  const getModelIcon = (modelName: 'mini' | 'aluda2' | 'test') => {
    switch (modelName) {
      case 'mini':
        return <Zap className="h-4 w-4" />;
      case 'aluda2':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'test':
        return <Zap className="h-4 w-4 text-green-400" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Model Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-white transition-colors duration-200"
      >
        <span className="font-medium">Aluda</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu - Always opens downward */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-xl z-50 min-w-[320px] max-w-[380px]">
          {/* Aluda Test Option (Free & Unlimited) */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200" onClick={() => handleModelSelect('test')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getModelIcon('test')}
                <div>
                  <div className="text-gray-900 dark:text-white font-medium text-sm">Aluda Test</div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs">უფასო და ულიმიტო ტესტირების მოდელი</div>
                </div>
              </div>
              {model === 'test' && <Check className="h-4 w-4 text-green-600 dark:text-green-400" />}
            </div>
          </div>

          {/* Aluda mini Option (Standard) */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200" onClick={() => handleModelSelect('mini')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getModelIcon('mini')}
                <div>
                  <div className="text-gray-900 dark:text-white font-medium text-sm">Aluda mini</div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs">კარგია ყოველდღიური ამოცანებისთვის</div>
                </div>
              </div>
              {model === 'mini' && <Check className="h-4 w-4 text-green-600 dark:text-green-400" />}
            </div>
          </div>

          {/* Aluda 2.0 Option (Premium) - Last and most prominent */}
          <div className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200" onClick={() => hasPremium && handleModelSelect('aluda2')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getModelIcon('aluda2')}
                <div>
                  <div className="text-gray-900 dark:text-white font-medium text-sm">Aluda 2.0</div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs">ჩვენი ყველაზე ჭკვიანი მოდელი</div>
                </div>
              </div>
              {!hasPremium ? (
                <button 
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-gray-700 dark:text-white text-xs transition-colors duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpgrade();
                  }}
                >
                  გაუმჯობესება
                </button>
              ) : (
                model === 'aluda2' && <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


