import { Copy, Terminal } from "lucide-react"

export default function IntegrationPage() {
  return (
    <div className="space-y-24 max-w-6xl">
      <div className="pt-12">
        <h1 className="text-[8rem] leading-[0.85] font-black tracking-tighter text-foreground mb-8">
          INTEGRATION<br />
          <span className="text-muted-foreground">GUIDE</span>
        </h1>
        <p className="text-2xl font-medium text-muted-foreground max-w-2xl border-l-2 border-teal-500 pl-6">
          Connect your application to BaseCred with zero friction.
        </p>
      </div>

      <div className="space-y-32">
        
        {/* Section 1: REST API */}
        <section className="space-y-12">
            <h2 className="text-5xl font-bold text-foreground tracking-tight flex items-center gap-4">
                <span className="text-teal-500">01.</span> REST API
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
                The easiest way to consume BaseCred signals is via our public REST API. 
                Endpoints are independently cacheable, scalable, and support CORS for direct frontend use.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
                <CodeWindow 
                    title="Endpoint: Discovery" 
                    badge="GET"
                    badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
                >
{`https://basecred.com/api/config/contexts`}
                </CodeWindow>

                <CodeWindow 
                    title="Endpoint: Decision" 
                    badge="GET"
                    badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                >
{`https://basecred.com/api/decision/:context?subject=:address`}
                </CodeWindow>
            </div>
        </section>

        {/* Section 2: Request & Response */}
        <section className="space-y-12">
             <h2 className="text-5xl font-bold text-foreground tracking-tight flex items-center gap-4">
                <span className="text-teal-500">02.</span> PAYLOAD
             </h2>
             
             <div className="grid lg:grid-cols-2 gap-8">
                {/* Request Example */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1">Example Request</h3>
                    <CodeWindow title="User interactions" badge="cURL">
{`curl --request GET \\
  --url 'https://basecred.com/api/decision/allowlist.general?subject=0x123...' \\
  --header 'Accept: application/json'`}
                    </CodeWindow>
                </div>

                {/* Response Example */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1">Example Response</h3>
                    <CodeWindow title="200 OK" language="json" isResponse>
{`{
  "context": "allowlist.general",
  "decision": "ALLOW",
  "confidence": "HIGH",
  "explain": [
    "User has high social trust (Neynar)",
    "User holds required NFT"
  ],
  "signals": {
    "trust": "HIGH",
    "social": "MEDIUM"
  }
}`}
                    </CodeWindow>
                </div>
             </div>
        </section>

        {/* Section 3: Client Implementation */}
        <section className="space-y-12">
            <h2 className="text-5xl font-bold text-foreground tracking-tight flex items-center gap-4">
                <span className="text-teal-500">03.</span> CLIENT
            </h2>
            <div className="space-y-8">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">JavaScript / TypeScript</h3>
                    <CodeWindow title="frontend-client.ts" language="typescript">
{`interface DecisionResponse {
  context: string;
  decision: "ALLOW" | "DENY" | "ALLOW_WITH_LIMIT";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  explain: string[];
}

const checkReputation = async (address: string) => {
  const response = await fetch(
    \`https://basecred.com/api/decision/allowlist.general?subject=\${address}\`
  );
  
  const data: DecisionResponse = await response.json();
  
  if (data.decision === "ALLOW") {
    // Grant access
  }
};`}
                    </CodeWindow>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Python</h3>
                     <CodeWindow title="backend_script.py" language="python">
{`import requests

def check_reputation(address: str):
    url = "https://basecred.com/api/decision/allowlist.general"
    params = {"subject": address}

    response = requests.get(url, params=params)
    data = response.json()

    if data["decision"] == "ALLOW":
        print(f"User {address} is allowed!")
        return True
    return False`}
                    </CodeWindow>
                </div>
            </div>
        </section>
      </div>
    </div>
  )
}

function CodeWindow({ 
    title, 
    children, 
    language = "bash", 
    badge, 
    badgeColor = "bg-zinc-800 text-zinc-400",
    isResponse = false,
    // Component for displaying code snippets
}: { 
    title: string; 
    children: string; 
    language?: string;
    badge?: string;
    badgeColor?: string;
    isResponse?: boolean;
}) {
    return (
        <div className="rounded-xl overflow-hidden bg-[#09090b] border border-zinc-800 shadow-2xl ring-1 ring-white/5">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                    </div>
                    <span className="text-xs font-medium text-zinc-400 ml-2 font-mono">{title}</span>
                </div>
                <div className="flex items-center gap-3">
                    {badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                            {badge}
                        </span>
                    )}
                    {!badge && (
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{language}</span>
                    )}
                    <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
                        <Copy className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            {/* Content */}
            <div className={`p-6 overflow-x-auto ${isResponse ? 'bg-[#0c0c0e]/50' : ''}`}>
                <pre className="text-sm font-mono leading-relaxed text-zinc-300">
                    {children}
                </pre>
            </div>
            
            {isResponse && (
                <div className="h-1 w-full bg-gradient-to-r from-teal-500/50 via-emerald-500/50 to-teal-500/50 opacity-20" />
            )}
        </div>
    )
}
