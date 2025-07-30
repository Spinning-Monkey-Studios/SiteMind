import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpTooltipProps {
  content: string;
  children: React.ReactNode;
}

export function HelpTooltip({ content, children }: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface HelpButtonProps {
  onClick: () => void;
}

export function HelpButton({ onClick }: HelpButtonProps) {
  return (
    <HelpTooltip content="Open help center for guides and documentation">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="h-8 w-8 p-0"
      >
        <i className="fas fa-question-circle text-slate-400 hover:text-blue-500"></i>
      </Button>
    </HelpTooltip>
  );
}