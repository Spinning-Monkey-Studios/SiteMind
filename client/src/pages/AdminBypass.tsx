import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function AdminBypass() {
  const [masterKey, setMasterKey] = useState("");
  const [bypassCode, setBypassCode] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  // Master key bypass mutation
  const masterKeyMutation = useMutation({
    mutationFn: async (key: string) => {
      return apiRequest("POST", "/api/admin/bypass/master-key", { masterKey: key });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Admin access granted via master key! Page will reload.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setTimeout(() => window.location.reload(), 1500);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Invalid master key. Please check and try again.",
        variant: "destructive",
      });
    },
  });

  // Bypass code mutation
  const bypassCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest("POST", "/api/admin/bypass/code", { bypassCode: code });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Admin access granted via bypass code! Page will reload.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setTimeout(() => window.location.reload(), 1500);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Invalid or expired bypass code.",
        variant: "destructive",
      });
    },
  });

  // Bypass config query (only for admins)
  const { data: bypassConfig } = useQuery({
    queryKey: ["/api/admin/bypass/config"],
    enabled: user?.isAdmin || false,
  });

  // Generate new bypass code mutation
  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/bypass/generate-code");
    },
    onSuccess: (data: any) => {
      toast({
        title: "Code Generated",
        description: `New bypass code: ${data.code}`,
        duration: 10000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bypass/config"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate bypass code.",
        variant: "destructive",
      });
    },
  });

  const handleMasterKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterKey.trim()) {
      masterKeyMutation.mutate(masterKey);
    }
  };

  const handleBypassCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bypassCode.trim()) {
      bypassCodeMutation.mutate(bypassCode);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Bypass Panel</h1>
        <p className="text-muted-foreground mt-2">
          Override payment requirements and gain admin access
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Master Key Bypass */}
        <Card>
          <CardHeader>
            <CardTitle>Master Key Access</CardTitle>
            <CardDescription>
              Use the admin master key to gain immediate full access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMasterKeySubmit} className="space-y-4">
              <div>
                <Label htmlFor="masterKey">Master Key</Label>
                <Input
                  id="masterKey"
                  type="password"
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  placeholder="Enter admin master key"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={masterKeyMutation.isPending}
              >
                {masterKeyMutation.isPending ? "Applying..." : "Apply Master Key"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Bypass Code */}
        <Card>
          <CardHeader>
            <CardTitle>Bypass Code</CardTitle>
            <CardDescription>
              Use a one-time bypass code for admin access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBypassCodeSubmit} className="space-y-4">
              <div>
                <Label htmlFor="bypassCode">Bypass Code</Label>
                <Input
                  id="bypassCode"
                  value={bypassCode}
                  onChange={(e) => setBypassCode(e.target.value)}
                  placeholder="Enter bypass code"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={bypassCodeMutation.isPending}
              >
                {bypassCodeMutation.isPending ? "Applying..." : "Apply Bypass Code"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Access Level</CardTitle>
            <CardDescription>
              Your current subscription and access status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Subscription Tier:</span>
              <Badge variant={user?.subscriptionTier === 'developer' ? 'default' : 'secondary'}>
                {user?.subscriptionTier || 'free'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Admin Access:</span>
              <Badge variant={user?.isAdmin ? 'default' : 'destructive'}>
                {user?.isAdmin ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Developer Access:</span>
              <Badge variant={user?.isDeveloper ? 'default' : 'destructive'}>
                {user?.isDeveloper ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Status:</span>
              <Badge variant={user?.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                {user?.subscriptionStatus || 'inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Admin Management (only for admins) */}
        {user?.isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Management</CardTitle>
              <CardDescription>
                Manage bypass codes and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => generateCodeMutation.mutate()}
                disabled={generateCodeMutation.isPending}
                className="w-full"
              >
                {generateCodeMutation.isPending ? "Generating..." : "Generate New Bypass Code"}
              </Button>
              
              {bypassConfig && (
                <div className="space-y-2">
                  <Separator />
                  <h4 className="font-semibold">Configuration</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Admin Emails:</strong> {bypassConfig.adminEmails?.length || 0}</p>
                    <p><strong>Developer Emails:</strong> {bypassConfig.developerEmails?.length || 0}</p>
                    <p><strong>Active Codes:</strong> {bypassConfig.bypassCodes?.length || 0}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Access Methods</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• <strong>Auto-Detection:</strong> Admin emails are automatically granted access</li>
          <li>• <strong>Master Key:</strong> Environment-configured key for owner access</li>
          <li>• <strong>Bypass Codes:</strong> One-time codes that can be generated and shared</li>
          <li>• <strong>Database Flag:</strong> Direct database modification of isAdmin/isDeveloper</li>
        </ul>
      </div>
    </div>
  );
}