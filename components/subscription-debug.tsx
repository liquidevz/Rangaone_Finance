"use client";

import { useState, useEffect } from "react";
import { subscriptionService } from "@/services/subscription.service";
import { tipsService } from "@/services/tip.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    try {
      const debug = await subscriptionService.debugSubscriptionAccess();
      const canShowPremiumTips = await tipsService.shouldShowPremiumTips();
      
      setDebugInfo({
        ...debug,
        canShowPremiumTips
      });
    } catch (error) {
      console.error("Debug failed:", error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDebug();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Subscription Debug Info</CardTitle>
        <Button onClick={runDebug} disabled={loading}>
          {loading ? "Loading..." : "Refresh Debug Info"}
        </Button>
      </CardHeader>
      <CardContent>
        {debugInfo ? (
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        ) : (
          <p>Loading debug information...</p>
        )}
      </CardContent>
    </Card>
  );
}