"use client"

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Eye, GitCompare, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import EnhancedEmailHighlighter from './EnhancedEmailHighlighter';

interface EmailComparison {
  id: string;
  title: string;
  from: string;
  subject: string;
  body: string;
  isPhishing: boolean;
  riskScore: number;
  findings: any[];
}

const sampleEmails: EmailComparison[] = [
  {
    id: 'paypal-phishing',
    title: 'PayPal Phishing',
    from: 'security@paypal.com',
    subject: 'Your PayPal Account Has Been Limited',
    body: 'Dear Customer, We have detected unusual activity on your PayPal account. To prevent unauthorized access, your account has been temporarily limited. Please verify your identity immediately by clicking the link below: [Verify Account Now] If you do not verify within 24 hours, your account will be permanently suspended. Thank you, PayPal Security Team',
    isPhishing: true,
    riskScore: 85,
    findings: [
      { id: 'urgent', category: 'urgency', severity: 'high', text: 'immediately' },
      { id: 'verification', category: 'verification', severity: 'high', text: 'verify your identity' },
      { id: 'threat', category: 'threat', severity: 'high', text: 'permanently suspended' }
    ]
  },
  {
    id: 'paypal-legitimate',
    title: 'PayPal Legitimate',
    from: 'service@paypal.com',
    subject: 'Your Recent PayPal Transaction',
    body: 'Hello, This is a confirmation of your recent payment of $25.00 to Example Store on October 25, 2024. Transaction ID: PP-1234567890 If you did not authorize this transaction, please contact us through the Resolution Center in your PayPal account. You can access your account at paypal.com to view more details. Thank you for using PayPal. Best regards, PayPal Customer Service',
    isPhishing: false,
    riskScore: 15,
    findings: []
  },
  {
    id: 'bank-phishing',
    title: 'Bank Phishing',
    from: 'alerts@bankofamerica.com',
    subject: 'Security Alert: Unusual Login Attempt',
    body: 'Dear Valued Customer, We have detected an unusual login attempt on your Bank of America account from an unrecognized device. For your security, we have temporarily locked your account. Please click the link below to verify your identity and restore access: [Secure Login] This is an automated security measure. If you did not attempt to log in, your account may be at risk. Bank of America Security Team',
    isPhishing: true,
    riskScore: 90,
    findings: [
      { id: 'credentials', category: 'credentials', severity: 'high', text: 'verify your identity' },
      { id: 'threat', category: 'threat', severity: 'high', text: 'account may be at risk' },
      { id: 'urgent', category: 'urgency', severity: 'medium', text: 'temporarily locked' }
    ]
  },
  {
    id: 'bank-legitimate',
    title: 'Bank Legitimate',
    from: 'no-reply@bankofamerica.com',
    subject: 'Your Monthly Account Statement is Ready',
    body: 'Dear Customer, Your monthly account statement for checking account ending in ****1234 is now available online. You can view or download your statement by logging into your Bank of America account at bankofamerica.com. Statement period: September 25, 2024 - October 25, 2024 If you have any questions about your account, please contact us at 1-800-432-1000. Thank you for banking with us. Sincerely, Bank of America',
    isPhishing: false,
    riskScore: 10,
    findings: []
  }
];

interface EmailComparisonProps {
  className?: string;
}

