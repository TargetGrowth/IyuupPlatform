import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Shield, FileText, Upload, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

const kycSchema = z.object({
  cpf: z.string().min(11, "CPF deve ter 11 dígitos").max(14, "CPF inválido"),
  cnpj: z.string().optional(),
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

export default function KycVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File }>({});

  const form = useForm<KycFormData>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      cpf: user?.cpf || "",
      cnpj: user?.cnpj || "",
      address: user?.address || "",
      city: user?.city || "",
      state: user?.state || "",
      zipCode: user?.zipCode || "",
      country: user?.country || "Brasil",
      dateOfBirth: user?.dateOfBirth || "",
    },
  });

  const { data: kycDocuments = [] } = useQuery<KycDocument[]>({
    queryKey: ["/api/kyc/documents"],
    enabled: !!user,
  });

  const submitKycMutation = useMutation({
    mutationFn: async (data: KycFormData) => {
      // Create documents object with file paths (simulated upload)
      const documents: { [key: string]: string } = {};
      
      Object.entries(selectedFiles).forEach(([docType, file]) => {
        documents[docType] = `/uploads/${user?.id}/${file.name}`;
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

  const canCreateCourses = user?.kycStatus === "approved";
  const kycPending = user?.kycStatus === "pending";
  const kycRejected = user?.kycStatus === "rejected";

  if (canCreateCourses) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Shield className="h-8 w-8 mr-3 text-green-600" />
              Verificação KYC - Aprovada
            </h1>
            <p className="mt-2 text-gray-600">
              Sua verificação foi aprovada. Você pode criar cursos agora.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Status: Aprovado</CardTitle>
              <CardDescription>
                Verificação aprovada em: {user?.kycSubmittedAt ? new Date(user.kycSubmittedAt).toLocaleDateString('pt-BR') : 'N/A'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-600 font-medium">Verificação KYC Aprovada</span>
              </div>
              <p className="text-gray-600">
                Você agora pode acessar todas as funcionalidades da plataforma, incluindo a criação e venda de cursos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 mr-3" />
            Verificação KYC
          </h1>
          <p className="mt-2 text-gray-600">
            Complete sua verificação de identidade para criar e vender cursos
          </p>
        </div>

        {kycPending && (
          <Alert className="mb-6">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Sua verificação KYC está pendente de análise. Aguarde a aprovação para criar cursos.
            </AlertDescription>
          </Alert>
        )}

        {kycRejected && user?.kycRejectionReason && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Sua verificação foi rejeitada: {user.kycRejectionReason}
            </AlertDescription>
          </Alert>
        )}

        {!kycPending && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>
                Preencha seus dados pessoais para verificação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => submitKycMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="000.000.000-00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ (Opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00.000.000/0000-00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00000-000"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Endereço Completo</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Rua, número, complemento"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Sua cidade"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="SP"
                              {...field}
                            />
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
                    className="w-full"
                  >
                    {submitKycMutation.isPending ? "Enviando..." : "Enviar Verificação KYC"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {kycDocuments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Documentos Enviados</CardTitle>
              <CardDescription>
                Status dos seus documentos de verificação
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
                        <p className="text-sm text-red-600">{doc.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}