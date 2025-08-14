'use client';

import React from 'react';
import { X, ShoppingCart, DollarSign, Settings, Globe } from 'lucide-react';
import { exampleJsonData } from '@/utils/exampleData';

interface JsonExampleModalProps {
  onSelect: (content: string) => void;
  onClose: () => void;
}

const JsonExampleModal: React.FC<JsonExampleModalProps> = ({ onSelect, onClose }) => {
  const examples = [
    {
      id: 'ecommerce',
      title: 'E-commerce Catalog',
      icon: ShoppingCart,
      preview: `"products": [
  {
    "id": "prod-001",
    "name": "Laptop Pro",
    "price": 999.99,
    ...
  }
]`,
    },
    {
      id: 'financialSales',
      title: 'Financial Sales',
      icon: DollarSign,
      preview: `"company": "TechCorp Solutions",
"totalRevenue": 45670000.5,
"quarters": [
  {
    "quarter": "Q1",
    ...
  }
]`,
    },
    {
      id: 'configuration',
      title: 'Application Configuration',
      icon: Settings,
      preview: `"app": {
  "name": "MyApp",
  "version": "1.0.0",
  "settings": {
    ...
  }
]`,
    },
    {
      id: 'geographicData',
      title: 'Geographic Data',
      icon: Globe,
      preview: `"type": "FeatureCollection",
"features": [
  {
    "type": "Feature",
    "geometry": {
      ...
    }
  }
]`,
    },
  ];

  return (
    <div className="json-example-modal" onClick={onClose}>
      <div 
        className="bg-[var(--bg-tertiary)] rounded-2xl p-6 max-w-5xl w-full mx-4 max-h-[85vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Choose a JSON Example</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {examples.map((example) => {
            const IconComponent = example.icon;
            return (
              <div
                key={example.id}
                onClick={() => onSelect(exampleJsonData[example.id])}
                className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] hover:border-purple-500 hover:bg-[var(--bg-tertiary)] transition-all duration-300 overflow-hidden group cursor-pointer hover:shadow-xl hover:shadow-purple-500/20 hover:scale-[1.02]"
              >
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <IconComponent className="w-7 h-7 text-purple-500 group-hover:text-purple-400 transition-colors" />
                    <h3 className="font-semibold text-lg text-white group-hover:text-purple-100 transition-colors">{example.title}</h3>
                  </div>
                  
                  <div className="relative h-40 mb-4 overflow-hidden rounded-lg bg-[#1a1a2e] group-hover:bg-[#1e1e3a] transition-colors">
                    <pre className="absolute inset-0 p-3 text-xs text-gray-400 font-mono blur-example-code group-hover:text-gray-300 transition-colors">
                      {`{
  ${example.preview}
}`}
                    </pre>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1a1a2e] group-hover:to-[#1e1e3a] transition-colors"></div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(exampleJsonData[example.id]);
                    }}
                    className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg group-hover:bg-purple-500 group-hover:hover:bg-purple-600"
                  >
                    Use this example
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JsonExampleModal;