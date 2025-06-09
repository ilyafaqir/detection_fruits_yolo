import { Link, useLocation } from 'react-router-dom';
import { Camera, History, Settings } from 'lucide-react';

const Header = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-float" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Fruit Detection
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className={`nav-link group ${
                isActive('/') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                <Camera className="h-5 w-5" />
                <span className="font-medium">Détection</span>
              </div>
            </Link>

            <Link
              to="/history"
              className={`nav-link group ${
                isActive('/history') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                <History className="h-5 w-5" />
                <span className="font-medium">Historique</span>
              </div>
            </Link>

            <Link
              to="/settings"
              className={`nav-link group ${
                isActive('/settings') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                <Settings className="h-5 w-5" />
                <span className="font-medium">Paramètres</span>
              </div>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header; 