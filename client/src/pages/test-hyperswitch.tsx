import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, CreditCard, User, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TestResult {
  success: boolean;
  message: string;
  tests?: {
    customer_creation: {
      success: boolean;
      customer_id: string;
    };
    payment_intent_creation: {
      success: boolean;
      payment_id: string;
      status: string;
      amount: number;
    };
    payment_retrieval: {
      success: boolean;
      payment_id: string;
      status: string;
    };
  };
  error?: string;
  details?: any;
}

export default function TestHyperSwitch() {
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const testMutation = useMutation({
    mutationFn: () => apiRequest('/api/test/hyperswitch', 'GET'),
    onSuccess: (data) => {
      setTestResult(data);
    },
    onError: (error) => {
      setTestResult({
        success: false,
        message: 'Falha na conexão com HyperSwitch',
        error: error.message
      });
    }
  });

  const runTest = () => {
    setTestResult(null);
    testMutation.mutate();
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "SUCESSO" : "FALHA"}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Teste de Integração HyperSwitch</h1>
        <p className="text-gray-600">
          Verifique se a integração com o HyperSwitch está funcionando corretamente
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Teste de Conectividade HyperSwitch
          </CardTitle>
          <CardDescription>
            Este teste verifica a criação de cliente, intenção de pagamento e recuperação de dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runTest}
            disabled={testMutation.isPending}
            className="w-full sm:w-auto"
          >
            {testMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              'Executar Teste'
            )}
          </Button>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(testResult.success)}
              Resultado do Teste
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status Geral</span>
              {getStatusBadge(testResult.success)}
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">{testResult.message}</p>
            </div>

            {testResult.success && testResult.tests && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Detalhes dos Testes</h3>
                
                {/* Test 1: Customer Creation */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">Criação de Cliente</span>
                    </div>
                    {getStatusBadge(testResult.tests.customer_creation.success)}
                  </div>
                  <p className="text-sm text-gray-600">
                    ID do Cliente: <code className="bg-gray-100 px-2 py-1 rounded">{testResult.tests.customer_creation.customer_id}</code>
                  </p>
                </div>

                {/* Test 2: Payment Intent Creation */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-medium">Criação de Intenção de Pagamento</span>
                    </div>
                    {getStatusBadge(testResult.tests.payment_intent_creation.success)}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Payment ID: <code className="bg-gray-100 px-2 py-1 rounded">{testResult.tests.payment_intent_creation.payment_id}</code></p>
                    <p>Status: <span className="font-medium">{testResult.tests.payment_intent_creation.status}</span></p>
                    <p>Valor: <span className="font-medium">${(testResult.tests.payment_intent_creation.amount / 100).toFixed(2)}</span></p>
                  </div>
                </div>

                {/* Test 3: Payment Retrieval */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Recuperação de Pagamento</span>
                    </div>
                    {getStatusBadge(testResult.tests.payment_retrieval.success)}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Payment ID: <code className="bg-gray-100 px-2 py-1 rounded">{testResult.tests.payment_retrieval.payment_id}</code></p>
                    <p>Status: <span className="font-medium">{testResult.tests.payment_retrieval.status}</span></p>
                  </div>
                </div>
              </div>
            )}

            {!testResult.success && testResult.error && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-red-600">Erro Detectado</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700 font-medium">Erro:</p>
                  <code className="text-sm text-red-800 bg-red-100 px-2 py-1 rounded mt-1 block">
                    {testResult.error}
                  </code>
                </div>
                
                {testResult.details && (
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <p className="text-sm text-gray-700 font-medium mb-2">Detalhes Técnicos:</p>
                    <pre className="text-xs text-gray-600 overflow-auto">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    <strong>Como resolver:</strong>
                  </p>
                  <ul className="text-sm text-blue-600 mt-2 space-y-1">
                    <li>• Verifique se as chaves da API HyperSwitch estão configuradas corretamente</li>
                    <li>• Confirme se você está usando o ambiente correto (sandbox/production)</li>
                    <li>• Verifique se sua conta HyperSwitch tem permissões adequadas</li>
                    <li>• Confirme se o HyperSwitch está configurado com processadores de pagamento</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}