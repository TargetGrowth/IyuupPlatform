import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, FileText, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Forbidden() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-red-900 mb-4">
            Acesso Negado
          </h1>
          
          <p className="text-red-800 mb-6 leading-relaxed">
            Você precisa ter sua verificação KYC aprovada para acessar esta funcionalidade.
          </p>
          
          <div className="space-y-3">
            <Button asChild className="w-full bg-red-600 hover:bg-red-700">
              <Link href="/settings">
                <FileText className="mr-2 h-4 w-4" />
                Verificar Documentos KYC
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Link>
            </Button>
          </div>
          
          <div className="mt-6 text-sm text-red-700 bg-red-100 rounded-lg p-3">
            <strong>Dica:</strong> O processo de verificação KYC leva entre 24-48 horas para ser concluído.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}