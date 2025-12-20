'use client';

import { useState } from 'react';
import { digioService } from '@/services/digio.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DigioProfileCheck from './digio-profile-check';

export default function DigioTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProfileCheck, setShowProfileCheck] = useState(false);

  const testDigioIntegration = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Example - replace with actual product data
      const agreementData = { productName: 'Growth Bundle' };
      const response = await digioService.createDocumentWithProfileCheck(
        agreementData,               // agreementData
        'Bundle',                    // productType
        '686a629db4f9ab73bb2dba3d',  // productId
        async () => {
          setShowProfileCheck(true);
          return new Promise((resolve) => {
            const checkComplete = () => {
              if (!showProfileCheck) {
                resolve();
              } else {
                setTimeout(checkComplete, 100);
              }
            };
            checkComplete();
          });
        }
      );

      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Digio Integration Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testDigioIntegration} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Creating Document...' : 'Test Digio Document Creation'}
        </Button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="font-semibold text-red-800">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold text-green-800">Success!</h3>
            <div className="mt-2 space-y-2">
              <p><strong>Document ID:</strong> {result.documentId}</p>
              {result.authenticationUrl && (
                <div>
                  <p><strong>Authentication URL:</strong></p>
                  <a 
                    href={result.authenticationUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {result.authenticationUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
        
        {showProfileCheck && (
          <DigioProfileCheck 
            onComplete={() => setShowProfileCheck(false)}
            onCancel={() => setShowProfileCheck(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}