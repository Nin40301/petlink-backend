import nodemailer from 'nodemailer';

export async function sendResetPasswordEmail(email: string, token: string) {
  // Cria conta de teste no Ethereal
  const testAccount = await nodemailer.createTestAccount();

  // Configura o transportador
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const resetLink = `http://localhost:3000/redefinir-senha?token=${token}`;

  const info = await transporter.sendMail({
    from: '"PetLink Support" <support@petlink.com>',
    to: email,
    subject: 'Recuperação de Senha - PetLink',
    text: `Você solicitou a recuperação de senha. Clique no link para redefinir: ${resetLink}`,
    html: `<p>Você solicitou a recuperação de senha. Clique no link para redefinir:</p><a href="${resetLink}">${resetLink}</a>`,
  });

  console.log('Message sent: %s', info.messageId);
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  
  return nodemailer.getTestMessageUrl(info);
}
