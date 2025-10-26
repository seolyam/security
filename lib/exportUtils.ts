import jsPDF from 'jspdf';

export interface AnalysisResult {
  findings: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high';
    text: string;
    meta?: Record<string, unknown>;
    startIndex?: number;
    endIndex?: number;
  }>;
  score: number;
  riskLevel: string;
  summary: string;
}

export interface EmailData {
  from: string;
  subject: string;
  body: string;
  analyzedAt: Date;
}

export interface ExportData {
  email: EmailData;
  analysis: AnalysisResult;
}

export const exportToJSON = (email: EmailData, analysis: AnalysisResult): void => {
  const exportData: ExportData = {
    email,
    analysis,
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

  const exportFileDefaultName = `phishsense-analysis-${new Date().toISOString().split('T')[0]}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const exportToPDF = async (
  email: EmailData,
  analysis: AnalysisResult
): Promise<void> => {
  try {
    const pdf = new jsPDF();

    // Add header
    pdf.setFontSize(20);
    pdf.text('Phishsense Analysis Report', 20, 30);

    // Add timestamp
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, 45);

    // Add email information
    pdf.setFontSize(14);
    pdf.text('Email Information', 20, 65);

    pdf.setFontSize(10);
    let yPosition = 75;

    pdf.text(`From: ${email.from}`, 20, yPosition);
    yPosition += 10;

    pdf.text(`Subject: ${email.subject}`, 20, yPosition);
    yPosition += 10;

    pdf.text(`Analyzed: ${email.analyzedAt.toLocaleString()}`, 20, yPosition);
    yPosition += 20;

    // Add analysis results
    pdf.setFontSize(14);
    pdf.text('Analysis Results', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.text(`Risk Score: ${analysis.score}%`, 20, yPosition);
    yPosition += 10;

    pdf.text(`Risk Level: ${analysis.riskLevel}`, 20, yPosition);
    yPosition += 10;

    pdf.text(`Summary: ${analysis.summary}`, 20, yPosition);
    yPosition += 20;

    // Add findings
    if (analysis.findings.length > 0) {
      pdf.setFontSize(14);
      pdf.text('Findings', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(10);
      analysis.findings.forEach((finding, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }

        const severityColor = finding.severity === 'high' ? 'High' :
                             finding.severity === 'medium' ? 'Medium' : 'Low';

        pdf.text(`${index + 1}. ${finding.text}`, 20, yPosition);
        yPosition += 8;
        pdf.text(`   Severity: ${severityColor}`, 25, yPosition);
        yPosition += 12;
      });
    }

    // Add email body preview
    pdf.addPage();
    pdf.setFontSize(14);
    pdf.text('Email Content', 20, 30);

    pdf.setFontSize(10);
    yPosition = 45;

    // Wrap text for email body
    const emailBody = email.body;
    const maxWidth = 170;
    const lines = pdf.splitTextToSize(emailBody, maxWidth);

    lines.forEach((line: string) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      pdf.text(line, 20, yPosition);
      yPosition += 7;
    });

    // Add footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(
        `Page ${i} of ${pageCount} - Phishsense Analysis Report`,
        20,
        pdf.internal.pageSize.height - 20
      );
    }

    // Download the PDF
    const fileName = `phishsense-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};

export const exportToCSV = (analyses: Array<{ email: EmailData; analysis: AnalysisResult }>): void => {
  const csvHeaders = [
    'Date',
    'From',
    'Subject',
    'Risk Score',
    'Risk Level',
    'Summary',
    'Findings Count'
  ].join(',');

  const csvRows = analyses.map(({ email, analysis }) => [
    email.analyzedAt.toISOString(),
    `"${email.from.replace(/"/g, '""')}"`,
    `"${email.subject.replace(/"/g, '""')}"`,
    analysis.score,
    analysis.riskLevel,
    `"${analysis.summary}"`,
    analysis.findings.length
  ].join(','));

  const csvContent = [csvHeaders, ...csvRows].join('\n');
  const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);

  const exportFileDefaultName = `phishsense-analyses-${new Date().toISOString().split('T')[0]}.csv`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};
