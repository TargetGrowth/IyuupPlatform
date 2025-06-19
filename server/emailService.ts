import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface InvitationEmailData {
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  type: 'coproducer' | 'affiliate';
  percentage?: number;
  commission?: number;
  invitationToken: string;
  courseName?: string;
}

interface VerificationEmailData {
  userEmail: string;
  userName: string;
  verificationToken: string;
}

interface SaleNotificationData {
  userEmail: string;
  userName: string;
  courseName: string;
  customerName: string;
  saleAmount: string;
  paymentMethod: string;
}

interface RegistrationEmailData {
  userEmail: string;
  userName: string;
}

// Use the verified email from Resend domain or fallback to the user's email
const getFromEmail = () => {
  return 'contato.cyfer@gmail.com'; // Use your verified email
};

export async function sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/verify-email/${data.verificationToken}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">IYUUP</h1>
          <p style="color: #666; margin: 5px 0;">Plataforma de Cursos Online</p>
        </div>
        
        <h2 style="color: #333;">Confirme seu e-mail</h2>
        
        <p>Olá <strong>${data.userName}</strong>!</p>
        
        <p>Obrigado por se cadastrar na IYUUP! Para completar seu cadastro e ter acesso a todas as funcionalidades da plataforma, confirme seu e-mail clicando no botão abaixo:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Confirmar E-mail
          </a>
        </div>
        
        <p>Ou copie e cole este link no seu navegador:</p>
        <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">${verificationUrl}</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Este link de verificação expira em 24 horas.<br>
            Se você não se cadastrou na IYUUP, pode ignorar este e-mail.
          </p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: getFromEmail(),
      to: [data.userEmail],
      subject: 'Confirme seu e-mail - IYUUP',
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('Erro ao enviar e-mail de verificação:', error);
    return false;
  }
}

export async function sendRegistrationWelcomeEmail(data: RegistrationEmailData): Promise<boolean> {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">IYUUP</h1>
          <p style="color: #666; margin: 5px 0;">Plataforma de Cursos Online</p>
        </div>
        
        <h2 style="color: #333;">Bem-vindo à IYUUP!</h2>
        
        <p>Olá <strong>${data.userName}</strong>!</p>
        
        <p>É um prazer ter você conosco! Sua conta foi criada com sucesso e agora você pode:</p>
        
        <ul style="color: #555; line-height: 1.6;">
          <li>📚 Criar e vender seus próprios cursos</li>
          <li>💰 Gerenciar suas vendas e analytics</li>
          <li>🔗 Criar links personalizados de vendas</li>
          <li>👥 Convidar coproductores e afiliados</li>
          <li>📊 Acompanhar relatórios detalhados</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard" 
             style="background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Acessar Dashboard
          </a>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Próximos passos:</h3>
          <ol style="color: #555; line-height: 1.6;">
            <li>Configure seus dados de pagamento</li>
            <li>Crie seu primeiro curso</li>
            <li>Personalize sua página de vendas</li>
            <li>Compartilhe seus links e comece a vender!</li>
          </ol>
        </div>
        
        <p>Se tiver dúvidas, nossa equipe está sempre pronta para ajudar!</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="color: #666; font-size: 12px;">
            Obrigado por escolher a IYUUP!<br>
            Equipe IYUUP
          </p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: getFromEmail(),
      to: [data.userEmail],
      subject: 'Bem-vindo à IYUUP - Sua jornada começa agora!',
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('Erro ao enviar e-mail de boas-vindas:', error);
    return false;
  }
}

export async function sendSaleNotificationEmail(data: SaleNotificationData): Promise<boolean> {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">IYUUP</h1>
          <p style="color: #666; margin: 5px 0;">Plataforma de Cursos Online</p>
        </div>
        
        <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0; font-size: 24px;">🎉 Nova Venda Realizada!</h2>
        </div>
        
        <p>Olá <strong>${data.userName}</strong>!</p>
        
        <p>Parabéns! Você acabou de realizar uma nova venda:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Curso:</td>
              <td style="padding: 8px 0; color: #333;">${data.courseName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Cliente:</td>
              <td style="padding: 8px 0; color: #333;">${data.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Valor:</td>
              <td style="padding: 8px 0; color: #10b981; font-weight: bold; font-size: 18px;">R$ ${data.saleAmount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Pagamento:</td>
              <td style="padding: 8px 0; color: #333;">${data.paymentMethod === 'credit_card' ? 'Cartão de Crédito' : data.paymentMethod === 'pix' ? 'PIX' : 'Boleto'}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/sales" 
             style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Ver Todas as Vendas
          </a>
        </div>
        
        <p>Continue assim! Cada venda é um passo a mais na construção do seu negócio digital.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="color: #666; font-size: 12px;">
            Equipe IYUUP
          </p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: getFromEmail(),
      to: [data.userEmail],
      subject: `🎉 Nova venda: ${data.courseName} - R$ ${data.saleAmount}`,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação de venda:', error);
    return false;
  }
}

export async function sendInvitationEmail(data: InvitationEmailData): Promise<boolean> {
  try {
    const subject = data.type === 'coproducer' 
      ? `Convite para ser coprodutor - ${data.courseName || 'Curso'}`
      : `Convite para ser afiliado - ${data.courseName || 'Curso'}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">IYUUP</h1>
          <p style="color: #666; margin: 5px 0;">Plataforma de Cursos Online</p>
        </div>
        
        <h2 style="color: #333;">Você foi convidado para participar de um projeto!</h2>
        
        <p>Olá!</p>
        
        <p><strong>${data.senderName}</strong> (${data.senderEmail}) convidou você para ser ${data.type === 'coproducer' ? 'coprodutor' : 'afiliado'} do curso:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${data.courseName || 'Curso'}</h3>
          ${data.type === 'coproducer' && data.percentage ? 
            `<p><strong>Percentual de participação:</strong> ${data.percentage}%</p>` : 
            `<p><strong>Comissão por venda:</strong> ${data.commission}%</p>`
          }
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/accept-invitation/${data.invitationToken}" 
             style="background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Aceitar Convite
          </a>
        </div>
        
        <p>Se você não conhece esta pessoa ou não deseja participar, pode ignorar este e-mail.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Este convite expira em 7 dias.<br>
            Equipe IYUUP
          </p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: getFromEmail(),
      to: [data.recipientEmail],
      subject: subject,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('Erro ao enviar e-mail de convite:', error);
    return false;
  }
}