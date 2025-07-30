import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [selectedCategory, setSelectedCategory] = useState("getting-started");

  const helpCategories = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: "fas fa-rocket",
    },
    {
      id: "ai-commands",
      title: "AI Commands",
      icon: "fas fa-brain",
    },
    {
      id: "site-management",
      title: "Site Management", 
      icon: "fas fa-cog",
    },
    {
      id: "themes-plugins",
      title: "Themes & Plugins",
      icon: "fas fa-palette",
    },
    {
      id: "security-performance",
      title: "Security & Performance",
      icon: "fas fa-shield-alt",
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      icon: "fas fa-tools",
    },
  ];

  const gettingStartedContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-play-circle text-blue-500"></i>
            <span>Quick Start Guide</span>
          </CardTitle>
          <CardDescription>Get up and running in minutes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
            <div>
              <h4 className="font-medium">Connect Your WordPress Site</h4>
              <p className="text-sm text-slate-600">Click "Connect WordPress Site" and enter your site URL, username, and app password.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
            <div>
              <h4 className="font-medium">Start Chatting with AI</h4>
              <p className="text-sm text-slate-600">Use natural language to describe what you want to do with your site.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
            <div>
              <h4 className="font-medium">Review and Execute</h4>
              <p className="text-sm text-slate-600">The AI will suggest actions. Review them and click "Execute" to apply changes.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setting Up WordPress Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">Application Password (Recommended)</h4>
            <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
              <li>Log into your WordPress admin dashboard</li>
              <li>Go to Users → Your Profile</li>
              <li>Scroll to "Application Passwords"</li>
              <li>Enter "WP AI Manager" as the name</li>
              <li>Click "Add New Application Password"</li>
              <li>Copy the generated password (save it securely)</li>
            </ol>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              <i className="fas fa-info-circle mr-1"></i>
              Application passwords are more secure than regular passwords and can be revoked anytime.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const aiCommandsContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Natural Language Commands</CardTitle>
          <CardDescription>Speak to your WordPress site in plain English</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Theme Customization</h4>
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">
                "Change my header color to blue"
              </Badge>
              <Badge variant="outline" className="text-xs">
                "Make my site look more modern"
              </Badge>
              <Badge variant="outline" className="text-xs">
                "Update the font to something more professional"
              </Badge>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Plugin Management</h4>
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">
                "Install a contact form plugin"
              </Badge>
              <Badge variant="outline" className="text-xs">
                "Add security plugins to protect my site"
              </Badge>
              <Badge variant="outline" className="text-xs">
                "Install SEO optimization tools"
              </Badge>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Content Management</h4>
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">
                "Create a new about page"
              </Badge>
              <Badge variant="outline" className="text-xs">
                "Update my homepage content"
              </Badge>
              <Badge variant="outline" className="text-xs">
                "Add a blog post about our services"
              </Badge>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Performance & SEO</h4>
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">
                "Optimize my site for speed"
              </Badge>
              <Badge variant="outline" className="text-xs">
                "Improve my SEO rankings"
              </Badge>
              <Badge variant="outline" className="text-xs">
                "Set up Google Analytics"
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Providers</CardTitle>
          <CardDescription>Choose your preferred AI assistant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <i className="fas fa-robot text-blue-500"></i>
                <h4 className="font-medium">OpenAI GPT-4</h4>
              </div>
              <p className="text-sm text-slate-600">Advanced reasoning and creative tasks</p>
            </div>
            <div className="border rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <i className="fas fa-brain text-green-500"></i>
                <h4 className="font-medium">Google Gemini</h4>
              </div>
              <p className="text-sm text-slate-600">Fast responses and multimodal capabilities</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const siteManagementContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Managing Multiple Sites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Adding Sites</h4>
            <p className="text-sm text-slate-600 mb-2">
              You can connect multiple WordPress sites to manage them all from one dashboard.
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Click the "+" button in the sidebar</li>
              <li>• Enter each site's details</li>
              <li>• Use different app passwords for each site</li>
              <li>• Switch between sites using the sidebar</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Site Monitoring</h4>
            <p className="text-sm text-slate-600 mb-2">
              Keep track of your sites' health and status.
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Green indicator: Site is online and healthy</li>
              <li>• Yellow indicator: Minor issues detected</li>
              <li>• Red indicator: Site is offline or has problems</li>
              <li>• Click "Check Status" for detailed information</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Site Actions</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Visit Site - Opens your site</li>
                <li>• Backup - Creates a backup</li>
                <li>• Clear Cache - Improves performance</li>
                <li>• Check Updates - Shows available updates</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">AI Actions</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Theme recommendations</li>
                <li>• Plugin suggestions</li>
                <li>• Security scans</li>
                <li>• Performance analysis</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const themesPluginsContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Changing Themes</h4>
            <p className="text-sm text-slate-600 mb-2">
              Ask the AI to help you find and install the perfect theme.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Example:</strong> "I need a modern business theme with a clean design"
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Customization Options</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Colors and branding</li>
              <li>• Typography and fonts</li>
              <li>• Layout and structure</li>
              <li>• Header and footer design</li>
              <li>• Mobile responsiveness</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plugin Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Essential Plugins</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <i className="fas fa-shield-alt text-green-500 w-4"></i>
                <span className="text-sm">Security plugins (Wordfence, Sucuri)</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-search text-blue-500 w-4"></i>
                <span className="text-sm">SEO plugins (Yoast, RankMath)</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-tachometer-alt text-orange-500 w-4"></i>
                <span className="text-sm">Performance plugins (WP Rocket, W3 Total Cache)</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-envelope text-purple-500 w-4"></i>
                <span className="text-sm">Contact forms (Contact Form 7, WPForms)</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Installation Methods</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• AI-assisted recommendations</li>
              <li>• Automatic installation and configuration</li>
              <li>• Compatibility checking</li>
              <li>• Settings optimization</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const securityPerformanceContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Security Essentials</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Keep WordPress and plugins updated</li>
              <li>• Use strong, unique passwords</li>
              <li>• Enable two-factor authentication</li>
              <li>• Install security plugins</li>
              <li>• Regular security scans</li>
              <li>• Limit login attempts</li>
            </ul>
          </div>

          <div className="bg-amber-50 p-3 rounded-lg">
            <p className="text-sm text-amber-700">
              <i className="fas fa-exclamation-triangle mr-1"></i>
              Always create backups before making security changes
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Optimization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Speed Optimization</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Enable caching plugins</li>
              <li>• Optimize images and media</li>
              <li>• Minimize HTTP requests</li>
              <li>• Use CDN services</li>
              <li>• Clean up database</li>
              <li>• Remove unused plugins</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Monitoring Tools</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Google PageSpeed Insights</li>
              <li>• GTmetrix analysis</li>
              <li>• WordPress health checks</li>
              <li>• Uptime monitoring</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const troubleshootingContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Common Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Connection Problems</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Check your site URL is correct</li>
              <li>• Verify app password is active</li>
              <li>• Ensure REST API is enabled</li>
              <li>• Check hosting restrictions</li>
              <li>• Try using HTTPS instead of HTTP</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">AI Response Issues</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Be more specific in your requests</li>
              <li>• Check API key is correctly configured</li>
              <li>• Try different AI providers if available</li>
              <li>• Refresh the page and try again</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Action Execution Failures</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Check user permissions in WordPress</li>
              <li>• Verify plugins support REST API</li>
              <li>• Try the action in smaller steps</li>
              <li>• Contact your hosting provider</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Getting Help</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <i className="fas fa-comments text-blue-500"></i>
              <span className="text-sm">Ask the AI for help with specific problems</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-book text-green-500"></i>
              <span className="text-sm">Check WordPress documentation</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-users text-purple-500"></i>
              <span className="text-sm">Visit WordPress support forums</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const getContent = (categoryId: string) => {
    switch (categoryId) {
      case "getting-started":
        return gettingStartedContent;
      case "ai-commands":
        return aiCommandsContent;
      case "site-management":
        return siteManagementContent;
      case "themes-plugins":
        return themesPluginsContent;
      case "security-performance":
        return securityPerformanceContent;
      case "troubleshooting":
        return troubleshootingContent;
      default:
        return gettingStartedContent;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <i className="fas fa-question-circle text-blue-500"></i>
            <span>WP AI Manager Help Center</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 border-r border-slate-200 pr-4">
            <nav className="space-y-2">
              {helpCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <i className={`${category.icon} w-5`}></i>
                    <span className="text-sm font-medium">{category.title}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 pl-6 overflow-y-auto">
            {getContent(selectedCategory)}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close Help
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}