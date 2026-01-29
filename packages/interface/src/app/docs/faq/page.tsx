export default function DocsFAQPage() {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">FAQ</h1>
          <p className="text-xl text-zinc-400">Common questions.</p>
        </div>
        <div className="prose prose-invert max-w-none">
            <h3>Is this a token?</h3>
            <p>No.</p>
            
            <h3>Can I pay to increase my score?</h3>
            <p>No. BaseCred aggregates external behavior. Genuine activity on Ethos/Farcaster improves your standing.</p>

            <h3>How do I integrate?</h3>
            <p>See <a href="/docs/schema" className="text-teal-400">Schema</a> for API details.</p>
        </div>
      </div>
    )
}
