import nodemailer from 'nodemailer';
import type { EmailSender } from '../application/ports.js';
export function createEmailSender(env: NodeJS.ProcessEnv): EmailSender {
    if (!env.SMTP_HOST)
        return { enviar: async (para, assunto, texto) => console.log(`[email não enviado: SMTP_HOST ausente] Para: ${para} | ${assunto} | ${texto}`) };
    const port = Number(env.SMTP_PORT || 587);
    const transport = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
    return {
        enviar: async (to, subject, text) => { await transport.sendMail({ from: env.SMTP_FROM || env.SMTP_USER, to, subject, text }); },
    };
}
