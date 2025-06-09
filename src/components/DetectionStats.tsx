import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { DetectionResult } from '../types';

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DetectionStatsProps {
  detections: DetectionResult[];
}

// Palette de couleurs distinctes pour les graphiques
const chartColors = {
  backgrounds: [
    'rgba(255, 99, 132, 0.6)',    // Rose
    'rgba(54, 162, 235, 0.6)',    // Bleu
    'rgba(255, 206, 86, 0.6)',    // Jaune
    'rgba(75, 192, 192, 0.6)',    // Turquoise
    'rgba(153, 102, 255, 0.6)',   // Violet
    'rgba(255, 159, 64, 0.6)',    // Orange
    'rgba(76, 175, 80, 0.6)',     // Vert
    'rgba(244, 67, 54, 0.6)',     // Rouge
    'rgba(156, 39, 176, 0.6)',    // Violet foncé
    'rgba(121, 85, 72, 0.6)',     // Marron
    'rgba(33, 150, 243, 0.6)',    // Bleu clair
    'rgba(255, 235, 59, 0.6)',    // Jaune clair
    'rgba(233, 30, 99, 0.6)',     // Rose foncé
    'rgba(0, 150, 136, 0.6)',     // Vert-bleu
    'rgba(158, 158, 158, 0.6)'    // Gris
  ],
  borders: [
    'rgb(255, 99, 132)',    // Rose
    'rgb(54, 162, 235)',    // Bleu
    'rgb(255, 206, 86)',    // Jaune
    'rgb(75, 192, 192)',    // Turquoise
    'rgb(153, 102, 255)',   // Violet
    'rgb(255, 159, 64)',    // Orange
    'rgb(76, 175, 80)',     // Vert
    'rgb(244, 67, 54)',     // Rouge
    'rgb(156, 39, 176)',    // Violet foncé
    'rgb(121, 85, 72)',     // Marron
    'rgb(33, 150, 243)',    // Bleu clair
    'rgb(255, 235, 59)',    // Jaune clair
    'rgb(233, 30, 99)',     // Rose foncé
    'rgb(0, 150, 136)',     // Vert-bleu
    'rgb(158, 158, 158)'    // Gris
  ]
};

const DetectionStats: React.FC<DetectionStatsProps> = ({ detections }) => {
  const stats = useMemo(() => {
    const fruitCounts: Record<string, number> = {};
    const confidenceSum: Record<string, number> = {};
    let totalDetections = 0;

    detections.forEach(result => {
      result.detections.forEach(detection => {
        fruitCounts[detection.name] = (fruitCounts[detection.name] || 0) + 1;
        confidenceSum[detection.name] = (confidenceSum[detection.name] || 0) + detection.confidence;
        totalDetections++;
      });
    });

    const avgConfidence: Record<string, number> = {};
    Object.keys(fruitCounts).forEach(fruit => {
      avgConfidence[fruit] = confidenceSum[fruit] / fruitCounts[fruit];
    });

    return { fruitCounts, avgConfidence, totalDetections };
  }, [detections]);

  const barData = {
    labels: Object.keys(stats.fruitCounts),
    datasets: [
      {
        label: 'Nombre de détections',
        data: Object.values(stats.fruitCounts),
        backgroundColor: Object.keys(stats.fruitCounts).map(
          (_, index) => chartColors.backgrounds[index % chartColors.backgrounds.length]
        ),
        borderColor: Object.keys(stats.fruitCounts).map(
          (_, index) => chartColors.borders[index % chartColors.borders.length]
        ),
        borderWidth: 1,
      },
    ],
  };

  const doughnutData = {
    labels: Object.keys(stats.fruitCounts),
    datasets: [
      {
        data: Object.values(stats.fruitCounts),
        backgroundColor: Object.keys(stats.fruitCounts).map(
          (_, index) => chartColors.backgrounds[index % chartColors.backgrounds.length]
        ),
        borderColor: Object.keys(stats.fruitCounts).map(
          (_, index) => chartColors.borders[index % chartColors.borders.length]
        ),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Total des détections
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {stats.totalDetections}
          </p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Types de fruits
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {Object.keys(stats.fruitCounts).length}
          </p>
        </div>
        <div className="bg-orange-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-orange-900 mb-2">
            Confiance moyenne
          </h3>
          <p className="text-3xl font-bold text-orange-600">
            {(Object.values(stats.avgConfidence).reduce((a, b) => a + b, 0) / 
              Object.values(stats.avgConfidence).length * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Distribution des détections</h3>
          <Bar data={barData} options={chartOptions} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Répartition des fruits</h3>
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Détails par fruit</h3>
        <div className="grid gap-4">
          {Object.entries(stats.fruitCounts).map(([fruit, count]) => (
            <div
              key={fruit}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <h4 className="font-medium capitalize">{fruit}</h4>
                <p className="text-sm text-gray-500">
                  {count} détection{count > 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-blue-600">
                  {(stats.avgConfidence[fruit] * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">confiance moyenne</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetectionStats; 