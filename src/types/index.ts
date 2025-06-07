export interface DetectionResult {
  id: string;
  timestamp: number;
  imageUrl: string;
  detections: FruitDetection[];
}

export interface FruitDetection {
  name: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectionStats {
  fruitCounts: Record<string, number>;
  totalDetections: number;
}

export interface HistoryItem extends DetectionResult {
  thumbnail: string;
} 