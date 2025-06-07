# Fruit Detector

Une application web moderne pour la détection de fruits dans les images utilisant React, TailwindCSS et l'intelligence artificielle (YOLO).

## Fonctionnalités

- 📸 Upload d'images ou capture via webcam
- 🔍 Détection de fruits en temps réel
- 📊 Statistiques et historique des détections
- 📱 Interface responsive et moderne
- 💾 Sauvegarde locale des résultats
- ⬇️ Téléchargement des images annotées

## Prérequis

- Node.js (v14 ou supérieur)
- npm (v6 ou supérieur)

## Installation

1. Clonez le dépôt :
```bash
git clone https://github.com/votre-username/fruit-detection.git
cd fruit-detection
```

2. Installez les dépendances :
```bash
npm install
```

3. Configurez l'API :
Modifiez l'URL de l'API dans `src/pages/Detection.tsx` :
```typescript
const API_URL = 'http://votre-api-endpoint/detect';
```

4. Démarrez l'application :
```bash
npm start
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

## Configuration de l'API

L'API doit accepter des requêtes POST avec un corps multipart/form-data contenant une image.
La réponse attendue doit être au format :

```json
{
  "detections": [
    {
      "name": "apple",
      "confidence": 0.95,
      "bbox": {
        "x": 100,
        "y": 200,
        "width": 50,
        "height": 50
      }
    }
  ]
}
```

## Technologies utilisées

- React.js
- TypeScript
- TailwindCSS
- Chart.js
- React Router
- Axios
- React Webcam

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

MIT
