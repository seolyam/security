"use client"

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Eye, MousePointer, AlertTriangle, Info } from 'lucide-react';

interface Finding {
  id: string;
  text: string;
  severity: 'low' | 'medium' | 'high';
  category: string;
  startIndex?: number;
  endIndex?: number;
}

interface EmailHighlighterProps {
  content: string;
  findings: Finding[];
  showHoverEffects?: boolean;
  showCategories?: boolean;
  className?: string;
}

export default function EmailHighlighter({
  content,
  findings,
  showHoverEffects = true,
  showCategories = true,
  className = ''
}: EmailHighlighterProps) {
  const [hoveredFinding, setHoveredFinding] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);

  const highlightedContent = useMemo(() => {
    if (findings.length === 0) {
      return <span>{content}</span>;
    }

    // Sort findings by startIndex to process them in order
    const sortedFindings = [...findings].sort((a, b) => (a.startIndex || 0) - (b.startIndex || 0));

    const parts: React.ReactElement[] = [];
    let lastIndex = 0;

    sortedFindings.forEach((finding, index) => {
      const startIndex = finding.startIndex || 0;
      const endIndex = finding.endIndex || startIndex + finding.text.length;

      // Add text before the finding
      if (startIndex > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {content.slice(lastIndex, startIndex)}
          </span>
        );
      }

      // Add the highlighted finding
      const isHovered = hoveredFinding === finding.id;
      const severityColor = finding.severity === 'high' ? 'bg-red-200 hover:bg-red-300' :
                           finding.severity === 'medium' ? 'bg-yellow-200 hover:bg-yellow-300' :
                           'bg-blue-200 hover:bg-blue-300';

      parts.push(
        <span
          key={`finding-${finding.id}`}
          className={`relative cursor-pointer transition-all duration-200 ${severityColor} ${isHovered ? 'ring-2 ring-blue-400' : ''}`}
          onMouseEnter={() => showHoverEffects && setHoveredFinding(finding.id)}
          onMouseLeave={() => showHoverEffects && setHoveredFinding(null)}
          title={showHoverEffects ? `${finding.category || 'Unknown'} (${finding.severity})` : undefined}
        >
          {content.slice(startIndex, endIndex)}

          {/* Hover tooltip */}
          {isHovered && showHoverEffects && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10 whitespace-nowrap">
              <div className="font-medium">{finding.category || 'Unknown'}</div>
              <div className="text-gray-300 capitalize">{finding.severity} severity</div>
              <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          )}
        </span>
      );

      lastIndex = endIndex;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key="text-final">
          {content.slice(lastIndex)}
        </span>
      );
    }

    return parts;
  }, [content, findings, hoveredFinding, showHoverEffects]);

  const getSeverityCounts = () => {
    const counts = { high: 0, medium: 0, low: 0 };
    findings.forEach(finding => {
      counts[finding.severity as keyof typeof counts]++;
    });
    return counts;
  };

  const severityCounts = getSeverityCounts();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <CardTitle className="text-lg">Content Analysis</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHoveredFinding(null)}
            >
              <MousePointer className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Interactive highlighting of suspicious content with hover effects
        </CardDescription>
      </CardHeader>

      <CardContent>
        {findings.length > 0 && showDetails && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium mb-2">Detection Summary</div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="destructive" className="text-xs">
                {severityCounts.high} High Risk
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {severityCounts.medium} Medium Risk
              </Badge>
              <Badge className="text-xs">
                {severityCounts.low} Low Risk
              </Badge>
            </div>
          </div>
        )}

        {/* Email Content with Highlighting */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>Email Content</span>
            {showHoverEffects && (
              <span className="text-gray-500">(Hover over highlighted text for details)</span>
            )}
          </div>

          <div className="p-4 border rounded-lg bg-white font-mono text-sm leading-relaxed">
            {highlightedContent}
          </div>
        </div>

        {/* Legend */}
        {findings.length > 0 && showDetails && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium mb-2">Legend</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-200 rounded"></div>
                <span>High Risk (Critical issues)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-200 rounded"></div>
                <span>Medium Risk (Suspicious patterns)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-200 rounded"></div>
                <span>Low Risk (Minor concerns)</span>
              </div>
            </div>
          </div>
        )}

        {/* No Findings Message */}
        {findings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Info className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No suspicious indicators found in this email</p>
            <p className="text-sm">The content appears to be safe</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
