import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardHeader from "@/components/dashboard-header";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, CreditCard, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WithdrawalData {
  availableBalance: number;
  totalRevenue: number;
  commission: number;
  withdrawals: Array<{
    id: number;
    amount: number;
    status: string;
    requestDate: string;
    processedDate?: string;
    method: string;
    account: string;
  }>;
}

export default function Withdrawals() {
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalMethod, setWithdrawalMethod] = useState("");
  const [accountDetails, setAccountDetails] = useState("");
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: withdrawalsData, isLoading } = useQuery<WithdrawalData>({
    queryKey: ["/api/withdrawals"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  const availableBalance = withdrawalsData?.availableBalance || 0;
  const totalEarned = withdrawalsData?.totalRevenue || 0;
  const commission = withdrawalsData?.commission || 0;
  const withdrawalHistory = withdrawalsData?.withdrawals || [];
  const pendingWithdrawals = withdrawalHistory
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);

  const requestWithdrawalMutation = useMutation({
    mutationFn: async (data: { amount: string; method: string; accountDetails: string }) => {
      return await apiRequest("/api/withdrawals", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de saque foi enviada com sucesso.",
      });
      setWithdrawalAmount("");
      setWithdrawalMethod("");
      setAccountDetails("");
      setShowWithdrawalForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao solicitar saque",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleWithdrawalRequest = () => {
    if (!withdrawalAmount || !withdrawalMethod || !accountDetails) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (amount <= 0 || amount > availableBalance) {
      toast({
        title: "Valor inválido",
        description: "O valor deve ser maior que zero e não exceder o saldo disponível.",
        variant: "destructive",
      });
      return;
    }

    requestWithdrawalMutation.mutate({
      amount: withdrawalAmount,
      method: withdrawalMethod,
      accountDetails,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex">
          <DashboardSidebar />
          <div className="flex-1 ml-64 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <div className="flex-1 ml-64 p-8 pt-20">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Saques</h1>
            <p className="text-gray-600">Gerencie seus saques e acompanhe seu saldo</p>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Saldo Disponível</p>
                    <p className="text-2xl font-bold text-green-600">R$ {availableBalance.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Saques Pendentes</p>
                    <p className="text-2xl font-bold text-orange-600">R$ {pendingWithdrawals.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Ganho</p>
                    <p className="text-2xl font-bold text-blue-600">R$ {totalEarned.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commission Info */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                <p className="text-sm text-gray-600">
                  Taxa da plataforma: R$ {commission.toFixed(2)} (10% sobre as vendas)
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Withdrawal Request Form */}
            <Card>
              <CardHeader>
                <CardTitle>Solicitar Saque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showWithdrawalForm ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Solicitar Novo Saque</h3>
                    <p className="text-gray-500 mb-4">
                      Você tem R$ {availableBalance.toFixed(2)} disponível para saque.
                    </p>
                    <Button 
                      onClick={() => setShowWithdrawalForm(true)}
                      disabled={availableBalance <= 0}
                    >
                      Solicitar Saque
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="amount">Valor</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0,00"
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        min="0"
                        max={availableBalance}
                        step="0.01"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Saldo disponível: R$ {availableBalance.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="method">Método de Saque</Label>
                      <Select value={withdrawalMethod} onValueChange={setWithdrawalMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="account">Dados da Conta</Label>
                      <Input
                        id="account"
                        placeholder={withdrawalMethod === 'pix' ? 'Chave PIX' : 'Banco, Agência, Conta'}
                        value={accountDetails}
                        onChange={(e) => setAccountDetails(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleWithdrawalRequest}
                        disabled={requestWithdrawalMutation.isPending}
                        className="flex-1"
                      >
                        {requestWithdrawalMutation.isPending ? "Enviando..." : "Enviar Solicitação"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowWithdrawalForm(false);
                          setWithdrawalAmount("");
                          setWithdrawalMethod("");
                          setAccountDetails("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Withdrawal History */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Saques</CardTitle>
              </CardHeader>
              <CardContent>
                {withdrawalHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum saque realizado</h3>
                    <p className="text-gray-500">Seus saques aparecerão aqui quando forem solicitados.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {withdrawalHistory.map((withdrawal) => (
                      <div key={withdrawal.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-lg">R$ {withdrawal.amount.toFixed(2)}</span>
                          <Badge variant={
                            withdrawal.status === 'completed' ? 'default' : 
                            withdrawal.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {withdrawal.status === 'completed' ? 'Concluído' : 
                             withdrawal.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Método:</span> {withdrawal.method}</p>
                          <p><span className="font-medium">Conta:</span> {withdrawal.account}</p>
                          <p><span className="font-medium">Solicitado:</span> {new Date(withdrawal.requestDate).toLocaleDateString('pt-BR')}</p>
                          {withdrawal.processedDate && (
                            <p><span className="font-medium">Processado:</span> {new Date(withdrawal.processedDate).toLocaleDateString('pt-BR')}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}