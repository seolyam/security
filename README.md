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
- **Interactive Radar Charts**: Visual breakdown of analysis contributions
- **Enhanced Email Highlighter**: Hover effects and category-based highlighting
- **Content Comparison**: Side-by-side email analysis for learning
- **Responsive Dashboard**: Professional sidebar navigation with mobile support

### 🎓 **Educational Mode**
- **Explain Buttons**: Detailed explanations for each detection finding
- **Safety Tips Carousel**: Rotating cybersecurity tips and best practices
- **Interactive Quiz**: Phishing awareness training with scoring
- **Learning Interface**: Educational content integrated throughout

### 🤖 **AI Learning & Training**
- **User Labeling System**: Mark emails as phishing/safe for training
- **Local Model Retraining**: Personalized ML models using your data
- **Training Interface**: Visual feedback during model training
- **Offline Learning**: All training happens locally in your browser

### 📈 **Analytics Dashboard**
- **Usage Statistics**: Track your analysis patterns and trends
- **Risk Distribution**: Visual charts showing detection results
- **Performance Metrics**: Analysis speed and accuracy tracking
- **Historical Trends**: Weekly and monthly activity summaries

### 🔧 **Rule Customization**
- **Custom Keywords**: Add your own detection patterns
- **Sensitivity Control**: Adjust detection thresholds
- **Category Management**: Organize and weight different rule types
- **Import/Export**: Backup and share custom rule sets

### 📋 **Enhanced Reporting**
- **Theme Support**: Light, dark, minimal, and professional themes
- **Custom Branding**: Add company logos and analyst information
- **Batch Export**: Export multiple analyses simultaneously
- **Digital Signatures**: Authenticated reports with unique hashes

### 🔒 **Privacy & Security**
- **Private Mode**: Disable all data storage for sensitive content
- **Data Management**: Clear all stored data with one click
- **Local Storage Only**: No data ever leaves your device
- **IndexedDB Integration**: Efficient local data management

### 🌙 **Dark Mode & Accessibility**
- **Theme Toggle**: Light, dark, and system theme support
- **Accessibility Features**: ARIA labels and keyboard navigation
- **High Contrast**: Improved visibility for all users
- **Mobile Responsive**: Optimized for all screen sizes

### 📱 **Demo & Testing**
- **Sample Emails**: Pre-loaded phishing and legitimate examples
- **Email Generator**: Create modified versions for testing
- **Interactive Comparison**: Learn differences between email types
- **Quick Load**: One-click loading of common scenarios

### 🔄 **Dataset Updates**
- **GitHub Integration**: Automatic updates from repository
- **Pattern Updates**: Latest phishing keywords and patterns
- **Model Updates**: Enhanced ML model parameters
- **Version Management**: Track and manage updates

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
├── enhancedExport.ts      # Professional PDF/JSON reports
├── headerAnalysis.ts      # Email header parsing utilities
├── mlClassifier.ts        # Legacy ML implementation
├── historyUtils.ts        # Local storage management
└── utils.ts               # Utility functions
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

## 📖 Usage Guide

### Main Dashboard Navigation

The application features a comprehensive sidebar navigation with 12 main sections:

1. **📧 Email Analyzer** - Main analysis interface with enhanced features
2. **📄 Demo Emails** - Load sample emails for testing and learning
3. **🔍 Email Comparison** - Side-by-side comparison of phishing vs legitimate emails
4. **🎓 Learn & Quiz** - Educational content and interactive phishing quiz
5. **📚 Analysis History** - View and manage previous analyses
6. **📊 Analytics** - Usage statistics and trend analysis
7. **🧠 AI Training** - Train personalized models with your labeled data
8. **📋 Reports** - Customize and generate professional reports
9. **🔄 Updates** - Check for and install latest detection patterns
10. **🛡️ Privacy** - Manage data storage and privacy settings
11. **⚙️ Settings** - Configure detection rules and preferences
12. **ℹ️ About** - System information and getting started guide

