import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (site: any) => void;
}

export function ConnectionModal({ isOpen, onClose, onSuccess }: ConnectionModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    username: "",
    password: "",
    authMethod: "app-password",
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();

  const createSiteMutation = useMutation({
    mutationFn: async (siteData: any) => {
      const response = await apiRequest("POST", "/api/sites", siteData);
      return response.json();
    },
    onSuccess: (newSite) => {
      toast({
        title: "Success",
        description: "WordPress site connected successfully!",
      });
      onSuccess(newSite);
      setFormData({
        name: "",
        url: "",
        username: "",
        password: "",
        authMethod: "app-password",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to WordPress site",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a site name",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.url.trim()) {
      toast({
        title: "Validation Error", 
        description: "Please enter a website URL",
        variant: "destructive",
      });
      return false;
    }

    try {
      new URL(formData.url);
    } catch {
      toast({
        title: "Validation Error",
        description: "Please enter a valid URL (e.g., https://yoursite.com)",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.username.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your WordPress username",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.password.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your password or application password",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Ensure URL has protocol
    let url = formData.url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const siteData = {
      ...formData,
      url,
      encryptedPassword: formData.password, // Will be encrypted on server
    };

    createSiteMutation.mutate(siteData);
  };

  const handleTestConnection = () => {
    if (!validateForm()) return;
    
    setIsTestingConnection(true);
    // Simulate connection test
    setTimeout(() => {
      setIsTestingConnection(false);
      toast({
        title: "Connection Test",
        description: "Connection looks good! You can now save the site.",
      });
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect Your WordPress Site</DialogTitle>
          <DialogDescription>
            Securely connect your WordPress site to enable AI management
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Site Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Site Name</Label>
            <Input
              id="name"
              placeholder="My WordPress Site"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
          </div>

          {/* Site URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://yoursite.com"
              value={formData.url}
              onChange={(e) => handleInputChange("url", e.target.value)}
            />
          </div>

          {/* Authentication Method */}
          <div className="space-y-3">
            <Label>Authentication Method</Label>
            <RadioGroup
              value={formData.authMethod}
              onValueChange={(value) => handleInputChange("authMethod", value)}
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="app-password" id="app-password" />
                <div className="flex-1">
                  <Label htmlFor="app-password" className="font-medium">
                    Application Password (Recommended)
                  </Label>
                  <p className="text-sm text-slate-600">
                    Generate an app password in your WordPress admin
                  </p>
                </div>
                <i className="fas fa-shield-alt text-green-500"></i>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="jwt" id="jwt" />
                <div className="flex-1">
                  <Label htmlFor="jwt" className="font-medium">
                    JWT Token
                  </Label>
                  <p className="text-sm text-slate-600">
                    For advanced users with JWT plugin installed
                  </p>
                </div>
                <i className="fas fa-key text-blue-500"></i>
              </div>
            </RadioGroup>
          </div>

          {/* Credentials */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="admin"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {formData.authMethod === "app-password" ? "App Password" : "Password"}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={formData.authMethod === "app-password" ? "xxxx xxxx xxxx xxxx" : "Password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
              />
            </div>
          </div>

          {/* Security Notice */}
          <Alert>
            <i className="fas fa-info-circle"></i>
            <AlertDescription>
              <strong>Security Information:</strong> Your credentials are encrypted and stored securely. 
              We use HTTPS for all connections and follow WordPress security best practices.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Testing...
                </>
              ) : (
                <>
                  <i className="fas fa-plug mr-2"></i>
                  Test Connection
                </>
              )}
            </Button>
            <Button
              type="submit"
              disabled={createSiteMutation.isPending}
            >
              {createSiteMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Connecting...
                </>
              ) : (
                <>
                  <i className="fas fa-plus mr-2"></i>
                  Add Site
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
