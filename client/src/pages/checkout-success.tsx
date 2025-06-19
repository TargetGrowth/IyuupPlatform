import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Mail, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutSuccess() {
  const [location] = useLocation();
  const [paymentId, setPaymentId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    // Extract payment_id from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('payment_id');
    if (id) {
      setPaymentId(id);
    }
  }, [location]);

  const copyPaymentId = () => {
    navigator.clipboard.writeText(paymentId);
    toast({
      title: "ID copiado!",
      description: "O ID do pagamento foi copiado para a área de transferência.",
    });
  };

  const goToDashboard = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">IYUUP</h1>
            <div className="text-sm text-gray-600">
              Compra finalizada
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pagamento Aprovado!
          </h1>
          <p className="text-lg text-gray-600">
            Sua compra foi processada com sucesso
          </p>
        </div>

        <div className="space-y-6">
          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID do Pagamento</label>
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-gray-900 font-mono">{paymentId}</span>
                    {paymentId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyPaymentId}
                        className="ml-2 h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Aprovado
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Próximos Passos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      E-mail de confirmação enviado
                    </p>
                    <p className="text-sm text-gray-600">
                      Verifique sua caixa de entrada para obter os detalhes da compra e instruções de acesso.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Download className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Acesso ao conteúdo
                    </p>
                    <p className="text-sm text-gray-600">
                      Seu acesso ao curso será liberado em até 15 minutos. Você receberá um e-mail com as instruções de login.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Garantia de 30 dias
                    </p>
                    <p className="text-sm text-gray-600">
                      Se não ficar satisfeito, você tem 30 dias para solicitar o reembolso integral.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Information */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Precisa de ajuda?
                </h3>
                <p className="text-gray-600 mb-4">
                  Nossa equipe de suporte está pronta para ajudar você
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>📧 E-mail: suporte@iyuup.com</p>
                  <p>📱 WhatsApp: (11) 99999-9999</p>
                  <p>🕒 Horário: Segunda a Sexta, 9h às 18h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={goToDashboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              Ir para o Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}