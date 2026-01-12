/**
 * Script per pulire il database dai dati demo
 * 
 * Rimuove tutti gli utenti, passkey, sessioni e token di verifica creati durante lo sviluppo.
 * 
 * Uso:
 *   pnpm tsx scripts/clean-demo-data.ts
 * 
 * Oppure con Docker:
 *   docker compose exec app pnpm tsx scripts/clean-demo-data.ts
 */

import { db } from "../lib/db"
import { 
	users, 
	passkeyCredentials, 
	sessions, 
	accounts, 
	verificationTokens 
} from "../lib/db/schema"
import { sql } from "drizzle-orm"

async function cleanDemoData() {
	console.log("🧹 Pulizia dati demo dal database...")
	
	try {
		// Conta i record prima della pulizia
		const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users)
		const [passkeyCount] = await db.select({ count: sql<number>`count(*)` }).from(passkeyCredentials)
		const [sessionCount] = await db.select({ count: sql<number>`count(*)` }).from(sessions)
		const [accountCount] = await db.select({ count: sql<number>`count(*)` }).from(accounts)
		const [tokenCount] = await db.select({ count: sql<number>`count(*)` }).from(verificationTokens)
		
		console.log(`📊 Record trovati:`)
		console.log(`   - Utenti: ${userCount.count}`)
		console.log(`   - Passkey: ${passkeyCount.count}`)
		console.log(`   - Sessioni: ${sessionCount.count}`)
		console.log(`   - Account: ${accountCount.count}`)
		console.log(`   - Token di verifica: ${tokenCount.count}`)
		
		// Elimina in ordine per rispettare le foreign key constraints
		// Le foreign key sono configurate con CASCADE, quindi eliminare gli utenti
		// eliminerà automaticamente le passkey, sessioni e account associati
		
		console.log("\n🗑️  Eliminazione token di verifica...")
		await db.delete(verificationTokens)
		console.log("   ✓ Token di verifica eliminati")
		
		console.log("\n🗑️  Eliminazione sessioni...")
		await db.delete(sessions)
		console.log("   ✓ Sessioni eliminate")
		
		console.log("\n🗑️  Eliminazione account...")
		await db.delete(accounts)
		console.log("   ✓ Account eliminati")
		
		console.log("\n🗑️  Eliminazione passkey...")
		await db.delete(passkeyCredentials)
		console.log("   ✓ Passkey eliminate")
		
		console.log("\n🗑️  Eliminazione utenti...")
		await db.delete(users)
		console.log("   ✓ Utenti eliminati")
		
		// Verifica che tutto sia stato eliminato
		const [finalUserCount] = await db.select({ count: sql<number>`count(*)` }).from(users)
		const [finalPasskeyCount] = await db.select({ count: sql<number>`count(*)` }).from(passkeyCredentials)
		
		console.log("\n✅ Pulizia completata!")
		console.log(`📊 Record rimanenti:`)
		console.log(`   - Utenti: ${finalUserCount.count}`)
		console.log(`   - Passkey: ${finalPasskeyCount.count}`)
		
		process.exit(0)
	} catch (error) {
		console.error("❌ Errore durante la pulizia:", error)
		process.exit(1)
	}
}

// Esegui lo script
cleanDemoData()
