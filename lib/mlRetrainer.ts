import * as tf from '@tensorflow/tfjs';
import { LabeledSample, TrainingConfig } from './offlineLearning';

export interface TrainingResult {
  success: boolean;
  accuracy?: number;
  loss?: number;
  epochs: number;
  duration: number;
  error?: string;
}

export interface ModelConfig {
  vocabularySize: number;
  maxLength: number;
  embeddingDim: number;
  hiddenUnits: number;
  dropoutRate: number;
}

export class MLRetrainer {
  private static instance: MLRetrainer;
  private model: tf.LayersModel | null = null;
  private tokenizer: Map<string, number> = new Map();
  private config: ModelConfig = {
    vocabularySize: 10000,
    maxLength: 500,
    embeddingDim: 50,
    hiddenUnits: 64,
    dropoutRate: 0.2
  };

  private constructor() {}

  static getInstance(): MLRetrainer {
    if (!MLRetrainer.instance) {
      MLRetrainer.instance = new MLRetrainer();
    }
    return MLRetrainer.instance;
  }

  // Build and compile the model
  private buildModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        // Input layer for text sequences
        tf.layers.embedding({
          inputDim: this.config.vocabularySize,
          outputDim: this.config.embeddingDim,
          inputLength: this.config.maxLength,
          name: 'embedding'
        }),

        // LSTM layer for sequence processing
        tf.layers.lstm({
          units: this.config.hiddenUnits,
          dropout: this.config.dropoutRate,
          recurrentDropout: this.config.dropoutRate,
          returnSequences: false,
          name: 'lstm'
        }),

        // Dense layers
        tf.layers.dense({
          units: this.config.hiddenUnits / 2,
          activation: 'relu',
          name: 'dense1'
        }),

        tf.layers.dropout({
          rate: this.config.dropoutRate,
          name: 'dropout1'
        }),

        // Output layer
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid',
          name: 'output'
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  // Create vocabulary from training samples
  private createVocabulary(texts: string[]): void {
    this.tokenizer.clear();

    const wordFreq = new Map<string, number>();

    texts.forEach(text => {
      const words = this.preprocessText(text);
      words.forEach(word => {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      });
    });

    // Sort by frequency and take top vocabularySize words
    const sortedWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.config.vocabularySize - 2); // Reserve 2 for special tokens

    // Add special tokens
    this.tokenizer.set('<PAD>', 0);
    this.tokenizer.set('<UNK>', 1);

