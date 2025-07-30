import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface MessageProps {
  message: any;
  site: any;
}

export function Message({ message, site }: MessageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [executingAction, setExecutingAction] = useState<string | null>(null);

  const isUser = message.role === 'user';
  const isWelcome = message.id === 'welcome';

  // Execute action mutation
  const executeActionMutation = useMutation({
    mutationFn: async (actionType: string) => {
      // For demo purposes, we'll simulate action execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, message: "Action completed successfully" };
    },
    onMutate: (actionType) => {
      setExecutingAction(actionType);
    },
    onSuccess: () => {
      setExecutingAction(null);
      toast({
        title: "Success",
        description: "Action completed successfully!",
      });
      // Refresh site status
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
    },
    onError: () => {
      setExecutingAction(null);
      toast({
        title: "Error",
        description: "Failed to execute action. Please try again.",
        variant: "destructive",
      });
    },
  });

  const renderMessageContent = () => {
    const content = message.content;
    const metadata = message.metadata;

    // Handle special formatting for AI responses with actions
    if (!isUser && metadata?.actions) {
      const lines = content.split('\n');
      const mainContent = lines[0];
      
      return (
        <div>
          <p className="text-slate-700 mb-3">{mainContent}</p>
          
          <div className="space-y-3">
            {metadata.actions.map((action: any, index: number) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-slate-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${
                    action.type === 'theme_customize' ? 'bg-amber-500' :
                    action.type === 'plugin_install' ? 'bg-green-500' :
                    action.type === 'content_update' ? 'bg-blue-500' :
                    'bg-purple-500'
                  }`}></div>
                  <span className="text-sm font-medium text-slate-700">{action.title || action.description}</span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{action.details || action.description}</p>
                <Button 
                  size="sm"
                  onClick={() => executeActionMutation.mutate(action.type)}
                  disabled={executingAction === action.type}
                  className="text-xs"
                >
                  {executingAction === action.type ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-1"></i>
                      Executing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-play mr-1"></i>
                      {action.buttonText || 'Execute'}
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Regular message content with line breaks
    return (
      <div className="whitespace-pre-wrap text-slate-700">
        {content.split('\n').map((line: string, index: number) => {
          if (line.startsWith('•')) {
            return (
              <div key={index} className="flex items-start space-x-2 my-1">
                <span className="text-blue-500 mt-1">•</span>
                <span className="text-sm text-slate-600">{line.substring(1).trim()}</span>
              </div>
            );
          }
          return line ? <p key={index}>{line}</p> : <br key={index} />;
        })}
      </div>
    );
  };

  if (isUser) {
    return (
      <div className="flex items-start space-x-3 justify-end">
        <div className="flex-1 max-w-2xl">
          <div className="bg-blue-500 text-white rounded-lg p-4 ml-auto">
            <p>{message.content}</p>
          </div>
          <span className="text-xs text-slate-400 mt-1 block text-right">
            You • {new Date(message.createdAt).toLocaleTimeString()}
          </span>
        </div>
        <img 
          src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32"} 
          alt="User Avatar" 
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3">
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
        <i className="fas fa-robot text-white text-sm"></i>
      </div>
      <div className="flex-1">
        <div className="bg-slate-100 rounded-lg p-4 max-w-2xl">
          {renderMessageContent()}
        </div>
        <span className="text-xs text-slate-400 mt-1 block">
          AI Assistant • {isWelcome ? 'Just now' : new Date(message.createdAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
