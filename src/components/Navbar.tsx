import { Link, useLocation } from 'react-router-dom';
import { Apple } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600';
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container-app">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Apple className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold text-gray-900">Fruit Detector</span>
          </Link>
          
          <div className="flex space-x-8">
            <Link to="/" className={`${isActive('/')} font-medium`}>
              Accueil
            </Link>
            <Link to="/detection" className={`${isActive('/detection')} font-medium`}>
              Détection
            </Link>
            <Link to="/history" className={`${isActive('/history')} font-medium`}>
              Historique
            </Link>
            <Link to="/about" className={`${isActive('/about')} font-medium`}>
              À propos
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 