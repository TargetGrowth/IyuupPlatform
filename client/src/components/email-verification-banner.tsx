import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, X, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EmailVerificationBannerProps {
  user: {
    id: number;
    fullName: string;
    email: string;
    emailVerified?: boolean;
  };
  onDismiss?: () => void;
}

export default function EmailVerificationBanner({ user, onDismiss }: EmailVerificationBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/resend-verification");
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Email de verificação enviado!",
        description: "Verifique sua caixa de entrada e spam.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (user.emailVerified || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleResend = () => {
    resendMutation.mutate();
  };

  return (
    <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 mb-6 relative z-40 shadow-lg">
      <Mail className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <div className="flex items-center justify-between w-full">
        <div className="flex-1">
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <strong>Verifique seu email</strong> - Enviamos um link de verificação para{" "}
            <span className="font-medium">{user.email}</span>. 
            Clique no link para ativar sua conta.
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={resendMutation.isPending}
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900"
          >
            {resendMutation.isPending ? "Enviando..." : "Reenviar"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}