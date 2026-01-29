export default function DocsAntiPatternsPage() {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Anti-Patterns</h1>
          <p className="text-xl text-zinc-400">What NOT to do with BaseCred.</p>
        </div>
        <div className="prose prose-invert max-w-none">
            <div className="p-4 bg-red-950/30 border border-red-900 rounded-md">
                <h3 className="text-red-300 mt-0">Don't create a leaderboard</h3>
                <p>BaseCred decisions are categorical (Allow/Deny), not scalar. Ranking users implies false precision.</p>
            </div>
            <div className="p-4 bg-red-950/30 border border-red-900 rounded-md mt-4">
                <h3 className="text-red-300 mt-0">Don't use as "Credit Score"</h3>
                <p>Financial creditworthiness is NOT evaluated by BaseCred. Using it for undercollateralized lending is dangerous.</p>
            </div>
        </div>
      </div>
    )
}
