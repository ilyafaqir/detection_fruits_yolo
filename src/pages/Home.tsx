import { useNavigate } from 'react-router-dom';
import { Camera, Apple, History } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Camera className="h-12 w-12 text-blue-500" />,
      title: 'Détection en temps réel',
      description: 'Utilisez votre webcam ou téléchargez une image pour détecter les fruits instantanément.'
    },
    {
      icon: <Apple className="h-12 w-12 text-blue-500" />,
      title: 'Reconnaissance précise',
      description: 'Notre modèle YOLO détecte une grande variété de fruits avec précision.'
    },
    {
      icon: <History className="h-12 w-12 text-blue-500" />,
      title: 'Historique des détections',
      description: 'Consultez vos dernières détections et analysez les statistiques.'
    }
  ];

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Détection de Fruits avec Intelligence Artificielle
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Utilisez notre technologie de pointe pour identifier les fruits dans vos images
      </p>
      
      <button
        onClick={() => navigate('/detection')}
        className="btn btn-primary text-lg mb-12"
      >
        Commencer la détection
      </button>

      <div className="grid md:grid-cols-3 gap-8 mt-12">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-center mb-4">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home; 