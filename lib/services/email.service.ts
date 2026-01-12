/**
 * Email Service
 * 
 * Handles sending emails via SMTP (Mailpit in development, production SMTP in production)
 */

import nodemailer from "nodemailer"
import { env } from "@/lib/env"

// Parse SMTP URL (format: smtp://host:port or smtp://user:pass@host:port)
function parseSmtpUrl(url: string) {
	const urlObj = new URL(url)
	return {
		host: urlObj.hostname,
		port: parseInt(urlObj.port) || 587,
		auth: urlObj.username && urlObj.password
			? {
					user: urlObj.username,
					pass: urlObj.password,
				}
			: undefined,
		secure: urlObj.protocol === "smtps:",
	}
}

// Create transporter (singleton)
let transporter: nodemailer.Transporter | null = null

function getTransporter() {
	if (!transporter) {
		if (!env.EMAIL_SERVER) {
			throw new Error("EMAIL_SERVER not configured")
		}

		const smtpConfig = parseSmtpUrl(env.EMAIL_SERVER)
		
		transporter = nodemailer.createTransport({
			host: smtpConfig.host,
			port: smtpConfig.port,
			secure: smtpConfig.secure,
			auth: smtpConfig.auth,
			// For Mailpit, we don't need authentication
			tls: {
				rejectUnauthorized: false, // Accept self-signed certificates (for Mailpit)
			},
		})
	}

	return transporter
}

/**
 * Send an email
 */
export async function sendEmail(options: {
	to: string
	subject: string
	html: string
	text?: string
}) {
	if (!env.EMAIL_SERVER) {
		console.warn("Email server not configured, skipping email send")
		return
	}

	try {
		const mailTransporter = getTransporter()
		
		await mailTransporter.sendMail({
			from: env.EMAIL_FROM,
			to: options.to,
			subject: options.subject,
			html: options.html,
			text: options.text || options.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
		})

		console.log(`Email sent to ${options.to}`)
	} catch (error) {
		console.error("Failed to send email:", error)
		throw error
	}
}

/**
 * Send magic link email
 */
export async function sendMagicLinkEmail(email: string, token: string) {
	const magicLink = `${env.NEXTAUTH_URL}/login?token=${token}&email=${encodeURIComponent(email)}`
	
	await sendEmail({
		to: email,
		subject: "Your DuoSync Magic Link",
		html: `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
				<h1 style="color: #2563eb;">DuoSync</h1>
				<p>Click the link below to sign in to your account:</p>
				<p style="margin: 30px 0;">
					<a href="${magicLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
						Sign In
					</a>
				</p>
				<p style="color: #666; font-size: 14px;">
					Or copy and paste this link into your browser:<br>
					<code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; word-break: break-all;">${magicLink}</code>
				</p>
				<p style="color: #666; font-size: 14px; margin-top: 30px;">
					This link will expire in 1 hour. If you didn't request this link, you can safely ignore this email.
				</p>
			</body>
			</html>
		`,
		text: `Sign in to DuoSync: ${magicLink}\n\nThis link will expire in 1 hour.`,
	})
}
