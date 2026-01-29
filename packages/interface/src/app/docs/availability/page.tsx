export default function DocsAvailabilityPage() {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Availability Semantics</h1>
          <p className="text-xl text-zinc-400">Understanding signal presence and absence.</p>
        </div>
        <div className="prose prose-invert max-w-none">
            <p>Every signal in BaseCred has an <code>availability</code> state. Do not assume missing data means low score.</p>
            <h3>States</h3>
            <ul>
                <li><code>AVAILABLE</code>: Data is present and fresh.</li>
                <li><code>UNAVAILABLE</code>: Data provider returned no record (user likely does not exist on platform).</li>
                <li><code>ERROR</code>: Provider unreachable. Decisions may fallback to "Partial" logic.</li>
            </ul>
        </div>
      </div>
    )
}