    sortedWords.forEach(([word, _], index) => {
      this.tokenizer.set(word, index + 2);
    });
  }

  // Preprocess text for training
  private preprocessText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(word => word.length > 0);
  }

  // Convert text to sequence of token indices
  private textToSequence(text: string, maxLength: number): number[] {
    const words = this.preprocessText(text);
    const sequence: number[] = [];

    for (let i = 0; i < maxLength; i++) {
      if (i < words.length) {
        const token = this.tokenizer.get(words[i]);
        sequence.push(token !== undefined ? token : 1); // 1 is <UNK>
      } else {
        sequence.push(0); // 0 is <PAD>
      }
    }

    return sequence;
  }

  // Prepare training data
  private prepareData(samples: LabeledSample[]): { xs: tf.Tensor, ys: tf.Tensor } {
    const texts: string[] = [];
    const labels: number[] = [];

    samples.forEach(sample => {
      const text = `${sample.content.subject || ''} ${sample.content.body || ''} ${sample.content.from || ''}`;
      texts.push(text);
      labels.push(sample.label === 'phishing' ? 1 : 0);
    });

    // Create vocabulary
    this.createVocabulary(texts);

    // Convert to sequences
    const sequences: number[][] = [];
    texts.forEach(text => {
      sequences.push(this.textToSequence(text, this.config.maxLength));
    });

    // Convert to tensors
    const xs = tf.tensor2d(sequences);
    const ys = tf.tensor1d(labels);

    return { xs, ys };
  }

  // Train the model with user samples
  async trainModel(samples: LabeledSample[], config: Partial<TrainingConfig> = {}): Promise<TrainingResult> {
    const startTime = Date.now();

    const trainingConfig: TrainingConfig = {
      epochs: 50,
      batchSize: 32,
      learningRate: 0.001,
      validationSplit: 0.2,
      ...config
    };

    try {
      if (samples.length < 10) {
        throw new Error('Need at least 10 samples for training (minimum 5 phishing + 5 safe)');
      }

      // Build model
      this.model = this.buildModel();

      // Prepare data
      const { xs, ys } = this.prepareData(samples);

      // Create validation data
      const validationSize = Math.floor(samples.length * trainingConfig.validationSplit);
      const trainSize = samples.length - validationSize;

      const xsTrain = xs.slice([0, 0], [trainSize, -1]);
      const ysTrain = ys.slice([0], [trainSize]);
      const xsVal = xs.slice([trainSize, 0], [validationSize, -1]);
      const ysVal = ys.slice([trainSize], [validationSize]);

      // Train the model
      const history = await this.model.fit(xsTrain, ysTrain, {
        epochs: trainingConfig.epochs,
        batchSize: trainingConfig.batchSize,
        validationData: [xsVal, ysVal],
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch + 1}/${trainingConfig.epochs} - loss: ${logs?.loss?.toFixed(4)}, accuracy: ${logs?.acc?.toFixed(4)}, val_loss: ${logs?.val_loss?.toFixed(4)}, val_acc: ${logs?.val_acc?.toFixed(4)}`);
          }
        }
      });

      // Get final metrics
      const finalMetrics = history.history;
      const accuracy = finalMetrics.acc[finalMetrics.acc.length - 1];
      const loss = finalMetrics.loss[finalMetrics.loss.length - 1];

      // Save model to localStorage
      await this.saveModel();

      // Clean up tensors
      xs.dispose();
      ys.dispose();
      xsTrain.dispose();
      ysTrain.dispose();
      xsVal.dispose();
      ysVal.dispose();

      const duration = Date.now() - startTime;

      return {
        success: true,
        accuracy: accuracy as number,
        loss: loss as number,
        epochs: trainingConfig.epochs,
        duration
      };

    } catch (error) {
      console.error('Training failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown training error',
        epochs: 0,
        duration: Date.now() - startTime
      };
    }
  }

  // Predict with the trained model
  async predict(text: string): Promise<number> {
    if (!this.model) {
      throw new Error('Model not trained yet');
    }

    try {
      const sequence = tf.tensor2d([this.textToSequence(text, this.config.maxLength)]);
      const prediction = this.model.predict(sequence) as tf.Tensor;
      const result = await prediction.data();
      const confidence = result[0];

      // Clean up tensors
      sequence.dispose();
      prediction.dispose();

      return confidence;
    } catch (error) {
      console.error('Prediction failed:', error);
      throw error;
    }
  }

  // Save model to localStorage
  private async saveModel(): Promise<void> {
    if (!this.model) return;

    try {
      const modelData = {
        modelTopology: this.model.toJSON(),
        config: this.config,
        tokenizer: Array.from(this.tokenizer.entries()),
        timestamp: Date.now()
      };

      localStorage.setItem('phishingsense_user_model', JSON.stringify(modelData));
    } catch (error) {
      console.error('Error saving model:', error);
    }
  }

  // Load model from localStorage
  async loadModel(): Promise<boolean> {
    try {
      const stored = localStorage.getItem('phishingsense_user_model');
      if (!stored) return false;

      const modelData = JSON.parse(stored);

      // Recreate tokenizer
      this.tokenizer = new Map(modelData.tokenizer);

      // Update config
      this.config = modelData.config;

      // Load model topology
      this.model = await tf.loadLayersModel(tf.io.fromMemory({
        modelArtifacts: modelData.modelTopology
      }));

      return true;
    } catch (error) {
      console.error('Error loading model:', error);
      return false;
    }
  }

  // Check if model is available
  isModelAvailable(): boolean {
    return this.model !== null;
  }

  // Get model info
  getModelInfo(): { samples: number; config: ModelConfig; lastTrained?: number } | null {
    const stored = localStorage.getItem('phishingsense_user_model');
    if (!stored) return null;

    const modelData = JSON.parse(stored);
    return {
      samples: 0, // Would need to get from training history
      config: modelData.config,
      lastTrained: modelData.timestamp
    };
  }

  // Clear model
  clearModel(): void {
    this.model = null;
    this.tokenizer.clear();
    localStorage.removeItem('phishingsense_user_model');
  }

  // Get training history
  getTrainingHistory(): any[] {
    const stored = localStorage.getItem('phishingsense_training_history');
    return stored ? JSON.parse(stored) : [];
  }

  // Save training history
  private saveTrainingHistory(result: TrainingResult): void {
    const history = this.getTrainingHistory();
    history.push({
      ...result,
      timestamp: Date.now()
    });

    // Keep only last 10 training sessions
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    localStorage.setItem('phishingsense_training_history', JSON.stringify(history));
  }
}
