import { analyzeEmailV2 } from '../lib/ruleEngine';

async function run() {
  const samples = [
    {
      name: 'Benign meeting invite',
      email: {
        from: 'colleague@company.com',
        subject: 'Team sync next Tuesday',
        body: 'Hi team,\nPlease review the agenda and add any topics.\nBest,\nAlice'
      }
    },
    {
      name: 'Credential phish',
      email: {
        from: 'security-update@paypal-secure.com',
        subject: 'Urgent: Verify your PayPal account access',
        body: 'Your account access is limited. Click here to verify your identity immediately: https://paypal-secure.com/verify. Failure to comply will result in suspension.'
      }
    },
    {
      name: 'Header spoofing sample',
      email: {
        from: 'alerts@bankofamerica-secure.com',
        subject: 'Fraudulent activity detected',
        body: 'We noticed unusual activity. Download the attached statement and login to verify your account.',
        headers: `Received-SPF: fail (google.com: domain of fake@bankofamerica-secure.com does not designate 1.2.3.4)
Authentication-Results: mx.google.com; dkim=fail header.i=@bankofamerica-secure.com; dmarc=fail action=quarantine header.from=bankofamerica-secure.com
Return-Path: <bounce@random.com>`
      }
    }
  ];

  for (const sample of samples) {
    const result = await analyzeEmailV2(sample.email, { enableML: false, sensitivity: 'medium' });
    console.log('\n====', sample.name, '====');
    console.log('Score:', result.score, 'Risk:', result.riskLevel, 'Summary:', result.summary);
    console.log('Rule Breakdown:', result.breakdown.rules);
    console.log('Header Breakdown:', result.breakdown.headers);
    console.log('ML Breakdown:', result.breakdown.ml);
    console.log('Findings:', result.findings.map(f => `${f.category ?? 'general'}:${f.severity} -> ${f.text}`));
  }
}

run().catch(err => {
  console.error('Failed to run analysis checks:', err);
});
