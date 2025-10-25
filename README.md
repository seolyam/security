# Phishsense

Phishsense is a lightweight phishing email detection tool built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui components.

## Features

- **Email Analysis**: Paste email content (from, subject, body) and get a comprehensive risk analysis
- **Rule-Based Detection**: Uses advanced heuristics to identify suspicious patterns including:
  - Phishing keywords and urgent language
  - Suspicious URLs and domains
  - Sender domain analysis
  - HTML indicators and attachment checks
- **Risk Scoring**: Clear 0-100 risk score with color-coded visual indicators
- **Detailed Findings**: Each suspicious element is highlighted with severity levels (Low, Medium, High)
- **Real-time Analysis**: Instant feedback as you type or paste email content
- **Demo Data**: Pre-loaded sample emails for testing (phishing, legitimate, and suspicious)

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Detection Engine**: Custom rule-based analysis in TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Analyze Email**: Enter the email sender, subject, and body content in the form
2. **View Results**: The analysis appears instantly in the right panel showing:
   - Overall risk score (0-100%)
   - Risk level (Low/Medium/High)
   - Detailed findings with severity indicators
   - Visual progress bar

3. **Test with Demo Data**: Use the sample emails in `/public/demo-emails/` to test different scenarios

## Demo Emails

The application includes sample emails for testing:

- **Phishing Example**: Fake PayPal security alert with suspicious links
- **Legitimate Example**: Real bank statement notification
- **Suspicious Example**: Apple security alert (could be legitimate)

## Detection Rules

The system analyzes emails for:

- **Keywords**: Urgent language, verification requests, account issues
- **URLs**: Shortened links, suspicious domains, mismatched anchor text
- **Sender**: Domain analysis, malformed addresses
- **Content**: HTML elements, attachment indicators, form elements

## Project Structure

```
/
├── app/                    # Next.js app router pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── AnalyzerForm.tsx  # Main analysis interface
├── lib/                  # Core logic
│   ├── ruleEngine.ts     # Phishing detection rules
│   └── utils.ts          # Utility functions
├── public/               # Static assets
│   └── demo-emails/      # Sample emails for testing
└── plan.md               # Project documentation
```

## Contributing

This is an educational project demonstrating phishing detection techniques. The rule engine can be extended with:

- Machine learning models (TensorFlow.js integration ready)
- Advanced natural language processing
- Email header analysis (SPF, DKIM, DMARC)
- Real-time URL reputation checking

## Ethics & Safety

⚠️ **Important Disclaimer**: This tool is for educational purposes only and should not be used as a replacement for professional email security systems. Always verify suspicious emails through official channels and never click on links or provide credentials in response to unsolicited requests.

## License

This project is for educational use. Please use responsibly and in accordance with applicable laws and regulations.
