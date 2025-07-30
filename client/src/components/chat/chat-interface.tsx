import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Message } from "./message";
import { SiteInfoPanel } from "./site-info-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInterfaceProps {
  conversationId: string;
  site: any;
  onProcessingChange: (processing: boolean) => void;
}

export function ChatInterface({ conversationId, site, onProcessingChange }: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversation messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/conversations", conversationId, "messages"],
    retry: false,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, {
        role: "user",
        content,
      });
      return response.json();
    },
    onMutate: () => {
      setIsTyping(true);
      onProcessingChange(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", conversationId, "messages"] 
      });
      setMessageText("");
      setIsTyping(false);
      onProcessingChange(false);
    },
    onError: (error) => {
      setIsTyping(false);
      onProcessingChange(false);
      
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
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [messageText]);

  const handleSendMessage = () => {
    if (!messageText.trim() || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate(messageText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const welcomeMessage = {
    id: 'welcome',
    role: 'assistant',
    content: `Welcome! I'm your WordPress AI assistant. I can help you:

• Change themes and customize colors
• Install and configure plugins  
• Optimize your site's performance
• Update content and manage posts
• Improve SEO and security

Just tell me what you'd like to do in plain English!`,
    createdAt: new Date().toISOString(),
    metadata: null,
  };

  const allMessages = [welcomeMessage, ...messages];

  return (
    <div className="flex-1 flex">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {allMessages.map((message, index) => (
                <Message 
                  key={message.id || index} 
                  message={message} 
                  site={site}
                />
              ))}
              
              {isTyping && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-robot text-white text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <div className="bg-slate-100 rounded-lg p-4 max-w-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">AI Assistant • typing...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 p-4 bg-white">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                placeholder="Ask me anything about your WordPress site... (e.g., 'Change the header font to something more modern' or 'Install a security plugin')"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px] max-h-32 resize-none"
                disabled={sendMessageMutation.isPending}
              />
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              className="px-6 py-3"
            >
              <i className="fas fa-paper-plane"></i>
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-4 text-xs text-slate-500">
              <span>Press Enter to send</span>
              <span>•</span>
              <span>Shift+Enter for new line</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">Powered by</span>
              <i className="fas fa-brain text-blue-500 text-sm"></i>
              <span className="text-xs font-medium text-blue-600">AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Site Info Panel */}
      <SiteInfoPanel site={site} />
    </div>
  );
}
