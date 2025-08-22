'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Check, Zap } from 'lucide-react';
import { useModel } from '@/context/ModelContext';
import { useTokens } from '@/context/TokensContext';

export default function ModelSwitcher() {
  const { model, setModel } = useModel();
  const { actor } = useTokens();
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

  const handleModelSelect = (newModel: 'mini' | 'aluda2') => {
    setModel(newModel);
    setIsOpen(false);
  };

  const getModelDisplayName = (modelName: 'mini' | 'aluda2') => {
    switch (modelName) {
      case 'mini':
        return 'Aluda mini';
      case 'aluda2':
        return 'Aluda 2.0';
      default:
        return 'Aluda mini';
    }
  };

  const getModelDescription = (modelName: 'mini' | 'aluda2') => {
    switch (modelName) {
      case 'mini':
        return 'Great for everyday tasks';
      case 'aluda2':
        return 'Our smartest model & more';
      default:
        return 'Great for everyday tasks';
    }
  };

  const getModelIcon = (modelName: 'mini' | 'aluda2') => {
    switch (modelName) {
      case 'mini':
        return <Zap className="h-4 w-4" />;
      case 'aluda2':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Model Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors duration-200"
      >
        <span className="font-medium">Aluda</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full md:top-full left-0 right-0 mb-2 md:mt-2 bg-gray-800 rounded-lg border border-gray-600 shadow-xl z-50">
          {/* Aluda 2.0 Option (Premium) */}
          <div className="p-3 border-b border-gray-600 cursor-pointer hover:bg-gray-700 transition-colors duration-200" onClick={() => hasPremium && handleModelSelect('aluda2')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getModelIcon('aluda2')}
                <div>
                  <div className="text-white font-medium">Aluda 2.0</div>
                  <div className="text-gray-400 text-sm">{getModelDescription('aluda2')}</div>
                </div>
              </div>
              {!hasPremium ? (
                <button 
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded text-white text-sm transition-colors duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle upgrade logic here
                    console.log('Upgrade to Aluda 2.0');
                  }}
                >
                  Upgrade
                </button>
              ) : (
                model === 'aluda2' && <Check className="h-4 w-4 text-white" />
              )}
            </div>
          </div>

          {/* Aluda mini Option (Standard) */}
          <div className="p-3 cursor-pointer hover:bg-gray-700 transition-colors duration-200" onClick={() => handleModelSelect('mini')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getModelIcon('mini')}
                <div>
                  <div className="text-white font-medium">Aluda mini</div>
                  <div className="text-gray-400 text-sm">{getModelDescription('mini')}</div>
                </div>
              </div>
              {model === 'mini' && <Check className="h-4 w-4 text-white" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


