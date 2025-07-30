import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { consoleMonitor } from '@/utils/console-monitor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Bug, RefreshCw, Trash2, Zap } from 'lucide-react';

interface ConsoleError {
  message: string;
  source?: string;
  line?: number;
  column?: number;
  timestamp: number;
  url?: string;
  stack?: string;
  level: 'error' | 'warn' | 'info';
}

export function ConsoleErrorsPanel() {
  const [localErrors, setLocalErrors] = useState<ConsoleError[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch server-side error analysis
  const { data: serverAnalysis, refetch: refetchAnalysis } = useQuery({
    queryKey: ['/api/console/analysis'],
    enabled: false, // Manual trigger
  });

  // Update local errors periodically
  useEffect(() => {
    const updateErrors = () => {
      const errors = consoleMonitor.getRecentErrors(20);
      setLocalErrors(errors);
    };

    updateErrors();
    const interval = setInterval(updateErrors, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAnalyzeErrors = async () => {
    setIsAnalyzing(true);
    try {
      const aiAnalysis = await consoleMonitor.getAnalysis();
      setAnalysis(aiAnalysis);
    } catch (error) {
      console.error('Failed to get AI analysis:', error);
      setAnalysis('Unable to analyze errors at this time.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearErrors = () => {
    consoleMonitor.clearErrors();
    setLocalErrors([]);
    setAnalysis('');
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getErrorIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const errorCounts = localErrors.reduce((acc, error) => {
    acc[error.level] = (acc[error.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          <h2 className="text-2xl font-semibold">Console Monitor</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClearErrors}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button size="sm" onClick={handleAnalyzeErrors} disabled={isAnalyzing}>
            <Zap className="h-4 w-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
          </Button>
        </div>
      </div>

      {/* Error Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Errors</p>
                <p className="text-2xl font-bold">{localErrors.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold">{errorCounts.warn || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold">{errorCounts.error || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="errors" className="w-full">
        <TabsList>
          <TabsTrigger value="errors">Recent Errors</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          {localErrors.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Bug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No console errors detected</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Console monitoring is active and will capture errors automatically
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {localErrors.map((error, index) => (
                <Card key={index} className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getErrorIcon(error.level)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={error.level === 'error' ? 'destructive' : 'secondary'}>
                              {error.level.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(error.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm font-medium break-words">{error.message}</p>
                          {error.source && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {error.source}:{error.line}:{error.column}
                            </p>
                          )}
                          {error.stack && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer">
                                Stack trace
                              </summary>
                              <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap font-mono">
                                {error.stack}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {analysis ? (
            <Card>
              <CardHeader>
                <CardTitle>AI Error Analysis</CardTitle>
                <CardDescription>
                  Intelligent analysis and solutions for your console errors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap">{analysis}</div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No analysis available</p>
                  {localErrors.length > 0 ? (
                    <Button onClick={handleAnalyzeErrors} disabled={isAnalyzing}>
                      <Zap className="h-4 w-4 mr-2" />
                      {isAnalyzing ? 'Analyzing Errors...' : 'Analyze Current Errors'}
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Errors will be analyzed automatically when detected
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {serverAnalysis && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Server Analysis:</strong> {JSON.stringify(serverAnalysis)}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}