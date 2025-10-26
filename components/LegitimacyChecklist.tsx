"use client"

import { useMemo } from 'react';
import { CheckCircle2, ShieldCheck, Sparkles, Info, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface LegitimacyChecklistProps {
  analysis: any;
  snapshot: {
    trustedByUser?: boolean;
    authStrong?: boolean;
    mlSupports?: boolean;
    score: number;
    verdict?: string;
  } | null;
  isTrustedSender: boolean;
  onMarkLegitimate: () => Promise<void> | void;
  markDisabled?: boolean;
  showSavedState?: boolean;
}

export default function LegitimacyChecklist({
  analysis,
  snapshot,
  isTrustedSender,
  onMarkLegitimate,
  markDisabled,
  showSavedState
}: LegitimacyChecklistProps) {
  const items = useMemo(() => {
    if (!analysis) return [];
    const headerDetails = analysis?.breakdown?.headers?.details || {};
    return [
      {
        id: 'auth',
        label: 'Authentication checks clean',
        description: 'SPF, DKIM, and DMARC all passed',
        active: snapshot?.authStrong,
        icon: ShieldCheck
      },
      {
        id: 'trusted',
        label: 'Sender confirmed legitimate',
        description: 'Previously marked as safe by you or your team',
        active: Boolean(snapshot?.trustedByUser || isTrustedSender),
        icon: CheckCircle2
      },
      {
        id: 'ml',
        label: 'ML model considers safe',
        description: 'Machine learning risk score below 40%',
        active: snapshot?.mlSupports,
        icon: Sparkles
      },
      {
        id: 'headers',
        label: 'Headers reviewed',
        description: `SPF: ${headerDetails.spfStatus || 'unknown'} | DKIM: ${headerDetails.dkimStatus || 'unknown'} | DMARC: ${headerDetails.dmarcStatus || 'unknown'}`,
        active: Boolean(headerDetails.spfStatus || headerDetails.dkimStatus || headerDetails.dmarcStatus),
        icon: Info
      }
    ];
  }, [analysis, snapshot, isTrustedSender]);

  const canMarkLegitimate = !isTrustedSender && !markDisabled;
  const scoreValue = Math.round(analysis?.score ?? 0);
  const scoreColor = scoreValue < 30 ? 'text-green-600' : scoreValue < 70 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Legitimacy Checklist
        </CardTitle>
        <CardDescription>
          Green checks indicate strong evidence that the email is legitimate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 rounded-lg border p-3 text-sm dark:border-gray-600 ${item.active ? 'border-green-300 bg-green-50 dark:bg-green-900/10' : 'bg-gray-50 dark:bg-gray-800/80'}`}
              >
                <Icon className={`h-4 w-4 mt-1 ${item.active ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <div className="font-semibold dark:text-gray-100 flex items-center gap-2">
                    {item.label}
                    {item.active ? (
                      <Badge variant="default" className="bg-green-600 text-white">Verified</Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Overall Score</div>
            <div className={`text-2xl font-bold ${scoreColor}`}>
              {scoreValue}%
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showSavedState ? (
              <Badge variant="default" className="bg-green-600 text-white">Saved as Legitimate</Badge>
            ) : null}
            <Button
              type="button"
              disabled={!canMarkLegitimate}
              onClick={() => onMarkLegitimate()}
              className="flex items-center gap-2"
              variant={canMarkLegitimate ? 'default' : 'outline'}
            >
              <PlusCircle className="h-4 w-4" />
              {isTrustedSender ? 'Already Marked Legitimate' : 'Mark as Legitimate'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
