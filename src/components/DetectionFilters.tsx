import { useState } from 'react';
import { Sliders, ChevronDown, ChevronUp } from 'lucide-react';

interface DetectionFiltersProps {
  onFiltersChange: (filters: DetectionFiltersType) => void;
}

export interface DetectionFiltersType {
  minConfidence: number;
  maxDetections: number;
  selectedFruits: string[];
}

const AVAILABLE_FRUITS = [
  'pomme', 'banane', 'orange', 'fraise', 'poire',
  'raisin', 'kiwi', 'ananas', 'mangue', 'pêche'
];

const DetectionFilters: React.FC<DetectionFiltersProps> = ({ onFiltersChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<DetectionFiltersType>({
    minConfidence: 0.5,
    maxDetections: 10,
    selectedFruits: []
  });

  const handleFilterChange = (key: keyof DetectionFiltersType, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-gray-700 dark:text-gray-200"
      >
        <div className="flex items-center space-x-2">
          <Sliders className="h-5 w-5" />
          <span className="font-medium">Filtres avancés</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confiance minimum: {filters.minConfidence * 100}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={filters.minConfidence}
              onChange={(e) => handleFilterChange('minConfidence', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre maximum de détections: {filters.maxDetections}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={filters.maxDetections}
              onChange={(e) => handleFilterChange('maxDetections', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fruits à détecter
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_FRUITS.map((fruit) => (
                <label
                  key={fruit}
                  className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <input
                    type="checkbox"
                    checked={filters.selectedFruits.includes(fruit)}
                    onChange={(e) => {
                      const newSelection = e.target.checked
                        ? [...filters.selectedFruits, fruit]
                        : filters.selectedFruits.filter(f => f !== fruit);
                      handleFilterChange('selectedFruits', newSelection);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span className="capitalize">{fruit}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectionFilters; 