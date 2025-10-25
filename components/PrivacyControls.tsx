"use client"

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Shield, Trash2, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

interface PrivacyControlsProps {
  onDataCleared?: () => void;
  className?: string;
}

export default function PrivacyControls({ onDataCleared, className = '' }: PrivacyControlsProps) {
  const [privateMode, setPrivateMode] = useState(() => {
    const stored = localStorage.getItem('phishingsense_private_mode');
    return stored === 'true';
  });

  const [isClearing, setIsClearing] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  const handlePrivateModeToggle = (enabled: boolean) => {
    setPrivateMode(enabled);
    localStorage.setItem('phishingsense_private_mode', enabled.toString());

    if (enabled) {
      // Clear any existing data when enabling private mode
      clearAllData();
    }
  };

  const clearAllData = () => {
    setIsClearing(true);

    try {
      // Clear all localStorage data
      const keysToKeep = ['phishingsense_theme', 'phishingsense_user_id'];
      const allKeys = Object.keys(localStorage);

      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      // Clear IndexedDB
      if ('indexedDB' in window) {
        indexedDB.databases().then(databases => {
          databases.forEach(db => {
            if (db.name && db.name.includes('PhishingSense')) {
              indexedDB.deleteDatabase(db.name);
            }
          });
        });
      }

      setClearConfirm(false);

      if (onDataCleared) {
        onDataCleared();
      }
    } catch (error) {
      console.error('Error clearing data:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const getStoredDataInfo = () => {
    const info = {
      historyItems: 0,
      trainingSamples: 0,
      customRules: 0,
      totalSize: 0
    };

    try {
      // Check localStorage size and items
      const history = localStorage.getItem('phishingsense_history');
      if (history) {
        const parsed = JSON.parse(history);
        info.historyItems = Array.isArray(parsed) ? parsed.length : 0;
        info.totalSize += new Blob([history]).size;
      }

      const samples = localStorage.getItem('phishingsense_labeled_samples');
      if (samples) {
        const parsed = JSON.parse(samples);
        info.trainingSamples = Array.isArray(parsed) ? parsed.length : 0;
        info.totalSize += new Blob([samples]).size;
      }

      const rules = localStorage.getItem('phishingsense_custom_rules');
      if (rules) {
        const parsed = JSON.parse(rules);
        info.customRules = Array.isArray(parsed) ? parsed.length : 0;
        info.totalSize += new Blob([rules]).size;
      }
    } catch (error) {
      console.error('Error getting stored data info:', error);
    }

    return info;
  };

  const dataInfo = getStoredDataInfo();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Privacy Notice */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            <CardTitle className="text-lg">Privacy & Data Protection</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">No Data Leaves Your Device</span>
            </div>
            <div className="text-sm text-green-700">
              All email analysis, training data, and history are stored locally in your browser.
              PhishingSense never transmits your data to external servers or third parties.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Private Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {privateMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            Private Mode
          </CardTitle>
          <CardDescription>
            Disable history saving and automatic data storage for sensitive content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">
                {privateMode ? 'Private Mode Active' : 'Private Mode Disabled'}
              </div>
              <div className="text-sm text-gray-600">
                {privateMode
                  ? 'No analysis history or training data will be saved'
                  : 'Analysis history and training data are stored locally'
                }
              </div>
            </div>
            <Switch
              checked={privateMode}
              onCheckedChange={handlePrivateModeToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stored Data Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stored Data Overview</CardTitle>
          <CardDescription>
            Summary of data currently stored in your browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{dataInfo.historyItems}</div>
              <div className="text-sm text-blue-600">Analysis History</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{dataInfo.trainingSamples}</div>
              <div className="text-sm text-purple-600">Training Samples</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{dataInfo.customRules}</div>
              <div className="text-sm text-orange-600">Custom Rules</div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">
              Total storage used: {(dataInfo.totalSize / 1024).toFixed(1)} KB
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clear Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Clear All Data
          </CardTitle>
          <CardDescription>
            Permanently delete all stored analysis history, training data, and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!clearConfirm ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800">Warning</span>
                </div>
                <div className="text-sm text-red-700 mb-3">
                  This will permanently delete all your analysis history, training samples, custom rules, and settings.
                  This action cannot be undone.
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setClearConfirm(true)}
                  disabled={isClearing}
                >
                  Clear All Data
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm font-medium text-red-800 mb-3">
                  Are you sure you want to delete all data? This cannot be undone.
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={clearAllData}
                    disabled={isClearing}
                    className="flex items-center gap-2"
                  >
                    {isClearing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Yes, Clear All Data
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setClearConfirm(false)}
                    disabled={isClearing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
