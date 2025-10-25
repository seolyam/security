export interface AnalysisResult {
  findings: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high';
    text: string;
    meta?: any;
    startIndex?: number;
    endIndex?: number;
  }>;
  score: number;
  riskLevel: string;
  summary: string;
}

export interface EmailData {
  from: string;
  subject: string;
  body: string;
  analyzedAt: Date;
}

export interface AnalysisHistoryItem {
  id: string;
  email: EmailData;
  analysis: AnalysisResult;
  createdAt: Date;
}

const STORAGE_KEY = 'phishsense-history';
const MAX_HISTORY_ITEMS = 50;

export const saveAnalysisToHistory = (email: EmailData, analysis: AnalysisResult): void => {
  try {
    const history = getAnalysisHistory();

    const newItem: AnalysisHistoryItem = {
      id: generateId(),
      email,
      analysis,
      createdAt: new Date(),
    };

    // Add to beginning of array and limit to max items
    const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error saving analysis to history:', error);
  }
};

export const getAnalysisHistory = (): AnalysisHistoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored);
    return history.map((item: any) => ({
      ...item,
      email: {
        ...item.email,
        analyzedAt: new Date(item.email.analyzedAt),
      },
      createdAt: new Date(item.createdAt),
    }));
  } catch (error) {
    console.error('Error loading analysis history:', error);
    return [];
  }
};

export const deleteAnalysisFromHistory = (id: string): void => {
  try {
    const history = getAnalysisHistory();
    const updatedHistory = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error deleting analysis from history:', error);
  }
};

export const clearAnalysisHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing analysis history:', error);
  }
};

export const getAnalysisById = (id: string): AnalysisHistoryItem | null => {
  const history = getAnalysisHistory();
  return history.find(item => item.id === id) || null;
};

export const exportHistoryToJSON = (): void => {
  const history = getAnalysisHistory();
  const dataStr = JSON.stringify(history, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

  const exportFileDefaultName = `phishsense-history-${new Date().toISOString().split('T')[0]}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
