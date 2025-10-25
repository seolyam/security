# PhishingSense v2.0 Developer Guide

## Overview

PhishingSense v2.0 is a modular email security analysis platform built with Next.js, TypeScript, and modern web technologies. This guide provides comprehensive documentation for developers who want to extend, modify, or contribute to the system.

## Architecture Overview

```
phishingsense/
├── app/                    # Next.js 16 App Router pages
├── components/            # React components
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   └── [feature components] # Feature-specific components
├── lib/                   # Core business logic
│   ├── engines/          # Modular analysis engines
│   ├── data/             # Configuration and pattern data
│   └── [utilities]       # Helper functions and utilities
└── public/               # Static assets and demo data
```

## Core Components

### 1. Analysis Engines (`lib/engines/`)

The system uses a modular engine architecture for different types of analysis:

#### RuleEngine (`ruleEngine.ts`)
- **Purpose**: Heuristic-based pattern matching
- **Features**: Keyword analysis, URL validation, domain checking
- **Configuration**: Sensitivity levels, custom weights

#### MLEngine (`mlEngine.ts`)
- **Purpose**: Machine learning-based classification
- **Features**: TensorFlow.js integration, model management
- **Configuration**: Model parameters, feature extraction

#### HeaderEngine (`headerEngine.ts`)
- **Purpose**: Email authentication analysis
- **Features**: SPF, DKIM, DMARC validation
- **Configuration**: Authentication thresholds

#### ScoreCombiner (`scoreCombiner.ts`)
- **Purpose**: Weighted score aggregation
- **Features**: Multi-engine result combination
- **Configuration**: Weight distributions

### 2. Data Layer (`lib/data/`)

#### patterns.json
Contains all detection patterns, keywords, and configuration:

```json
{
  "phishingKeywords": {
    "urgent": {
      "weight": 15,
      "severity": "medium",
      "patterns": ["urgent", "immediate", "asap"]
    }
  },
  "suspiciousDomains": ["example.com"],
  "urlPatterns": {
    "shorteners": ["bit.ly", "tinyurl.com"]
  }
}
```

## Adding New Detection Rules

### 1. Keyword-Based Rules

To add new phishing keywords:

1. **Update patterns.json**:
```json
{
  "phishingKeywords": {
    "newCategory": {
      "weight": 20,
      "severity": "high",
      "patterns": ["new keyword", "another pattern"]
    }
  }
}
```

2. **Add explanation in patterns.json**:
```json
{
  "educationalContent": {
    "explanations": {
      "newCategory": "Explanation of why this pattern is suspicious"
    }
  }
}
```

3. **Update the RuleEngine**:
```typescript
// In ruleEngine.ts, add to analyzeKeywords method
private analyzeKeywords(content: EmailContent): Finding[] {
  // Add new category check
  this.patterns.phishingKeywords.newCategory.patterns.forEach(pattern => {
    // Pattern matching logic
  });
}
```

### 2. URL Pattern Rules

To add new URL-based detection:

```typescript
// Add to patterns.json
{
  "urlPatterns": {
    "newSuspicious": ["suspicious-pattern", "another-pattern"]
  }
}

// In ruleEngine.ts
private analyzeUrls(content: EmailContent): Finding[] {
  this.patterns.urlPatterns.newSuspicious.forEach(pattern => {
    if (url.includes(pattern)) {
      findings.push({
        id: `url-${pattern}`,
        text: `Suspicious URL pattern: ${pattern}`,
        severity: 'medium',
        category: 'url'
      });
    }
  });
}
```

### 3. Domain Validation Rules

```typescript
// Add to patterns.json
{
  "suspiciousDomains": ["new-suspicious-domain.com"],
  "legitimateDomains": ["new-legitimate-domain.com"]
}

// In ruleEngine.ts
private analyzeDomains(content: EmailContent): Finding[] {
  const domain = extractDomain(content.from);
  if (this.patterns.suspiciousDomains.includes(domain)) {
    // Add suspicious domain finding
  }
}
```

