import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import nodemailer from "nodemailer";
import { adminRouter } from "./routers/admin";
import { billingRouter } from "./routers/billing";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  admin: adminRouter,
  billing: billingRouter,

  // Email: send signed agreement to contracts@drivewhip.com and member
  agreement: router({
    sendEmail: publicProcedure
      .input(z.object({
        memberName: z.string(),
        memberEmail: z.string().email().optional(),
        agreementHtml: z.string(),
        addonHtmls: z.array(z.object({ label: z.string(), html: z.string() })).optional(),
      }))
      .mutation(async ({ input }) => {
        const gmailUser = process.env.GMAIL_USER;
        const gmailPass = process.env.GMAIL_APP_PASSWORD;

        if (!gmailUser || !gmailPass) {
          console.warn('[Email] GMAIL_USER or GMAIL_APP_PASSWORD not configured — skipping email send');
          return { sent: false, reason: 'Email not configured' };
        }

        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: { user: gmailUser, pass: gmailPass },
        });

        const attachments = [
          {
            filename: `WhipMemberAgreement_${input.memberName.replace(/\s+/g, '_')}.html`,
            content: input.agreementHtml,
            contentType: 'text/html',
          },
          ...(input.addonHtmls ?? []).map(a => ({
            filename: `${a.label.replace(/\s+/g, '_')}.html`,
            content: a.html,
            contentType: 'text/html',
          })),
        ];

        const subject = `Whip Member Agreement — ${input.memberName}`;
        const text = `A new Whip Member Agreement has been signed by ${input.memberName}.\n\nPlease find the signed agreement(s) attached.`;

        const recipients = [gmailUser]; // contracts@drivewhip.com
        if (input.memberEmail) recipients.push(input.memberEmail);

        await transporter.sendMail({
          from: `"Whip Agreements" <${gmailUser}>`,
          to: recipients.join(', '),
          subject,
          text,
          attachments,
        });

        return { sent: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
