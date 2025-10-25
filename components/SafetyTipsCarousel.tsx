"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ChevronLeft, ChevronRight, Lightbulb, Shield, AlertTriangle } from 'lucide-react';

interface SafetyTip {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'email' | 'password' | 'financial' | 'technical';
  severity: 'low' | 'medium' | 'high';
}

const safetyTips: SafetyTip[] = [
  {
    id: 'verify-sender',
    title: 'Verify Sender Identity',
    content: 'Always check the full email address of the sender. Hover over the "From" field to see the actual email address, not just the display name.',
    category: 'email',
    severity: 'high'
  },
  {
    id: 'no-passwords',
    title: 'Never Share Passwords',
    content: 'Legitimate organizations will never ask for your passwords, PINs, or security codes via email. If in doubt, contact them directly.',
    category: 'password',
    severity: 'high'
  },
  {
    id: 'check-urls',
    title: 'Inspect Links Carefully',
    content: 'Hover over links before clicking to see the real destination URL. Look for HTTPS and correct spelling of domain names.',
    category: 'technical',
    severity: 'high'
  },
  {
    id: 'urgent-scams',
    title: 'Urgency is a Red Flag',
    content: 'Emails creating urgency ("Act now!" or "Account will be suspended!") are often phishing attempts designed to bypass your caution.',
    category: 'email',
    severity: 'medium'
  },
  {
    id: 'two-factor',
    title: 'Enable Two-Factor Authentication',
    content: 'Use 2FA on all important accounts. Even if someone gets your password, they\'ll need a second verification method.',
    category: 'password',
    severity: 'medium'
  },
  {
    id: 'software-updates',
    title: 'Keep Software Updated',
    content: 'Regularly update your operating system, browser, and security software to protect against known vulnerabilities.',
    category: 'technical',
    severity: 'medium'
  },
  {
    id: 'bank-verification',
    title: 'Bank Security Practices',
    content: 'Banks never request sensitive information via email. Always use official apps or websites for banking activities.',
    category: 'financial',
    severity: 'high'
  },
  {
    id: 'report-phishing',
    title: 'Report Suspicious Emails',
    content: 'Forward suspicious emails to your IT department or services like abuse@domain.com to help protect others.',
    category: 'general',
    severity: 'low'
  },
  {
    id: 'password-manager',
    title: 'Use Password Managers',
    content: 'Password managers generate and store strong, unique passwords for each account, making you less vulnerable to breaches.',
    category: 'password',
    severity: 'medium'
  },
  {
    id: 'public-wifi',
    title: 'Be Cautious on Public WiFi',
    content: 'Avoid entering sensitive information when connected to public WiFi networks, which may not be secure.',
    category: 'technical',
    severity: 'medium'
  }
];

interface SafetyTipsCarouselProps {
  className?: string;
  autoPlay?: boolean;
  interval?: number;
}

export default function SafetyTipsCarousel({
  className = '',
  autoPlay = true,
  interval = 8000
}: SafetyTipsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % safetyTips.length);
    }, interval);

    return () => clearInterval(timer);
  }, [isAutoPlaying, interval]);

  const nextTip = () => {
    setCurrentIndex(prev => (prev + 1) % safetyTips.length);
  };

  const prevTip = () => {
    setCurrentIndex(prev => (prev - 1 + safetyTips.length) % safetyTips.length);
  };

  const currentTip = safetyTips[currentIndex];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'email': return <Lightbulb className="h-4 w-4" />;
      case 'password': return <Shield className="h-4 w-4" />;
      case 'financial': return <AlertTriangle className="h-4 w-4" />;
      case 'technical': return <Shield className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">Did You Know?</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevTip}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-500 px-2">
              {currentIndex + 1} / {safetyTips.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextTip}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Cybersecurity tips to help you stay safe online
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Tip */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getCategoryIcon(currentTip.category)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium">{currentTip.title}</h3>
                  <Badge className={`text-xs ${getSeverityColor(currentTip.severity)}`}>
                    {currentTip.severity} priority
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {currentTip.content}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-1">
            {safetyTips.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                aria-label={`Go to tip ${index + 1}`}
              />
            ))}
          </div>

          {/* Auto-play Toggle */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Auto-play tips</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="text-xs"
            >
              {isAutoPlaying ? 'Pause' : 'Play'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
