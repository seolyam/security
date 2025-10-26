"use client"

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Home,
  Search,
  History,
  Settings,
  Info,
  Menu,
  X,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Brain,
  BarChart3,
  BookOpen,
  GitCompare,
  FileText,
  RefreshCw,
  Eye,
  Palette,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../lib/authProvider';
import AnalyzerForm from './AnalyzerForm';
import CloudHistoryPanel from './CloudHistoryPanel';
import TrainingInterface from './TrainingInterface';
import RuleCustomization from './RuleCustomization';
import CloudAnalyticsDashboard from './CloudAnalyticsDashboard';
import DemoEmailGenerator from './DemoEmailGenerator';
import ReportCustomization from './ReportCustomization';
import DatasetUpdateUtility from './DatasetUpdateUtility';
import PrivacyControls from './PrivacyControls';
import SafetyTipsCarousel from './SafetyTipsCarousel';
import PhishingQuiz from './PhishingQuiz';
import EmailComparison from './EmailComparison';
import LabelingInterface from './LabelingInterface';
import ExplanationModal from './ExplanationModal';
import RiskRadarChart from './RiskRadarChart';
import EnhancedEmailHighlighter from './EnhancedEmailHighlighter';
import ThemeToggle from './ThemeToggle';

type TabType = 'analyzer' | 'history' | 'settings' | 'about' | 'training' | 'analytics' | 'demo' | 'reports' | 'updates' | 'privacy' | 'education' | 'comparison';

interface DashboardProps {
  initialTab?: TabType;
}

export default function Dashboard({ initialTab = 'analyzer' }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const tabs = [
    { id: 'analyzer', label: 'Email Analyzer', icon: Search },
    { id: 'demo', label: 'Demo Emails', icon: FileText },
    { id: 'comparison', label: 'Email Comparison', icon: GitCompare },
    { id: 'education', label: 'Learn & Quiz', icon: BookOpen },
    { id: 'history', label: 'Analysis History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'training', label: 'AI Training', icon: Brain },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'updates', label: 'Updates', icon: RefreshCw },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About', icon: Info }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'analyzer':
        return <AnalyzerForm />;
      case 'demo':
        return <DemoTab />;
      case 'comparison':
        return <ComparisonTab />;
      case 'education':
        return <EducationTab />;
      case 'history':
        return <HistoryTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'training':
        return <TrainingTab />;
      case 'reports':
        return <ReportsTab />;
      case 'updates':
        return <UpdatesTab />;
      case 'privacy':
        return <PrivacyTab />;
      case 'settings':
        return <SettingsTab />;
      case 'about':
        return <AboutTab />;
      default:
        return <AnalyzerForm />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out dark:bg-gray-800 dark:border-gray-700
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold dark:text-white">PhishingSense</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">v3.0</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className="w-full justify-start gap-2 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => {
                      setActiveTab(tab.id as TabType);
                      setSidebarOpen(false);
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t dark:border-gray-700">
            {/* User Profile Section */}
            <div className="mb-4">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex-shrink-0">
                  <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>

            <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
              Cloud-Enabled Email Security Analysis
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between dark:bg-gray-800 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="font-semibold dark:text-white">PhishingSense</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function DemoTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Demo Email Generator</h1>
        <p className="text-gray-600 dark:text-gray-400">Load sample emails for testing and learning</p>
      </div>
      <DemoEmailGenerator />
    </div>
  );
}

function ComparisonTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Email Comparison</h1>
        <p className="text-gray-600 dark:text-gray-400">Compare phishing and legitimate emails side by side</p>
      </div>
      <EmailComparison />
    </div>
  );
}

function EducationTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Learn & Quiz</h1>
        <p className="text-gray-600 dark:text-gray-400">Educational content and phishing awareness training</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SafetyTipsCarousel />
        <PhishingQuiz />
      </div>
    </div>
  );
}

function AnalyticsTab() {
  return <CloudAnalyticsDashboard />;
}

function TrainingTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">AI Training</h1>
        <p className="text-gray-600 dark:text-gray-400">Train personalized models with your labeled data</p>
      </div>
      <TrainingInterface />
    </div>
  );
}

function ReportsTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Report Customization</h1>
        <p className="text-gray-600 dark:text-gray-400">Customize and generate professional reports</p>
      </div>
      <ReportCustomization />
    </div>
  );
}

function UpdatesTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Dataset Updates</h1>
        <p className="text-gray-600 dark:text-gray-400">Check for and install latest detection patterns</p>
      </div>
      <DatasetUpdateUtility />
    </div>
  );
}

function HistoryTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Analysis History</h1>
        <p className="text-gray-600 dark:text-gray-400">View and manage your email analysis history</p>
      </div>
      <CloudHistoryPanel />
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure PhishingSense preferences and advanced options</p>
      </div>
      <RuleCustomization />
    </div>
  );
}

function AboutTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">About PhishingSense v2.0</h1>
        <p className="text-gray-600 dark:text-gray-400">Advanced email security analysis platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Version 2.0 Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Hybrid Detection Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Advanced Header Validation</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Machine Learning Integration</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Analytics Dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Educational Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-indigo-500" />
                <span className="text-sm">Dark Mode Support</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technology Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Next.js 16 + TypeScript</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">TensorFlow.js (Client ML)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">shadcn/ui Components</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Recharts for Visualizations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm">jsPDF Report Generation</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600">1</span>
              </div>
              <div>
                <h3 className="font-medium">Navigate to Email Analyzer</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Use the sidebar to access the main analysis interface</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600">2</span>
              </div>
              <div>
                <h3 className="font-medium">Enter Email Details</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Paste the sender, subject, and email body content</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600">3</span>
              </div>
              <div>
                <h3 className="font-medium">Enable Advanced Features</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add headers and enable ML analysis for comprehensive results</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600">4</span>
              </div>
              <div>
                <h3 className="font-medium">Explore All Features</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Try the demo emails, educational content, analytics, and more</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PrivacyTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Privacy & Security</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your privacy settings and data</p>
      </div>
      <PrivacyControls />
    </div>
  );
}
