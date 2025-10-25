# PhishingSense v2.0

**Advanced AI-Powered Email Security Analysis Platform**

PhishingSense is a comprehensive phishing email detection system that combines rule-based heuristics, machine learning, and advanced email authentication analysis to provide enterprise-grade email security insights.

![Version 2.0](https://img.shields.io/badge/version-2.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-ML-orange)

## ✨ What's New in v2.0

### 🧠 **Hybrid Detection Engine**
- **Modular Architecture**: Separate engines for rules, ML, headers, and scoring
- **Weighted Analysis**: 25% keywords, 25% headers, 40% ML, 10% misc factors
- **Real-time Processing**: Sub-second analysis with detailed breakdowns

### 📊 **Advanced Visualization**
- **Circular Confidence Gauge**: Animated risk score with color coding
- **Score Breakdown**: Visual contribution from each analysis factor
- **Content Highlighting**: Interactive highlighting of suspicious phrases
- **Responsive Dashboard**: Professional sidebar navigation

### 🔐 **Enhanced Security Analysis**
- **SPF/DKIM/DMARC Validation**: Complete email authentication analysis
- **Header Anomaly Detection**: Suspicious routing and metadata analysis
- **Domain Consistency**: From/Return-Path validation
- **Digital Signatures**: Report authentication with unique signatures

### 📋 **Professional Reporting**
- **Enhanced PDF Reports**: Multi-page reports with signatures and metadata
- **JSON Export**: Complete structured analysis data
- **History Management**: Local storage with search and filtering
- **Batch Operations**: Export multiple analyses and manage history

## 🚀 Core Features

### Email Analysis
- **Multi-Engine Detection**: Rule-based + ML + Header validation
- **Real-time Results**: Instant analysis as you type
- **Advanced Options**: Headers input and ML toggle
- **Content Highlighting**: Visual markers for suspicious content

### Machine Learning (Beta)
- **TensorFlow.js Integration**: Client-side neural network
- **Feature Engineering**: Advanced text-to-vector conversion
- **Confidence Scoring**: ML confidence alongside rule-based analysis
- **Hybrid Scoring**: Combined ML and traditional detection

### Header Authentication
- **SPF Validation**: Sender Policy Framework compliance
- **DKIM Verification**: Digital signature authentication
- **DMARC Analysis**: Domain-based policy compliance
- **Routing Analysis**: Email server hop patterns and anomalies

### Export & History
- **PDF Reports**: Professional multi-page analysis reports
- **JSON Data**: Complete structured export for integration
- **Digital Signatures**: Report authenticity verification
- **History Management**: Persistent analysis storage and retrieval

## 🏗️ Architecture

### Modular Engine Design
```
lib/
├── engines/
│   ├── ruleEngine.ts      # Heuristic keyword & pattern analysis
│   ├── mlEngine.ts        # TensorFlow.js neural network
│   ├── headerEngine.ts    # SPF/DKIM/DMARC validation
│   └── scoreCombiner.ts   # Weighted scoring & orchestration
├── data/
│   └── patterns.json      # Phishing templates & configurations
└── enhancedExport.ts      # PDF/JSON report generation
```

### Scoring System
| Component | Weight | Description |
|-----------|--------|-------------|
| Rule Engine | 25% | Keyword patterns, URL analysis, domain validation |
| Header Analysis | 25% | SPF/DKIM/DMARC authentication results |
| ML Engine | 40% | Neural network confidence scoring |
| Additional | 10% | Attachments, HTML elements, routing |

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + React 19
- **UI Framework**: shadcn/ui + Radix UI primitives + Tailwind CSS
- **Machine Learning**: TensorFlow.js (client-side neural networks)
- **Document Generation**: jsPDF + html2canvas
- **Icons**: Lucide React
- **State Management**: React hooks + localStorage
- **Build System**: Next.js with TypeScript

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone and Install**:
```bash
git clone <repository-url>
cd phishingsense
npm install
```

2. **Development**:
```bash
npm run dev
# Visit http://localhost:3000
```

3. **Production Build**:
```bash
npm run build
npm start
```

## 📊 Sample Data

Test the system with included demo emails:

- **Phishing Examples**: Fake PayPal/Bank alerts with malicious links
- **Legitimate Examples**: Real banking statements and notifications
- **Header Examples**: Emails with complete SPF/DKIM/DMARC validation

## 🔍 Detection Capabilities

### Rule-Based Engine
- **19+ Phishing Keywords**: Urgent, verify, password, security alerts
- **URL Analysis**: Shortened links, suspicious domains, keyword detection
- **Domain Validation**: Suspicious sender patterns, IP spoofing detection
- **Content Analysis**: HTML elements, attachment extensions, form detection

### Header Authentication
- **SPF Compliance**: Sender Policy Framework validation
- **DKIM Verification**: Digital signature authentication
- **DMARC Policy**: Domain-based Message Authentication compliance
- **Routing Analysis**: Email server hop patterns and anomalies

### Machine Learning
- **Neural Network**: Multi-layer perceptron with ReLU/sigmoid activation
- **Feature Engineering**: TF-IDF vectorization with 50+ features
- **Training Data**: Demo dataset with phishing/legitimate classification
- **Confidence Scoring**: Probability-based risk assessment

## ⚙️ Configuration

### Analysis Settings (via Dashboard → Settings)
- **ML Analysis**: Enable/disable TensorFlow.js integration
- **Header Validation**: Toggle advanced authentication analysis
- **Export Format**: Set default report format (PDF/JSON)
- **Sensitivity**: Adjust detection thresholds

## 🔒 Security & Privacy

- **Client-Side Processing**: All analysis happens in your browser
- **No Data Transmission**: Email content never leaves your device
- **Local Storage Only**: Analysis history stored locally
- **Input Sanitization**: DOMPurify integration for content cleaning
- **Digital Signatures**: Report authenticity verification

## 🧪 Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## 📈 Performance

- **Analysis Time**: <1000ms for comprehensive analysis
- **ML Processing**: ~500ms for neural network inference
- **Export Generation**: <2000ms for PDF reports
- **Memory Usage**: Optimized for browser environments

## 🤝 Contributing

This project demonstrates modern email security analysis techniques. Contributions welcome:

1. **Rule Enhancements**: Add new detection patterns to `patterns.json`
2. **ML Improvements**: Enhance the TensorFlow.js model architecture
3. **UI Components**: Extend the dashboard with new visualization tools
4. **Export Formats**: Add support for additional report formats

## 📄 License

Educational and research use. For production deployment, ensure compliance with applicable email security regulations and privacy laws.

---

**Built with ❤️ for email security research and education**

**PhishingSense v2.0 - Advanced Email Security Analysis Platform**

## 📁 Project Structure

```
/phishingsense
├── app/                    # Next.js app router pages
│   └── page.tsx           # Main dashboard entry point
├── components/            # React components
│   ├── ui/               # shadcn/ui component library
│   ├── Dashboard.tsx     # Main navigation and layout
│   ├── AnalyzerForm.tsx  # Enhanced analysis interface
│   ├── ConfidenceGauge.tsx # Circular risk visualization
│   ├── EmailHighlighter.tsx # Content highlighting
│   └── HistoryPanel.tsx   # Analysis history management
├── lib/                  # Core business logic
│   ├── engines/          # Modular analysis engines
│   │   ├── ruleEngine.ts     # Rule-based detection
│   │   ├── mlEngine.ts       # ML/TensorFlow.js integration
│   │   ├── headerEngine.ts   # SPF/DKIM/DMARC validation
│   │   └── scoreCombiner.ts  # Weighted scoring orchestration
│   ├── data/
│   │   └── patterns.json     # Phishing patterns & templates
│   ├── headerAnalysis.ts     # Email header parsing
│   ├── mlClassifier.ts       # Legacy ML implementation
│   ├── historyUtils.ts       # Local storage management
│   └── utils.ts              # Utility functions
└── public/
    └── demo-emails/          # Sample emails for testing
```
