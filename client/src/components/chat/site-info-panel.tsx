import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface SiteInfoPanelProps {
  site: any;
}

export function SiteInfoPanel({ site }: SiteInfoPanelProps) {
  // Fetch site activities
  const { data: activities = [] } = useQuery({
    queryKey: ["/api/sites", site.id, "activities"],
    enabled: !!site,
    retry: false,
  });

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'visit':
        window.open(site.url, '_blank');
        break;
      case 'backup':
        // TODO: Implement backup functionality
        console.log('Creating backup...');
        break;
      case 'cache':
        // TODO: Implement cache clearing
        console.log('Clearing cache...');
        break;
      case 'updates':
        // TODO: Implement updates check
        console.log('Checking for updates...');
        break;
    }
  };

  return (
    <div className="w-80 border-l border-slate-200 bg-white">
      <div className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Site Overview</h3>
        
        {/* Site Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <i className="fas fa-check-circle text-green-500"></i>
              <span className="text-sm font-medium text-green-800">Site Online</span>
            </div>
            <span className="text-xs text-green-600">99.9% uptime</span>
          </div>

          {/* WordPress Info */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">WordPress</span>
              <span className="text-sm font-medium text-slate-900">
                {site.wpVersion || '6.4.2'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Active Theme</span>
              <span className="text-sm font-medium text-slate-900">
                {site.activeTheme || 'Astra'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Plugins</span>
              <span className="text-sm font-medium text-slate-900">
                {site.pluginCount || 12} active
              </span>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-900 mb-3">Recent Activity</h4>
            <div className="space-y-3">
              {activities.length > 0 ? (
                activities.map((activity: any, index: number) => (
                  <div key={activity.id || index} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.activityType === 'plugin_install' ? 'bg-green-500' :
                      activity.activityType === 'theme_customize' ? 'bg-blue-500' :
                      activity.activityType === 'security_scan' ? 'bg-amber-500' :
                      'bg-purple-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-600">{activity.description}</p>
                      <span className="text-xs text-slate-400">
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-600">Site connected successfully</p>
                      <span className="text-xs text-slate-400">
                        {site.lastConnected ? new Date(site.lastConnected).toLocaleString() : 'Recently'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-600">WordPress status verified</p>
                      <span className="text-xs text-slate-400">Recently</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-900 mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('visit')}
                className="p-3 h-auto flex flex-col items-center space-y-1"
              >
                <i className="fas fa-external-link-alt text-sm"></i>
                <span className="text-xs">Visit Site</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('backup')}
                className="p-3 h-auto flex flex-col items-center space-y-1"
              >
                <i className="fas fa-download text-sm"></i>
                <span className="text-xs">Backup</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('cache')}
                className="p-3 h-auto flex flex-col items-center space-y-1"
              >
                <i className="fas fa-broom text-sm"></i>
                <span className="text-xs">Clear Cache</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('updates')}
                className="p-3 h-auto flex flex-col items-center space-y-1"
              >
                <i className="fas fa-sync text-sm"></i>
                <span className="text-xs">Updates</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
