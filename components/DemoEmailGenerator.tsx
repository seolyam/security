"use client"

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Mail, Shuffle, Edit, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';

interface DemoEmail {
  id: string;
  title: string;
  category: 'phishing' | 'legitimate' | 'suspicious';
  from: string;
  subject: string;
  body: string;
  riskScore: number;
  explanation: string;
}

const demoEmails: DemoEmail[] = [
  {
    id: 'paypal-phishing-1',
    title: 'PayPal Account Suspension',
    category: 'phishing',
    from: 'security@paypal.com',
    subject: 'Your PayPal Account Has Been Limited - Action Required',
    body: 'Dear PayPal User, We have detected unusual activity on your account. To prevent unauthorized access, your account has been temporarily limited. Please verify your identity immediately by clicking the link below: [Verify Account Now] If you do not verify within 24 hours, your account will be permanently suspended. This is an automated security measure to protect your account. Thank you, PayPal Security Team',
    riskScore: 85,
    explanation: 'This is a classic phishing attempt impersonating PayPal with urgency tactics and credential requests.'
  },
  {
    id: 'paypal-legitimate-1',
    title: 'PayPal Transaction Confirmation',
    category: 'legitimate',
    from: 'service@paypal.com',
    subject: 'Your Recent PayPal Transaction',
    body: 'Hello, This is a confirmation of your recent payment of $25.00 to Example Store on October 25, 2024. Transaction ID: PP-1234567890 If you did not authorize this transaction, please contact us through the Resolution Center in your PayPal account. You can access your account at paypal.com to view more details. Thank you for using PayPal. Best regards, PayPal Customer Service',
    riskScore: 15,
    explanation: 'This is a legitimate PayPal transaction confirmation with no suspicious elements.'
  },
  {
    id: 'bank-phishing-1',
    title: 'Bank Account Verification',
    category: 'phishing',
    from: 'alerts@bankofamerica.com',
    subject: 'Security Alert: Unusual Login Attempt',
    body: 'Dear Valued Customer, We have detected an unusual login attempt on your Bank of America account from an unrecognized device. For your security, we have temporarily locked your account. Please click the link below to verify your identity and restore access: [Secure Login] This is an automated security measure. If you did not attempt to log in, your account may be at risk. Bank of America Security Team',
    riskScore: 90,
    explanation: 'This phishing email impersonates Bank of America and requests account verification through a suspicious link.'
  },
  {
    id: 'bank-legitimate-1',
    title: 'Bank Statement Available',
    category: 'legitimate',
    from: 'no-reply@bankofamerica.com',
    subject: 'Your Monthly Account Statement is Ready',
    body: 'Dear Customer, Your monthly account statement for checking account ending in ****1234 is now available online. You can view or download your statement by logging into your Bank of America account at bankofamerica.com. Statement period: September 25, 2024 - October 25, 2024 If you have any questions about your account, please contact us at 1-800-432-1000. Thank you for banking with us. Sincerely, Bank of America',
    riskScore: 10,
    explanation: 'This is a legitimate bank statement notification directing users to the official website.'
  },
  {
    id: 'crypto-phishing-1',
    title: 'Bitcoin Investment Opportunity',
    category: 'phishing',
    from: 'investor@crypto-wallet.com',
    subject: 'URGENT: Your Bitcoin Investment Has Grown 300%!',
    body: 'Congratulations! Your Bitcoin investment has increased by 300% in just one week! This is your chance to withdraw your profits before the market crashes. Click here to access your wallet and withdraw funds immediately: [Claim Your Profits] Don\'t miss this opportunity! The market is volatile and you need to act NOW! Crypto Investment Team',
    riskScore: 95,
    explanation: 'This is a cryptocurrency scam promising unrealistic returns and creating urgency to act quickly.'
  },
  {
    id: 'delivery-phishing-1',
    title: 'Package Delivery Failed',
    category: 'phishing',
    from: 'delivery@fedex.com',
    subject: 'Package Delivery Failed - Update Required',
    body: 'Dear Customer, We were unable to deliver your package due to an incorrect delivery address. Please update your delivery information by clicking the link below: [Update Delivery Address] Your package will be returned to sender if you do not update within 24 hours. This requires a small processing fee of $2.99. FedEx Delivery Services',
    riskScore: 70,
    explanation: 'This fake delivery notification requests payment and address verification through a suspicious link.'
  },
  {
    id: 'apple-phishing-1',
    title: 'Apple ID Security Alert',
    category: 'phishing',
    from: 'security@apple.com',
    subject: 'Apple ID Locked: Immediate Action Required',
    body: 'Your Apple ID has been locked due to suspicious activity. Multiple login attempts have been detected from an unknown location. To restore access to your account, please verify your identity: [Verify Apple ID] If you do not verify within 24 hours, your Apple ID will be permanently disabled. Apple Security Team',
    riskScore: 80,
    explanation: 'This phishing email impersonates Apple and threatens account suspension to steal credentials.'
  },
  {
    id: 'apple-legitimate-1',
    title: 'Apple Purchase Receipt',
    category: 'legitimate',
    from: 'no-reply@apple.com',
    subject: 'Your Apple Receipt',
    body: 'Thank you for your recent purchase! Receipt for: iPhone 15 Pro Max - $1,199.00 Order Number: APP-9876543210 Purchase Date: October 25, 2024 You can view your receipt and manage your purchases by visiting apple.com. If you have any questions, please contact Apple Support. Apple Inc.',
    riskScore: 5,
    explanation: 'This is a legitimate Apple purchase receipt with proper formatting and no suspicious requests.'
  }
];

