import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TutorialStep {
  title: string;
  content: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Bienvenue !',
    content: 'Découvrez comment utiliser notre détecteur de fruits en quelques étapes simples.',
    target: 'body',
    position: 'top'
  },
  {
    title: 'Chargement d\'image',
    content: 'Commencez par charger une image ou utiliser votre webcam pour capturer une photo.',
    target: '.upload-section',
    position: 'bottom'
  },
  {
    title: 'Filtres avancés',
    content: 'Utilisez les filtres pour affiner la détection selon vos besoins.',
    target: '.filters-section',
    position: 'right'
  },
  {
    title: 'Résultats',
    content: 'Visualisez les résultats de la détection avec les pourcentages de confiance.',
    target: '.results-section',
    position: 'left'
  }
];

interface TutorialProps {
  onComplete: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const updatePosition = () => {
      const step = TUTORIAL_STEPS[currentStep];
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        const pos = { top: 0, left: 0 };

        switch (step.position) {
          case 'top':
            pos.top = rect.top - 120;
            pos.left = rect.left + (rect.width / 2) - 150;
            break;
          case 'bottom':
            pos.top = rect.bottom + 20;
            pos.left = rect.left + (rect.width / 2) - 150;
            break;
          case 'left':
            pos.top = rect.top + (rect.height / 2) - 60;
            pos.left = rect.left - 320;
            break;
          case 'right':
            pos.top = rect.top + (rect.height / 2) - 60;
            pos.left = rect.right + 20;
            break;
        }

        setPosition(pos);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      <div
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-[300px]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <button
          onClick={onComplete}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {TUTORIAL_STEPS[currentStep].title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {TUTORIAL_STEPS[currentStep].content}
        </p>

        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center space-x-1 text-sm ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Précédent</span>
          </button>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {currentStep + 1} / {TUTORIAL_STEPS.length}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <span>{currentStep === TUTORIAL_STEPS.length - 1 ? 'Terminer' : 'Suivant'}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
};

export default Tutorial; 