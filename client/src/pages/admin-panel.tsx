import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Eye, CheckCircle, XCircle, Clock, FileText, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  kycStatus: string;
  role: string;
  isActive: boolean;
  kycSubmittedAt?: string;
  createdAt: string;
  cpf?: string;
  cnpj?: string;
  rgNumber?: string;
  cnhNumber?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface KycDocument {
  id: number;
  userId: number;
  documentType: string;
  fileName: string;
  filePath: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
  };
}

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "admin"
  });

  const { data: pendingKyc = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/kyc/pending"],
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: kycDocuments = [] } = useQuery<KycDocument[]>({
    queryKey: ["/api/admin/kyc/documents"],
  });

  const approveKycMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("PATCH", `/api/admin/kyc/${userId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "KYC aprovado",
        description: "Usuário aprovado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectKycMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      return await apiRequest("PATCH", `/api/admin/kyc/${userId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setRejectionReason("");
      toast({
        title: "KYC rejeitado",
        description: "Usuário rejeitado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (adminData: typeof newAdminData) => {
      return await apiRequest("POST", "/api/admin/users/create", adminData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowCreateAdmin(false);
      setNewAdminData({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        role: "admin"
      });
      toast({
        title: "Admin criado",
        description: "Novo administrador criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: Partial<User> }) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Usuário atualizado",
        description: "Dados do usuário atualizados com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 mr-3" />
            Painel Administrativo
          </h1>
          <p className="mt-2 text-gray-600">
            Gerencie usuários e verificações KYC
          </p>
        </div>

        <Tabs defaultValue="kyc-pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="kyc-pending">KYC Pendentes</TabsTrigger>
            <TabsTrigger value="users">Todos os Usuários</TabsTrigger>
            <TabsTrigger value="admins">Administradores</TabsTrigger>
          </TabsList>

          <TabsContent value="kyc-pending" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Verificações KYC Pendentes</CardTitle>
                <CardDescription>
                  Usuários aguardando aprovação de KYC
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingKyc.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Nenhuma verificação KYC pendente
                    </p>
                  ) : (
                    pendingKyc
                      .sort((a, b) => {
                        if (!a.kycSubmittedAt || !b.kycSubmittedAt) return 0;
                        return new Date(b.kycSubmittedAt).getTime() - new Date(a.kycSubmittedAt).getTime();
                      })
                      .map((user) => (
                      <div key={user.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{user.fullName}</h3>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-sm text-gray-500">
                              Enviado em: {user.kycSubmittedAt ? new Date(user.kycSubmittedAt).toLocaleDateString('pt-BR') : 'N/A'}
                            </p>
                            {user.cpf && (
                              <div className="mt-2 text-sm">
                                <span className="font-medium">CPF:</span> {user.cpf}
                              </div>
                            )}
                            {user.address && (
                              <div className="text-sm">
                                <span className="font-medium">Endereço:</span> {user.address}, {user.city}/{user.state}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver Detalhes
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Verificação KYC - {user.fullName}</DialogTitle>
                                  <DialogDescription>
                                    Análise completa de documentos e dados do usuário
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6">
                                  {/* Dados Pessoais */}
                                  <div>
                                    <h3 className="text-lg font-semibold mb-3">Dados Pessoais</h3>
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                      <div>
                                        <Label className="text-sm text-gray-600">Nome Completo</Label>
                                        <p className="font-medium">{user.fullName}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm text-gray-600">Email</Label>
                                        <p className="font-medium">{user.email}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm text-gray-600">Telefone</Label>
                                        <p className="font-medium">{user.phone}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm text-gray-600">CPF</Label>
                                        <p className="font-medium">{user.cpf || "Não informado"}</p>
                                      </div>
                                      {user.cnpj && (
                                        <div>
                                          <Label className="text-sm text-gray-600">CNPJ</Label>
                                          <p className="font-medium">{user.cnpj}</p>
                                        </div>
                                      )}
                                      {(() => {
                                        const userDocs = kycDocuments?.filter((doc: any) => doc.userId === user.id) || [];
                                        const rgDoc = userDocs.find((doc: any) => doc.documentType === 'rg');
                                        const cnhDoc = userDocs.find((doc: any) => doc.documentType === 'cnh');
                                        
                                        return (
                                          <>
                                            {rgDoc && (
                                              <div>
                                                <Label className="text-sm text-gray-600">RG</Label>
                                                <p className="font-medium">{rgDoc.documentNumber || "Número não informado"}</p>
                                              </div>
                                            )}
                                            {cnhDoc && (
                                              <div>
                                                <Label className="text-sm text-gray-600">CNH</Label>
                                                <p className="font-medium">{cnhDoc.documentNumber || "Número não informado"}</p>
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                      {user.dateOfBirth && (
                                        <div>
                                          <Label className="text-sm text-gray-600">Data de Nascimento</Label>
                                          <p className="font-medium">
                                            {new Date(user.dateOfBirth).toLocaleDateString('pt-BR')}
                                          </p>
                                        </div>
                                      )}
                                      <div className="col-span-2">
                                        <Label className="text-sm text-gray-600">Endereço Completo</Label>
                                        <p className="font-medium">
                                          {user.address}<br />
                                          {user.city}/{user.state} - CEP: {user.zipCode}
                                          {user.country && ` - ${user.country}`}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm text-gray-600">Data de Submissão</Label>
                                        <p className="font-medium">
                                          {user.kycSubmittedAt ? new Date(user.kycSubmittedAt).toLocaleDateString('pt-BR') : 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm text-gray-600">Status Atual</Label>
                                        <Badge variant={user.kycStatus === 'pending' ? 'secondary' : 'destructive'}>
                                          {user.kycStatus === 'pending' ? 'Pendente' : user.kycStatus === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Documentos */}
                                  <div>
                                    <h3 className="text-lg font-semibold mb-3">Documentos Enviados</h3>
                                    <div className="space-y-3">
                                      {kycDocuments
                                        .filter(doc => doc.userId === user.id)
                                        .map((doc) => (
                                          <div key={doc.id} className="border rounded-lg p-4 bg-white">
                                            <div className="flex items-center justify-between">
                                              <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                  <FileText className="h-4 w-4" />
                                                  <span className="font-medium">
                                                    {doc.documentType === 'cpf_doc' ? 'Documento CPF' :
                                                     doc.documentType === 'rg' ? 'RG' :
                                                     doc.documentType === 'cnh' ? 'CNH' :
                                                     doc.documentType === 'comprovante_residencia' ? 'Comprovante de Residência' :
                                                     doc.documentType.toUpperCase()}
                                                  </span>
                                                  <Badge variant={
                                                    doc.status === 'pending' ? 'secondary' :
                                                    doc.status === 'approved' ? 'default' : 'destructive'
                                                  }>
                                                    {doc.status === 'pending' ? 'Pendente' : 
                                                     doc.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                                  </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">{doc.fileName}</p>
                                                <p className="text-xs text-gray-500">
                                                  Enviado em: {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                                                </p>
                                              </div>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  window.open(`/api/admin/documents/${doc.id}/view`, '_blank');
                                                }}
                                              >
                                                <Eye className="h-4 w-4 mr-1" />
                                                Ver
                                              </Button>
                                            </div>
                                          </div>
                                        ))
                                      }
                                      {kycDocuments.filter(doc => doc.userId === user.id).length === 0 && (
                                        <p className="text-gray-500 text-center py-4">
                                          Nenhum documento encontrado
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Ações */}
                                  <div className="flex space-x-3 pt-4 border-t">
                                    <Button
                                      onClick={() => approveKycMutation.mutate(user.id)}
                                      disabled={approveKycMutation.isPending}
                                      className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Aprovar KYC
                                    </Button>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="destructive" className="flex-1">
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Rejeitar KYC
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Rejeitar KYC</DialogTitle>
                                          <DialogDescription>
                                            Informe o motivo da rejeição
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <Textarea
                                            placeholder="Digite o motivo da rejeição..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                          />
                                          <Button
                                            onClick={() => rejectKycMutation.mutate({ 
                                              userId: user.id, 
                                              reason: rejectionReason 
                                            })}
                                            disabled={rejectKycMutation.isPending || !rejectionReason}
                                            variant="destructive"
                                            className="w-full"
                                          >
                                            Confirmar Rejeição
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Usuários</CardTitle>
                <CardDescription>
                  Gerencie todos os usuários da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allUsers.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{user.fullName}</h3>
                            <Badge className={getStatusColor(user.kycStatus)}>
                              {getStatusIcon(user.kycStatus)}
                              <span className="ml-1">
                                {user.kycStatus === "approved" ? "Aprovado" :
                                 user.kycStatus === "rejected" ? "Rejeitado" : "Pendente"}
                              </span>
                            </Badge>
                            <Badge variant="outline">
                              {user.role === "super_admin" ? "Super Admin" : 
                               user.role === "admin" ? "Admin" : "Usuário"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-sm text-gray-500">
                            Cadastrado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => 
                              updateUserMutation.mutate({
                                userId: user.id,
                                updates: { role: newRole }
                              })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuário</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant={user.isActive ? "destructive" : "default"}
                            size="sm"
                            onClick={() => 
                              updateUserMutation.mutate({
                                userId: user.id,
                                updates: { isActive: !user.isActive }
                              })
                            }
                          >
                            {user.isActive ? "Desativar" : "Ativar"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Administradores</CardTitle>
                <CardDescription>
                  Gerencie administradores do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Dialog open={showCreateAdmin} onOpenChange={setShowCreateAdmin}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Criar Novo Admin
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Novo Administrador</DialogTitle>
                        <DialogDescription>
                          Preencha os dados do novo administrador
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="fullName">Nome Completo</Label>
                          <Input
                            id="fullName"
                            value={newAdminData.fullName}
                            onChange={(e) => setNewAdminData(prev => ({ ...prev, fullName: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newAdminData.email}
                            onChange={(e) => setNewAdminData(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            value={newAdminData.phone}
                            onChange={(e) => setNewAdminData(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Senha</Label>
                          <Input
                            id="password"
                            type="password"
                            value={newAdminData.password}
                            onChange={(e) => setNewAdminData(prev => ({ ...prev, password: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="role">Nível de Acesso</Label>
                          <Select
                            value={newAdminData.role}
                            onValueChange={(value) => setNewAdminData(prev => ({ ...prev, role: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={() => createAdminMutation.mutate(newAdminData)}
                          disabled={createAdminMutation.isPending}
                          className="w-full"
                        >
                          Criar Administrador
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-4">
                  {allUsers.filter(user => user.role === "admin" || user.role === "super_admin").map((admin) => (
                    <div key={admin.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{admin.fullName}</h3>
                            <Badge variant="outline">
                              {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                            </Badge>
                            {admin.isActive ? (
                              <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">Inativo</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{admin.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}