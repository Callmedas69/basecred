export default function DocsOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Overview</h1>
        <p className="text-xl text-muted-foreground">
          Make misuse harder than correct use.
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <p>
          BaseCred is a <strong>read-only reputation primitive</strong>. It
          aggregates signals from trusted on-chain and off-chain providers
          (Ethos, Neynar, Talent Protocol) and exposes them as{" "}
          <strong>neutral, deterministic context</strong> — not judgments.
        </p>

        <p>BaseCred answers one question only:</p>

        <blockquote>
          <p>
            <strong>
              “What signals are observable about this identity right now?”
            </strong>
          </p>
        </blockquote>

        <p>
          It does <strong>not</strong> decide who to trust, who to block, or
          what action to take.
        </p>

        <h3>Core Principles</h3>
        <ul>
          <li>
            <strong>Context, not decisions:</strong> BaseCred provides
            descriptive signals. Applications own all interpretation,
            thresholds, and enforcement.
          </li>
          <li>
            <strong>No judgment:</strong> We never label users, rank them, or
            produce final verdicts.
          </li>
          <li>
            <strong>Deterministic:</strong> The same input always results in the
            same output.
          </li>
          <li>
            <strong>Explicit absence:</strong> Missing data is surfaced clearly
            — never inferred or hidden.
          </li>
          <li>
            <strong>Transparent by design:</strong> Every field is traceable to
            a source. No hidden weighting. No black boxes.
          </li>
        </ul>

        <h3>What BaseCred Is Not</h3>
        <p>
          BaseCred is <strong>not</strong> an authorization engine, moderation
          system, trust oracle, or recommendation system.
        </p>
        <p>
          If your product requires a final score or automatic action, BaseCred
          is intentionally the wrong tool.
        </p>

        <h3>Integration</h3>
        <p>
          You can integrate BaseCred via the SDK or public API. The response
          schema is <strong>versioned and stable</strong> (Semantic Versioning).
          See the{" "}
          <a
            href="/docs/integration"
            className="text-foreground hover:underline font-bold"
          >
            Integration Guide
          </a>{" "}
          for details.
        </p>
        <br />
        <p>
          See Context vs Decision to understand where BaseCred stops and your
          application begins.
        </p>

        <div className="bg-muted/50 border-l-4 border-teal-500 p-4 rounded-r-md my-6">
          <p className="font-bold text-teal-500 m-0 mb-1">Quick Start</p>
          <p className="m-0 text-sm text-foreground">
            Check out the{" "}
            <a href="/human" className="text-teal-500 hover:underline">
              Human
            </a>{" "}
            to see live data.
          </p>
        </div>
      </div>
    </div>
  );
}
