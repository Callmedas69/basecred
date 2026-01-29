/**
 * BaseCred Decision Engine - API Server Example
 * 
 * Run with: npx tsx examples/api-server.ts
 * 
 * Test with:
 *   curl -X POST http://localhost:3000/v1/decide \
 *     -H "Content-Type: application/json" \
 *     -d '{"subject": "0x1234", "context": "allowlist.general"}'
 */

import { createServer, IncomingMessage, ServerResponse } from "http"
import { decide, normalizeSignals, validateDecideRequest } from "../src"
import type { UnifiedProfileData } from "../src"

const PORT = 3000

// ============================================================================
// Mock Profile Fetcher
// In production, this would call Ethos, Neynar, and Talent APIs
// ============================================================================

async function fetchProfile(subject: string): Promise<UnifiedProfileData> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 100))

    // Mock profiles based on subject
    if (subject.toLowerCase().includes("spam")) {
        return {
            ethos: { availability: "available", credibility_score: 15 },
            neynar: { farcaster_user_score: 0.1 },
            talent: null
        }
    }

    if (subject.toLowerCase().includes("expert")) {
        return {
            ethos: { availability: "available", credibility_score: 80 },
            neynar: { farcaster_user_score: 0.85 },
            talent: {
                builder: { availability: "available", score: 90 },
                creator: { availability: "available", score: 70 }
            }
        }
    }

    // Default: moderate user
    return {
        ethos: { availability: "available", credibility_score: 55 },
        neynar: { farcaster_user_score: 0.6 },
        talent: {
            builder: { availability: "available", score: 40 },
            creator: { availability: "not_found" }
        }
    }
}

// ============================================================================
// HTTP Request Handler
// ============================================================================

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    res.setHeader("Content-Type", "application/json")

    // Handle preflight
    if (req.method === "OPTIONS") {
        res.writeHead(204)
        res.end()
        return
    }

    // Only accept POST /v1/decide
    if (req.method !== "POST" || req.url !== "/v1/decide") {
        res.writeHead(404)
        res.end(JSON.stringify({ error: "Not found" }))
        return
    }

    try {
        // Parse body
        const body = await parseBody(req)

        // Validate request
        const validation = validateDecideRequest(body)
        if (!validation.valid) {
            res.writeHead(400)
            res.end(JSON.stringify({ error: validation.error }))
            return
        }

        const { subject, context } = validation.data

        // Fetch profile and normalize signals
        const profile = await fetchProfile(subject)
        const signals = normalizeSignals(profile)

        // Make decision
        const decision = decide(signals, context)

        // Log for demo purposes
        console.log(`[${new Date().toISOString()}] ${subject} → ${context} → ${decision.decision}`)

        // Return response
        res.writeHead(200)
        res.end(JSON.stringify(decision, null, 2))

    } catch (error) {
        console.error("Error:", error)
        res.writeHead(500)
        res.end(JSON.stringify({ error: "Internal server error" }))
    }
}

// ============================================================================
// Body Parser
// ============================================================================

function parseBody(req: IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        req.on("data", chunk => chunks.push(chunk))
        req.on("end", () => {
            try {
                const body = Buffer.concat(chunks).toString()
                resolve(JSON.parse(body))
            } catch {
                reject(new Error("Invalid JSON"))
            }
        })
        req.on("error", reject)
    })
}

// ============================================================================
// Start Server
// ============================================================================

const server = createServer(handleRequest)

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║     BaseCred Decision Engine API Server                        ║
╠════════════════════════════════════════════════════════════════╣
║  Listening on: http://localhost:${PORT}                          ║
║  Endpoint:     POST /v1/decide                                 ║
╠════════════════════════════════════════════════════════════════╣
║  Test commands:                                                ║
║                                                                ║
║  # Your wallet:                                                ║
║  curl -X POST http://localhost:${PORT}/v1/decide \\              ║
║    -H "Content-Type: application/json" \\                       ║
║    -d '{"subject": "0x168D8b4f50BB3aA67D05a6937B643004257118ED", "context": "allowlist.general"}'
║                                                                ║
║  # Expert user:                                                ║
║  curl -X POST http://localhost:${PORT}/v1/decide \\              ║
║    -H "Content-Type: application/json" \\                       ║
║    -d '{"subject": "expert", "context": "allowlist.general"}'  ║
║                                                                ║
║  # Spam user:                                                  ║
║  curl -X POST http://localhost:${PORT}/v1/decide \\              ║
║    -H "Content-Type: application/json" \\                       ║
║    -d '{"subject": "spam", "context": "allowlist.general"}'    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`)
})
