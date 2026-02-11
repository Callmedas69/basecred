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

if (!existsSync(wasmSrc)) {
  console.error(`[prebuild] Circuit WASM not found at ${wasmSrc}. Run circuit build first.`)
  process.exit(1)
}
if (!existsSync(zkeySrc)) {
  console.error(`[prebuild] Circuit ZKey not found at ${zkeySrc}. Run circuit build first.`)
  process.exit(1)
}

mkdirSync(dest, { recursive: true })

copyFileSync(wasmSrc, join(dest, 'DecisionCircuit.wasm'))
copyFileSync(zkeySrc, join(dest, 'circuit_final.zkey'))

console.log('[prebuild] Circuit files copied to packages/interface/circuits/')
