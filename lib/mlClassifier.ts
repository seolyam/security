import * as tf from '@tensorflow/tfjs';

// Simple vocabulary for email classification
const VOCABULARY = [
  'urgent', 'verify', 'password', 'account', 'click', 'update',
  'confirm', 'security', 'alert', 'login', 'suspended', 'bank',
  'paypal', 'amazon', 'apple', 'microsoft', 'google', 'secure',
  'verification', 'identity', 'suspicious', 'unusual', 'limited',
  'time', 'offer', 'free', 'prize', 'congratulations', 'winner'
];

export interface MLModel {
  loadModel: () => Promise<void>;
  predict: (text: string) => Promise<number>;
  isLoaded: boolean;
}

class SimplePhishingClassifier implements MLModel {
  private model: tf.LayersModel | null = null;
  public isLoaded = false;

  async loadModel(): Promise<void> {
    try {
      // For demo purposes, we'll create a simple sequential model
      // In a real implementation, you'd load a pre-trained model
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [VOCABULARY.length], units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      });

      // Compile the model
      this.model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      // Train with dummy data for demo
      await this.trainWithDemoData();

      this.isLoaded = true;
      console.log('ML model loaded successfully');
    } catch (error) {
      console.error('Error loading ML model:', error);
      throw error;
    }
  }

  private async trainWithDemoData(): Promise<void> {
    if (!this.model) return;

    // Demo training data - in reality, you'd use a larger dataset
    const trainingTexts = [
      'Your account needs verification immediately',
      'Click here to update your password',
      'Security alert for your account',
      'Your package will be delivered tomorrow',
      'Meeting scheduled for next week',
      'Invoice attached for your review',
      'Thank you for your recent purchase',
      'Account suspended due to suspicious activity',
      'Verify your identity to continue',
      'Congratulations! You won a prize'
    ];

    const trainingLabels = [
      1, 1, 1, 0, 0, 0, 0, 1, 1, 1  // 1 = phishing, 0 = legitimate
    ];

    const xs = tf.tensor2d(this.textsToFeatures(trainingTexts));
    const ys = tf.tensor2d(trainingLabels, [trainingLabels.length, 1]);

    await this.model.fit(xs, ys, {
      epochs: 50,
      batchSize: 4,
      verbose: 0,
      validationSplit: 0.2
    });

    xs.dispose();
    ys.dispose();
  }

  private textsToFeatures(texts: string[]): number[][] {
    return texts.map(text => {
      const features = new Array(VOCABULARY.length).fill(0);
      const lowerText = text.toLowerCase();

      VOCABULARY.forEach((word, index) => {
        if (lowerText.includes(word)) {
          features[index] = 1;
        }
      });

      return features;
    });
  }

  async predict(text: string): Promise<number> {
    if (!this.model || !this.isLoaded) {
      throw new Error('Model not loaded');
    }

    const features = this.textsToFeatures([text]);
    const input = tf.tensor2d(features);
    const prediction = this.model.predict(input) as tf.Tensor;
    const result = await prediction.data();

    input.dispose();
    prediction.dispose();

    // Return probability (0-1, where 1 is more likely phishing)
    return result[0];
  }

  getModelInfo() {
    return {
      vocabularySize: VOCABULARY.length,
      isLoaded: this.isLoaded,
      modelType: 'Simple Neural Network',
      description: 'Basic phishing detection using keyword features'
    };
  }
}

// Global instance
let mlClassifier: SimplePhishingClassifier | null = null;

export const getMLClassifier = (): SimplePhishingClassifier => {
  if (!mlClassifier) {
    mlClassifier = new SimplePhishingClassifier();
  }
  return mlClassifier;
};

export const initializeMLModel = async (): Promise<void> => {
  const classifier = getMLClassifier();
  if (!classifier.isLoaded) {
    await classifier.loadModel();
  }
};

export const predictWithML = async (text: string): Promise<number> => {
  const classifier = getMLClassifier();
  if (!classifier.isLoaded) {
    await initializeMLModel();
  }
  return await classifier.predict(text);
};
