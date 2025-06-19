import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Lock, Loader2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PaymentFormProps {
  amount: number;
  courseId: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  couponCode?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

interface PaymentIntent {
  paymentId: string;
  clientSecret: string;
  publishableKey: string;
}

export default function PaymentForm({ amount, courseId, customerInfo, couponCode, onSuccess, onError }: PaymentFormProps) {
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    installments: "1",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const { toast } = useToast();

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      setIsCreatingIntent(true);
      try {
        const intent = await apiRequest('POST', '/api/payments/create-intent', {
          amount,
          courseId,
          customerInfo,
          currency: 'USD',
        });
        setPaymentIntent(intent);
      } catch (error: any) {
        toast({
          title: "Erro ao inicializar pagamento",
          description: error.message || "Não foi possível inicializar o pagamento",
          variant: "destructive",
        });
        onError(error.message || "Failed to create payment intent");
      } finally {
        setIsCreatingIntent(false);
      }
    };

    createPaymentIntent();
  }, [amount, courseId, customerInfo, toast, onError]);

  const handleInputChange = (field: string, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D+/g, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const validateCardData = () => {
    const { cardNumber, expiryDate, cvv, cardholderName } = paymentData;
    
    if (!cardNumber.replace(/\s/g, '') || cardNumber.replace(/\s/g, '').length < 13) {
      throw new Error("Número do cartão inválido");
    }
    
    if (!expiryDate || expiryDate.length < 5) {
      throw new Error("Data de validade inválida");
    }
    
    if (!cvv || cvv.length < 3) {
      throw new Error("CVV inválido");
    }
    
    if (!cardholderName.trim()) {
      throw new Error("Nome do portador é obrigatório");
    }
  };

  const processPayment = async () => {
    if (!paymentIntent) {
      toast({
        title: "Erro",
        description: "Intent de pagamento não foi criado",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Validate card data
      validateCardData();

      const [expMonth, expYear] = paymentData.expiryDate.split('/');
      
      // Create payment method object
      const paymentMethod = {
        type: 'card',
        card: {
          number: paymentData.cardNumber.replace(/\s/g, ''),
          exp_month: expMonth,
          exp_year: `20${expYear}`,
          cvc: paymentData.cvv,
          cardholder_name: paymentData.cardholderName,
        },
        billing: {
          address: {
            line1: customerInfo.address || '',
            city: '',
            state: '',
            zip: '',
            country: 'US',
          },
        },
      };

      // Confirm payment with HyperSwitch
      const result = await apiRequest('POST', '/api/payments/confirm', {
        paymentId: paymentIntent.paymentId,
        paymentMethod,
        courseId,
        customerInfo,
        amount,
        couponCode,
      });

      if (result.status === 'succeeded') {
        toast({
          title: "Pagamento aprovado!",
          description: "Seu pedido foi confirmado com sucesso.",
        });
        onSuccess();
      } else if (result.status === 'requires_capture') {
        toast({
          title: "Pagamento autorizado",
          description: "Seu pagamento foi autorizado e será capturado em breve.",
        });
        onSuccess();
      } else {
        throw new Error(result.last_payment_error?.message || "Pagamento não foi aprovado");
      }
      
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Erro no pagamento",
        description: error.message || "Ocorreu um erro ao processar seu pagamento.",
        variant: "destructive",
      });
      onError(error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateInstallmentValue = (installments: number) => {
    const fee = installments > 1 ? 0.025 : 0; // 2.5% fee for installments
    const totalWithFee = amount * (1 + fee);
    return totalWithFee / installments;
  };

  if (isCreatingIntent) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Inicializando pagamento...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Pagamento Seguro
        </CardTitle>
        <p className="text-sm text-gray-600">
          Seus dados são protegidos com criptografia SSL
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Número do Cartão</Label>
            <Input
              id="cardNumber"
              placeholder="0000 0000 0000 0000"
              value={paymentData.cardNumber}
              onChange={(e) => handleInputChange("cardNumber", formatCardNumber(e.target.value))}
              maxLength={19}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate">Validade</Label>
              <Input
                id="expiryDate"
                placeholder="MM/AA"
                value={paymentData.expiryDate}
                onChange={(e) => handleInputChange("expiryDate", formatExpiryDate(e.target.value))}
                maxLength={5}
              />
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                value={paymentData.cvv}
                onChange={(e) => handleInputChange("cvv", e.target.value.replace(/\D/g, ''))}
                maxLength={4}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cardholderName">Nome no Cartão</Label>
            <Input
              id="cardholderName"
              placeholder="Nome conforme impresso no cartão"
              value={paymentData.cardholderName}
              onChange={(e) => handleInputChange("cardholderName", e.target.value.toUpperCase())}
            />
          </div>

          <div>
            <Label htmlFor="installments">Parcelamento</Label>
            <Select value={paymentData.installments} onValueChange={(value) => handleInputChange("installments", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}x de ${calculateInstallmentValue(num).toFixed(2)}
                    {num > 1 && " (com juros)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold">Total:</span>
            <span className="text-lg font-bold">
              ${(amount * (parseInt(paymentData.installments) > 1 ? 1.025 : 1)).toFixed(2)}
            </span>
          </div>

          <Button 
            onClick={processPayment}
            disabled={isProcessing || !paymentIntent}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Finalizar Pagamento
              </>
            )}
          </Button>

          <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
            <Lock className="h-4 w-4 mr-1" />
            Pagamento 100% seguro e criptografado
          </div>
        </div>
      </CardContent>
    </Card>
  );
}