## Machine Learning Integration

### Adding New ML Features

1. **Feature Engineering**:
```typescript
// In mlEngine.ts
private extractFeatures(content: EmailContent): number[] {
  const features = [
    // Existing features
    this.countKeywords(content.body, ['urgent', 'immediate']),
    this.checkUrlSuspiciousness(content.body),
    // New feature
    this.detectNewPattern(content.subject)
  ];
  return features;
}
```

2. **Model Configuration**:
```typescript
// In mlEngine.ts
private createModel(): tf.LayersModel {
  return tf.sequential({
    layers: [
      tf.layers.dense({
        units: 64,
        activation: 'relu',
        inputShape: [this.featureCount]
      }),
      // Add new layers as needed
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 1, activation: 'sigmoid' })
    ]
  });
}
```

## UI Component Development

### Creating New Components

1. **Use shadcn/ui components** for consistency:
```typescript
// components/ui/[component].tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface ComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  // Props
}

export const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("...", className)} {...props} />
  }
)
```

2. **Add theme support**:
```typescript
// Use theme-aware styling
const { theme } = useTheme();
return (
  <div className={theme === 'dark' ? 'dark-styles' : 'light-styles'}>
    {/* Component content */}
  </div>
);
```

3. **Implement accessibility**:
```typescript
// Add ARIA labels and keyboard navigation
<button
  aria-label="Analyze email"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleAnalyze();
    }
  }}
>
  Analyze
</button>
```

## Configuration Management

### Environment Variables

Add new configuration options:

```env
# .env.local
NEXT_PUBLIC_NEW_FEATURE_ENABLED=true
NEXT_PUBLIC_API_ENDPOINT=https://api.example.com
NEXT_PUBLIC_MAX_ANALYSIS_SIZE=10000
```

### Dynamic Configuration

```typescript
// lib/config.ts
export const config = {
  features: {
    newFeature: process.env.NEXT_PUBLIC_NEW_FEATURE_ENABLED === 'true',
  },
  limits: {
    maxAnalysisSize: parseInt(process.env.NEXT_PUBLIC_MAX_ANALYSIS_SIZE || '10000'),
  }
};
```

## Performance Optimization

### Web Workers

For heavy computations:

```javascript
// public/workers/heavy-computation.js
self.onmessage = async function(e) {
  const { type, data } = e.data;

  switch (type) {
    case 'ANALYZE':
      const result = await performHeavyAnalysis(data);
      self.postMessage({ type: 'RESULT', result });
      break;
  }
};
```

```typescript
// In component
const worker = new Worker('/workers/heavy-computation.js');
worker.postMessage({ type: 'ANALYZE', data: emailContent });
worker.onmessage = (e) => {
  if (e.data.type === 'RESULT') {
    setResult(e.data.result);
  }
};
```

### Code Splitting

```typescript
// Dynamic imports for lazy loading
const MLComponent = React.lazy(() => import('./MLComponent'));

// In component
<Suspense fallback={<LoadingSpinner />}>
  {enableML && <MLComponent />}
</Suspense>
```

## Testing

### Unit Tests

```typescript
// lib/engines/__tests__/ruleEngine.test.ts
import { RuleEngine } from '../ruleEngine';

describe('RuleEngine', () => {
  it('should detect urgent keywords', async () => {
    const engine = new RuleEngine();
    const result = await engine.analyze({
      subject: 'Urgent: Account Verification Required',
      body: 'Please verify immediately'
    });

    expect(result.findings.some(f => f.category === 'urgent')).toBe(true);
  });
});
```

### Integration Tests

```typescript
// __tests__/analysis-flow.test.ts
import { analyzeEmailV2 } from '../lib/ruleEngine';

describe('Full Analysis Flow', () => {
  it('should complete full analysis pipeline', async () => {
    const email = {
      subject: 'Account Security Alert',
      body: 'Your account needs verification',
      from: 'security@paypal.com'
    };

    const result = await analyzeEmailV2(email);
    expect(result.score).toBeGreaterThan(0);
    expect(result.findings).toBeDefined();
  });
});
```

