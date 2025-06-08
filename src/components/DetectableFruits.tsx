import React from 'react';

const fruits = [
  { name: 'Pomme', image: '/images/fruits/apple.png' },
  { name: 'Banane', image: '/images/fruits/banana.png' },
  { name: 'Cerise', image: '/images/fruits/cherry.png' },
  { name: 'Concombre', image: '/images/fruits/cucumber.png' },
  { name: 'Raisin', image: '/images/fruits/grapes.png' },
  { name: 'Kiwi', image: '/images/fruits/kiwi.png' },
  { name: 'Citron', image: '/images/fruits/lemon.png' },
  { name: 'Mangue', image: '/images/fruits/mango.png' },
  { name: 'Orange', image: '/images/fruits/orange.png' },
  { name: 'Ananas', image: '/images/fruits/pineapple.png' },
  { name: 'Tomate', image: '/images/fruits/tomato.png' },
  { name: 'Pastèque', image: '/images/fruits/watermelon.png' }
];

const DetectableFruits = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
          Fruits Détectables
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Notre système peut détecter automatiquement les fruits suivants avec une grande précision
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {fruits.map((fruit, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div className="aspect-square relative">
                <img
                  src={fruit.image}
                  alt={fruit.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-center font-semibold">
                      {fruit.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DetectableFruits; 