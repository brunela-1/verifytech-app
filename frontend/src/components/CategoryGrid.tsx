import React from 'react';
import { CATEGORIES } from '../types';

interface CategoryGridProps {
  value: string;
  onChange: (key: string) => void;
}

const categoryEmojis: Record<string, string> = {
  plomeria: '🔧',
  electricidad: '⚡',
  aire_acondicionado: '❄️',
  gas: '🔥',
  electrodomesticos: '🫙',
  pintura: '🎨',
  carpinteria: '🪚',
  cerrajeria: '🔑',
  jardineria: '🌿',
  limpieza: '🧹',
};

export default function CategoryGrid({ value, onChange }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {CATEGORIES.map(cat => {
        const selected = value === cat.key;
        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => onChange(cat.key)}
            className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-150 active:scale-95 cursor-pointer ${
              selected
                ? 'border-[#004ac6] bg-[#004ac6]/6 shadow-sm'
                : 'border-[#eceef0] bg-white hover:border-[#004ac6]/40 hover:bg-[#f7f9fb] hover:shadow-sm'
            }`}
          >
            {/* Selected check mark */}
            {selected && (
              <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-[#004ac6] rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
            <span className="text-3xl">{categoryEmojis[cat.key] ?? '🔧'}</span>
            <span className={`text-xs font-semibold text-center leading-tight ${
              selected ? 'text-[#004ac6]' : 'text-[#434655]'
            }`}>
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
