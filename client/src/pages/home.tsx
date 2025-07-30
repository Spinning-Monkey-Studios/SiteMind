import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/ui/sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ConnectionModal } from "@/components/modals/connection-modal";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { HelpModal } from "@/components/help/help-modal";
import { HelpButton } from "@/components/help/help-tooltip";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  // Fetch user's WordPress sites
  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ["/api/sites"],
    enabled: !!user,
    retry: false,
  });

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user,
    retry: false,
  });

  // Create new conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (data: { siteId?: string; title?: string }) => {
      const response = await apiRequest("POST", "/api/conversations", data);
      return response.json();
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setCurrentConversationId(newConversation.id);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    },
  });

  // Check if user has any sites connected
  useEffect(() => {
    if (!sitesLoading && sites.length === 0 && user) {
      setShowConnectionModal(true);
    } else if (sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites[0].id);
    }
  }, [sites, sitesLoading, user, selectedSiteId]);

  // Create initial conversation when site is selected
  useEffect(() => {
    if (selectedSiteId && !currentConversationId && !createConversationMutation.isPending) {
      createConversationMutation.mutate({
        siteId: selectedSiteId,
        title: "AI WordPress Assistant",
      });
    }
  }, [selectedSiteId, currentConversationId, createConversationMutation]);

  if (authLoading || sitesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your WordPress dashboard...</p>
        </div>
      </div>
    );
  }

  const selectedSite = sites.find((site: any) => site.id === selectedSiteId);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        sites={sites}
        selectedSiteId={selectedSiteId}
        onSiteSelect={setSelectedSiteId}
        onAddSite={() => setShowConnectionModal(true)}
        user={user}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">AI WordPress Assistant</h2>
              <p className="text-sm text-slate-500">
                Manage your WordPress site with natural language commands
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <HelpButton onClick={() => setShowHelpModal(true)} />
              <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <i className="fas fa-bell text-lg"></i>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center space-x-3">
                <img 
                  src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32"} 
                  alt="User Avatar" 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-slate-700">
                  {user?.firstName || user?.email || "User"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {sites.length > 0 && selectedSite && currentConversationId ? (
          <ChatInterface
            conversationId={currentConversationId}
            site={selectedSite}
            onProcessingChange={setIsProcessing}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-comments text-slate-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {sites.length === 0 ? "Connect Your First WordPress Site" : "Select a Site to Begin"}
              </h3>
              <p className="text-slate-600 mb-4">
                {sites.length === 0 
                  ? "Connect your WordPress site to start managing it with AI"
                  : "Choose a WordPress site from the sidebar to start chatting"
                }
              </p>
              {sites.length === 0 && (
                <button
                  onClick={() => setShowConnectionModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <i className="fas fa-plug mr-2"></i>
                  Connect WordPress Site
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        onSuccess={(newSite) => {
          setShowConnectionModal(false);
          setSelectedSiteId(newSite.id);
          queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
        }}
      />

      <LoadingOverlay isVisible={isProcessing} />
      
      <HelpModal 
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
}
