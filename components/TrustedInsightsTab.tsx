"use client"

import { useEffect, useState } from 'react';
import { ShieldCheck, Trash2, RefreshCw, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getTrustedRecords, removeTrustedRecord, TrustedRecord } from '../lib/services/trustedService';
import { useAuth } from '../lib/authProvider';

function formatDate(date: string): string {
  try {
    const d = new Date(date);
    return d.toLocaleString();
  } catch {
    return date;
  }
}

export default function TrustedInsightsTab() {
  const { user } = useAuth();
  const [records, setRecords] = useState<TrustedRecord[]>([]);

  const refreshRecords = () => {
    const data = getTrustedRecords({ userId: user?.id });
    setRecords(data);
  };

  useEffect(() => {
    refreshRecords();
  }, [user?.id]);

  const handleRemove = (id: string) => {
    removeTrustedRecord(id);
    refreshRecords();
  };

  const total = records.length;
  const lastConfirmed = records.reduce<string | null>((latest, record) => {
    if (!record.lastConfirmedAt) return latest;
    if (!latest) return record.lastConfirmedAt;
    return new Date(record.lastConfirmedAt) > new Date(latest) ? record.lastConfirmedAt : latest;
  }, null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 dark:text-gray-100">
            <ShieldCheck className="h-6 w-6" />
            Trusted Senders
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review and manage emails you have confirmed as legitimate. These confirmations help reduce false positives.
          </p>
        </div>
        <Button variant="outline" onClick={refreshRecords} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
          <CardDescription>
            {total} trusted sender{total === 1 ? '' : 's'}
            {lastConfirmed ? ` • Last confirmation ${formatDate(lastConfirmed)}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No trusted senders yet. Mark legitimate emails from the analyzer to build confidence and reduce false positives.
            </div>
          ) : (
            <div className="space-y-3">
              {records.map(record => (
                <div
                  key={record.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 border rounded-lg p-3 dark:border-gray-700 dark:bg-gray-900/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center rounded-full bg-green-100 text-green-600 h-10 w-10 dark:bg-green-900/40">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold dark:text-gray-100 flex items-center gap-2">
                        {record.sender}
                        <Badge variant="secondary" className="text-xs">{record.domain}</Badge>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Confirmed {record.confirmationCount} time{record.confirmationCount === 1 ? '' : 's'} • Last confirmed {formatDate(record.lastConfirmedAt)}
                      </div>
                      {record.subject ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Recent subject: {record.subject}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.authSnapshot ? (
                      <Badge variant="outline" className="text-xs">
                        SPF {record.authSnapshot.spfPassed ? 'pass' : 'n/a'} • DKIM {record.authSnapshot.dkimPassed ? 'pass' : 'n/a'} • DMARC {record.authSnapshot.dmarcPassed ? 'pass' : 'n/a'}
                      </Badge>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemove(record.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
