export interface EmailHeader {
  name: string;
  value: string;
}

export interface HeaderAnalysis {
  spf?: {
    status: 'pass' | 'fail' | 'softfail' | 'neutral' | 'unknown';
    explanation?: string;
  };
  dkim?: {
    status: 'pass' | 'fail' | 'unknown';
    signature?: string;
  };
  dmarc?: {
    status: 'pass' | 'fail' | 'unknown';
    policy?: string;
  };
  received?: {
    count: number;
    hops: string[];
  };
  suspiciousHeaders?: {
    header: string;
    reason: string;
  }[];
  overall: 'good' | 'suspicious' | 'bad';
}

const SUSPICIOUS_HEADERS = [
  'x-mailer',
  'x-originating-ip',
  'x-source-ip',
  'x-sender-id',
  'x-authentication-results',
  'x-virus-scanned',
  'x-spam-score',
  'x-spam-status',
  'x-priority',
];

const SUSPICIOUS_USER_AGENTS = [
  'php',
  'perl',
  'python',
  'spider',
  'bot',
  'crawler',
  'scraper',
  'harvest',
];

export function parseEmailHeaders(headersText: string): EmailHeader[] {
  const headers: EmailHeader[] = [];
  const lines = headersText.split('\n');

  let currentHeader: Partial<EmailHeader> = {};

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) continue;

    // Check if this is a header line (contains colon)
    if (trimmedLine.includes(':')) {
      // If we have a previous header, save it
      if (currentHeader.name && currentHeader.value) {
        headers.push({
          name: currentHeader.name,
          value: currentHeader.value.trim()
        });
      }

      // Parse new header
      const [name, ...valueParts] = trimmedLine.split(':');
      currentHeader = {
        name: name.trim().toLowerCase(),
        value: valueParts.join(':').trim()
      };
    } else {
      // Continuation of previous header
      if (currentHeader.value) {
        currentHeader.value += ' ' + trimmedLine;
      }
    }
  }

  // Add the last header
  if (currentHeader.name && currentHeader.value) {
    headers.push({
      name: currentHeader.name,
      value: currentHeader.value.trim()
    });
  }

  return headers;
}

export function analyzeEmailHeaders(headers: EmailHeader[]): HeaderAnalysis {
  const analysis: HeaderAnalysis = {
    received: {
      count: 0,
      hops: []
    },
    suspiciousHeaders: [],
    overall: 'good'
  };

  // Analyze SPF
  const spfHeader = headers.find(h => h.name === 'received-spf');
  if (spfHeader) {
    const spfValue = spfHeader.value.toLowerCase();
    if (spfValue.includes('pass')) {
      analysis.spf = { status: 'pass' };
    } else if (spfValue.includes('fail')) {
      analysis.spf = { status: 'fail', explanation: 'SPF authentication failed' };
    } else if (spfValue.includes('softfail')) {
      analysis.spf = { status: 'softfail' };
    } else {
      analysis.spf = { status: 'neutral' };
    }
  }

  // Analyze DKIM
  const dkimHeader = headers.find(h => h.name === 'dkim-signature');
  if (dkimHeader) {
    analysis.dkim = { status: 'pass', signature: dkimHeader.value.substring(0, 50) + '...' };
  } else {
    const dkimResult = headers.find(h => h.name === 'authentication-results' && h.value.toLowerCase().includes('dkim'));
    if (dkimResult && dkimResult.value.toLowerCase().includes('dkim=pass')) {
      analysis.dkim = { status: 'pass' };
    } else if (dkimResult && dkimResult.value.toLowerCase().includes('dkim=fail')) {
      analysis.dkim = { status: 'fail' };
    } else {
      analysis.dkim = { status: 'unknown' };
    }
  }

  // Analyze DMARC
  const dmarcResult = headers.find(h => h.name === 'authentication-results' && h.value.toLowerCase().includes('dmarc'));
  if (dmarcResult) {
    const dmarcValue = dmarcResult.value.toLowerCase();
    if (dmarcValue.includes('dmarc=pass')) {
      analysis.dmarc = { status: 'pass', policy: 'DMARC authentication passed' };
    } else if (dmarcValue.includes('dmarc=fail')) {
      analysis.dmarc = { status: 'fail', policy: 'DMARC authentication failed' };
    } else {
      analysis.dmarc = { status: 'unknown' };
    }
  }

  // Analyze Received headers
  const receivedHeaders = headers.filter(h => h.name === 'received');
  analysis.received = {
    count: receivedHeaders.length,
    hops: receivedHeaders.map(h => h.value.split(' ')[0])
  };

  // Check for suspicious headers
  headers.forEach(header => {
    // Check for suspicious header names
    if (SUSPICIOUS_HEADERS.includes(header.name)) {
      analysis.suspiciousHeaders?.push({
        header: header.name,
        reason: 'Unusual header that may indicate automated or suspicious email'
      });
    }

    // Check for suspicious user agents
    if (header.name === 'user-agent' && header.value) {
      const userAgent = header.value.toLowerCase();
      const isSuspicious = SUSPICIOUS_USER_AGENTS.some(agent => userAgent.includes(agent));
      if (isSuspicious) {
        analysis.suspiciousHeaders?.push({
          header: 'user-agent',
          reason: `Suspicious user agent detected: ${header.value}`
        });
      }
    }

    // Check for missing important headers
    if (header.name === 'return-path' && !header.value.includes('@')) {
      analysis.suspiciousHeaders?.push({
        header: 'return-path',
        reason: 'Invalid or missing return path'
      });
    }
  });

  // Determine overall security status
  let securityScore = 0;

  if (analysis.spf?.status === 'fail') securityScore += 30;
  if (analysis.dkim?.status === 'fail') securityScore += 30;
  if (analysis.dmarc?.status === 'fail') securityScore += 20;
  if (analysis.received.count > 5) securityScore += 10; // Too many hops
  if (analysis.suspiciousHeaders && analysis.suspiciousHeaders.length > 0) {
    securityScore += analysis.suspiciousHeaders.length * 5;
  }

  if (securityScore >= 50) {
    analysis.overall = 'bad';
  } else if (securityScore >= 20) {
    analysis.overall = 'suspicious';
  } else {
    analysis.overall = 'good';
  }

  return analysis;
}

export function formatHeaderAnalysis(analysis: HeaderAnalysis): string {
  const parts: string[] = [];

  if (analysis.spf) {
    parts.push(`SPF: ${analysis.spf.status.toUpperCase()}`);
  }

  if (analysis.dkim) {
    parts.push(`DKIM: ${analysis.dkim.status.toUpperCase()}`);
  }

  if (analysis.dmarc) {
    parts.push(`DMARC: ${analysis.dmarc.status.toUpperCase()}`);
  }

  parts.push(`Received Hops: ${analysis.received?.count || 0}`);

  if (analysis.suspiciousHeaders && analysis.suspiciousHeaders.length > 0) {
    parts.push(`Suspicious Headers: ${analysis.suspiciousHeaders.length}`);
  }

  return parts.join(' | ');
}
