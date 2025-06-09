import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, RefreshCw } from 'lucide-react';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const [detectionHistory, setDetectionHistory] = useLocalStorage<DetectionResult[]>('detection-history', []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRealTimeDetection, setIsRealTimeDetection] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  const [detectionFrequency, setDetectionFrequency] = useState<number>(150); // Augmenté à 150ms pour plus de précision
  const [minConfidence, setMinConfidence] = useState<number>(0.45); // Augmenté le seuil de confiance
  const [maxObjects, setMaxObjects] = useState<number>(5); // Limiter le nombre d'objets pour améliorer la performance
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectionSummary, setDetectionSummary] = useState<string>('');
  const [isHighPerformance, setIsHighPerformance] = useState<boolean>(false);
  const [bufferSize, setBufferSize] = useState<number>(3);
  const detectionBuffer = useRef<any[]>([]);
  const processingFrame = useRef<boolean>(false);
  const fpsCounter = useRef<number>(0);
  const [currentFPS, setCurrentFPS] = useState<number>(0);
  const lastFPSUpdate = useRef<number>(Date.now());

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
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Réinitialiser les états précédents
      setResult(null);
      setErrorMessage(null);
      setIsWebcamActive(false);
      setIsRealTimeDetection(false);

      // Créer une nouvelle URL pour l'aperçu
      const objectUrl = URL.createObjectURL(file);
      
      setSelectedFile(file);
      setPreviewUrl(objectUrl);
      
      // Effacer le canvas avant de charger la nouvelle image
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      // Analyser l'image après un court délai pour s'assurer que l'état est mis à jour
      setTimeout(() => {
        handleAnalyze();
      }, 100);

    } catch (error) {
      console.error('Erreur lors du chargement du fichier:', error);
      setErrorMessage('Erreur lors du chargement de l\'image');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setErrorMessage('Veuillez téléverser une image ou utiliser la webcam.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const base64Image = await toBase64(selectedFile);
      const imageInput = { type: 'base64', value: base64Image };
      const finalImageUrl = `data:image/jpeg;base64,${base64Image}`;
      
      const imageObj = new Image();
      imageObj.src = finalImageUrl;

      // Attendre que l'image soit chargée
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

      // Mettre à jour le résumé des détections
      updateDetectionSummary(predictions);

      if (canvasRef.current) {
        drawSegmentation(imageObj, predictions, canvasRef.current);
      }

    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'analyse');
      setDetectionSummary('');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSegmentedImage = (canvas: HTMLCanvasElement) => {
    // Fonction désactivée pour éviter l'enregistrement automatique
    return;
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
        finalImageUrl = await new Promise<string>((resolve) => {
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

      setDetectionHistory((prev: DetectionResult[]) => {
        // Vérifier si une détection similaire existe déjà dans les 2 dernières secondes
        const recentDetections = prev.filter(
          (item: DetectionResult) => Date.now() - item.timestamp < 2000
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

  const updateDetectionSummary = (predictions: any[]) => {
    if (predictions.length === 0) {
      setDetectionSummary('Aucun fruit détecté');
      return;
    }

    // Compter les types de fruits
    const fruitCounts: { [key: string]: number } = {};
    predictions.forEach(pred => {
      fruitCounts[pred.class] = (fruitCounts[pred.class] || 0) + 1;
    });

    // Créer le résumé
    const summary = Object.entries(fruitCounts)
      .map(([fruit, count]) => `${count} ${fruit}${count > 1 ? 's' : ''}`)
      .join(', ');

    setDetectionSummary(`Fruits détectés : ${summary}`);
  };

  const updateFPSCounter = () => {
    fpsCounter.current++;
    const now = Date.now();
    if (now - lastFPSUpdate.current >= 1000) {
      setCurrentFPS(fpsCounter.current);
      fpsCounter.current = 0;
      lastFPSUpdate.current = now;
    }
  };

  const processDetectionBuffer = () => {
    if (detectionBuffer.current.length >= bufferSize) {
      // Moyenne des prédictions dans le buffer
      const averagedPredictions = averagePredictions(detectionBuffer.current);
      detectionBuffer.current = [];
      return averagedPredictions;
    }
    return null;
  };

  const averagePredictions = (predictions: any[][]) => {
    const averaged: any[] = [];
    const groups: { [key: string]: any[] } = {};

    // Grouper les prédictions par classe
    predictions.flat().forEach(pred => {
      if (!groups[pred.class]) {
        groups[pred.class] = [];
      }
      groups[pred.class].push(pred);
    });

    // Calculer la moyenne pour chaque groupe
    Object.entries(groups).forEach(([className, preds]) => {
      if (preds.length > 0) {
        const avgConfidence = preds.reduce((sum, p) => sum + p.confidence, 0) / preds.length;
        const avgX = preds.reduce((sum, p) => sum + p.x, 0) / preds.length;
        const avgY = preds.reduce((sum, p) => sum + p.y, 0) / preds.length;
        const avgWidth = preds.reduce((sum, p) => sum + p.width, 0) / preds.length;
        const avgHeight = preds.reduce((sum, p) => sum + p.height, 0) / preds.length;

        averaged.push({
          class: className,
          confidence: avgConfidence,
          x: avgX,
          y: avgY,
          width: avgWidth,
          height: avgHeight
        });
      }
    });

    return averaged;
  };

  const detectRealTime = async (timestamp: number) => {
    if (!webcamRef.current || !canvasRef.current || !isRealTimeDetection) return;

    updateFPSCounter();

    if (processingFrame.current) {
      animationFrameRef.current = requestAnimationFrame(detectRealTime);
      return;
    }

    if (timestamp - lastDetectionTimeRef.current > detectionFrequency) {
      processingFrame.current = true;
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
              },
              confidence: minConfidence,
              overlap: 0.3,
              max_objects: maxObjects,
              min_area: 100
            })
          });

          if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
          }

          const result = await response.json();
          const predictions = result.outputs?.[0]?.predictions?.predictions || [];
          
          const filteredPredictions = predictions
            .filter((pred: any) => pred.confidence >= minConfidence)
            .sort((a: any, b: any) => b.confidence - a.confidence)
            .slice(0, maxObjects);

          if (isHighPerformance) {
            // Mode haute performance : utiliser le buffer
            detectionBuffer.current.push(filteredPredictions);
            const averagedPreds = processDetectionBuffer();
            
            if (averagedPreds) {
              if (canvasRef.current) {
                drawBoundingBox(averagedPreds, canvasRef.current);
                updateDetectionSummary(averagedPreds);
                if (averagedPreds.length > 0) {
                  await saveToHistory(averagedPreds, imageSrc);
                }
              }
            }
          } else {
            // Mode normal : afficher directement
            if (canvasRef.current) {
              drawBoundingBox(filteredPredictions, canvasRef.current);
              updateDetectionSummary(filteredPredictions);
              if (filteredPredictions.length > 0) {
                await saveToHistory(filteredPredictions, imageSrc);
              }
            }
          }
        } catch (error) {
          console.error('Erreur de détection:', error);
          setErrorMessage(error instanceof Error ? error.message : 'Erreur de détection');
          setIsRealTimeDetection(false);
          setDetectionSummary('');
        }
        lastDetectionTimeRef.current = timestamp;
      }
      processingFrame.current = false;
    }

    if (isRealTimeDetection) {
      animationFrameRef.current = requestAnimationFrame(detectRealTime);
    }
  };

  const captureWebcam = async () => {
    if (!webcamRef.current) {
      setErrorMessage('La webcam n\'est pas active');
      return;
    }

    try {
      // Désactiver la détection en temps réel pendant la capture
      setIsRealTimeDetection(false);

      // Prendre la capture
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Impossible de capturer l\'image');
      }

      // Créer un élément image pour la prévisualisation
      const img = new Image();
      img.src = imageSrc;

      // Attendre que l'image soit chargée
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image capturée'));
      });

      // Convertir l'image base64 en fichier
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Mettre à jour les états
      setSelectedFile(file);
      setPreviewUrl(imageSrc);
      setIsWebcamActive(false);

      // Effacer le canvas existant
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      // Analyser automatiquement l'image capturée
      await handleAnalyze();

      // Afficher un message de succès temporaire
      setDetectionSummary('Image capturée avec succès !');
      setTimeout(() => {
        if (detectionSummary === 'Image capturée avec succès !') {
          setDetectionSummary('');
        }
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de la capture:', error);
      setErrorMessage('Erreur lors de la capture de l\'image');
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
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsWebcamActive(false);
    setResult(null);
    setIsRealTimeDetection(false);
    setErrorMessage(null);
    setDetectionSummary('');
    
    // Effacer le canvas
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    // Réinitialiser l'input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const drawBoundingBox = (predictions: any[], canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !webcamRef.current?.video) return;

    const video = webcamRef.current.video;
    const { videoWidth, videoHeight } = video;
    const { width: displayWidth, height: displayHeight } = video.getBoundingClientRect();

    // Définir la taille du canvas pour correspondre exactement à la taille d'affichage
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Calculer les facteurs d'échelle
    const scaleX = displayWidth / videoWidth;
    const scaleY = displayHeight / videoHeight;

    // Effacer le canvas précédent
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach((pred: any) => {
      // Utiliser les coordonnées de la boîte englobante avec mise à l'échelle précise
      const x = pred.x * scaleX;
      const y = pred.y * scaleY;
      
      // Réduire légèrement la taille de la boîte pour mieux s'adapter à l'objet
      const reductionFactor = 0.95; // Réduction de 5%
      const boxWidth = pred.width * scaleX * reductionFactor;
      const boxHeight = pred.height * scaleY * reductionFactor;

      // Dessiner un contour plus fin et plus précis avec une couleur qui varie selon la confiance
      const alpha = Math.max(0.5, pred.confidence); // Minimum 0.5 d'opacité
      ctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`;
      ctx.lineWidth = 2;
      
      // Dessiner la boîte principale avec un contour double pour plus de précision
      const boxX = x - boxWidth/2;
      const boxY = y - boxHeight/2;
      
      // Contour externe légèrement plus grand
      ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(boxX - 1, boxY - 1, boxWidth + 2, boxHeight + 2);
      
      // Contour interne précis
      ctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      
      // Ajouter des points aux coins pour plus de précision
      const cornerSize = 3; // Réduit la taille des points
      ctx.fillStyle = '#00ff00';
      
      // Coins externes
      const corners = [
        [boxX, boxY], // Haut gauche
        [boxX + boxWidth, boxY], // Haut droite
        [boxX, boxY + boxHeight], // Bas gauche
        [boxX + boxWidth, boxY + boxHeight] // Bas droite
      ];
      
      corners.forEach(([cornerX, cornerY]) => {
        ctx.beginPath();
        ctx.arc(cornerX, cornerY, cornerSize, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ajouter le label avec le score de confiance
      const confidence = (pred.confidence * 100).toFixed(1);
      const text = `${pred.class} ${confidence}%`;
      
      // Améliorer la lisibilité du texte
      ctx.font = 'bold 12px Arial';
      const textMetrics = ctx.measureText(text);
      const padding = 4;
      const textHeight = 16;

      // Dessiner un fond semi-transparent pour le texte
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(
        boxX,
        boxY - textHeight - padding * 2,
        textMetrics.width + padding * 2,
        textHeight + padding
      );

      // Dessiner le texte avec un contour pour une meilleure visibilité
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1.5;
      ctx.strokeText(text, boxX + padding, boxY - padding - 4);
      ctx.fillStyle = '#00ff00';
      ctx.fillText(text, boxX + padding, boxY - padding - 4);
    });
  };

  useEffect(() => {
    if (isRealTimeDetection) {
      animationFrameRef.current = requestAnimationFrame(detectRealTime);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRealTimeDetection, detectRealTime]);

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
            Choisissez une méthode de détection
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
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Activez la webcam ou chargez une image
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-center space-x-4">
          {isWebcamActive && (
            <button
              onClick={captureWebcam}
              className="btn btn-primary"
              disabled={isLoading}
            >
              <Camera className="h-5 w-5 mr-2" />
              <span>Prendre une photo</span>
            </button>
          )}

          {selectedFile && (
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
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
          )}
        </div>

        {detectionSummary && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md font-medium">
            {detectionSummary}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
            {errorMessage}
          </div>
        )}

        {isWebcamActive && isRealTimeDetection && (
          <div className="mt-4 space-y-4">
            <div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seuil de confiance: {Math.round(minConfidence * 100)}%
              </label>
              <input
                type="range"
                min="30"
                max="90"
                step="5"
                value={minConfidence * 100}
                onChange={(e) => setMinConfidence(parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre maximum d'objets: {maxObjects}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={maxObjects}
                onChange={(e) => setMaxObjects(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Mode haute performance
                </label>
                <input
                  type="checkbox"
                  checked={isHighPerformance}
                  onChange={(e) => setIsHighPerformance(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
              </div>
              <div className="text-sm text-gray-600">
                FPS actuel: {currentFPS}
              </div>
            </div>

            {isHighPerformance && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taille du buffer: {bufferSize} frames
                </label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={bufferSize}
                  onChange={(e) => setBufferSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Detection; 