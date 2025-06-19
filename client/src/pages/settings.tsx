import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DashboardHeader from "@/components/dashboard-header";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  User, 
  Lock, 
  Bell, 
  CreditCard, 
  Globe, 
  Shield,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useKyc } from "@/hooks/useKyc";

const kycSchema = z.object({
  cpf: z.string().min(11, "CPF deve ter 11 dígitos").max(14, "CPF inválido"),
  cnpj: z.string().optional(),
  rgNumber: z.string().min(5, "Número do RG é obrigatório"),
  cnhNumber: z.string().optional(),
  address: z.string().min(10, "Endereço deve ter pelo menos 10 caracteres"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  zipCode: z.string().min(8, "CEP deve ter 8 dígitos"),
  country: z.string().default("Brasil"),
  dateOfBirth: z.string().min(10, "Data de nascimento é obrigatória"),
});

type KycFormData = z.infer<typeof kycSchema>;

interface KycDocument {
  id: number;
  documentType: string;
  fileName: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

export default function Settings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { kycStatus, hasSubmittedDocuments } = useKyc();

  // Get user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Get payment configuration
  const { data: paymentConfig } = useQuery({
    queryKey: ["/api/payment-config"],
  });

  // Get KYC documents
  const { data: kycDocuments = [] } = useQuery<KycDocument[]>({
    queryKey: ["/api/kyc/documents"],
    enabled: !!user,
  });

  // KYC form setup
  const kycForm = useForm<KycFormData>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      cpf: "",
      cnpj: "",
      rgNumber: "",
      cnhNumber: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Brasil",
      dateOfBirth: "",
    },
  });

  // Profile form state
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    bio: "",
    website: "",
  });

  // Update form when user data loads
  useEffect(() => {
    if (user && typeof user === 'object') {
      const userData = user as {
        fullName?: string;
        email?: string;
        phone?: string;
        bio?: string;
        website?: string;
      };
      setProfileData({
        fullName: userData.fullName || "",
        email: userData.email || "",
        phone: userData.phone || "",
        bio: userData.bio || "",
        website: userData.website || "",
      });
    }
  }, [user]);

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailSales: true,
    emailMarketing: false,
    pushSales: true,
    pushMarketing: true,
    smsImportant: false,
  });

  // Payment settings
  const [paymentSettings, setPaymentSettings] = useState({
    pixKey: "",
    bankName: "",
    agency: "",
    account: "",
    accountType: "",
  });

  // Update payment settings when config loads
  useEffect(() => {
    if (paymentConfig && typeof paymentConfig === 'object') {
      const config = paymentConfig as any;
      setPaymentSettings({
        pixKey: config.pixKey || "",
        bankName: config.bankName || "",
        agency: config.agency || "",
        account: config.account || "",
        accountType: config.accountType || "",
      });
    }
  }, [paymentConfig]);

  const updateProfile = useMutation({
    mutationFn: async (data: typeof profileData) => {
      return await apiRequest("PATCH", "/api/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil",
        variant: "destructive",
      });
    },
  });

  const updatePassword = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      return await apiRequest("PATCH", "/api/auth/password", data);
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada",
        description: "Sua senha foi atualizada com sucesso",
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível alterar a senha",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(profileData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "A confirmação de senha não confere",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    updatePassword.mutate(passwordData);
  };

  const saveNotificationSettings = () => {
    toast({
      title: "Configurações salvas",
      description: "Suas preferências de notificação foram atualizadas",
    });
  };

  const updatePaymentConfig = useMutation({
    mutationFn: async (data: typeof paymentSettings) => {
      return await apiRequest("PATCH", "/api/payment-config", data);
    },
    onSuccess: () => {
      toast({
        title: "Dados bancários salvos",
        description: "Suas informações de pagamento foram atualizadas",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-config"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações de pagamento",
        variant: "destructive",
      });
    },
  });

  const savePaymentSettings = () => {
    updatePaymentConfig.mutate(paymentSettings);
  };

  // KYC submission mutation
  const submitKycMutation = useMutation({
    mutationFn: async (data: KycFormData) => {
      const documents: { [key: string]: string } = {};
      
      Object.entries(selectedFiles).forEach(([docType, file]) => {
        documents[docType] = `/uploads/${(user as any)?.id}/${file.name}`;
      });

      return await apiRequest("POST", "/api/kyc/submit", {
        kycData: data,
        documents,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "KYC enviado com sucesso",
        description: "Sua verificação foi enviada e está sendo analisada.",
      });
      setSelectedFiles({});
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (docType: string, file: File) => {
    setSelectedFiles(prev => ({ ...prev, [docType]: file }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Update KYC form when user data loads
  useEffect(() => {
    if (user && typeof user === 'object') {
      const userData = user as any;
      kycForm.reset({
        cpf: userData.cpf || "",
        cnpj: userData.cnpj || "",
        address: userData.address || "",
        city: userData.city || "",
        state: userData.state || "",
        zipCode: userData.zipCode || "",
        country: userData.country || "Brasil",
        dateOfBirth: userData.dateOfBirth || "",
      });
    }
  }, [user, kycForm]);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <div className="flex-1 ml-64">
          <div className="p-8 pt-24">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Configurações</h1>
              <p className="text-gray-600">Gerencie suas preferências e dados da conta</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="profile" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Perfil</span>
                </TabsTrigger>
                <TabsTrigger value="kyc" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>KYC</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Segurança</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <span>Notificações</span>
                </TabsTrigger>
                <TabsTrigger value="payment" className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Pagamentos</span>
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Perfil</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Nome completo</Label>
                          <Input
                            id="fullName"
                            value={profileData.fullName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">E-mail</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            value={profileData.phone}
                            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={profileData.website}
                            onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://seusite.com"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="bio">Biografia</Label>
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Conte um pouco sobre você..."
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={updateProfile.isPending}
                        className="bg-primary-blue hover:bg-blue-700"
                      >
                        {updateProfile.isPending ? "Salvando..." : "Salvar alterações"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* KYC Tab */}
              <TabsContent value="kyc">
                <div className="space-y-6">
                  {/* KYC Status Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <span>Status da Verificação KYC</span>
                      </CardTitle>
                      <CardDescription>
                        Verificação de identidade obrigatória para criar e vender produtos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {kycStatus === "approved" ? (
                        <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">Verificação Aprovada</p>
                            <p className="text-sm text-green-600">
                              Você pode criar produtos e se afiliar a outros produtos
                            </p>
                          </div>
                        </div>
                      ) : kycStatus === "pending" && hasSubmittedDocuments ? (
                        <Alert className="border-blue-200 bg-blue-50">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-blue-800">
                            Seus documentos estão sendo analisados. Você poderá criar produtos após a aprovação.
                          </AlertDescription>
                        </Alert>
                      ) : kycStatus === "rejected" ? (
                        <Alert variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            Seus documentos foram rejeitados. Envie novos documentos para continuar.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert className="border-amber-200 bg-amber-50">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-amber-800">
                            Envie seus documentos para verificação KYC antes de criar e vender produtos.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* KYC Form */}
                  {kycStatus !== "approved" && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Dados para Verificação</CardTitle>
                        <CardDescription>
                          Preencha seus dados pessoais para verificação de identidade
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Form {...kycForm}>
                          <form onSubmit={kycForm.handleSubmit((data) => submitKycMutation.mutate(data))} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={kycForm.control}
                                name="cpf"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>CPF</FormLabel>
                                    <FormControl>
                                      <Input placeholder="000.000.000-00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={kycForm.control}
                                name="cnpj"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>CNPJ (Opcional)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="00.000.000/0000-00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={kycForm.control}
                                name="rgNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Número do RG</FormLabel>
                                    <FormControl>
                                      <Input placeholder="00.000.000-0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={kycForm.control}
                                name="cnhNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Número da CNH (Opcional)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="00000000000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={kycForm.control}
                                name="dateOfBirth"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Data de Nascimento</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={kycForm.control}
                                name="zipCode"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>CEP</FormLabel>
                                    <FormControl>
                                      <Input placeholder="00000-000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={kycForm.control}
                                name="address"
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel>Endereço Completo</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Rua, número, complemento" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={kycForm.control}
                                name="city"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Cidade</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Sua cidade" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={kycForm.control}
                                name="state"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Estado</FormLabel>
                                    <FormControl>
                                      <Input placeholder="SP" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="space-y-4">
                              <Label className="text-lg font-semibold">Documentos Obrigatórios</Label>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['rg', 'cpf_doc', 'comprovante_residencia'].map((docType) => (
                                  <div key={docType} className="border rounded-lg p-4">
                                    <Label className="block mb-2 font-medium">
                                      {docType === 'rg' ? 'RG (Frente e Verso)' :
                                       docType === 'cpf_doc' ? 'CPF' : 'Comprovante de Residência'}
                                    </Label>
                                    <Input
                                      type="file"
                                      accept="image/*,.pdf"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileSelect(docType, file);
                                      }}
                                      className="mb-2"
                                    />
                                    {selectedFiles[docType] && (
                                      <div className="flex items-center text-sm text-green-600">
                                        <FileText className="h-4 w-4 mr-1" />
                                        {selectedFiles[docType].name}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <Button
                              type="submit"
                              disabled={submitKycMutation.isPending}
                              className="w-full bg-primary-blue hover:bg-blue-700"
                            >
                              {submitKycMutation.isPending ? "Enviando..." : "Enviar Verificação KYC"}
                            </Button>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  )}

                  {/* Documents Status */}
                  {kycDocuments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Documentos Enviados</CardTitle>
                        <CardDescription>
                          Status detalhado dos seus documentos de verificação
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {kycDocuments.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between border rounded-lg p-4">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-gray-500" />
                                <div>
                                  <p className="font-medium">{doc.fileName}</p>
                                  <p className="text-sm text-gray-500">
                                    Tipo: {doc.documentType.toUpperCase()}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Enviado em: {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                <Badge className={getStatusColor(doc.status)}>
                                  {getStatusIcon(doc.status)}
                                  <span className="ml-1">
                                    {doc.status === "approved" ? "Aprovado" :
                                     doc.status === "rejected" ? "Rejeitado" : "Pendente"}
                                  </span>
                                </Badge>
                                {doc.rejectionReason && (
                                  <p className="text-sm text-red-600 text-right max-w-xs">
                                    {doc.rejectionReason}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Alterar senha</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Senha atual</Label>
                        <div className="relative mt-1">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="newPassword">Nova senha</Label>
                        <div className="relative mt-1">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="mt-1"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={updatePassword.isPending}
                        className="bg-primary-blue hover:bg-blue-700"
                      >
                        {updatePassword.isPending ? "Alterando..." : "Alterar senha"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Preferências de notificação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <Mail className="h-5 w-5 mr-2" />
                        E-mail
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Notificações de vendas</Label>
                            <p className="text-sm text-gray-600">Receba um e-mail a cada nova venda</p>
                          </div>
                          <Switch
                            checked={notifications.emailSales}
                            onCheckedChange={(checked) => 
                              setNotifications(prev => ({ ...prev, emailSales: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>E-mails promocionais</Label>
                            <p className="text-sm text-gray-600">Dicas, novidades e promoções</p>
                          </div>
                          <Switch
                            checked={notifications.emailMarketing}
                            onCheckedChange={(checked) => 
                              setNotifications(prev => ({ ...prev, emailMarketing: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <Bell className="h-5 w-5 mr-2" />
                        Notificações Push
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Vendas e pedidos</Label>
                            <p className="text-sm text-gray-600">Notificações em tempo real</p>
                          </div>
                          <Switch
                            checked={notifications.pushSales}
                            onCheckedChange={(checked) => 
                              setNotifications(prev => ({ ...prev, pushSales: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Marketing e atualizações</Label>
                            <p className="text-sm text-gray-600">Novidades da plataforma</p>
                          </div>
                          <Switch
                            checked={notifications.pushMarketing}
                            onCheckedChange={(checked) => 
                              setNotifications(prev => ({ ...prev, pushMarketing: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <Smartphone className="h-5 w-5 mr-2" />
                        SMS
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Alertas importantes</Label>
                            <p className="text-sm text-gray-600">Apenas para notificações críticas</p>
                          </div>
                          <Switch
                            checked={notifications.smsImportant}
                            onCheckedChange={(checked) => 
                              setNotifications(prev => ({ ...prev, smsImportant: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={saveNotificationSettings}
                      className="bg-primary-blue hover:bg-blue-700"
                    >
                      Salvar preferências
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payment Tab */}
              <TabsContent value="payment">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados para recebimento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">PIX</h3>
                      <div>
                        <Label htmlFor="pixKey">Chave PIX</Label>
                        <Input
                          id="pixKey"
                          value={paymentSettings.pixKey}
                          onChange={(e) => setPaymentSettings(prev => ({ ...prev, pixKey: e.target.value }))}
                          placeholder="E-mail, telefone ou CPF"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Dados bancários</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="bankName">Banco</Label>
                          <Input
                            id="bankName"
                            value={paymentSettings.bankName}
                            onChange={(e) => setPaymentSettings(prev => ({ ...prev, bankName: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="accountType">Tipo de conta</Label>
                          <Input
                            id="accountType"
                            value={paymentSettings.accountType}
                            onChange={(e) => setPaymentSettings(prev => ({ ...prev, accountType: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label htmlFor="agency">Agência</Label>
                          <Input
                            id="agency"
                            value={paymentSettings.agency}
                            onChange={(e) => setPaymentSettings(prev => ({ ...prev, agency: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="account">Conta</Label>
                          <Input
                            id="account"
                            value={paymentSettings.account}
                            onChange={(e) => setPaymentSettings(prev => ({ ...prev, account: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={savePaymentSettings}
                      className="bg-primary-blue hover:bg-blue-700"
                    >
                      Salvar dados bancários
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}