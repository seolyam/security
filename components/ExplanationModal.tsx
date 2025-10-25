"use client"

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { HelpCircle, X, Lightbulb, Shield, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react';

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  finding: {
    id: string;
    category: string;
    severity: string;
    text: string;
  };
}

const explanations = {
  'urgent': {
    title: 'Urgency Tactics',
    icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    content: 'Phishing emails often create a false sense of urgency to pressure you into making quick decisions without careful consideration. Common tactics include phrases like "immediate action required," "account suspension imminent," or "limited time offer."',
    tips: [
      'Take a moment to verify the sender independently',
      'Contact the organization through official channels',
      'Never click links in urgent emails'
    ]
  },
  'verification': {
    title: 'Verification Requests',
    icon: <HelpCircle className="h-5 w-5 text-blue-500" />,
    content: 'Legitimate companies rarely ask you to verify personal information through email links. These requests are often phishing attempts designed to steal your login credentials or personal data.',
    tips: [
      'Verify requests through official websites or phone numbers',
      'Use bookmarks or type URLs manually',
      'Enable two-factor authentication'
    ]
  },
  'credentials': {
    title: 'Credential Theft',
    icon: <Shield className="h-5 w-5 text-red-500" />,
    content: 'Emails requesting passwords, usernames, or other login credentials are almost always malicious. No legitimate organization will ask for this information via email.',
    tips: [
      'Never share passwords via email',
      'Use password managers for secure storage',
      'Change passwords immediately if compromised'
    ]
  },
  'financial': {
    title: 'Financial Scams',
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    content: 'Phishing emails targeting financial information often impersonate banks, payment services, or government agencies to steal money or financial data.',
    tips: [
      'Verify through official banking apps or websites',
      'Monitor accounts regularly for suspicious activity',
      'Use credit monitoring services'
    ]
  },
  'delivery': {
    title: 'Fake Delivery Notices',
    icon: <HelpCircle className="h-5 w-5 text-green-500" />,
    content: 'Scammers often pose as delivery services (FedEx, UPS, DHL) to trick you into clicking malicious links or providing personal information.',
    tips: [
      'Track packages through official apps',
      'Never pay unexpected delivery fees via email links',
      'Verify delivery status through official websites'
    ]
  },
  'government': {
    title: 'Government Impersonation',
    icon: <Shield className="h-5 w-5 text-red-500" />,
    content: 'Scammers frequently impersonate government agencies (IRS, Social Security, etc.) to steal personal information or request payments.',
    tips: [
      'Government agencies communicate through official mail',
      'Verify tax information through official IRS website',
      'Never provide SSN or financial info via email'
    ]
  },
  'crypto': {
    title: 'Cryptocurrency Scams',
    icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
    content: 'Cryptocurrency-related phishing often promises unrealistic returns or claims wallet compromise to steal digital assets.',
    tips: [
      'Research investment opportunities thoroughly',
      'Use hardware wallets for cryptocurrency storage',
      'Be skeptical of unsolicited investment advice'
    ]
  },
  'default': {
    title: 'Phishing Detection',
    icon: <HelpCircle className="h-5 w-5 text-gray-500" />,
    content: 'This email contains suspicious patterns commonly used in phishing attempts. Always verify the legitimacy of unexpected requests.',
    tips: [
      'Verify sender identity through official channels',
      'Check for spelling and grammar errors',
      'Be cautious of unsolicited requests'
    ]
  }
};

export default function ExplanationModal({ isOpen, onClose, finding }: ExplanationModalProps) {
  if (!isOpen) return null;

  const category = finding.category || 'default';
  const explanation = explanations[category as keyof typeof explanations] || explanations.default;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {explanation.icon}
              <h2 className="text-lg font-semibold">{explanation.title}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-gray-700">
              {explanation.content}
            </div>

            <div className="border-t pt-4">
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Protection Tips
              </div>
              <div className="space-y-2">
                {explanation.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