interface DemoEmailGeneratorProps {
  onLoadEmail?: (email: { from: string; subject: string; body: string }) => void;
  className?: string;
}

export default function DemoEmailGenerator({ onLoadEmail, className = '' }: DemoEmailGeneratorProps) {
  const [selectedEmail, setSelectedEmail] = useState<DemoEmail | null>(null);
  const [modifiedEmail, setModifiedEmail] = useState({
    from: '',
    subject: '',
    body: ''
  });
  const [isModified, setIsModified] = useState(false);

  const handleEmailSelect = (emailId: string) => {
    const email = demoEmails.find(e => e.id === emailId);
    if (email) {
      setSelectedEmail(email);
      setModifiedEmail({
        from: email.from,
        subject: email.subject,
        body: email.body
      });
      setIsModified(false);
    }
  };

  const handleModifyField = (field: 'from' | 'subject' | 'body', value: string) => {
    setModifiedEmail(prev => ({ ...prev, [field]: value }));
    setIsModified(true);
  };

  const handleLoadEmail = () => {
    if (onLoadEmail) {
      onLoadEmail(modifiedEmail);
    }
  };

  const handleReset = () => {
    if (selectedEmail) {
      setModifiedEmail({
        from: selectedEmail.from,
        subject: selectedEmail.subject,
        body: selectedEmail.body
      });
      setIsModified(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'phishing': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'legitimate': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'suspicious': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getCategoryBadge = (category: string, score: number) => {
    const variant = category === 'phishing' ? 'destructive' : category === 'legitimate' ? 'default' : 'secondary';
    return <Badge variant={variant}>{category} ({score}%)</Badge>;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Demo Email Generator
          </CardTitle>
          <CardDescription>
            Load sample emails for testing and learning. Modify them to see how small changes affect the analysis.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Email Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Sample Email</CardTitle>
          <CardDescription>
            Choose from various phishing and legitimate email examples
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <select
              onChange={(e) => handleEmailSelect(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm border border-gray-200 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue=""
            >
              <option value="" disabled>Choose a sample email to load</option>
              {demoEmails.map(email => (
                <option key={email.id} value={email.id}>
                  {email.title}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Selected Email Details */}
      {selectedEmail && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getCategoryIcon(selectedEmail.category)}
                <CardTitle className="text-lg">{selectedEmail.title}</CardTitle>
                {getCategoryBadge(selectedEmail.category, selectedEmail.riskScore)}
              </div>
              <Button variant="outline" size="sm" onClick={handleReset} disabled={!isModified}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
            <CardDescription>
              {selectedEmail.explanation}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Email Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from">From</Label>
                  <Input
                    id="from"
                    value={modifiedEmail.from}
                    onChange={(e) => handleModifyField('from', e.target.value)}
                    className={isModified ? 'border-blue-300' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={modifiedEmail.subject}
                    onChange={(e) => handleModifyField('subject', e.target.value)}
                    className={isModified ? 'border-blue-300' : ''}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="body">Email Body</Label>
                <Textarea
                  id="body"
                  rows={8}
                  value={modifiedEmail.body}
                  onChange={(e) => handleModifyField('body', e.target.value)}
                  className={isModified ? 'border-blue-300' : ''}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={handleLoadEmail} className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Load into Analyzer
                </Button>

                {isModified && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Edit className="h-3 w-3" />
                    Modified
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Load Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Load</CardTitle>
          <CardDescription>
            Load common email types directly into the analyzer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => handleEmailSelect('paypal-phishing-1')}
              className="flex items-center gap-2 justify-start"
            >
              <AlertTriangle className="h-4 w-4 text-red-500" />
              PayPal Phishing
            </Button>

            <Button
              variant="outline"
              onClick={() => handleEmailSelect('bank-phishing-1')}
              className="flex items-center gap-2 justify-start"
            >
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Bank Phishing
            </Button>

            <Button
              variant="outline"
              onClick={() => handleEmailSelect('crypto-phishing-1')}
              className="flex items-center gap-2 justify-start"
            >
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Crypto Scam
            </Button>

            <Button
              variant="outline"
              onClick={() => handleEmailSelect('paypal-legitimate-1')}
              className="flex items-center gap-2 justify-start"
            >
              <CheckCircle className="h-4 w-4 text-green-500" />
              PayPal Legit
            </Button>

            <Button
              variant="outline"
              onClick={() => handleEmailSelect('bank-legitimate-1')}
              className="flex items-center gap-2 justify-start"
            >
              <CheckCircle className="h-4 w-4 text-green-500" />
              Bank Statement
            </Button>

            <Button
              variant="outline"
              onClick={() => handleEmailSelect('apple-legitimate-1')}
              className="flex items-center gap-2 justify-start"
            >
              <CheckCircle className="h-4 w-4 text-green-500" />
              Apple Receipt
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
