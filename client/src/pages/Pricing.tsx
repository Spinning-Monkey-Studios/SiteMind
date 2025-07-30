import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle, Star, Zap, Users, Code, Palette, Monitor } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: string;
  features: string[];
  limits: {
    maxSites: number;
    maxApiCalls: number;
    maxStorageGB: number;
    hasAiAccess: boolean;
    hasGraphicsAccess: boolean;
    hasConsoleMonitoring: boolean;
    hasCustomGraphics: boolean;
    hasPrioritySupport: boolean;
    hasWhiteLabel: boolean;
    hasCodeAccess: boolean;
  };
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

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  // Fetch subscription plans
  const { data: plans = [] } = useQuery({
    queryKey: ['/api/subscription-plans', billingPeriod],
  });

  // Fetch payment providers
  const { data: providers = [] } = useQuery({
    queryKey: ['/api/payment-providers'],
  });

  // Create checkout session
  const checkoutMutation = useMutation({
    mutationFn: async ({ planId, providerId }: { planId: string; providerId?: string }) => {
      return await apiRequest('/api/checkout/create', {
        method: 'POST',
        body: JSON.stringify({ planId, providerId }),
      });
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast({
          title: "Checkout session created",
          description: "Redirecting to payment...",
        });
      }
    },
    onError: () => {
      toast({
        title: "Failed to create checkout",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price / 100);
  };

  const getYearlyPrice = (monthlyPrice: number) => {
    return monthlyPrice * 12 * 0.83; // 17% discount for yearly
  };

  const handleSubscribe = (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to subscribe",
        variant: "destructive",
      });
      return;
    }

    setSelectedPlan(plan);
  };

  const handleCheckout = () => {
    if (!selectedPlan) return;

    const defaultProvider = providers.find((p: PaymentProvider) => p.isDefault);
    const providerId = selectedProvider || defaultProvider?.id;

    if (!providerId) {
      toast({
        title: "No payment provider available",
        description: "Please contact support to complete your purchase",
        variant: "destructive",
      });
      return;
    }

    checkoutMutation.mutate({
      planId: selectedPlan.id,
      providerId,
    });
  };

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Users className="h-6 w-6" />;
      case 'basic': return <Zap className="h-6 w-6" />;
      case 'pro': return <Star className="h-6 w-6" />;
      case 'enterprise': return <Code className="h-6 w-6" />;
      default: return <Users className="h-6 w-6" />;
    }
  };

  const isCurrentPlan = (tier: string) => {
    return user?.subscriptionTier === tier && user?.subscriptionStatus === 'active';
  };

  const getDisplayPrice = (plan: SubscriptionPlan) => {
    if (plan.price === 0) return 'Free';
    
    const price = billingPeriod === 'yearly' ? getYearlyPrice(plan.price) : plan.price;
    const formatted = formatPrice(price, plan.currency);
    
    if (billingPeriod === 'yearly') {
      return `${formatted}/year`;
    }
    return `${formatted}/month`;
  };

  const filteredPlans = plans
    .filter((plan: SubscriptionPlan) => plan.isActive && plan.tier !== 'developer')
    .sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Powerful WordPress management with AI assistance. Start free and upgrade as you grow.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <Label htmlFor="billing-toggle">Monthly</Label>
          <Switch
            id="billing-toggle"
            checked={billingPeriod === 'yearly'}
            onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
          />
          <Label htmlFor="billing-toggle">
            Yearly <Badge variant="secondary" className="ml-1">Save 17%</Badge>
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredPlans.map((plan: SubscriptionPlan) => (
          <Card key={plan.id} className={`relative ${plan.tier === 'pro' ? 'border-primary shadow-lg scale-105' : ''}`}>
            {plan.tier === 'pro' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="px-3 py-1">Most Popular</Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                {getPlanIcon(plan.tier)}
              </div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription className="min-h-[3rem]">{plan.description}</CardDescription>
              <div className="text-3xl font-bold">
                {getDisplayPrice(plan)}
              </div>
              {billingPeriod === 'yearly' && plan.price > 0 && (
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(plan.price)}/month
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4 border-t">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>WordPress Sites:</span>
                    <span>{plan.limits.maxSites === -1 ? 'Unlimited' : plan.limits.maxSites}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>API Calls/month:</span>
                    <span>{plan.limits.maxApiCalls === -1 ? 'Unlimited' : plan.limits.maxApiCalls.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage:</span>
                    <span>{plan.limits.maxStorageGB === -1 ? 'Unlimited' : `${plan.limits.maxStorageGB}GB`}</span>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full" 
                variant={plan.tier === 'pro' ? 'default' : 'outline'}
                disabled={isCurrentPlan(plan.tier) || checkoutMutation.isPending}
                onClick={() => handleSubscribe(plan)}
              >
                {isCurrentPlan(plan.tier) 
                  ? 'Current Plan' 
                  : plan.price === 0 
                    ? 'Get Started Free' 
                    : 'Subscribe Now'
                }
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enterprise Contact Section */}
      <Card className="bg-muted/50">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Need Something Custom?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Looking for custom integrations, on-premise deployment, or special pricing? 
              We'd love to work with you to create a solution that fits your needs.
            </p>
            <Button size="lg">Contact Sales</Button>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Subscription</DialogTitle>
            <DialogDescription>
              You're subscribing to {selectedPlan?.name} - {getDisplayPrice(selectedPlan!)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Payment Method</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose payment method" />
                </SelectTrigger>
                <SelectContent>
                  {providers.filter((p: PaymentProvider) => p.isEnabled).map((provider: PaymentProvider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name} {provider.isDefault && '(Default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setSelectedPlan(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCheckout}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? 'Creating...' : 'Continue to Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <Card>
          <CardContent className="p-6 text-center">
            <Palette className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">AI-Powered Graphics</h3>
            <p className="text-muted-foreground text-sm">
              Generate custom graphics and find royalty-free images with AI assistance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Monitor className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Console Monitoring</h3>
            <p className="text-muted-foreground text-sm">
              Automatic error detection and AI-powered debugging assistance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Code className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">WordPress Integration</h3>
            <p className="text-muted-foreground text-sm">
              Direct integration with WordPress REST API for seamless management
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}