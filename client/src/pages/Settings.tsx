import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Key, Server, Settings as SettingsIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { GraphicsPanel } from '@/components/ai/graphics-panel';
import { ConsoleErrorsPanel } from '@/components/ai/console-errors';

interface ApiKey {
  id: string;
  provider: string;
  keyName: string;
  isActive: boolean;
  hasKey: boolean;
  lastUsed: string | null;
  createdAt: string;
}

interface HostingAccount {
  id: string;
  provider: string;
  accountName: string;
  serverUrl: string;
  isActive: boolean;
  hasCredentials: boolean;
  lastConnected: string | null;
  createdAt: string;
}

interface AuthProvider {
  name: string;
  displayName: string;
  loginUrl: string;
  enabled: boolean;
  requiredEnvVars: string[];
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingApiKey, setIsAddingApiKey] = useState(false);
  const [isAddingHostingAccount, setIsAddingHostingAccount] = useState(false);
  const [newApiKey, setNewApiKey] = useState({ provider: '', keyName: '', encryptedKey: '' });
  const [newHostingAccount, setNewHostingAccount] = useState({
    provider: '',
    accountName: '',
    serverUrl: '',
    encryptedCredentials: '{"username": "", "password": "", "apiKey": ""}'
  });

  // Fetch API keys
  const { data: apiKeys = [], isLoading: loadingApiKeys } = useQuery({
    queryKey: ['/api/user/api-keys'],
  });

  // Fetch hosting accounts
  const { data: hostingAccounts = [], isLoading: loadingHostingAccounts } = useQuery({
    queryKey: ['/api/user/hosting-accounts'],
  });

  // Fetch auth providers
  const { data: authProviders = [], isLoading: loadingAuthProviders } = useQuery({
    queryKey: ['/api/auth/providers'],
  });

  // Add API key mutation
  const addApiKeyMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/user/api-keys', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/api-keys'] });
      setIsAddingApiKey(false);
      setNewApiKey({ provider: '', keyName: '', encryptedKey: '' });
      toast({
        title: "Success",
        description: "API key added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add API key",
        variant: "destructive",
      });
    },
  });

  // Delete API key mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      return await apiRequest(`/api/user/api-keys/${keyId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/api-keys'] });
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    },
  });

  // Add hosting account mutation
  const addHostingAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/user/hosting-accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/hosting-accounts'] });
      setIsAddingHostingAccount(false);
      setNewHostingAccount({
        provider: '',
        accountName: '',
        serverUrl: '',
        encryptedCredentials: '{"username": "", "password": "", "apiKey": ""}'
      });
      toast({
        title: "Success",
        description: "Hosting account added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add hosting account",
        variant: "destructive",
      });
    },
  });

  // Delete hosting account mutation
  const deleteHostingAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return await apiRequest(`/api/user/hosting-accounts/${accountId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/hosting-accounts'] });
      toast({
        title: "Success",
        description: "Hosting account deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete hosting account",
        variant: "destructive",
      });
    },
  });

  const handleAddApiKey = () => {
    if (!newApiKey.provider || !newApiKey.keyName || !newApiKey.encryptedKey) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    addApiKeyMutation.mutate(newApiKey);
  };

  const handleAddHostingAccount = () => {
    if (!newHostingAccount.provider || !newHostingAccount.accountName || !newHostingAccount.serverUrl) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    // Validate JSON credentials
    try {
      JSON.parse(newHostingAccount.encryptedCredentials);
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON format in credentials",
        variant: "destructive",
      });
      return;
    }
    
    addHostingAccountMutation.mutate(newHostingAccount);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="hosting-accounts">Hosting</TabsTrigger>
          <TabsTrigger value="ai-graphics">AI Graphics</TabsTrigger>
          <TabsTrigger value="console-monitor">Errors</TabsTrigger>
          <TabsTrigger value="authentication">Auth</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">API Keys</h2>
              <p className="text-muted-foreground">Manage your AI service API keys</p>
            </div>
            <Dialog open={isAddingApiKey} onOpenChange={setIsAddingApiKey}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add API Key</DialogTitle>
                  <DialogDescription>
                    Add a new API key for AI services like OpenAI, Google, or Anthropic.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="provider">Provider</Label>
                    <Select value={newApiKey.provider} onValueChange={(value) => setNewApiKey({...newApiKey, provider: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="gemini">Google (Gemini)</SelectItem>
                        <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="keyName">Key Name</Label>
                    <Input
                      id="keyName"
                      value={newApiKey.keyName}
                      onChange={(e) => setNewApiKey({...newApiKey, keyName: e.target.value})}
                      placeholder="e.g., OpenAI API Key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={newApiKey.encryptedKey}
                      onChange={(e) => setNewApiKey({...newApiKey, encryptedKey: e.target.value})}
                      placeholder="sk-..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingApiKey(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddApiKey} disabled={addApiKeyMutation.isPending}>
                    {addApiKeyMutation.isPending ? "Adding..." : "Add Key"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {loadingApiKeys ? (
              <div>Loading API keys...</div>
            ) : apiKeys.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Key className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No API keys configured. Add your first API key to start using AI features.
                  </p>
                </CardContent>
              </Card>
            ) : (
              apiKeys.map((apiKey: ApiKey) => (
                <Card key={apiKey.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">{apiKey.keyName}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{apiKey.provider}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                        {apiKey.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant={apiKey.hasKey ? "default" : "destructive"}>
                        {apiKey.hasKey ? "Configured" : "Missing"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteApiKeyMutation.mutate(apiKey.id)}
                        disabled={deleteApiKeyMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="hosting-accounts" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Hosting Accounts</h2>
              <p className="text-muted-foreground">Manage your web hosting and WordPress credentials</p>
            </div>
            <Dialog open={isAddingHostingAccount} onOpenChange={setIsAddingHostingAccount}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Hosting Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Hosting Account</DialogTitle>
                  <DialogDescription>
                    Connect your web hosting account for WordPress management.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="hostingProvider">Provider</Label>
                    <Select value={newHostingAccount.provider} onValueChange={(value) => setNewHostingAccount({...newHostingAccount, provider: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hosting provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpanel">cPanel</SelectItem>
                        <SelectItem value="bluehost">Bluehost</SelectItem>
                        <SelectItem value="godaddy">GoDaddy</SelectItem>
                        <SelectItem value="hostgator">HostGator</SelectItem>
                        <SelectItem value="siteground">SiteGround</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      value={newHostingAccount.accountName}
                      onChange={(e) => setNewHostingAccount({...newHostingAccount, accountName: e.target.value})}
                      placeholder="My hosting account"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serverUrl">Server/Control Panel URL</Label>
                    <Input
                      id="serverUrl"
                      value={newHostingAccount.serverUrl}
                      onChange={(e) => setNewHostingAccount({...newHostingAccount, serverUrl: e.target.value})}
                      placeholder="https://cpanel.example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="credentials">Credentials (JSON)</Label>
                    <Textarea
                      id="credentials"
                      value={newHostingAccount.encryptedCredentials}
                      onChange={(e) => setNewHostingAccount({...newHostingAccount, encryptedCredentials: e.target.value})}
                      placeholder='{"username": "your_username", "password": "your_password", "apiKey": "optional_api_key"}'
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter credentials in JSON format. All data is encrypted before storage.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingHostingAccount(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddHostingAccount} disabled={addHostingAccountMutation.isPending}>
                    {addHostingAccountMutation.isPending ? "Adding..." : "Add Account"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {loadingHostingAccounts ? (
              <div>Loading hosting accounts...</div>
            ) : hostingAccounts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Server className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No hosting accounts configured. Add your hosting credentials to manage WordPress sites.
                  </p>
                </CardContent>
              </Card>
            ) : (
              hostingAccounts.map((account: HostingAccount) => (
                <Card key={account.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Server className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">{account.accountName}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{account.provider}</p>
                        <p className="text-xs text-muted-foreground">{account.serverUrl}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={account.isActive ? "default" : "secondary"}>
                        {account.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant={account.hasCredentials ? "default" : "destructive"}>
                        {account.hasCredentials ? "Connected" : "No Credentials"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteHostingAccountMutation.mutate(account.id)}
                        disabled={deleteHostingAccountMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="ai-graphics" className="space-y-4">
          <GraphicsPanel />
        </TabsContent>

        <TabsContent value="console-monitor" className="space-y-4">
          <ConsoleErrorsPanel />
        </TabsContent>

        <TabsContent value="authentication" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Authentication Providers</h2>
            <p className="text-muted-foreground">Available login methods for your account</p>
          </div>

          <div className="grid gap-4">
            {loadingAuthProviders ? (
              <div>Loading authentication providers...</div>
            ) : (
              authProviders.providers?.map((provider: AuthProvider) => (
                <Card key={provider.name}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        {provider.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium">{provider.displayName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {provider.enabled ? "Available for login" : "Not configured"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={provider.enabled ? "default" : "secondary"}>
                        {provider.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      {provider.enabled && provider.name !== 'replit' && (
                        <Button size="sm" asChild>
                          <a href={provider.loginUrl}>
                            Connect
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )) || []
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Environment Variables Required</CardTitle>
              <CardDescription>
                Some authentication providers require environment variables to be configured by the administrator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm"><strong>Facebook:</strong> FACEBOOK_APP_ID, FACEBOOK_APP_SECRET</p>
                <p className="text-sm"><strong>Microsoft:</strong> MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET</p>
                <p className="text-sm text-muted-foreground">
                  Contact your administrator if you need additional login methods enabled.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}