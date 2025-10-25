# PhishingSense v3.0

**Cloud-Enabled AI-Powered Email Security Analysis Platform**

PhishingSense is a comprehensive phishing email detection system that combines rule-based heuristics, machine learning, and advanced email authentication analysis to provide enterprise-grade email security insights. Now with **Supabase integration** for multi-user support, cloud synchronization, and real-time analytics.

![Version 3.0](https://img.shields.io/badge/version-3.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-ML-orange)
![Supabase](https://img.shields.io/badge/Supabase-Cloud-green)

## ✨ What's New in v3.0

### ☁️ **Supabase Integration**
- **User Authentication**: Secure signup/login with email verification
- **Cloud Storage**: All scans, settings, and history stored in PostgreSQL
- **Multi-Device Sync**: Access your data from any device
- **Real-time Analytics**: Live dashboard with cloud-powered insights
- **Dynamic Rules**: Update detection patterns from the database

### 🔐 **Enhanced Security**
- **Row Level Security**: Database-level access control
- **Secure API**: All data operations through authenticated endpoints
- **Privacy Controls**: Granular privacy settings and data management
- **Session Management**: Persistent authentication across browser sessions
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
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Build System**: Next.js with TypeScript

## ⚙️ Supabase Setup

### 1. Environment Configuration

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://saxmpvvgjkidotpqsaht.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNheG1wdnZnamtpZG90cHFzYWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNjQ2NTAsImV4cCI6MjA3Njk0MDY1MH0.Z05qOMiT_OnNLD3WwNxd-gTEwg1LRSwHDoYQOpq7vEY
```

### 2. Database Setup

1. **Go to your Supabase project**: https://supabase.com/dashboard/project/saxmpvvgjkidotpqsaht
2. **Navigate to SQL Editor**
3. **Copy the entire contents** of `supabase-schema.sql`
4. **Run the SQL script** to create all tables and security policies

**If you get "relation already exists" errors:**
- The schema has been partially applied before
- Try running the schema again (it uses `CREATE TABLE IF NOT EXISTS`)
- Or use the reset script: `./reset-database.sh`

**If you encounter database errors, check the comprehensive error resolution guide:**
📖 **[Error Resolution Guide](documentation/error-resolution.md)** - Detailed troubleshooting for all database issues

### Enhanced Error Diagnostics

The application now includes advanced error handling and debugging tools:

- 🔍 **Browser Console Debug Tool**: Run `await AuthService.debugConnection()` in browser console
- 📊 **Enhanced Logging**: Detailed error codes and actionable solutions
- 🛠️ **Connection Testing**: Automatic database connectivity validation
- 🎯 **Specific Guidance**: Tailored solutions for each error type

### 3. Quick Setup Script

Alternatively, run the setup script:

```bash
chmod +x setup-supabase.sh
./setup-supabase.sh
```

This will verify your configuration and provide step-by-step instructions.

### Why pnpm?

This project recommends **pnpm** as the package manager for several reasons:

- **🚀 Faster Installation**: pnpm is significantly faster than npm and yarn
- **💾 Space Efficient**: Uses a content-addressable filesystem, saving disk space
- **🔒 Strict**: Prevents security issues by avoiding phantom dependencies
- **⚡ Parallel**: Installs packages in parallel for better performance
- **🔄 Monorepo Ready**: Excellent support for monorepos (if you expand the project)

You can still use npm or yarn if you prefer - all package managers are supported!

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm/yarn

### Installation

1. **Clone and Install**:
```bash
git clone <repository-url>
cd phishingsense

# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

2. **Development**:
```bash
# Using pnpm (recommended)
pnpm dev

# Or using npm
npm run dev

# Visit http://localhost:3000
```

3. **Production Build**:
```bash
# Using pnpm (recommended)
pnpm build
pnpm start

# Or using npm
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
- **Secure Cloud Storage**: Authenticated data storage with Row Level Security (RLS)
- **Privacy Controls**: Choose between local-only or cloud-synced data
- **Data Ownership**: Full control over your stored analyses and settings
- **Private Mode**: Option to disable all data storage

### Security Features
- **Input Sanitization**: DOMPurify integration for content cleaning
- **Digital Signatures**: Report authenticity verification
- **Encrypted Storage**: Sensitive data encrypted in localStorage
- **Row Level Security**: Database-level access control in Supabase
- **No Tracking**: No analytics or external API calls without consent

### Authentication & Access
- **Secure Login**: Email/password and magic link authentication
- **Session Management**: Persistent authenticated sessions
- **Multi-Device Sync**: Access your data from any device
- **Account Security**: Password reset and account management

## 🧪 Testing

```bash
# Run development server
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Future: Add test suite
pnpm test
```

### Alternative with npm:

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
│   ├── AuthForm.tsx      # Authentication interface
│   ├── ProtectedRoute.tsx # Route protection wrapper
│   ├── Dashboard.tsx     # Main navigation and layout
│   ├── AnalyzerForm.tsx  # Enhanced analysis interface
│   ├── CloudHistoryPanel.tsx # Cloud-based history management
│   ├── CloudAnalyticsDashboard.tsx # Cloud-powered analytics
│   ├── ConfidenceGauge.tsx # Circular risk visualization
│   ├── EmailHighlighter.tsx # Content highlighting
│   ├── LabelingInterface.tsx # AI training feedback
│   ├── TrainingInterface.tsx # Model retraining UI
│   ├── RuleCustomization.tsx # Custom rule management
│   ├── DemoEmailGenerator.tsx # Sample email loading
│   ├── EmailComparison.tsx # Side-by-side comparison
│   ├── SafetyTipsCarousel.tsx # Educational content
│   ├── PhishingQuiz.tsx    # Interactive learning
│   ├── ReportCustomization.tsx # Advanced export options
│   ├── DatasetUpdateUtility.tsx # Update management
│   ├── PrivacyControls.tsx # Data and privacy settings
│   └── [more feature components]
├── lib/                  # Core business logic
│   ├── services/         # Cloud service integrations
│   │   ├── authService.ts    # Supabase authentication
│   │   ├── scanService.ts    # Email scan cloud storage
│   │   ├── settingsService.ts # User settings sync
│   │   ├── patternService.ts # Dynamic rule updates
│   │   └── reportService.ts  # Report management
│   ├── engines/          # Modular analysis engines
│   │   ├── ruleEngine.ts     # Rule-based detection
│   │   ├── mlEngine.ts       # ML/TensorFlow.js integration
│   │   ├── headerEngine.ts   # SPF/DKIM/DMARC validation
│   │   └── scoreCombiner.ts  # Weighted scoring orchestration
│   ├── supabase.ts       # Supabase client configuration
│   ├── authProvider.tsx   # Authentication context provider
│   ├── themeProvider.tsx  # Theme management (cloud-synced)
│   ├── data/
│   │   └── patterns.json     # Phishing patterns & templates
│   ├── offlineLearning.ts    # User labeling and training
│   ├── mlRetrainer.ts        # Local model retraining
│   ├── indexedDB.ts          # Local database management
│   ├── enhancedExport.ts     # Professional PDF/JSON reports
│   ├── headerAnalysis.ts     # Email header parsing utilities
│   ├── historyUtils.ts       # Local storage management
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
