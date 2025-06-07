import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import useLocalStorage from '../hooks/useLocalStorage';
import { DetectionResult } from '../types';
import DetectionStats from '../components/DetectionStats';
import { Trash2, Download, Camera, Link } from 'lucide-react';

const History = () => {
  const [detectionHistory, setDetectionHistory] = useLocalStorage<DetectionResult[]>('detection-history', []);

  const downloadImage = (imageUrl: string, id: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `detection-${id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearHistory = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
      setDetectionHistory([]);
    }
  };

  const getImageSource = (imageUrl: string) => {
    return imageUrl.startsWith('blob:') || imageUrl.startsWith('data:') ? 'Webcam' : 'URL';
  };

  if (detectionHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Trash2 className="h-12 w-12 mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Aucune détection dans l'historique
        </h2>
        <p className="text-gray-600">
          Les détections que vous effectuerez apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Historique des détections
        </h1>
        <button
          onClick={clearHistory}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <Trash2 className="h-4 w-4" />
          <span>Effacer l'historique</span>
        </button>
      </div>

      <DetectionStats detections={detectionHistory} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {detectionHistory.map((result) => (
          <div
            key={result.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-video">
              <img
                src={result.imageUrl}
                alt="Détection"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex space-x-2">
                <button
                  onClick={() => downloadImage(result.imageUrl, result.id)}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                  title="Télécharger l'image"
                >
                  <Download className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-800">
                  {getImageSource(result.imageUrl) === 'Webcam' ? (
                    <><Camera className="h-3 w-3 mr-1" /> Webcam</>
                  ) : (
                    <><Link className="h-3 w-3 mr-1" /> URL</>
                  )}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="text-sm text-gray-500 mb-2">
                {formatDistanceToNow(result.timestamp, {
                  addSuffix: true,
                  locale: fr,
                })}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {result.detections.map((detection, index) => (
                  <span
                    key={`${result.id}-${index}`}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {detection.name} ({(detection.confidence * 100).toFixed(1)}%)
                  </span>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                {result.detections.length} détection{result.detections.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History; 