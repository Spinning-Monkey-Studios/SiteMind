import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 flex items-center space-x-4 max-w-sm mx-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <div>
          <p className="font-medium text-slate-900">
            {message || "Processing your request..."}
          </p>
          <p className="text-sm text-slate-600">
            AI is analyzing and executing your command
          </p>
        </div>
      </div>
    </div>
  );
}
