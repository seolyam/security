"use client"

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Settings, Plus, X, RotateCcw, Save, AlertTriangle } from 'lucide-react';

type SeverityLevel = 'low' | 'medium' | 'high';
type SensitivityLevel = 'lenient' | 'balanced' | 'strict';

interface CustomRule {
  id: string;
  keyword: string;
  category: string;
  severity: SeverityLevel;
  weight: number;
  enabled: boolean;
}

interface RuleCustomizationProps {
  className?: string;
}

const SENSITIVITY_LEVELS: SensitivityLevel[] = ['lenient', 'balanced', 'strict'];
const SEVERITY_LEVELS: SeverityLevel[] = ['low', 'medium', 'high'];

function loadStoredRules(): CustomRule[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const stored = localStorage.getItem('phishingsense_custom_rules');
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error('Error reading stored rules:', error);
  }
  return [];
}

function loadStoredSensitivity(): SensitivityLevel {
  if (typeof window === 'undefined') {
    return 'balanced';
  }
  try {
    const stored = localStorage.getItem('phishingsense_sensitivity');
    if (stored === 'lenient' || stored === 'balanced' || stored === 'strict') {
      return stored;
    }
  } catch (error) {
    console.error('Error reading stored sensitivity:', error);
  }
  return 'balanced';
}

export default function RuleCustomization({ className = '' }: RuleCustomizationProps) {
  const [customRules, setCustomRules] = useState<CustomRule[]>(() => loadStoredRules());
  const [newRule, setNewRule] = useState<{
    keyword: string;
    category: string;
    severity: SeverityLevel;
    weight: number;
  }>({
    keyword: '',
    category: 'custom',
    severity: 'medium',
    weight: 15
  });
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>(() => loadStoredSensitivity());
  const [isModified, setIsModified] = useState(false);

  const saveSettings = () => {
    try {
      localStorage.setItem('phishingsense_custom_rules', JSON.stringify(customRules));
      localStorage.setItem('phishingsense_sensitivity', sensitivity);
      setIsModified(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const resetSettings = () => {
    localStorage.removeItem('phishingsense_custom_rules');
    localStorage.removeItem('phishingsense_sensitivity');
    setCustomRules([]);
    setSensitivity('balanced');
    setIsModified(false);
  };

  const addRule = () => {
    if (!newRule.keyword.trim()) return;

    const rule: CustomRule = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      keyword: newRule.keyword.trim().toLowerCase(),
      category: newRule.category,
      severity: newRule.severity,
      weight: newRule.weight,
      enabled: true
    };

    setCustomRules(prev => [...prev, rule]);
    setNewRule({
      keyword: '',
      category: 'custom',
      severity: 'medium',
      weight: 15
    });
    setIsModified(true);
  };

  const removeRule = (ruleId: string) => {
    setCustomRules(prev => prev.filter(r => r.id !== ruleId));
    setIsModified(true);
  };

  const toggleRule = (ruleId: string) => {
    setCustomRules(prev => prev.map(r =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
    setIsModified(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSensitivityDescription = (level: string) => {
    switch (level) {
      case 'lenient': return 'Lower sensitivity - fewer false positives, may miss some threats';
      case 'balanced': return 'Balanced sensitivity - good mix of detection and accuracy';
      case 'strict': return 'Higher sensitivity - catches more threats, may have more false positives';
      default: return '';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Sensitivity Level */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Detection Sensitivity
          </CardTitle>
          <CardDescription>
            Adjust how aggressively the system detects potential phishing attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sensitivity">Sensitivity Level</Label>
              <div className="flex rounded-md border border-gray-200 dark:border-gray-700">
                {SENSITIVITY_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      setSensitivity(level);
                      setIsModified(true);
                    }}
                    className={`flex-1 py-2 px-3 text-sm capitalize border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${
                      sensitivity === level
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {getSensitivityDescription(sensitivity)}
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Note:</strong> Changes are saved locally and will be applied to future analyses.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Custom Detection Rules
          </CardTitle>
          <CardDescription>
            Add your own keywords and patterns to improve detection accuracy
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add New Rule */}
          <div className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="text-sm font-medium">Add New Rule</div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <Label htmlFor="keyword">Keyword/Pattern</Label>
                <Input
                  id="keyword"
                  placeholder="e.g., urgent, verify"
                  value={newRule.keyword}
                  onChange={(e) => setNewRule(prev => ({ ...prev, keyword: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., urgent, financial"
                  value={newRule.category}
                  onChange={(e) => setNewRule(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="severity">Severity</Label>
                <div className="flex rounded-md border border-gray-200 dark:border-gray-700">
                  {SEVERITY_LEVELS.map((severity) => (
                    <button
                      key={severity}
                      type="button"
                      onClick={() => setNewRule(prev => ({ ...prev, severity }))}
                      className={`flex-1 py-2 px-3 text-sm capitalize border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${
                        newRule.severity === severity
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                      }`}
                    >
                      {severity}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  type="number"
                  min="1"
                  max="50"
                  value={newRule.weight}
                  onChange={(e) => setNewRule(prev => ({ ...prev, weight: parseInt(e.target.value) || 15 }))}
                />
              </div>
            </div>

            <Button onClick={addRule} disabled={!newRule.keyword.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </div>

          {/* Custom Rules List */}
          {customRules.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Your Custom Rules ({customRules.length})</div>

              {customRules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleRule(rule.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        rule.enabled
                          ? 'bg-blue-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          rule.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    <div className="flex-1">
                      <div className="font-medium">{rule.keyword}</div>
                      <div className="text-sm text-gray-600">
                        Category: {rule.category} • Weight: {rule.weight}
                      </div>
                    </div>

                    <Badge className={getSeverityColor(rule.severity)}>
                      {rule.severity}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRule(rule.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {customRules.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No custom rules added yet</p>
              <p className="text-sm">Add rules above to customize detection</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={saveSettings} disabled={!isModified}>
          <Save className="h-4 w-4 mr-1" />
          Save Changes
        </Button>

        <Button variant="outline" onClick={resetSettings}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset to Defaults
        </Button>
      </div>

      {isModified && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          You have unsaved changes. Click &ldquo;Save Changes&rdquo; to apply them.
          </div>
        </div>
      )}
    </div>
  );
}
