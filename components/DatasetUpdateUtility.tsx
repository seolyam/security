"use client"

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { RefreshCw, Download, CheckCircle, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface UpdateInfo {
  version: string;
  lastUpdated: string;
  patternsCount: number;
  newKeywords: string[];
  changelog: string[];
}

export default function DatasetUpdateUtility() {
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // GitHub raw URLs for updated datasets
  const UPDATE_SOURCES = {
    patterns: 'https://raw.githubusercontent.com/yourusername/phishingsense/main/lib/data/patterns.json',
    model: 'https://raw.githubusercontent.com/yourusername/phishingsense/main/public/model.json'
  };

  React.useEffect(() => {
    // Load last update timestamp
    const stored = localStorage.getItem('phishingsense_last_update');
    if (stored) {
      setLastUpdate(stored);
    }

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkForUpdates = async () => {
    if (!isOnline) {
      setError('No internet connection available');
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      // Check current patterns
      const currentPatterns = localStorage.getItem('phishingsense_patterns_backup');
      const currentTimestamp = currentPatterns ? JSON.parse(currentPatterns).timestamp : null;

      // Fetch remote patterns (using a placeholder URL for now)
      const response = await fetch('https://api.github.com/repos/yourusername/phishingsense/releases/latest');

      if (response.ok) {
        const releaseData = await response.json();

        // Compare versions
        const remoteVersion = releaseData.tag_name;
        const currentVersion = '2.0.0'; // Would get from package.json

        if (remoteVersion !== currentVersion) {
          setUpdateInfo({
            version: remoteVersion,
            lastUpdated: releaseData.published_at,
            patternsCount: 150, // Would get from actual data
            newKeywords: ['crypto wallet', 'investment opportunity', 'account verification'],
            changelog: [
              'Added new cryptocurrency scam detection patterns',
              'Enhanced localization support',
              'Improved ML model accuracy',
              'Added educational content and explanations'
            ]
          });
        } else {
          setError('You are already using the latest version');
        }
      } else {
        setError('Unable to check for updates. Please try again later.');
      }
    } catch (error) {
      console.error('Update check failed:', error);
      setError('Failed to check for updates. Please check your internet connection.');
    } finally {
      setIsChecking(false);
    }
  };

  const applyUpdates = async () => {
    if (!updateInfo || !isOnline) return;

    setIsUpdating(true);
    setError(null);

    try {
      // In a real implementation, you would fetch the actual updated files
      // For now, we'll simulate the update process

      // Simulate fetching updated patterns
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update localStorage with new data
      const updatedPatterns = {
        ...JSON.parse(localStorage.getItem('phishingsense_patterns_backup') || '{}'),
        timestamp: new Date().toISOString(),
        version: updateInfo.version
      };

      localStorage.setItem('phishingsense_patterns_backup', JSON.stringify(updatedPatterns));
      localStorage.setItem('phishingsense_last_update', new Date().toISOString());

      setLastUpdate(new Date().toISOString());

      // Clear update info
      setUpdateInfo(null);

    } catch (error) {
      console.error('Update failed:', error);
      setError('Failed to apply updates. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            {!isOnline && (
              <span className="text-sm text-gray-600">
                Updates require an internet connection
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Last Update Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dataset Information</CardTitle>
          <CardDescription>
            Current version and last update status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Current Version</span>
              <Badge>v2.0.0</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Last Update</span>
              <span className="text-sm text-gray-600">
                {lastUpdate ? formatDate(lastUpdate) : 'Never'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Detection Patterns</span>
              <span className="text-sm text-gray-600">150+ keywords</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">ML Model Status</span>
              <Badge variant="secondary">Up to date</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Check for Updates
          </CardTitle>
          <CardDescription>
            Fetch the latest phishing patterns and detection improvements from the repository
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-2">What gets updated:</div>
              <div className="text-sm text-blue-800 space-y-1">
                <div>• Latest phishing keywords and patterns</div>
                <div>• Enhanced detection rules</div>
                <div>• Updated ML model parameters</div>
                <div>• Educational content and explanations</div>
              </div>
            </div>

            <Button
              onClick={checkForUpdates}
              disabled={!isOnline || isChecking}
              className="w-full flex items-center gap-2"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Checking for updates...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Check for Updates
                </>
              )}
            </Button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Update Available */}
      {updateInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Download className="h-5 w-5" />
              Update Available
            </CardTitle>
            <CardDescription>
              Version {updateInfo.version} is ready to install
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm font-medium text-green-900 mb-2">What's new in v{updateInfo.version}:</div>
                <div className="space-y-1">
                  {updateInfo.changelog.map((change, index) => (
                    <div key={index} className="text-sm text-green-800 flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      {change}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{updateInfo.patternsCount}</div>
                  <div className="text-gray-600">Detection Patterns</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{updateInfo.newKeywords.length}</div>
                  <div className="text-gray-600">New Keywords</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">Latest</div>
                  <div className="text-gray-600">ML Model</div>
                </div>
              </div>

              <Button
                onClick={applyUpdates}
                disabled={isUpdating}
                className="w-full flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Applying updates...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Install Update
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Update Note */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-gray-600">
            <div className="font-medium mb-2">Need to update manually?</div>
            <div>
              If automatic updates fail, you can download the latest version from{' '}
              <a
                href="https://github.com/yourusername/phishingsense"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