## Deployment

### Build Process

```json
// package.json scripts
{
  "build": "next build",
  "export": "next build && next export",
  "analyze": "cross-env ANALYZE=true next build"
}
```

### Environment Configuration

```typescript
// lib/config/production.ts
export const productionConfig = {
  enableAdvancedFeatures: true,
  maxConcurrentAnalyses: 5,
  cacheTimeout: 3600000 // 1 hour
};
```

## Contributing Guidelines

### Code Style

1. **TypeScript**: Use strict typing, avoid `any` types
2. **React**: Functional components with hooks, avoid class components
3. **Naming**: Use camelCase for variables, PascalCase for components
4. **Imports**: Group by external/internal, alphabetize within groups

### Pull Request Process

1. **Create feature branch**: `git checkout -b feature/new-analysis-method`
2. **Implement changes**: Follow existing patterns and add tests
3. **Update documentation**: Add JSDoc comments and README updates
4. **Run tests**: Ensure all tests pass
5. **Submit PR**: Include description of changes and rationale

### Performance Considerations

1. **Bundle size**: Monitor with `npm run analyze`
2. **Runtime performance**: Use React DevTools Profiler
3. **Memory usage**: Implement cleanup in useEffect hooks
4. **Network requests**: Minimize and cache where possible

## API Reference

### Core Functions

```typescript
/**
 * Main analysis function - combines all engines
 * @param content Email content to analyze
 * @param config Analysis configuration options
 * @returns Promise resolving to comprehensive analysis results
 */
export async function analyzeEmailV2(
  content: EmailContent,
  config?: Partial<AnalysisConfig>
): Promise<AnalysisResult>
```

### Engine Interfaces

```typescript
interface RuleEngineConfig {
  sensitivity?: 'lenient' | 'balanced' | 'strict';
  enableUrlAnalysis?: boolean;
  enableDomainAnalysis?: boolean;
  enableAttachmentAnalysis?: boolean;
  customWeights?: { [keyword: string]: number };
}
```

## Troubleshooting

### Common Issues

1. **TypeScript errors**: Check import paths and type definitions
2. **Build failures**: Ensure all dependencies are installed
3. **Runtime errors**: Check browser console for detailed error messages
4. **Performance issues**: Use React DevTools to identify bottlenecks

### Debug Mode

```typescript
// Enable debug logging
localStorage.setItem('phishingsense_debug', 'true');

// View debug information
console.log('Analysis breakdown:', result.breakdown);
console.log('Processing time:', result.processingTime);
```

## Security Considerations

1. **Input validation**: Sanitize all user inputs
2. **XSS prevention**: Use DOMPurify for content display
3. **CSRF protection**: Implement proper request validation
4. **Data privacy**: Ensure no sensitive data is transmitted

## Future Enhancements

### Recommended Extensions

1. **Plugin System**: Allow third-party rule modules
2. **API Integration**: Connect to external threat intelligence feeds
3. **Real-time Updates**: WebSocket-based live threat updates
4. **Multi-language Support**: Internationalization (i18n)

### Advanced Features

1. **Model Retraining**: User-supervised learning
2. **Batch Processing**: Analyze multiple emails simultaneously
3. **Export Customization**: Advanced report theming
4. **Analytics Dashboard**: Usage statistics and insights

## Support

For questions or issues:

1. **Check documentation**: Review this developer guide
2. **Examine examples**: Look at existing components for patterns
3. **Debug thoroughly**: Use browser dev tools and logging
4. **Community**: Consider GitHub issues for community support

---

## Version History

- **v2.0.0**: Modular architecture, enhanced UI, ML integration
- **v1.0.0**: Basic rule-based analysis
- **v0.1.0**: Initial prototype

---

*This developer guide is maintained as part of the PhishingSense v2.0 documentation. Last updated: 2024*