### Enhanced Analysis Workflow

1. **Navigate to Email Analyzer**: Use the sidebar or main interface
2. **Enter Email Details**: Fill in the From, Subject, and Body fields
3. **Enable Advanced Options**: Click to expand and add email headers
4. **Toggle ML Analysis**: Enable machine learning for enhanced detection
5. **Review Enhanced Results**: See ML confidence, radar charts, and detailed breakdowns
6. **Use Learning Tools**: Label emails and view educational explanations
7. **Export Results**: Generate customized PDF or JSON reports

### Advanced Features

#### AI Training Workflow
1. **Label Emails**: Use the labeling interface to mark emails as phishing/safe
2. **Check Data**: Ensure you have at least 5 phishing and 5 safe samples
3. **Train Model**: Navigate to AI Training tab and start training
4. **Monitor Progress**: Watch real-time training metrics and accuracy
5. **Apply Model**: The system automatically uses your trained model

#### Analytics and Insights
1. **View Dashboard**: Navigate to Analytics for comprehensive statistics
2. **Track Trends**: Monitor your analysis patterns over time
3. **Risk Analysis**: Understand detection accuracy and patterns
4. **Export Reports**: Generate insights for security reporting

#### Educational Mode
1. **Take Quiz**: Test your phishing awareness knowledge
2. **Read Tips**: Browse the rotating safety tips carousel
3. **Compare Emails**: Use the comparison tool to learn differences
4. **Explain Findings**: Click explain buttons for detailed insights

### Mobile Usage

The interface is fully responsive and optimized for mobile devices:
- Collapsible sidebar navigation
- Touch-friendly controls
- Optimized layouts for small screens
- Dark mode support for better visibility

## 🎨 Customization Options

### Theme System
- **Light Mode**: Clean, professional appearance
- **Dark Mode**: Easy on the eyes for extended use
- **System**: Automatically matches your OS preference
- **Accessibility**: High contrast and keyboard navigation

### Detection Sensitivity
- **Lenient**: Fewer false positives, may miss some threats
- **Balanced**: Optimal mix of detection and accuracy (recommended)
- **Strict**: Catches more threats, may have more false positives

### Custom Rules
Add your own detection patterns:
```json
{
  "customKeywords": ["your company name", "internal project"],
  "suspiciousDomains": ["competitor-domain.com"]
}
```

## 🔒 Privacy & Security

### Data Protection
- **Client-Side Processing**: All analysis happens in your browser
- **No Data Transmission**: Email content never leaves your device
- **Local Storage Only**: Analysis history stored locally in browser
- **Private Mode**: Option to disable all data storage
- **Data Export**: Full control over your data

### Security Features
- **Input Sanitization**: DOMPurify integration for content cleaning
- **Digital Signatures**: Report authenticity verification
- **Encrypted Storage**: Sensitive data encrypted in localStorage
- **No Tracking**: No analytics or external API calls without consent

