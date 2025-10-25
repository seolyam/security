"use client"

import React from 'react';
import { Finding } from '../lib/ruleEngine';

interface EmailHighlighterProps {
  content: string;
  findings: Finding[];
  className?: string;
}

interface HighlightedSection {
  text: string;
  isHighlighted: boolean;
  finding?: Finding;
}

export default function EmailHighlighter({
  content,
  findings,
  className = ''
}: EmailHighlighterProps) {
  // Sort findings by start index to process them in order
  const sortedFindings = [...findings].sort((a, b) => {
    const aIndex = a.startIndex ?? content.indexOf(a.text);
    const bIndex = b.startIndex ?? content.indexOf(b.text);
    return aIndex - bIndex;
  });

  // Create highlighted sections
  const sections: HighlightedSection[] = [];
  let lastIndex = 0;

  sortedFindings.forEach(finding => {
    // Find the actual position of the suspicious text
    const findingText = finding.text.split(': ')[1]?.replace(/['"]/g, '') || finding.text;
    const searchText = content.toLowerCase();
    const startIndex = searchText.indexOf(findingText.toLowerCase());

    if (startIndex === -1) return;

    // Add text before the finding
    if (startIndex > lastIndex) {
      sections.push({
        text: content.slice(lastIndex, startIndex),
        isHighlighted: false,
      });
    }

    // Add the highlighted finding
    const endIndex = startIndex + findingText.length;
    sections.push({
      text: content.slice(startIndex, endIndex),
      isHighlighted: true,
      finding,
    });

    lastIndex = endIndex;
  });

  // Add remaining text
  if (lastIndex < content.length) {
    sections.push({
      text: content.slice(lastIndex),
      isHighlighted: false,
    });
  }

  // If no specific findings found, treat the whole content as normal
  if (sections.length === 0) {
    sections.push({
      text: content,
      isHighlighted: false,
    });
  }

  const getHighlightClass = (finding: Finding): string => {
    switch (finding.severity) {
      case 'high':
        return 'bg-red-200 border-red-400 text-red-900';
      case 'medium':
        return 'bg-yellow-200 border-yellow-400 text-yellow-900';
      case 'low':
        return 'bg-blue-200 border-blue-400 text-blue-900';
      default:
        return 'bg-gray-200 border-gray-400 text-gray-900';
    }
  };

  return (
    <div className={`p-4 bg-gray-50 rounded-lg font-mono text-sm leading-relaxed ${className}`}>
      {sections.map((section, index) => {
        if (section.isHighlighted && section.finding) {
          return (
            <span
              key={index}
              className={`inline-block px-1 py-0.5 mx-0.5 rounded border ${getHighlightClass(section.finding)}`}
              title={`${section.finding.severity.toUpperCase()} severity: ${section.finding.text}`}
            >
              {section.text}
            </span>
          );
        }

        return (
          <span key={index} className="text-gray-800">
            {section.text}
          </span>
        );
      })}
    </div>
  );
}
