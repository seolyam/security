import * as tf from '@tensorflow/tfjs';
import patterns from '../data/patterns.json';

export interface MLResult {
  score: number;
  confidence: number;
  findings: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high';
    text: string;
    meta?: any;
    category: string;
  }>;
  modelUsed: string;
  processingTime: number;
}

export interface MLConfig {
  enabled: boolean;
  modelType: 'client' | 'api' | 'hybrid';
  apiEndpoint?: string;
  confidenceThreshold: number;
}

export class MLEngine {
  private config: MLConfig;
  private model: tf.LayersModel | null = null;
  private isLoaded = false;

  constructor(config: MLConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) return;

    try {
      if (this.config.modelType === 'client') {
        await this.loadClientModel();
      }
      this.isLoaded = true;
      console.log('ML Engine initialized successfully');
    } catch (error) {
      console.error('Error initializing ML engine:', error);
      throw error;
    }
  }

  private async loadClientModel(): Promise<void> {
    try {
      // For demo purposes, create a simple model
      // In production, you'd load a pre-trained model from a URL
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [Object.keys(patterns.phishingKeywords).length + 10], units: 32, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      });

      this.model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      // Train with demo data
      await this.trainDemoModel();

    } catch (error) {
      console.error('Error loading client model:', error);
      throw error;
    }
  }

  private async trainDemoModel(): Promise<void> {
    if (!this.model) return;

    // Demo training data
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
      1, 1, 1, 0, 0, 0, 0, 1, 1, 1
    ];

    const xs = tf.tensor2d(this.textToFeatures(trainingTexts));
    const ys = tf.tensor2d(trainingLabels, [trainingLabels.length, 1]);

    await this.model.fit(xs, ys, {
      epochs: 100,
      batchSize: 4,
      verbose: 0,
      validationSplit: 0.2
    });

    xs.dispose();
    ys.dispose();
  }

  async analyze(content: {
    subject?: string;
    body?: string;
    from?: string;
  }): Promise<MLResult> {
    const startTime = Date.now();

    if (!this.config.enabled || !this.isLoaded) {
      return {
        score: 0,
        confidence: 0,
        findings: [],
        modelUsed: 'disabled',
        processingTime: Date.now() - startTime
      };
    }

    try {
      let score = 0;
      let confidence = 0;
      let modelUsed = '';
      const findings: MLResult['findings'] = [];

      if (this.config.modelType === 'client' && this.model) {
        const features = this.textToFeatures([`${content.subject} ${content.body}`]);
        const input = tf.tensor2d(features);
        const prediction = this.model.predict(input) as tf.Tensor;
        const result = await prediction.data();

        score = result[0] * 100;
        confidence = Math.min(1, score / 50); // Normalize confidence
        modelUsed = 'tensorflowjs-client';

        input.dispose();
        prediction.dispose();

      } else if (this.config.modelType === 'api' && this.config.apiEndpoint) {
        // API-based prediction
        const response = await fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: content.subject,
            body: content.body,
            from: content.from
          })
        });

        if (response.ok) {
          const data = await response.json();
          score = data.probability * 100;
          confidence = data.confidence || 0.5;
          modelUsed = 'external-api';
        }
      }

      // Add ML-based findings
      if (score > 70) {
        findings.push({
          id: 'ml-high-risk',
          severity: 'high',
          text: `ML analysis indicates high phishing probability (${Math.round(score)}%)`,
          meta: { score, confidence },
          category: 'ml'
        });
      } else if (score > 40) {
        findings.push({
          id: 'ml-medium-risk',
          severity: 'medium',
          text: `ML analysis indicates moderate phishing probability (${Math.round(score)}%)`,
          meta: { score, confidence },
          category: 'ml'
        });
      }

      return {
        score,
        confidence,
        findings,
        modelUsed,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Error in ML analysis:', error);
      return {
        score: 0,
        confidence: 0,
        findings: [{
          id: 'ml-error',
          severity: 'low',
          text: 'Error in ML analysis',
          meta: { error: error instanceof Error ? error.message : 'Unknown error' },
          category: 'ml'
        }],
        modelUsed: 'error',
        processingTime: Date.now() - startTime
      };
    }
  }

  private textToFeatures(texts: string[]): number[][] {
    return texts.map(text => {
      const features = new Array(Object.keys(patterns.phishingKeywords).length + 10).fill(0);
      const lowerText = text.toLowerCase();

      let featureIndex = 0;

      // Keyword features
      Object.values(patterns.phishingKeywords).forEach(category => {
        category.patterns.forEach((pattern: string) => {
          if (lowerText.includes(pattern)) {
            features[featureIndex] = 1;
          }
          featureIndex++;
        });
      });

      // Additional features
      features[featureIndex++] = lowerText.includes('urgent') ? 1 : 0;
      features[featureIndex++] = lowerText.includes('click') ? 1 : 0;
      features[featureIndex++] = lowerText.includes('verify') ? 1 : 0;
      features[featureIndex++] = lowerText.includes('password') ? 1 : 0;
      features[featureIndex++] = lowerText.includes('account') ? 1 : 0;
      features[featureIndex++] = lowerText.includes('bank') ? 1 : 0;
      features[featureIndex++] = lowerText.includes('paypal') ? 1 : 0;
      features[featureIndex++] = lowerText.includes('security') ? 1 : 0;
      features[featureIndex++] = lowerText.includes('update') ? 1 : 0;
      features[featureIndex++] = (lowerText.match(/https?:\/\//g) || []).length > 0 ? 1 : 0;

      return features;
    });
  }

  updateConfig(config: Partial<MLConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): MLConfig {
    return { ...this.config };
  }

  isReady(): boolean {
    return this.isLoaded && this.config.enabled;
  }
}
