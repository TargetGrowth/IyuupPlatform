import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Lock, CheckCircle, User, Mail, Phone, MapPin, Smartphone, Plus, Package, Tag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PaymentForm from "@/components/payment-form";

interface CheckoutProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
  customTitle?: string;
  customPrice?: number;
}

interface OrderBump {
  id: number;
  title: string;
  description?: string;
  price: string;
  image?: string;
  isSelected?: boolean;
}

interface Coupon {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  document: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface PaymentMethod {
  type: 'credit_card' | 'pix' | 'boleto';
  card?: {
    number: string;
    holderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
}

export default function Checkout() {
  const [matchCheckout, paramsCheckout] = useRoute("/checkout/:linkId");
  const [matchProduct, paramsProduct] = useRoute("/product/:slug");
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    document: "",
    address: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      country: "BR",
    },
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    type: 'credit_card',
    card: {
      number: "",
      holderName: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
    },
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [selectedOrderBumps, setSelectedOrderBumps] = useState<number[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const { toast } = useToast();

  // Function to fetch address data from CEP
  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setCustomerInfo(prev => ({
          ...prev,
          address: {
            ...prev.address,
            street: data.logradouro || prev.address.street,
            neighborhood: data.bairro || prev.address.neighborhood,
            city: data.localidade || prev.address.city,
            state: data.uf || prev.address.state,
            zipCode: cleanCep,
          }
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsLoadingCep(false);
    }
  };

  // Determine which route we're on and construct the API endpoint
  const isProductRoute = matchProduct && paramsProduct?.slug;
  const isCheckoutRoute = matchCheckout && paramsCheckout?.linkId;
  
  const apiEndpoint = isProductRoute 
    ? `/api/product/${paramsProduct?.slug}`
    : `/api/checkout/${paramsCheckout?.linkId}`;

  // Fetch real product data from sales link or direct product
  const { data: salesLinkData, isLoading, error } = useQuery({
    queryKey: [apiEndpoint],
    enabled: !!(isProductRoute || isCheckoutRoute),
  });

  // Fetch order bumps for the course
  const { data: orderBumps } = useQuery({
    queryKey: [`/api/courses/${(salesLinkData as any)?.course?.id}/order-bumps`],
    enabled: !!(salesLinkData as any)?.course?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando informações do produto...</p>
        </div>
      </div>
    );
  }

  if (error || !salesLinkData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link não encontrado</h1>
          <p className="text-gray-600">Este link de venda não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  const salesData = salesLinkData as any;
  const product: CheckoutProduct = {
    id: salesData.course.id,
    title: salesData.course.title,
    description: salesData.course.description,
    price: parseFloat(salesData.course.price),
    image: salesData.course.thumbnailUrl || "https://via.placeholder.com/400x200",
    customTitle: salesData.customTitle,
    customPrice: parseFloat(salesData.customPrice),
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setCustomerInfo(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setCustomerInfo(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCardChange = (field: string, value: string) => {
    setPaymentMethod(prev => ({
      ...prev,
      card: { ...prev.card!, [field]: value }
    }));
  };

  const toggleOrderBump = (orderBumpId: number) => {
    setSelectedOrderBumps(prev => 
      prev.includes(orderBumpId) 
        ? prev.filter(id => id !== orderBumpId)
        : [...prev, orderBumpId]
    );
  };

  const validateCoupon = async (code: string) => {
    if (!code.trim()) return;
    
    setIsValidatingCoupon(true);
    try {
      const finalPrice = product.customPrice || product.price;
      const response = await apiRequest('POST', `/api/coupons/validate`, {
        code: code.trim(),
        orderValue: finalPrice,
        courseId: product.id
      });
      
      if (response.valid) {
        setAppliedCoupon({
          code: code.trim(),
          discount: response.discount,
          type: response.type
        });
        
        toast({
          title: "Cupom aplicado!",
          description: `Desconto de R$ ${response.discount.toFixed(2)} aplicado.`,
        });
      } else {
        toast({
          title: "Cupom inválido",
          description: response.message || "Este cupom não é válido para este produto.",
          variant: "destructive",
        });
        setAppliedCoupon(null);
      }
    } catch (error: any) {
      toast({
        title: "Cupom inválido",
        description: error.message || "Cupom não encontrado ou expirado.",
        variant: "destructive",
      });
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const processPayment = async () => {
    const requiredFields = [
      customerInfo.name, customerInfo.email, customerInfo.phone,
      customerInfo.address.street, customerInfo.address.number,
      customerInfo.address.neighborhood, customerInfo.address.city,
      customerInfo.address.state, customerInfo.address.zipCode
    ];

    if (requiredFields.some(field => !field.trim())) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod.type === 'credit_card') {
      const cardFields = [
        paymentMethod.card?.number, paymentMethod.card?.holderName,
        paymentMethod.card?.expiryMonth, paymentMethod.card?.expiryYear,
        paymentMethod.card?.cvv
      ];
      
      if (cardFields.some(field => !field?.trim())) {
        toast({
          title: "Dados do cartão incompletos",
          description: "Preencha todos os dados do cartão",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);

    try {
      const paymentData = {
        amount: Math.round(finalPrice * 100), // Convert to cents
        currency: "BRL",
        customer: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          document: customerInfo.document,
          address: customerInfo.address,
        },
        paymentMethod,
        productId: product.id,
        linkId: isCheckoutRoute ? paramsCheckout?.linkId : null,
        couponCode: appliedCoupon?.code || null,
      };

      const result = await apiRequest("POST", "/api/payments/process", paymentData);

      if (result.status === "succeeded" || result.status === "pending") {
        toast({
          title: "Pagamento processado!",
          description: paymentMethod.type === 'pix' 
            ? "Use o QR Code ou código PIX para completar o pagamento" 
            : "Seu acesso será liberado em instantes",
        });

        // Redirect to success page with payment details
        window.location.href = `/checkout/success?payment_id=${result.payment_id}`;
      } else {
        throw new Error(result.error || "Falha no processamento");
      }
    } catch (error: any) {
      toast({
        title: "Erro no pagamento",
        description: error.message || "Tente novamente ou entre em contato com o suporte",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate pricing with order bumps and coupons
  const basePrice = product.customPrice || product.price;
  const orderBumpsTotal = Array.isArray(orderBumps) 
    ? orderBumps
        .filter((ob: OrderBump) => selectedOrderBumps.includes(ob.id))
        .reduce((total: number, ob: OrderBump) => total + parseFloat(ob.price), 0)
    : 0;
  
  const subtotal = basePrice + orderBumpsTotal;
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalPrice = Math.max(0, subtotal - couponDiscount);
  const discount = product.customPrice ? product.price - product.customPrice : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">IYUUP</h1>
            <div className="flex items-center text-sm text-gray-600">
              <Lock className="h-4 w-4 mr-1" />
              Checkout Seguro
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Information */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {product.customTitle || product.title}
                    </h2>
                    <p className="text-gray-600 mb-4">{product.description}</p>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl font-bold text-green-600">
                        R$ {finalPrice.toFixed(2)}
                      </span>
                      {discount > 0 && (
                        <>
                          <span className="text-lg text-gray-500 line-through">
                            R$ {product.price.toFixed(2)}
                          </span>
                          <Badge variant="destructive">
                            -{((discount / product.price) * 100).toFixed(0)}%
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Bumps */}
            {Array.isArray(orderBumps) && orderBumps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-600" />
                    Produtos Adicionais
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Aproveite estas ofertas especiais disponíveis apenas durante o checkout
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orderBumps.map((orderBump: OrderBump) => (
                    <div 
                      key={orderBump.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedOrderBumps.includes(orderBump.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleOrderBump(orderBump.id)}
                    >
                      <div className="flex items-start space-x-4">
                        <div 
                          className="flex items-center cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOrderBump(orderBump.id);
                          }}
                        >
                          <div
                            className={`h-4 w-4 border-2 rounded flex items-center justify-center transition-colors ${
                              selectedOrderBumps.includes(orderBump.id)
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300 hover:border-blue-400'
                            }`}
                          >
                            {selectedOrderBumps.includes(orderBump.id) && (
                              <svg
                                className="h-3 w-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                        
                        {orderBump.image && (
                          <img
                            src={orderBump.image}
                            alt={orderBump.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{orderBump.title}</h4>
                          {orderBump.description && (
                            <p className="text-sm text-gray-600 mt-1">{orderBump.description}</p>
                          )}
                          <div className="flex items-center mt-2">
                            <span className="text-lg font-bold text-green-600">
                              + R$ {parseFloat(orderBump.price).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Coupon Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-green-600" />
                  Cupom de Desconto
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="font-semibold text-green-800">Cupom aplicado: {appliedCoupon.code}</p>
                      <p className="text-sm text-green-600">
                        Desconto: R$ {appliedCoupon.discount.toFixed(2)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={removeCoupon}>
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Digite seu cupom"
                      className="flex-1"
                    />
                    <Button
                      onClick={() => validateCoupon(couponCode)}
                      disabled={isValidatingCoupon || !couponCode.trim()}
                    >
                      {isValidatingCoupon ? 'Validando...' : 'Aplicar'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  O que você vai receber
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
                    Acesso imediato ao conteúdo completo
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
                    Suporte direto com o instrutor
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
                    Certificado de conclusão
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
                    Garantia de 30 dias ou seu dinheiro de volta
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Dados pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Seu nome completo"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="seu@email.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                        let formatted = value;
                        if (value.length >= 11) {
                          formatted = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                        } else if (value.length >= 6) {
                          formatted = value.replace(/(\d{2})(\d{4,5})/, '($1) $2');
                        } else if (value.length >= 2) {
                          formatted = value.replace(/(\d{2})/, '($1) ');
                        }
                        handleInputChange("phone", formatted);
                      }}
                      placeholder="(11) 99999-9999"
                      className="mt-1"
                      maxLength={15}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="document">CPF</Label>
                  <Input
                    id="document"
                    value={customerInfo.document}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                      const formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                      handleInputChange("document", formatted);
                    }}
                    placeholder="000.000.000-00"
                    className="mt-1"
                    maxLength={14}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Endereço de cobrança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="street">Rua *</Label>
                    <Input
                      id="street"
                      value={customerInfo.address.street}
                      onChange={(e) => handleInputChange("address.street", e.target.value)}
                      placeholder="Nome da rua"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      value={customerInfo.address.number}
                      onChange={(e) => handleInputChange("address.number", e.target.value)}
                      placeholder="123"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={customerInfo.address.complement}
                      onChange={(e) => handleInputChange("address.complement", e.target.value)}
                      placeholder="Apto, bloco, etc."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">CEP *</Label>
                    <div className="relative">
                      <Input
                        id="zipCode"
                        value={customerInfo.address.zipCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                          const formatted = value.replace(/(\d{5})(\d{3})/, '$1-$2');
                          handleInputChange("address.zipCode", formatted);
                          if (value.length === 8) {
                            fetchAddressByCep(value);
                          }
                        }}
                        placeholder="00000-000"
                        className="mt-1 pr-10"
                        maxLength={9}
                      />
                      {isLoadingCep && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 mt-0.5">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    value={customerInfo.address.neighborhood}
                    onChange={(e) => handleInputChange("address.neighborhood", e.target.value)}
                    placeholder="Nome do bairro"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={customerInfo.address.city}
                      onChange={(e) => handleInputChange("address.city", e.target.value)}
                      placeholder="Nome da cidade"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Select 
                      value={customerInfo.address.state}
                      onValueChange={(value) => handleInputChange("address.state", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AC">Acre</SelectItem>
                        <SelectItem value="AL">Alagoas</SelectItem>
                        <SelectItem value="AP">Amapá</SelectItem>
                        <SelectItem value="AM">Amazonas</SelectItem>
                        <SelectItem value="BA">Bahia</SelectItem>
                        <SelectItem value="CE">Ceará</SelectItem>
                        <SelectItem value="DF">Distrito Federal</SelectItem>
                        <SelectItem value="ES">Espírito Santo</SelectItem>
                        <SelectItem value="GO">Goiás</SelectItem>
                        <SelectItem value="MA">Maranhão</SelectItem>
                        <SelectItem value="MT">Mato Grosso</SelectItem>
                        <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                        <SelectItem value="MG">Minas Gerais</SelectItem>
                        <SelectItem value="PA">Pará</SelectItem>
                        <SelectItem value="PB">Paraíba</SelectItem>
                        <SelectItem value="PR">Paraná</SelectItem>
                        <SelectItem value="PE">Pernambuco</SelectItem>
                        <SelectItem value="PI">Piauí</SelectItem>
                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                        <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                        <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                        <SelectItem value="RO">Rondônia</SelectItem>
                        <SelectItem value="RR">Roraima</SelectItem>
                        <SelectItem value="SC">Santa Catarina</SelectItem>
                        <SelectItem value="SP">São Paulo</SelectItem>
                        <SelectItem value="SE">Sergipe</SelectItem>
                        <SelectItem value="TO">Tocantins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Forma de pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={paymentMethod.type} onValueChange={(value) => setPaymentMethod(prev => ({ ...prev, type: value as any }))}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="credit_card">Cartão</TabsTrigger>
                    <TabsTrigger value="pix">PIX</TabsTrigger>
                    <TabsTrigger value="boleto">Boleto</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="credit_card" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="cardNumber">Número do cartão *</Label>
                      <Input
                        id="cardNumber"
                        value={paymentMethod.card?.number || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                          const formatted = value.replace(/(.{4})/g, '$1 ').trim();
                          handleCardChange("number", formatted);
                        }}
                        placeholder="0000 0000 0000 0000"
                        className="mt-1"
                        maxLength={19}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cardName">Nome no cartão *</Label>
                      <Input
                        id="cardName"
                        value={paymentMethod.card?.holderName || ""}
                        onChange={(e) => handleCardChange("holderName", e.target.value)}
                        placeholder="Nome como está no cartão"
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="expMonth">Mês *</Label>
                        <Select onValueChange={(value) => handleCardChange("expiryMonth", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="MM" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                                {month.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="expYear">Ano *</Label>
                        <Select onValueChange={(value) => handleCardChange("expiryYear", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="AA" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() + i).map(year => (
                              <SelectItem key={year} value={year.toString().slice(-2)}>
                                {year.toString().slice(-2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV *</Label>
                        <Input
                          id="cvv"
                          value={paymentMethod.card?.cvv || ""}
                          onChange={(e) => handleCardChange("cvv", e.target.value)}
                          placeholder="123"
                          className="mt-1"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="pix" className="mt-4">
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Smartphone className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <h3 className="text-lg font-semibold mb-2">Pagamento via PIX</h3>
                      <p className="text-gray-600">
                        Após finalizar a compra, você receberá o QR Code e código PIX para pagamento instantâneo.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="boleto" className="mt-4">
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Mail className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                      <h3 className="text-lg font-semibold mb-2">Pagamento via Boleto</h3>
                      <p className="text-gray-600">
                        O boleto será enviado por e-mail e tem vencimento em 3 dias úteis.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Produto principal:</span>
                    <span>R$ {basePrice.toFixed(2)}</span>
                  </div>
                  
                  {orderBumpsTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Produtos adicionais:</span>
                      <span>R$ {orderBumpsTotal.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Desconto promocional:</span>
                      <span>-R$ {discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Cupom ({appliedCoupon.code}):</span>
                      <span>-R$ {couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">R$ {finalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={processPayment}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold mt-6"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processando...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      {paymentMethod.type === 'credit_card' ? 'Finalizar Compra' : 
                       paymentMethod.type === 'pix' ? 'Gerar PIX' : 'Gerar Boleto'}
                    </div>
                  )}
                </Button>

                <div className="text-xs text-gray-500 text-center mt-4">
                  <Lock className="h-3 w-3 inline mr-1" />
                  Seus dados estão protegidos com criptografia SSL
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}