export default function EmailComparison({ className = '' }: EmailComparisonProps) {
  const [leftEmail, setLeftEmail] = useState<EmailComparison | null>(sampleEmails[0]);
  const [rightEmail, setRightEmail] = useState<EmailComparison | null>(sampleEmails[1]);
  const [showComparison, setShowComparison] = useState(false);

  const handleCompare = () => {
    if (leftEmail && rightEmail) {
      setShowComparison(true);
    }
  };

  const handleReset = () => {
    setLeftEmail(sampleEmails[0]);
    setRightEmail(sampleEmails[1]);
    setShowComparison(false);
  };

  const getRiskBadge = (score: number, isPhishing: boolean) => {
    const variant = score < 30 ? 'default' : score < 70 ? 'secondary' : 'destructive';
    const label = isPhishing ? 'Phishing' : 'Legitimate';
    return <Badge variant={variant}>{label} ({score}%)</Badge>;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Selection Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Compare Emails
          </CardTitle>
          <CardDescription>
            Select two emails to compare side by side and learn the differences between phishing and legitimate messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Email Selection */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Email 1 (Left)</div>
              <div className="relative">
                <select
                  value={leftEmail?.id || ''}
                  onChange={(e) => {
                    const email = sampleEmails.find(em => em.id === e.target.value);
                    setLeftEmail(email || null);
                  }}
                  className="w-full h-10 px-3 py-2 text-sm border border-gray-200 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select first email</option>
                  {sampleEmails.map(email => (
                    <option key={email.id} value={email.id}>
                      {email.title}
                    </option>
                  ))}
                </select>
              </div>

              {leftEmail && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium">{leftEmail.title}</div>
                  <div className="text-xs text-gray-600 mb-2">
                    From: {leftEmail.from}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    Subject: {leftEmail.subject}
                  </div>
                  {getRiskBadge(leftEmail.riskScore, leftEmail.isPhishing)}
                </div>
              )}
            </div>

            {/* Right Email Selection */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Email 2 (Right)</div>
              <div className="relative">
                <select
                  value={rightEmail?.id || ''}
                  onChange={(e) => {
                    const email = sampleEmails.find(em => em.id === e.target.value);
                    setRightEmail(email || null);
                  }}
                  className="w-full h-10 px-3 py-2 text-sm border border-gray-200 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select second email</option>
                  {sampleEmails.map(email => (
                    <option key={email.id} value={email.id}>
                      {email.title}
                    </option>
                  ))}
                </select>
              </div>

              {rightEmail && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium">{rightEmail.title}</div>
                  <div className="text-xs text-gray-600 mb-2">
                    From: {rightEmail.from}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    Subject: {rightEmail.subject}
                  </div>
                  {getRiskBadge(rightEmail.riskScore, rightEmail.isPhishing)}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button onClick={handleCompare} disabled={!leftEmail || !rightEmail}>
              <GitCompare className="h-4 w-4 mr-2" />
              Compare Emails
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparison View */}
      {showComparison && leftEmail && rightEmail && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Email */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-5 w-5 ${leftEmail.isPhishing ? 'text-red-500' : 'text-green-500'}`} />
                  <CardTitle className="text-lg">{leftEmail.title}</CardTitle>
                </div>
                {getRiskBadge(leftEmail.riskScore, leftEmail.isPhishing)}
              </div>
              <CardDescription>
                <div className="text-xs space-y-1">
                  <div>From: {leftEmail.from}</div>
                  <div>Subject: {leftEmail.subject}</div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedEmailHighlighter
                content={leftEmail.body}
                findings={leftEmail.findings}
                showHoverEffects={true}
              />
            </CardContent>
          </Card>

          {/* Right Email */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-5 w-5 ${rightEmail.isPhishing ? 'text-red-500' : 'text-green-500'}`} />
                  <CardTitle className="text-lg">{rightEmail.title}</CardTitle>
                </div>
                {getRiskBadge(rightEmail.riskScore, rightEmail.isPhishing)}
              </div>
              <CardDescription>
                <div className="text-xs space-y-1">
                  <div>From: {rightEmail.from}</div>
                  <div>Subject: {rightEmail.subject}</div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedEmailHighlighter
                content={rightEmail.body}
                findings={rightEmail.findings}
                showHoverEffects={true}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Educational Insights */}
      {showComparison && leftEmail && rightEmail && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Key Differences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-sm font-medium text-red-600">⚠️ Phishing Indicators (Left)</div>
                {leftEmail.isPhishing ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span>Urgency and threats</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span>Requests for verification</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span>Suspicious sender domain</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No significant phishing indicators</div>
                )}
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-green-600">✅ Legitimate Indicators (Right)</div>
                {rightEmail.isPhishing ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span>Contains phishing patterns</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Official sender domain</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Factual, non-urgent content</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>No requests for sensitive info</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
