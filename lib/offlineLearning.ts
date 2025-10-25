export interface LabeledSample {
  id: string;
  content: {
    subject?: string;
    body?: string;
    from?: string;
  };
  label: 'phishing' | 'safe';
  timestamp: number;
  userId: string;
  metadata?: {
    confidence?: number;
    source?: string;
    category?: string;
  };
}

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
}

export interface MLModelData {
  samples: LabeledSample[];
  modelConfig?: any;
  lastTrained?: number;
  accuracy?: number;
}

const STORAGE_KEYS = {
  LABELED_SAMPLES: 'phishingsense_labeled_samples',
  USER_MODEL: 'phishingsense_user_model',
  TRAINING_HISTORY: 'phishingsense_training_history'
};

export class OfflineLearningManager {
  private static instance: OfflineLearningManager;
  private samples: LabeledSample[] = [];
  private isInitialized = false;

  private constructor() {}

  static getInstance(): OfflineLearningManager {
    if (!OfflineLearningManager.instance) {
      OfflineLearningManager.instance = new OfflineLearningManager();
    }
    return OfflineLearningManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load existing samples from storage
      const stored = localStorage.getItem(STORAGE_KEYS.LABELED_SAMPLES);
      if (stored) {
        this.samples = JSON.parse(stored);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing offline learning:', error);
      this.samples = [];
    }
  }

  // Add a new labeled sample
  addSample(content: { subject?: string; body?: string; from?: string }, label: 'phishing' | 'safe', metadata?: LabeledSample['metadata']): string {
    const sampleId = `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const sample: LabeledSample = {
      id: sampleId,
      content,
      label,
      timestamp: Date.now(),
      userId: this.getUserId(),
      metadata
    };

    this.samples.push(sample);
    this.saveSamples();

    return sampleId;
  }

  // Remove a labeled sample
  removeSample(sampleId: string): boolean {
    const index = this.samples.findIndex(s => s.id === sampleId);
    if (index === -1) return false;

    this.samples.splice(index, 1);
    this.saveSamples();
    return true;
  }

  // Get all samples for a specific label
  getSamplesByLabel(label: 'phishing' | 'safe'): LabeledSample[] {
    return this.samples.filter(s => s.label === label);
  }

  // Get all samples
  getAllSamples(): LabeledSample[] {
    return [...this.samples];
  }

  // Get sample statistics
  getSampleStats(): { total: number; phishing: number; safe: number; recent: number } {
    const now = Date.now();
    const recent = this.samples.filter(s => now - s.timestamp < 7 * 24 * 60 * 60 * 1000); // Last 7 days

    return {
      total: this.samples.length,
      phishing: this.samples.filter(s => s.label === 'phishing').length,
      safe: this.samples.filter(s => s.label === 'safe').length,
      recent: recent.length
    };
  }

  // Check if we have enough samples for training
  hasEnoughSamples(): boolean {
    const stats = this.getSampleStats();
    return stats.phishing >= 5 && stats.safe >= 5;
  }

  // Prepare training data from samples
  prepareTrainingData(): { features: string[]; labels: number[] } {
    const features: string[] = [];
    const labels: number[] = [];

    this.samples.forEach(sample => {
      const text = `${sample.content.subject || ''} ${sample.content.body || ''} ${sample.content.from || ''}`.toLowerCase();
      features.push(text);
      labels.push(sample.label === 'phishing' ? 1 : 0);
    });

    return { features, labels };
  }

  // Save samples to localStorage
  private saveSamples(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LABELED_SAMPLES, JSON.stringify(this.samples));
    } catch (error) {
      console.error('Error saving samples:', error);
    }
  }

  // Generate or get user ID for tracking
  private getUserId(): string {
    let userId = localStorage.getItem('phishingsense_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('phishingsense_user_id', userId);
    }
    return userId;
  }

  // Clear all samples and data
  clearAllData(): void {
    this.samples = [];
    localStorage.removeItem(STORAGE_KEYS.LABELED_SAMPLES);
    localStorage.removeItem(STORAGE_KEYS.USER_MODEL);
    localStorage.removeItem(STORAGE_KEYS.TRAINING_HISTORY);
  }

  // Export samples for backup or analysis
  exportSamples(): string {
    return JSON.stringify(this.samples, null, 2);
  }

  // Import samples from backup
  importSamples(jsonData: string): { success: boolean; count: number; errors: string[] } {
    const errors: string[] = [];
    let count = 0;

    try {
      const imported = JSON.parse(jsonData);
      if (Array.isArray(imported)) {
        imported.forEach((sample, index) => {
          if (this.validateSample(sample)) {
            this.samples.push(sample);
            count++;
          } else {
            errors.push(`Sample ${index}: Invalid format`);
          }
        });
        this.saveSamples();
      } else {
        errors.push('Invalid JSON format: expected array');
      }
    } catch (error) {
      errors.push(`JSON parse error: ${error}`);
    }

    return { success: errors.length === 0, count, errors };
  }

  // Validate sample format
  private validateSample(sample: any): sample is LabeledSample {
    return (
      typeof sample === 'object' &&
      typeof sample.id === 'string' &&
      typeof sample.label === 'string' &&
      ['phishing', 'safe'].includes(sample.label) &&
      typeof sample.timestamp === 'number' &&
      typeof sample.userId === 'string' &&
      typeof sample.content === 'object'
    );
  }
}
