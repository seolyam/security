import jsPDF from 'jspdf';
import { AnalysisResult } from './engines/scoreCombiner';

export interface EmailData {
  from: string;
  subject: string;
  body: string;
  headers?: string;
  analyzedAt: Date;
}

export interface EnhancedExportData {
  email: EmailData;
  analysis: AnalysisResult;
  metadata: {
    version: string;
    generatedAt: Date;
    signature: string;
  };
}

// Generate a simple hash for digital signature
function generateSignature(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

export const generateEnhancedPDF = async (
  email: EmailData,
  analysis: AnalysisResult
): Promise<void> => {
  try {
    const pdf = new jsPDF();
    const formatPercent = (value: number) => `${(Math.round(value * 10) / 10).toFixed(1)}%`;
    const formatConfidence = (value: number) => `${(Math.round(value * 1000) / 10).toFixed(1)}%`;

    // Generate signature for the report
    const signatureData = JSON.stringify({
      from: email.from,
      subject: email.subject,
      score: analysis.score,
      timestamp: email.analyzedAt.toISOString()
    });
    const signature = generateSignature(signatureData);

    const reportData: EnhancedExportData = {
      email,
      analysis,
      metadata: {
        version: '2.0',
        generatedAt: new Date(),
        signature
      }
    };

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('Phishsense Analysis Report', 20, 30);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Report ID: ${signature}`, 20, 40);
    pdf.text(`Generated: ${reportData.metadata.generatedAt.toLocaleString()}`, 20, 45);
    pdf.text(`Analysis Date: ${email.analyzedAt.toLocaleString()}`, 20, 50);

    let yPosition = 65;

    // Email Information Section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Email Information', 20, yPosition);
    yPosition += 15;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const emailInfo = [
      `From: ${email.from}`,
      `Subject: ${email.subject}`,
      `Analysis Time: ${(analysis.processingTime ?? 0)}ms`
    ];

    emailInfo.forEach(info => {
      pdf.text(info, 20, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Risk Assessment Section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Risk Assessment', 20, yPosition);
    yPosition += 15;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.text(`Overall Risk Score: ${analysis.score.toFixed(1)}%`, 20, yPosition);
    yPosition += 10;

    const riskColor = analysis.riskLevel === 'Low' ? [0, 128, 0] :
                     analysis.riskLevel === 'Medium' ? [255, 165, 0] : [255, 0, 0];

    pdf.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Risk Level: ${analysis.riskLevel} - ${analysis.summary}`, 20, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Rule-based Analysis: ${formatPercent(analysis.breakdown.rules.score)} (weight ${formatPercent(analysis.breakdown.rules.percentage)})`, 25, yPosition);
    yPosition += 8;
    pdf.text(`Header Validation: ${formatPercent(analysis.breakdown.headers.score)} (weight ${formatPercent(analysis.breakdown.headers.percentage)})`, 25, yPosition);
    yPosition += 8;
    pdf.text(`ML Analysis: ${formatPercent(analysis.breakdown.ml.score)} (weight ${formatPercent(analysis.breakdown.ml.percentage)})`, 25, yPosition);
    yPosition += 8;
    pdf.text(`Additional Factors: ${formatPercent(analysis.breakdown.misc.score)} (weight ${formatPercent(analysis.breakdown.misc.percentage)})`, 25, yPosition);
    yPosition += 15;

    // Findings Section
    if (analysis.findings.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Detailed Findings', 20, yPosition);
      yPosition += 15;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      analysis.findings.forEach((finding, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }

        const severityLabel = finding.severity === 'high' ? '[HIGH]' :
                              finding.severity === 'medium' ? '[MEDIUM]' : '[LOW]';

        pdf.text(`${index + 1}. ${severityLabel} ${finding.text}`, 20, yPosition);
        yPosition += 8;

        if (finding.category) {
          pdf.setFontSize(8);
          pdf.text(`   Category: ${finding.category}`, 25, yPosition);
          yPosition += 6;
          pdf.setFontSize(10);
        }

        yPosition += 5;
      });
    }

    // Email Content Preview
    pdf.addPage();
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Email Content Preview', 20, 30);
    yPosition = 45;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const previewText = email.body.substring(0, 800);
    const lines = pdf.splitTextToSize(previewText, 170);

    lines.forEach((line: string) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      pdf.text(line, 20, yPosition);
      yPosition += 6;
    });

    // Header Analysis (if available)
    if (email.headers && analysis.breakdown.headers.score > 0) {
      pdf.addPage();
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Header Authentication Analysis', 20, 30);
      yPosition = 45;

      const headerDetails = analysis.breakdown.headers.details ?? {};

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const headerInfo = [
        `SPF Status: ${headerDetails.spfStatus ?? 'Not Available'}`,
        `DKIM Status: ${headerDetails.dkimStatus ?? 'Not Available'}`,
        `DMARC Status: ${headerDetails.dmarcStatus ?? 'Not Available'}`,
        `Email Hops: ${headerDetails.receivedCount ?? 0}`,
        `Suspicious Headers: ${headerDetails.suspiciousHeaders ?? 0}`
      ];

      headerInfo.forEach(detail => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
        pdf.text(detail, 20, yPosition);
        yPosition += 8;
      });
    }

    // ML Analysis Details (if used)
    if (analysis.breakdown.ml.confidence > 0) {
      pdf.addPage();
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Machine Learning Analysis', 20, 30);
      yPosition = 45;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const mlDetails = [
        `Model Used: ${analysis.breakdown.ml.modelUsed}`,
        `ML Confidence: ${formatConfidence(analysis.breakdown.ml.confidence)}`,
        `ML Score: ${formatPercent(analysis.breakdown.ml.score)}`,
        `Processing Time: ${(analysis.processingTime ?? 0)}ms`
      ];

      mlDetails.forEach(detail => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
        pdf.text(detail, 20, yPosition);
        yPosition += 8;
      });
    }

    // Recommendations Section
    pdf.addPage();
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Recommendations', 20, 30);
    yPosition = 45;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const recommendations = [
      analysis.riskLevel === 'High' ? 'Do not click any links or provide credentials.' : 'Email appears safe to interact with.',
      analysis.riskLevel === 'Medium' ? 'Verify sender identity through official channels.' : '',
      'Always check URL domains before clicking.',
      'Enable two-factor authentication on important accounts.',
      'Use antivirus software with email scanning.',
      'Report suspicious emails to your IT security team.'
    ].filter(Boolean);

    recommendations.forEach(rec => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      pdf.text(`- ${rec}`, 20, yPosition);
      yPosition += 8;
    });

    // Footer with signature on every page
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(
        `Phishsense Report | Signature: ${signature} | Page ${i} of ${pageCount}`,
        20,
        pdf.internal.pageSize.height - 15
      );
      pdf.text(
        `This report was generated on ${reportData.metadata.generatedAt.toLocaleString()}`,
        20,
        pdf.internal.pageSize.height - 10
      );
    }

    const fileName = `phishingsense-report-${signature}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating enhanced PDF:', error);
    throw new Error('Failed to generate enhanced PDF report');
  }
};

export const generateEnhancedJSON = (email: EmailData, analysis: AnalysisResult): void => {
  const signatureData = JSON.stringify({
    from: email.from,
    subject: email.subject,
    score: analysis.score,
    timestamp: email.analyzedAt.toISOString()
  });
  const signature = generateSignature(signatureData);

  const exportData: EnhancedExportData = {
    email,
    analysis,
    metadata: {
      version: '2.0',
      generatedAt: new Date(),
      signature
    }
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

  const exportFileDefaultName = `phishingsense-analysis-${signature}-${new Date().toISOString().split('T')[0]}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};
