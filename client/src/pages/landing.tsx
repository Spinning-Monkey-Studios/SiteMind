import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    // Check if running on localhost for development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      window.location.href = "/api/auth/dev-login";
    } else {
      window.location.href = "/api/login";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-robot text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">WP AI Manager</h1>
              <p className="text-slate-600">Intelligent WordPress Control</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Manage Your WordPress Site with AI
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Connect your WordPress site and use natural language commands to customize themes, 
            install plugins, and optimize your website—all through an intelligent AI assistant.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-palette text-blue-600 text-xl"></i>
              </div>
              <CardTitle>Theme Customization</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Change colors, fonts, and layouts with simple commands like 
                "Make my site more modern" or "Change the header to orange"
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-plug text-green-600 text-xl"></i>
              </div>
              <CardTitle>Plugin Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Install and configure plugins automatically. Just say 
                "Add a contact form" or "Install security plugins"
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-line text-purple-600 text-xl"></i>
              </div>
              <CardTitle>SEO & Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get AI-powered recommendations for SEO improvements, 
                performance optimization, and content enhancement
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Benefits */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Why Choose WP AI Manager?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-check text-white text-xs"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">No Technical Knowledge Required</h4>
                    <p className="text-slate-600 text-sm">Use plain English to manage your WordPress site</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-check text-white text-xs"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Secure & Safe</h4>
                    <p className="text-slate-600 text-sm">Your credentials are encrypted and stored securely</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-check text-white text-xs"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Works with Shared Hosting</h4>
                    <p className="text-slate-600 text-sm">Compatible with popular hosting providers</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-check text-white text-xs"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Active Site Monitoring</h4>
                    <p className="text-slate-600 text-sm">Regular health checks with alerts and recommendations</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-check text-white text-xs"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Intelligent Recommendations</h4>
                    <p className="text-slate-600 text-sm">Get AI-powered suggestions for improvements</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-check text-white text-xs"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Backup Recommendations</h4>
                    <p className="text-slate-600 text-sm">Safety checks before making major changes</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button onClick={handleLogin} size="lg" className="text-lg px-8 py-3">
            <i className="fas fa-sign-in-alt mr-2"></i>
            Get Started with AI WordPress Management
          </Button>
          <p className="text-sm text-slate-500 mt-4">
            Free plan available • Subscription for advanced features • Works with existing sites
          </p>
        </div>
      </div>
    </div>
  );
}
