// use use strict mode
"use strict"

// requires
const nodemailer = require("nodemailer");

class EmailService {
    constructor() {
        this.__transporter = null; // the variable that responsable for connect with the emain servec provider
    };

    // get or create the transporter
    _getTransporter() {
        // check if transporter defined get it
        if (this.__transporter) {
            return this.__transporter;
        }

        // create transporter
        this.__transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT, 10) || 587,
            secure: false, // for first connection only and will be STARTTLS (save connection)
            // auther data
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        return this.__transporter;
    }

    // sending email
    async _send({ to, subject, html }) {
        await this._getTransporter().sendMail({
            from: `"HRM Pro" <${process.env.EMAIL_FROM}>`,
            to: to,
            subject: subject,
            html, // the body of the email
        });
    }

    // password reset
    async sendPasswordReset(email, resetToken) {
        // get client url
        const clientURL = process.env.CLIENT_URL || "http://localhost:3000";

        // make reset link
        const resetLink = `${clientURL}/reset-password?token=${resetToken}`;

        await this._send({
            to: email,
            subject: `HRM Pro — Password Reset Request`,
            // email body
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #1a56db;">Password Reset</h2>
                  <p>You requested a password reset for your HRM Pro account.</p>
                  <p>Click the button below to set a new password. This link expires in <strong>10 minutes</strong>.</p>
                  <a href="${resetLink}"
                     style="display:inline-block; padding:12px 24px; background:#1a56db;
                            color:#fff; border-radius:6px; text-decoration:none; font-weight:bold;">
                      Reset My Password
                  </a>
                  <p style="margin-top:24px; color:#6b7280; font-size:13px;">
                      If you did not request this, please ignore this email.
                      Your password will not change.
                  </p>
                  <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;">
                  <p style="color:#9ca3af; font-size:12px;">HRM Pro — Human Resource Management System</p>
                </div>
            `,
        });
    }

    // sending welcome
    async sendWelcome(email, name, temporaryPassword) {
        // get client url
        const clientURL = process.env.CLIENT_URL || "http://localhost:3000";

        await this._send({
            to: email,
            subject: `Welcome to HRM Pro — Your account is ready`,
            // email body
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #1a56db;">Welcome, ${name}!</h2>
                  <p>Your HRM Pro account has been created by the HR team.</p>
                  <table style="border-collapse:collapse; width:100%; margin:16px 0;">
                    <tr>
                      <td style="padding:8px; border:1px solid #e5e7eb; background:#f9fafb; font-weight:bold; width:40%;">Login URL</td>
                        <td style="padding:8px; border:1px solid #e5e7eb;"><a href="${clientURL}">${clientURL}</a></td>
                      </tr>
                      <tr>
                      <td style="padding:8px; border:1px solid #e5e7eb; background:#f9fafb; font-weight:bold;">Email</td>
                        <td style="padding:8px; border:1px solid #e5e7eb;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px; border:1px solid #e5e7eb; background:#f9fafb; font-weight:bold;">Temporary Password</td>
                        <td style="padding:8px; border:1px solid #e5e7eb; font-family:monospace;">${temporaryPassword}</td>
                      </tr>
                  </table>
                  <p style="color:#dc2626;"><strong>Please change your password after your first login.</strong></p>
                  <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;">
                  <p style="color:#9ca3af; font-size:12px;">HRM Pro — Human Resource Management System</p>
                </div>
            `,
        });
    }
}

// exporting with singleton design pattern
module.exports = new EmailService();