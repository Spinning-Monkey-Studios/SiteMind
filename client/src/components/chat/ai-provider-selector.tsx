import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HelpTooltip } from "@/components/help/help-tooltip";

interface AIProviderSelectorProps {
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
}

export function AIProviderSelector({ selectedProvider, onProviderChange }: AIProviderSelectorProps) {
  const { data: providersData } = useQuery({
    queryKey: ["/api/ai/providers"],
    retry: false,
  });

  const providers = providersData?.providers || [];

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'fas fa-robot';
      case 'gemini':
        return 'fas fa-brain';
      default:
        return 'fas fa-cog';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'OpenAI GPT-4';
      case 'gemini':
        return 'Google Gemini';
      default:
        return provider;
    }
  };

  if (providers.length <= 1) {
    return null; // Don't show selector if only one provider available
  }

  return (
    <HelpTooltip content="Choose your preferred AI assistant for processing commands">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-3">
            <i className={`${getProviderIcon(selectedProvider)} mr-2`}></i>
            <span className="text-xs">{getProviderName(selectedProvider)}</span>
            <i className="fas fa-chevron-down ml-2 text-xs"></i>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {providers.map((provider: string) => (
            <DropdownMenuItem
              key={provider}
              onClick={() => onProviderChange(provider)}
              className={selectedProvider === provider ? "bg-blue-50" : ""}
            >
              <i className={`${getProviderIcon(provider)} mr-2 w-4`}></i>
              <span>{getProviderName(provider)}</span>
              {selectedProvider === provider && (
                <i className="fas fa-check ml-auto text-blue-500"></i>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </HelpTooltip>
  );
}