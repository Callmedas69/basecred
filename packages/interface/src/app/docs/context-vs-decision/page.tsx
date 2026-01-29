export default function ContextVsDecisionPage() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>Context vs Decision</h1>

      <p>
        <strong>Status:</strong> Public · Contractual
      </p>

      <p>
        This page defines the <strong>hard boundary</strong> between what
        BaseCred provides and what applications must own.
      </p>

      <p>If this boundary is unclear, BaseCred will be misused.</p>

      <hr />

      <h2>The Core Rule</h2>

      <blockquote>
        <p>
          <strong>
            BaseCred provides context. Applications make decisions.
          </strong>
        </p>
      </blockquote>

      <p>This separation is intentional and non-negotiable.</p>

      <hr />

      <h2>What We Mean by Context</h2>

      <p>
        <strong>Context</strong> is descriptive information about an identity at
        a point in time.
      </p>

      <p>Context answers:</p>

      <blockquote>
        <p>
          <em>
            “What signals are observable right now, and what is their
            condition?”
          </em>
        </p>
      </blockquote>

      <p>Context is:</p>
      <ul>
        <li>neutral</li>
        <li>read-only</li>
        <li>deterministic</li>
        <li>source-traceable</li>
      </ul>

      <p>Context can be:</p>
      <ul>
        <li>logged</li>
        <li>cached</li>
        <li>compared</li>
        <li>audited</li>
      </ul>

      <p>
        Context <strong>must not</strong>:
      </p>
      <ul>
        <li>recommend actions</li>
        <li>imply permission or restriction</li>
        <li>label users</li>
        <li>rank users</li>
        <li>infer intent or future behavior</li>
      </ul>

      <p>
        BaseCred outputs <strong>context only</strong>.
      </p>

      <hr />

      <h2>What We Mean by Decision</h2>

      <p>
        A <strong>decision</strong> is an application-owned action taken in
        response to context.
      </p>

      <p>Decisions answer:</p>

      <blockquote>
        <p>
          <em>“Given our goals, values, and risk tolerance, what do we do?”</em>
        </p>
      </blockquote>

      <p>Decisions are:</p>
      <ul>
        <li>subjective</li>
        <li>business-specific</li>
        <li>environment-specific</li>
        <li>reversible</li>
      </ul>

      <p>Decisions include:</p>
      <ul>
        <li>allowing or denying access</li>
        <li>publishing or hiding content</li>
        <li>rate-limiting or throttling</li>
        <li>gating participation</li>
      </ul>

      <p>
        All decisions must live <strong>outside BaseCred</strong>.
      </p>

      <hr />

      <h2>The Contractual Boundary</h2>

      <h3>BaseCred Guarantees</h3>

      <p>BaseCred guarantees that:</p>
      <ul>
        <li>signals are descriptive, not evaluative</li>
        <li>absence of data is explicit</li>
        <li>time describes freshness, not behavior</li>
        <li>sources are not merged into a verdict</li>
        <li>no hidden weighting or aggregation exists</li>
      </ul>

      <p>
        BaseCred will <strong>never</strong>:
      </p>
      <ul>
        <li>return a final score</li>
        <li>recommend an action</li>
        <li>enforce a threshold</li>
        <li>compare users against each other</li>
      </ul>

      <hr />

      <h3>Application Responsibilities</h3>

      <p>Applications are responsible for:</p>
      <ul>
        <li>defining thresholds</li>
        <li>implementing business logic</li>
        <li>enforcing outcomes</li>
        <li>explaining decisions to users</li>
        <li>accepting accountability for consequences</li>
      </ul>

      <p>
        If an application needs BaseCred to justify a decision, the design is
        invalid.
      </p>

      <hr />

      <h2>Reference Flow</h2>

      <pre>
        {`Identity
   ↓
Context (BaseCred)
   ↓
Decision Logic (Application)
   ↓
Outcome`}
      </pre>

      <p>
        BaseCred stops <strong>before</strong> the decision layer.
      </p>

      <hr />

      <h2>Reference Decision Matrix (Illustrative Only)</h2>

      <p>
        The table below shows <strong>example</strong> application logic. It is
        not guidance. It is not recommended behavior.
      </p>

      <table>
        <thead>
          <tr>
            <th>Use Case</th>
            <th>Context Observed</th>
            <th>Application Decision</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Allowlist</td>
            <td>Sufficient coverage, low risk signals</td>
            <td>Allow</td>
          </tr>
          <tr>
            <td>Commenting</td>
            <td>No negative social signals</td>
            <td>Publish</td>
          </tr>
          <tr>
            <td>Rate limiting</td>
            <td>Low coverage or stale data</td>
            <td>Throttle</td>
          </tr>
          <tr>
            <td>Governance</td>
            <td>Full source availability</td>
            <td>Permit</td>
          </tr>
          <tr>
            <td>Submission</td>
            <td>Recent or corroborated signals</td>
            <td>Accept</td>
          </tr>
        </tbody>
      </table>

      <p>
        Different applications may reach different decisions using the same
        context.
      </p>

      <hr />

      <h2>Common Violations</h2>

      <ul>
        <li>treating context as authorization</li>
        <li>exposing a single reputation verdict</li>
        <li>auto-blocking users based on signals</li>
        <li>hiding decision logic behind the SDK</li>
        <li>presenting BaseCred output as “trust”</li>
      </ul>

      <p>These are design errors, not configuration issues.</p>

      <hr />

      <h2>Why This Boundary Exists</h2>

      <p>Reputation systems fail when:</p>
      <ul>
        <li>interpretation is hidden</li>
        <li>power is centralized</li>
        <li>responsibility is blurred</li>
      </ul>

      <p>This boundary ensures:</p>
      <ul>
        <li>misuse is harder than correct use</li>
        <li>decisions remain explainable</li>
        <li>responsibility stays with the application</li>
      </ul>

      <hr />

      <h2>Summary</h2>

      <ul>
        <li>
          BaseCred provides <strong>context only</strong>
        </li>
        <li>
          Applications own <strong>all decisions</strong>
        </li>
        <li>The boundary is explicit and permanent</li>
      </ul>

      <p>
        <strong>Breaking this contract breaks the system.</strong>
      </p>
    </div>
  );
}
