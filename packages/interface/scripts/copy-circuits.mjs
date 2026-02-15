/**
 * Prebuild script: copies circuit WASM and ZKey from packages/contracts
 * into packages/interface/circuits/ so Vercel serverless functions can access them.
 */
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const contractsCircuits = join(root, '..', 'contracts', 'circuits')
const dest = join(root, 'circuits')

const wasmSrc = join(contractsCircuits, 'build', 'DecisionCircuit_js', 'DecisionCircuit.wasm')
const zkeySrc = join(contractsCircuits, 'circuit_final.zkey')

if (!existsSync(wasmSrc) || !existsSync(zkeySrc)) {
  console.warn(`[prebuild] Circuit files not found — skipping copy. ZK proof generation will be unavailable at runtime.`)
  console.warn(`[prebuild]   WASM: ${wasmSrc} (${existsSync(wasmSrc) ? 'found' : 'missing'})`)
  console.warn(`[prebuild]   ZKey: ${zkeySrc} (${existsSync(zkeySrc) ? 'found' : 'missing'})`)
  process.exit(0)
}

mkdirSync(dest, { recursive: true })

copyFileSync(wasmSrc, join(dest, 'DecisionCircuit.wasm'))
copyFileSync(zkeySrc, join(dest, 'circuit_final.zkey'))

console.log('[prebuild] Circuit files copied to packages/interface/circuits/')
