import { ReactNode } from 'react';

interface StatsCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, title, value, trend, color }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-500 dark:text-blue-400',
      text: 'text-blue-900 dark:text-blue-100',
      trend: 'text-blue-700 dark:text-blue-300',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-500 dark:text-green-400',
      text: 'text-green-900 dark:text-green-100',
      trend: 'text-green-700 dark:text-green-300',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      icon: 'text-orange-500 dark:text-orange-400',
      text: 'text-orange-900 dark:text-orange-100',
      trend: 'text-orange-700 dark:text-orange-300',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-500 dark:text-purple-400',
      text: 'text-purple-900 dark:text-purple-100',
      trend: 'text-purple-700 dark:text-purple-300',
    },
  };

  return (
    <div className={`${colorClasses[color].bg} rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105`}>
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-xl ${colorClasses[color].bg} ${colorClasses[color].icon}`}>
          {icon}
        </div>
        <div>
          <h3 className={`text-sm font-medium ${colorClasses[color].text} mb-1`}>
            {title}
          </h3>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {value}
            </p>
            {trend && (
              <span className={`inline-flex items-center text-sm ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard; 