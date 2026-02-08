declare module "snarkjs" {
    export const groth16: {
        verify: (
            vkey: unknown,
            publicSignals: unknown[],
            proof: unknown
        ) => Promise<boolean>
        fullProve: (
            input: unknown,
            wasmFile: string,
            zkeyFile: string
        ) => Promise<{ proof: unknown; publicSignals: unknown[] }>
    }
}