## 🧪 Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Future: Add test suite
npm test
```

## 📈 Performance

- **Analysis Time**: <1000ms for comprehensive analysis
- **ML Processing**: ~500ms for neural network inference
- **Export Generation**: <2000ms for PDF reports
- **Memory Usage**: Optimized for browser environments
- **Responsive Design**: Works on all device sizes

## 🎨 User Interface

### Dashboard Navigation
- **Sidebar Navigation**: Clean, responsive navigation between sections
- **Mobile Support**: Collapsible sidebar with overlay for mobile devices
- **Dark/Light Mode**: Theme support (ready for implementation)
- **Accessibility**: Keyboard navigation and ARIA labels

### Visualization Components
- **Confidence Gauge**: Circular SVG progress indicator with animations
- **Score Breakdown**: Visual representation of analysis contributions
- **Content Highlighter**: Interactive highlighting of suspicious phrases
- **Progress Indicators**: Real-time feedback during analysis

## 🤝 Contributing

This project demonstrates modern email security analysis techniques. Contributions welcome:

## 📁 Project Structure

```
phishingsense/
├── app/                    # Next.js 16 app router pages
│   └── page.tsx           # Main dashboard entry point
├── components/            # React components
│   ├── ui/               # shadcn/ui component library
│   │   ├── button.tsx     # Interactive buttons
│   │   ├── card.tsx       # Content containers
│   │   ├── input.tsx      # Form inputs
│   │   └── [more UI components]
│   ├── Dashboard.tsx     # Main navigation and layout
│   ├── AnalyzerForm.tsx  # Enhanced analysis interface
│   ├── ConfidenceGauge.tsx # Circular risk visualization
│   ├── EmailHighlighter.tsx # Content highlighting
│   ├── HistoryPanel.tsx   # Analysis history management
│   ├── LabelingInterface.tsx # AI training feedback
│   ├── TrainingInterface.tsx # Model retraining UI
│   ├── RuleCustomization.tsx # Custom rule management
│   ├── AnalyticsDashboard.tsx # Usage statistics
│   ├── DemoEmailGenerator.tsx # Sample email loading
│   ├── EmailComparison.tsx # Side-by-side comparison
│   ├── SafetyTipsCarousel.tsx # Educational content
│   ├── PhishingQuiz.tsx    # Interactive learning
│   ├── ReportCustomization.tsx # Advanced export options
│   ├── DatasetUpdateUtility.tsx # Update management
│   ├── PrivacyControls.tsx # Data and privacy settings
│   └── [more feature components]
├── lib/                  # Core business logic
│   ├── engines/          # Modular analysis engines
│   │   ├── ruleEngine.ts     # Rule-based detection
│   │   ├── mlEngine.ts       # ML/TensorFlow.js integration
│   │   ├── headerEngine.ts   # SPF/DKIM/DMARC validation
│   │   └── scoreCombiner.ts  # Weighted scoring orchestration
│   ├── data/
│   │   └── patterns.json     # Phishing patterns & templates
│   ├── offlineLearning.ts    # User labeling and training
│   ├── mlRetrainer.ts        # Local model retraining
│   ├── indexedDB.ts          # Local database management
│   ├── enhancedExport.ts     # Professional PDF/JSON reports
│   ├── headerAnalysis.ts     # Email header parsing utilities
│   ├── historyUtils.ts       # Local storage management
│   ├── themeProvider.tsx     # Dark mode and theming
│   └── utils.ts              # Utility functions
└── public/
    ├── demo-emails/          # Sample emails for testing
    └── workers/              # Web Workers for performance
```

## 🎯 Detection Capabilities

### Rule-Based Engine
- **150+ Phishing Keywords**: Comprehensive pattern matching across categories
- **URL Analysis**: Shortened links, suspicious domains, keyword detection
- **Domain Validation**: Spoofing detection, legitimate domain verification
- **Content Analysis**: HTML elements, attachment extensions, form detection
- **Custom Rules**: User-defined patterns and weights

### Header Authentication
- **SPF Compliance**: Sender Policy Framework validation
- **DKIM Verification**: Digital signature authentication
- **DMARC Policy**: Domain-based Message Authentication compliance
- **Routing Analysis**: Email server hop patterns and anomalies
- **Domain Consistency**: From/Return-Path validation

### Machine Learning
- **Neural Network**: Multi-layer perceptron with ReLU/sigmoid activation
- **Feature Engineering**: TF-IDF vectorization with 50+ features
- **Training Data**: User-labeled samples for personalized models
- **Confidence Scoring**: Probability-based risk assessment
- **Real-time Inference**: Client-side TensorFlow.js processing

### Advanced Features
- **Interactive Visualizations**: Radar charts and breakdown analysis
- **Educational Mode**: Explain buttons and learning content
- **Performance Optimization**: Web Workers and IndexedDB
- **Privacy Controls**: Private mode and data management
