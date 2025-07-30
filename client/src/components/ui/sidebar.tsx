import { Button } from "@/components/ui/button";

interface SidebarProps {
  sites: any[];
  selectedSiteId: string | null;
  onSiteSelect: (siteId: string) => void;
  onAddSite: () => void;
  user: any;
}

export function Sidebar({ sites, selectedSiteId, onSiteSelect, onAddSite, user }: SidebarProps) {
  const selectedSite = sites.find(site => site.id === selectedSiteId);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-slate-200 flex flex-col">
      {/* Logo Area */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-white text-lg"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900">WP AI Manager</h1>
            <p className="text-xs text-slate-500">Intelligent WP Control</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium">
          <i className="fas fa-comments w-5"></i>
          <span>AI Chat</span>
        </a>
        <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
          <i className="fas fa-tachometer-alt w-5"></i>
          <span>Dashboard</span>
        </a>
        <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
          <i className="fas fa-palette w-5"></i>
          <span>Theme Editor</span>
        </a>
        <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
          <i className="fas fa-plug w-5"></i>
          <span>Plugins</span>
        </a>
        <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
          <i className="fas fa-shield-alt w-5"></i>
          <span>Security</span>
        </a>
        <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
          <i className="fas fa-chart-line w-5"></i>
          <span>Analytics</span>
        </a>

        {/* Sites Section */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-900">WordPress Sites</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddSite}
              className="h-6 w-6 p-0"
            >
              <i className="fas fa-plus text-xs"></i>
            </Button>
          </div>
          
          <div className="space-y-1">
            {sites.map((site) => (
              <button
                key={site.id}
                onClick={() => onSiteSelect(site.id)}
                className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                  selectedSiteId === site.id
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    site.isActive ? "bg-green-500" : "bg-gray-400"
                  }`}></div>
                  <span className="truncate">{site.name}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate">
                  {new URL(site.url).hostname}
                </div>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Site Connection Status */}
      {selectedSite && (
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 truncate">{selectedSite.name}</p>
              <p className="text-xs text-green-600">Connected</p>
            </div>
            <button className="text-green-600 hover:text-green-700">
              <i className="fas fa-cog text-sm"></i>
            </button>
          </div>
        </div>
      )}

      {/* User Section */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3 mb-3">
          <img 
            src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32"} 
            alt="User Avatar" 
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.firstName || user?.email || "User"}
            </p>
            <p className="text-xs text-slate-500">WordPress Manager</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full"
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          Logout
        </Button>
      </div>
    </div>
  );
}
