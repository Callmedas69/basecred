export default function DocsSchemaPage() {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Response Schema</h1>
          <p className="text-xl text-zinc-400">The canonical output format.</p>
        </div>
  
        <div className="prose prose-invert max-w-none">
          <p>
            The BaseCred Decision Engine returns a <code>DecideUseCaseOutput</code> object.
            This schema is strict and will not change without a major version bump.
          </p>
          
          <h3>JSON Structure</h3>
          <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "decision": "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS",
  "confidence": "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH",
  "explain": [
    "String explanation of why the decision was made",
    "Multiple reasons may be provided"
  ],
  "constraints": [], // Array of specific limitations if ALLOW_WITH_LIMITS
  "ruleIds": ["rule_id_1", "rule_id_2"], // IDs of rules that triggered
  "version": "1.0.0", // Engine version
  "accessStatus": "eligible" | "limited" | "not_ready" | "blocked", // Optional, retail-facing interpretation
  "blockingFactors": ["trust", "builder"], // Optional, context-aware guidance
  "requestId": "req_...", // Trace ID
  "timestamp": "2024-01-01T00:00:00Z"
}`}
          </pre>
  
          <h3>Field Definitions</h3>
          <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="py-2">Field</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Description</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
                <tr>
                    <td className="py-3 font-mono text-teal-400">decision</td>
                    <td className="py-3 font-mono text-sm">Enum</td>
                    <td className="py-3">The final recommendation. One of <code>ALLOW</code>, <code>DENY</code>, or <code>ALLOW_WITH_LIMITS</code>.</td>
                </tr>
                <tr>
                    <td className="py-3 font-mono text-teal-400">confidence</td>
                    <td className="py-3 font-mono text-sm">Enum</td>
                    <td className="py-3">A qualitative measure of certainty derived from signal coverage and consistency.</td>
                </tr>
                <tr>
                    <td className="py-3 font-mono text-teal-400">explain</td>
                    <td className="py-3 font-mono text-sm">string[]</td>
                    <td className="py-3">Human-readable reasons. Safe to display to end-users.</td>
                </tr>
                <tr>
                    <td className="py-3 font-mono text-teal-400">accessStatus</td>
                    <td className="py-3 font-mono text-sm">"eligible" | "limited" | "not_ready" | "blocked"</td>
                    <td className="py-3">
                      Optional, retail-facing summary of the decision used for UX. Derived from the underlying decision and rule set and does not change enforcement.
                    </td>
                </tr>
                <tr>
                    <td className="py-3 font-mono text-teal-400">blockingFactors</td>
                    <td className="py-3 font-mono text-sm">string[]</td>
                    <td className="py-3">
                      Optional list of high-level factors currently blocking access in the requested context. Intended for progression guidance, not for policy decisions.
                    </td>
                </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }
