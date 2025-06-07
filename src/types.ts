export interface FruitDetection {
  name: string;
  confidence: number;
  points: Array<[number, number]>;
}

export interface DetectionResult {
  id: string;
  timestamp: number;
  imageUrl: string;
  detections: FruitDetection[];
} 