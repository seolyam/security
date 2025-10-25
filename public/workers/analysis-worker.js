// Web Worker for heavy analysis operations
// This runs in a separate thread to keep the UI responsive

import { analyzeEmailV2 } from '../lib/ruleEngine';

self.onmessage = async function(e) {
  const { type, data } = e.data;

  try {
    switch (type) {
      case 'ANALYZE_EMAIL':
        const result = await analyzeEmailV2(data.emailContent, data.config);
        self.postMessage({ type: 'ANALYSIS_RESULT', result });
        break;

      case 'BATCH_ANALYZE':
        const results = [];
        for (const email of data.emails) {
          const result = await analyzeEmailV2(email.content, email.config);
          results.push({ id: email.id, result });
        }
        self.postMessage({ type: 'BATCH_RESULT', results });
        break;

      default:
        self.postMessage({ type: 'ERROR', error: 'Unknown operation type' });
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
