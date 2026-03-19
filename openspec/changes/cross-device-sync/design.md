## Context

The HKIFF 2026 app is a statically-exported Next.js site deployed to Cloudflare Pages. All user state (plan screenings, favourites, ticket quantities) lives in browser localStorage under key `hkiff50-data` with a versioned schema (currently v2). There is no backend, no auth, and no user identity system.

Users plan their festival on a laptop, then need their selections on their phone at the cinema. Currently this requires manually re-entering every choice.

The project already has `wrangler.toml` configured and deploys via `wrangler pages deploy`. Cloudflare Pages Functions provide serverless API routes with KV bindings — no separate Worker project needed.

## Goals / Non-Goals

**Goals:**
- Enable plan synchronization across devices without user accounts
- Use anonymous 4-character tokens as shared secrets to link devices
- Correctly handle concurrent edits via timestamp-based merge (adds AND removes)
- Auto-sync on every change with minimal user friction
- Stay within Cloudflare free tier at festival scale (~5,000 users)

**Non-Goals:**
- User accounts or authentication
- Real-time push sync (WebSocket/SSE) — polling or sync-on-change is sufficient
- Sharing plans between different users (social features)
- Conflict resolution UI — automatic timestamp-based merge is sufficient
- Offline queue with retry — if sync fails, it retries on next change

## Decisions

### 1. Cloudflare Pages Functions + KV over standalone Worker or D1

**Choice:** Pages Functions with KV binding

**Rationale:** The project already deploys to CF Pages. Pages Functions are co-located (just add a `functions/` directory). KV is ideal for this use case: small values (~1-2KB), read-heavy, globally distributed. D1 would add SQL complexity for what is essentially a key-value lookup. A standalone Worker would require a separate deployment pipeline.

**Alternatives considered:**
- D1 (SQLite): Overkill for key-value lookups, adds migration complexity
- Durable Objects: Designed for coordination/state machines, not simple storage
- External service (Firebase, Supabase): Adds external dependency and auth complexity

### 2. Anonymous 4-character token over longer IDs or auth

**Choice:** 4-char alphanumeric code from a 32-character alphabet (no ambiguous chars: 0/O, 1/I/L excluded)

**Rationale:** ~1M combinations is plenty for festival scale. Short enough to type on a phone, read aloud, or display in large font. No auth means zero friction — users don't need to create accounts for a 2-week festival app.

**Alternatives considered:**
- UUID: Unguessable but impossible to type manually
- 6-char code: More space but unnecessary; 4 chars already gives 1M combinations for ~5K users
- Email-based magic links: Adds auth complexity and email infrastructure

### 3. Timestamp-based merge over CRDT or last-write-wins

**Choice:** Per-item timestamps with latest-operation-wins merge

**Rationale:** Correctly handles both additions AND removals across devices. Simple to implement — no CRDT library needed. Device clock accuracy is sufficient for "did I add or remove this more recently" granularity. Data size is small enough that tracking timestamps per item adds negligible overhead.

**Alternatives considered:**
- Union merge (add-only): Can't handle removals — deleted items reappear
- Last-write-wins (whole document): Loses concurrent edits from the other device
- CRDTs (e.g., OR-Set): Correct but massively overengineered for dozens of items

### 4. Server-side merge over client-side merge

**Choice:** Merge happens in the Pages Function on PUT, not on the client

**Rationale:** Avoids read-then-write race conditions on the client. The Worker reads current KV state, merges with incoming data, writes result, and returns merged state — all in one invocation. Client just pushes its state and applies the merged response.

### 5. Lazy token generation (on "Sync Devices" tap) over eager

**Choice:** Generate token only when user explicitly opens sync

**Rationale:** Avoids KV writes for users who never sync. Most users will never use this feature. Those who do will tap "Sync Devices" once, get a token, and it persists in localStorage from then on.

### 6. Query parameter (`?sync=7X3K`) over dedicated route

**Choice:** Handle sync join via `?sync=` param on the existing Plan page

**Rationale:** No new Next.js page needed. The plan page detects the param on mount, triggers the merge, shows a summary toast, and cleans the URL with `router.replace`. The token doesn't leak into browser history.

## Risks / Trade-offs

**[Token guessing]** → 4-char tokens have ~1M combinations. An attacker could enumerate tokens to find active plans. **Mitigation:** Plans contain only screening IDs and film IDs (no PII). Rate-limit the API endpoint (CF WAF rules or in-Worker rate limiting). Acceptable risk for a festival app with no sensitive data.

**[Clock skew]** → Timestamp-based merge assumes device clocks are roughly correct. **Mitigation:** For "did I add or remove this film in the last few minutes," even clocks off by minutes are fine. Edge case: if a device clock is hours off, its operations may incorrectly win or lose. Acceptable for the use case.

**[KV eventual consistency]** → KV writes may take up to 60 seconds to propagate globally. **Mitigation:** The merge-on-write pattern means each device gets the merged result immediately in the PUT response. The KV propagation delay only affects a second device reading stale data within 60 seconds of the first device's write — unlikely at festival scale.

**[Free tier write limits]** → KV free tier allows 1,000 writes/day. With debounced syncs (3s), a heavy user editing 100 times/day produces ~100 writes. 10 active users = 1,000 writes. **Mitigation:** Monitor usage; upgrade to $5/mo paid tier if needed during peak planning days. Read limits (100K/day) are not a concern.

**[No offline queue]** → If sync fails (network error), the change is lost from the sync perspective (still saved locally). **Mitigation:** Next successful change will push the full current state, which includes any previously un-synced changes. No data is ever lost from localStorage.
