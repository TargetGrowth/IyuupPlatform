import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function EmailVerification() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verificationToken = urlParams.get('token');
    if (verificationToken) {
      setToken(verificationToken);
      verifyEmail(verificationToken);
    } else {
      setHasError(true);
    }
  }, []);

  const verifyEmailMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("GET", `/api/verify-email/${token}`);
      return response;
    },
    onSuccess: () => {
      setIsVerified(true);
      setTimeout(() => {
        setLocation("/dashboard");
      }, 3000);
    },
    onError: () => {
      setHasError(true);
    },
  });

  const verifyEmail = (token: string) => {
    verifyEmailMutation.mutate(token);
  };

  const handleGoToDashboard = () => {
    setLocation("/dashboard");
  };

  const handleGoToLogin = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-blue to-dark-blue p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Verificação de Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {verifyEmailMutation.isPending && (
            <div className="text-center space-y-4">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-blue" />
              <p className="text-gray-600">Verificando seu email...</p>
            </div>
          )}

          {isVerified && (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Email verificado com sucesso!
                </h3>
                <p className="text-gray-600 mb-4">
                  Sua conta foi ativada. Redirecionando para o dashboard...
                </p>
                <Button 
                  onClick={handleGoToDashboard}
                  className="w-full bg-secondary-orange hover:bg-orange-600"
                >
                  Ir para Dashboard
                </Button>
              </div>
            </div>
          )}

          {hasError && (
            <div className="text-center space-y-4">
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Erro na verificação
                </h3>
                <p className="text-gray-600 mb-4">
                  Link de verificação inválido ou expirado. 
                  Faça login para reenviar o email de verificação.
                </p>
                <Button 
                  onClick={handleGoToLogin}
                  variant="outline"
                  className="w-full"
                >
                  Voltar ao Login
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}