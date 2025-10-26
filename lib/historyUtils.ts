import type { AnalysisResult as FullAnalysisResult } from './engines/scoreCombiner';
import type { Finding } from './ruleEngine';

export interface StoredAnalysisResult {
  findings: Finding[];
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
  analysis: StoredAnalysisResult;
  createdAt: Date;
}

const STORAGE_KEY = 'phishsense-history';
const MAX_HISTORY_ITEMS = 50;

export const toStoredAnalysisResult = (analysis: FullAnalysisResult): StoredAnalysisResult => ({
  findings: analysis.findings,
  score: analysis.score,
  riskLevel: analysis.riskLevel,
  summary: analysis.summary
});

export const saveAnalysisToHistory = (email: EmailData, analysis: StoredAnalysisResult): void => {
  try {
    const history = getAnalysisHistory();

    const newItem: AnalysisHistoryItem = {
      id: generateId(),
      email,
      analysis,
      createdAt: new Date()
    };

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

    const rawHistory = JSON.parse(stored) as Array<{
      id: string;
      email: EmailData & { analyzedAt: string | Date };
      analysis: StoredAnalysisResult;
      createdAt: string | Date;
    }>;

    return rawHistory.map(item => ({
      id: item.id,
      email: {
        ...item.email,
        analyzedAt: new Date(item.email.analyzedAt)
      },
      analysis: item.analysis,
      createdAt: new Date(item.createdAt)
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
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

  const exportFileDefaultName = `phishsense-history-${new Date().toISOString().split('T')[0]}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}
