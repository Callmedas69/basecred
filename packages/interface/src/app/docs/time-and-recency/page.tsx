export default function DocsTimeRecencyPage() {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Time & Recency</h1>
          <p className="text-xl text-zinc-400">How time affects decisions.</p>
        </div>
        <div className="prose prose-invert max-w-none">
            <p>Reputation is not static. BaseCred weighs recency heavily.</p>
            <ul>
                <li>Signals older than 90 days may decay in Tier calculations.</li>
                <li><code>recencyDays</code> is exposed in the Normalized Signals (internal).</li>
                <li>Decisions are made "at the time of request". Re-requesting later may yield different results.</li>
            </ul>
        </div>
      </div>
    )
}
