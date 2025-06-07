import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, RefreshCw, Download } from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';

interface Point {
  x: number;
  y: number;
}

interface DetectionResult {
  id: string;
  timestamp: number;
  imageUrl: string;
  detections: {
    name: string;
    confidence: number;
    points: Point[];
  }[];
}

const Detection = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const [detectionHistory, setDetectionHistory] = useLocalStorage<DetectionResult[]>('detection-history', []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const segmentedImageRef = useRef<string | null>(null);
  const [isRealTimeDetection, setIsRealTimeDetection] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  const [detectionFrequency, setDetectionFrequency] = useState<number>(100); // 100ms = 10fps
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setImageUrl('');
      setIsWebcamActive(false);
      
      // Analyser immédiatement l'image
      await handleAnalyze();
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setImageUrl(url);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const captureWebcam = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
            setSelectedFile(file);
            setPreviewUrl(imageSrc);
            setImageUrl('');
          });
      }
    }
  };

  const saveSegmentedImage = (canvas: HTMLCanvasElement) => {
    try {
      // Convertir le canvas en URL de données
      const segmentedImageUrl = canvas.toDataURL('image/png');
      segmentedImageRef.current = segmentedImageUrl;
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = segmentedImageUrl;
      link.download = `segmented-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'image segmentée:', error);
    }
  };

  const drawSegmentation = (image: HTMLImageElement, predictions: any[], canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculer les dimensions pour maintenir le ratio
    const containerWidth = canvas.clientWidth;
    const containerHeight = canvas.clientHeight;
    const imageAspectRatio = image.width / image.height;
    const containerAspectRatio = containerWidth / containerHeight;

    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
    if (imageAspectRatio > containerAspectRatio) {
      // L'image est plus large que le conteneur
      drawWidth = containerWidth;
      drawHeight = containerWidth / imageAspectRatio;
      offsetY = (containerHeight - drawHeight) / 2;
    } else {
      // L'image est plus haute que le conteneur
      drawHeight = containerHeight;
      drawWidth = containerHeight * imageAspectRatio;
      offsetX = (containerWidth - drawWidth) / 2;
    }

    // Définir la taille du canvas pour correspondre à la taille d'affichage
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculer les facteurs d'échelle
    const scaleX = drawWidth / image.width;
    const scaleY = drawHeight / image.height;

    // Couleurs pour la segmentation
    const colors = [
      'rgba(255, 0, 0, 0.3)',   // Rouge
      'rgba(0, 255, 0, 0.3)',   // Vert
      'rgba(0, 0, 255, 0.3)',   // Bleu
      'rgba(255, 255, 0, 0.3)', // Jaune
    ];

    // Dessiner chaque segmentation
    predictions.forEach((pred, index) => {
      const points = pred.points as Point[];
      if (!points || points.length === 0) return;

      // Commencer le chemin
      ctx.beginPath();

      // Déplacer au premier point avec les coordonnées ajustées
      const startX = points[0].x * scaleX + offsetX;
      const startY = points[0].y * scaleY + offsetY;
      ctx.moveTo(startX, startY);

      // Dessiner le chemin avec les coordonnées ajustées
      points.forEach((point: Point) => {
        const x = point.x * scaleX + offsetX;
        const y = point.y * scaleY + offsetY;
        ctx.lineTo(x, y);
      });

      ctx.closePath();

      // Remplir avec une couleur semi-transparente
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();

      // Dessiner le contour
      ctx.strokeStyle = colors[index % colors.length].replace('0.3', '1.0');
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ajouter le label avec le score
      const confidence = (pred.confidence * 100).toFixed(1);
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      const text = `${pred.class} ${confidence}%`;
      
      // Positionner le texte au-dessus de la segmentation
      const textX = startX;
      const textY = startY - 5;

      // Dessiner le contour du texte
      ctx.strokeText(text, textX, textY);
      // Dessiner le texte
      ctx.fillText(text, textX, textY);
    });

    // Sauvegarder l'image segmentée
    saveSegmentedImage(canvas);
  };

  const saveToHistory = async (predictions: any[], imageUrl: string) => {
    try {
      // Convertir l'image en base64 si ce n'est pas déjà fait
      let finalImageUrl = imageUrl;
      if (imageUrl.startsWith('blob:')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        finalImageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const newResult: DetectionResult = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageUrl: finalImageUrl,
        detections: predictions.map((pred: any) => ({
          name: pred.class,
          confidence: pred.confidence,
          points: pred.points || []
        }))
      };

      setDetectionHistory(prev => {
        // Vérifier si une détection similaire existe déjà dans les 2 dernières secondes
        const recentDetections = prev.filter(
          item => Date.now() - item.timestamp < 2000
        );
        if (recentDetections.length === 0) {
          return [newResult, ...prev].slice(0, 20); // Garder les 20 dernières détections
        }
        return prev;
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde dans l\'historique:', error);
    }
  };

  const detectRealTime = async (timestamp: number) => {
    if (!webcamRef.current || !canvasRef.current || !isRealTimeDetection) return;

    // Utiliser la fréquence de détection configurable
    if (timestamp - lastDetectionTimeRef.current > detectionFrequency) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        try {
          setErrorMessage(null);
          const base64Image = imageSrc.split(',')[1];

          const response = await fetch('https://serverless.roboflow.com/infer/workflows/wisd-wnpmm/custom-workflow-3', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              api_key: 'JH3zDTC53vZdOK0EYnyo',
              inputs: {
                image: {
                  type: 'base64',
                  value: base64Image
                }
              }
            })
          });

          if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
          }

          const result = await response.json();
          const predictions = result.outputs?.[0]?.predictions?.predictions || [];
          
          if (canvasRef.current) {
            drawBoundingBox(predictions, canvasRef.current);
            // Sauvegarder dans l'historique si des fruits sont détectés
            if (predictions.length > 0) {
              await saveToHistory(predictions, imageSrc);
            }
          }
        } catch (error) {
          console.error('Erreur de détection:', error);
          setErrorMessage(error instanceof Error ? error.message : 'Erreur de détection');
          setIsRealTimeDetection(false);
        }
        lastDetectionTimeRef.current = timestamp;
      }
    }

    if (isRealTimeDetection) {
      animationFrameRef.current = requestAnimationFrame(detectRealTime);
    }
  };

  const handleAnalyze = async () => {
    if (!imageUrl && !selectedFile) {
      alert('Veuillez fournir une URL ou téléverser une image.');
      return;
    }

    setIsLoading(true);

    try {
      let imageInput;
      let imageObj = new Image();
      let finalImageUrl: string;

      if (selectedFile) {
        const base64Image = await toBase64(selectedFile);
        imageInput = { type: 'base64', value: base64Image };
        finalImageUrl = `data:image/jpeg;base64,${base64Image}`;
        imageObj.src = finalImageUrl;
      } else if (imageUrl) {
        imageInput = { type: 'url', value: imageUrl };
        // Pour les URLs externes, on les garde telles quelles
        finalImageUrl = imageUrl;
        imageObj.src = imageUrl;
      } else {
        throw new Error('Aucune image sélectionnée');
      }

      await new Promise((resolve, reject) => {
        imageObj.onload = resolve;
        imageObj.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      });

      const response = await fetch('https://serverless.roboflow.com/infer/workflows/wisd-wnpmm/custom-workflow-3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          api_key: 'JH3zDTC53vZdOK0EYnyo',
          inputs: {
            image: imageInput
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const result = await response.json();
      const predictions = result.outputs?.[0]?.predictions?.predictions || [];

      if (predictions.length > 0) {
        await saveToHistory(predictions, finalImageUrl);
      }

      if (canvasRef.current) {
        drawSegmentation(imageObj, predictions, canvasRef.current);
      }

    } catch (error) {
      console.error('Erreur lors de l\'appel à l\'API:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detection-${result.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setImageUrl('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsWebcamActive(false);
    setResult(null);
    // Effacer le canvas
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const drawBoundingBox = (predictions: any[], canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajuster la taille du canvas à celle de la vidéo
    const video = webcamRef.current?.video;
    if (!video) return;

    const { videoWidth, videoHeight } = video;
    const { width: displayWidth, height: displayHeight } = video.getBoundingClientRect();

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Effacer le canvas précédent
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach((pred: any) => {
      // Calculer les coordonnées de la boîte englobante à partir des points
      if (!pred.points || pred.points.length === 0) return;

      // Trouver les coordonnées min et max pour créer la boîte englobante
      const xCoords = pred.points.map((p: Point) => p.x);
      const yCoords = pred.points.map((p: Point) => p.y);
      
      const minX = Math.min(...xCoords);
      const maxX = Math.max(...xCoords);
      const minY = Math.min(...yCoords);
      const maxY = Math.max(...yCoords);

      // Calculer les dimensions de la boîte
      const width = maxX - minX;
      const height = maxY - minY;

      // Calculer les facteurs d'échelle
      const scaleX = displayWidth / videoWidth;
      const scaleY = displayHeight / videoHeight;

      // Appliquer l'échelle aux coordonnées
      const scaledX = minX * scaleX;
      const scaledY = minY * scaleY;
      const scaledWidth = width * scaleX;
      const scaledHeight = height * scaleY;

      // Dessiner la boîte englobante
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Ajouter le label avec un fond semi-transparent
      const confidence = (pred.confidence * 100).toFixed(1);
      const text = `${pred.class} ${confidence}%`;
      
      ctx.font = 'bold 16px Arial';
      const textMetrics = ctx.measureText(text);
      const padding = 5;
      const textHeight = 24;

      // Dessiner le fond du texte
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(
        scaledX,
        scaledY - textHeight - padding,
        textMetrics.width + padding * 2,
        textHeight
      );

      // Dessiner le texte
      ctx.fillStyle = '#00ff00';
      ctx.fillText(text, scaledX + padding, scaledY - padding - 5);
    });
  };

  useEffect(() => {
    if (isWebcamActive && isRealTimeDetection) {
      // Démarrer la détection en temps réel
      animationFrameRef.current = requestAnimationFrame(detectRealTime);
    } else {
      // Arrêter la détection
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Nettoyer le canvas
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isWebcamActive, isRealTimeDetection]);

  // Modifier la fonction qui gère l'activation de la webcam
  const toggleWebcam = () => {
    const newState = !isWebcamActive;
    setIsWebcamActive(newState);
    if (!newState) {
      setIsRealTimeDetection(false);
      // Nettoyer le canvas quand on désactive la webcam
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL de l'image
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={handleUrlChange}
            placeholder="Entrez l'URL de l'image"
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ou utilisez la webcam / téléversez une image
          </label>
          <div className="flex justify-center space-x-4">
            <button
              onClick={toggleWebcam}
              className="btn btn-secondary"
            >
              <Camera className="h-5 w-5 mr-2" />
              <span>{isWebcamActive ? 'Désactiver' : 'Activer'} la webcam</span>
            </button>

            {isWebcamActive && (
              <button
                onClick={() => setIsRealTimeDetection(!isRealTimeDetection)}
                className={`btn ${isRealTimeDetection ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Camera className="h-5 w-5 mr-2" />
                <span>{isRealTimeDetection ? 'Arrêter' : 'Démarrer'} la détection</span>
              </button>
            )}
            
            <label className="btn btn-secondary cursor-pointer">
              <Upload className="h-5 w-5 mr-2" />
              <span>Charger une image</span>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png"
                onChange={handleFileSelect}
              />
            </label>

            <button
              onClick={resetAll}
              className="btn btn-secondary"
              title="Réinitialiser l'image et la segmentation"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>

        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-6 relative">
          {isWebcamActive ? (
            <>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-contain"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
            </>
          ) : (
            <>
              {(previewUrl || imageUrl) && (
                <>
                  <img
                    src={previewUrl || imageUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                </>
              )}
              {!previewUrl && !imageUrl && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Aucune image sélectionnée
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-center space-x-4">
          {isWebcamActive && (
            <button
              onClick={captureWebcam}
              className="btn btn-secondary"
            >
              <Camera className="h-5 w-5 mr-2" />
              <span>Prendre une photo</span>
            </button>
          )}

          <button
            onClick={handleAnalyze}
            disabled={(!selectedFile && !imageUrl) || isLoading}
            className="btn btn-primary"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                <span>Analyse en cours...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                <span>Analyser</span>
              </>
            )}
          </button>
        </div>

        {result && (
          <div className="mt-4">
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {isWebcamActive && isRealTimeDetection && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fréquence de détection: {Math.round(1000 / detectionFrequency)} FPS
            </label>
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={detectionFrequency}
              onChange={(e) => setDetectionFrequency(1000 / parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default Detection; 