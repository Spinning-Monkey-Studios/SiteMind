import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Users, CreditCard, Code, DollarSign, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: string;
  features: string[];
  limits: any;
  isActive: boolean;
  sortOrder: number;
}

interface PaymentProvider {
  id: string;
  name: string;
  provider: string;
  isEnabled: boolean;
  isDefault: boolean;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  isAdmin: boolean;
  isDeveloper: boolean;
  createdAt: string;
}

export default function Admin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [codeView, setCodeView] = useState<'frontend' | 'backend'>('frontend');

  // Fetch admin data
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['/api/admin/subscription-plans'],
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['/api/admin/payment-providers'],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  const { data: frontendCode } = useQuery({
    queryKey: ['/api/admin/code/frontend'],
    enabled: codeView === 'frontend',
  });

  const { data: backendCode } = useQuery({
    queryKey: ['/api/admin/code/backend'],
    enabled: codeView === 'backend',
  });

  // Mutations
  const updatePlanMutation = useMutation({
    mutationFn: async (plan: Partial<SubscriptionPlan>) => {
      return await apiRequest(`/api/admin/subscription-plans${plan.id ? `/${plan.id}` : ''}`, {
        method: plan.id ? 'PUT' : 'POST',
        body: JSON.stringify(plan),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscription-plans'] });
      toast({ title: "Plan updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update plan", variant: "destructive" });
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: async (provider: Partial<PaymentProvider & { config: any }>) => {
      return await apiRequest(`/api/admin/payment-providers${provider.id ? `/${provider.id}` : ''}`, {
        method: provider.id ? 'PUT' : 'POST',
        body: JSON.stringify(provider),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment-providers'] });
      toast({ title: "Payment provider updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update payment provider", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      return await apiRequest(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "User updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update user", variant: "destructive" });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest(`/api/admin/subscription-plans/${planId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscription-plans'] });
      toast({ title: "Plan deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete plan", variant: "destructive" });
    },
  });

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price / 100);
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="code">Code View</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                    <p className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                    <p className="text-2xl font-bold">{formatPrice(stats?.monthlyRevenue || 0)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Connected Sites</p>
                    <p className="text-2xl font-bold">{stats?.totalSites || 0}</p>
                  </div>
                  <Settings className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user: User) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        {user.isAdmin && <Badge variant="destructive">Admin</Badge>}
                        {user.isDeveloper && <Badge variant="secondary">Developer</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{user.subscriptionTier}</Badge>
                        <Badge variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                          {user.subscriptionStatus}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateUserMutation.mutate({
                          userId: user.id,
                          updates: { isDeveloper: !user.isDeveloper }
                        })}
                      >
                        {user.isDeveloper ? 'Remove Dev' : 'Make Dev'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateUserMutation.mutate({
                          userId: user.id,
                          updates: { isAdmin: !user.isAdmin }
                        })}
                      >
                        {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Subscription Plans</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedPlan(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedPlan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
                </DialogHeader>
                <PlanEditor plan={selectedPlan} onSave={updatePlanMutation.mutate} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {plans.map((plan: SubscriptionPlan) => (
              <Card key={plan.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                        <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{plan.description}</p>
                      <p className="text-2xl font-bold">
                        {formatPrice(plan.price, plan.currency)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{plan.billingPeriod}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {plan.features.map((feature: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedPlan(plan)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Plan</DialogTitle>
                          </DialogHeader>
                          <PlanEditor plan={plan} onSave={updatePlanMutation.mutate} />
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{plan.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePlanMutation.mutate(plan.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Payment Providers</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedProvider(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Provider
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedProvider ? 'Edit Provider' : 'Add Provider'}</DialogTitle>
                </DialogHeader>
                <PaymentProviderEditor provider={selectedProvider} onSave={updateProviderMutation.mutate} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {providers.map((provider: PaymentProvider) => (
              <Card key={provider.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{provider.name}</h3>
                          {provider.isDefault && <Badge>Default</Badge>}
                        </div>
                        <p className="text-muted-foreground capitalize">{provider.provider}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={provider.isEnabled}
                        onCheckedChange={(enabled) => updateProviderMutation.mutate({
                          ...provider,
                          isEnabled: enabled
                        })}
                      />
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedProvider(provider)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Configure
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Configure {provider.name}</DialogTitle>
                          </DialogHeader>
                          <PaymentProviderEditor provider={provider} onSave={updateProviderMutation.mutate} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="code" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Code View</h2>
            <Select value={codeView} onValueChange={(value: 'frontend' | 'backend') => setCodeView(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frontend">Frontend</SelectItem>
                <SelectItem value="backend">Backend</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                {codeView === 'frontend' ? 'Frontend Code' : 'Backend Code'}
              </CardTitle>
              <CardDescription>
                View and analyze the application code structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-sm">
                  <code>
                    {codeView === 'frontend' ? frontendCode?.structure : backendCode?.structure}
                  </code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <h2 className="text-2xl font-semibold">Platform Configuration</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>
                Configure default API keys used by developer accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                These keys are used automatically for developer accounts. Regular users will need to provide their own API keys.
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>OpenAI API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.openai ? 'text' : 'password'}
                        value="sk-••••••••••••••••••••••••••••••••••••••••••••••••••"
                        readOnly
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSecretVisibility('openai')}
                      >
                        {showSecrets.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Gemini API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.gemini ? 'text' : 'password'}
                        value="AIza••••••••••••••••••••••••••••••••••••••"
                        readOnly
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSecretVisibility('gemini')}
                      >
                        {showSecrets.gemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Plan Editor Component
function PlanEditor({ plan, onSave }: { plan: SubscriptionPlan | null; onSave: (plan: any) => void }) {
  const [formData, setFormData] = useState(plan || {
    name: '',
    tier: '',
    description: '',
    price: 0,
    currency: 'USD',
    billingPeriod: 'monthly',
    features: [],
    limits: {},
    isActive: true,
    sortOrder: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Plan Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="tier">Tier</Label>
          <Select value={formData.tier} onValueChange={(value) => setFormData(prev => ({ ...prev, tier: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="price">Price (cents)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) }))}
          />
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="billingPeriod">Billing Period</Label>
          <Select value={formData.billingPeriod} onValueChange={(value) => setFormData(prev => ({ ...prev, billingPeriod: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit">Save Plan</Button>
      </DialogFooter>
    </form>
  );
}

// Payment Provider Editor Component
function PaymentProviderEditor({ provider, onSave }: { provider: PaymentProvider | null; onSave: (provider: any) => void }) {
  const [formData, setFormData] = useState(provider || {
    name: '',
    provider: '',
    isEnabled: false,
    isDefault: false,
    config: {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Provider Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="provider">Provider Type</Label>
          <Select value={formData.provider} onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stripe">Stripe</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="lemonsqueezy">LemonSqueezy</SelectItem>
              <SelectItem value="paddle">Paddle</SelectItem>
              <SelectItem value="gumroad">Gumroad</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isDefault"
          checked={formData.isDefault}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
        />
        <Label htmlFor="isDefault">Set as default provider</Label>
      </div>

      <DialogFooter>
        <Button type="submit">Save Provider</Button>
      </DialogFooter>
    </form>
  );
}