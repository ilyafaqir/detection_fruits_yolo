import { Apple, Database, Brain } from 'lucide-react';

const About = () => {
  const sections = [
    {
      icon: <Apple className="h-8 w-8 text-blue-500" />,
      title: 'Le Projet',
      content: `Notre application de détection de fruits utilise l'intelligence artificielle pour identifier 
      et localiser différents types de fruits dans vos images. Que ce soit pour l'éducation, 
      l'agriculture ou simplement par curiosité, notre outil offre une interface simple et efficace 
      pour analyser vos images.`
    },
    {
      icon: <Brain className="h-8 w-8 text-blue-500" />,
      title: 'La Technologie',
      content: `Nous utilisons YOLO (You Only Look Once), un modèle de détection d'objets en temps réel 
      reconnu pour sa rapidité et sa précision. Cette technologie permet de détecter plusieurs fruits 
      simultanément dans une image, avec leurs positions exactes et un niveau de confiance pour 
      chaque détection.`
    },
    {
      icon: <Database className="h-8 w-8 text-blue-500" />,
      title: 'Les Données',
      content: `Notre modèle a été entraîné sur un large dataset d'images de fruits, comprenant des milliers 
      d'exemples annotés manuellement. Cela permet une détection précise dans diverses conditions : 
      différents angles, éclairages, et environnements.`
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          À Propos de Fruit Detector
        </h1>
        <p className="text-xl text-gray-600">
          Une solution moderne pour la détection de fruits par intelligence artificielle
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-1">
        {sections.map((section, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4 mb-4">
              {section.icon}
              <h2 className="text-2xl font-semibold text-gray-900">
                {section.title}
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              {section.content}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center text-gray-600">
        <p>
          Vous avez des questions ou des suggestions ?<br />
          Contactez-nous à <a href="mailto:contact@fruitdetector.com" className="text-blue-500 hover:underline">
            contact@fruitdetector.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default About; 