# DATA_MODEL — MongoDB

**Status:** BASELINE v0.1. Field names are suggestions; keep them consistent across code, docs, and indexes. Index syntax **(verify against current Atlas docs)** before relying on it.

## 1. Collections overview
| Collection | Purpose |
|---|---|
| `workspaces` | Logical collection of sources (demo workspace, per-session sandboxes). |
| `sources` | One doc per imported source (file/URL/text/record set). Holds original content + metadata + status. |
| `chunks` | Retrievable passages with embeddings, offsets, section info, and source linkage. |
| `queries` | Query log: question, filters, trace, answer state, latency, tokens. |
| `eval_cases` | Test requests with expected source IDs / state. |
| `eval_runs` | Results per config for comparison. |

## 2. Schemas

### `workspaces`
```jsonc
{
  "_id": "ws_demo",
  "name": "Demo workspace",
  "kind": "demo | sandbox",
  "readOnly": true,
  "createdAt": ISODate(),
  "expiresAt": ISODate()          // sandbox only → TTL index
}
```

### `sources`
```jsonc
{
  "_id": "src_<nanoid>",
  "workspaceId": "ws_demo",
  "title": "Acme Retention Policy v3",
  "type": "pdf | md | txt | html | csv | json | transcript | image",
  "origin": { "kind": "upload|url|seed|n8n", "name": "policy_v3.pdf", "url": null },
  "license": "CC-BY-4.0 | synthetic | own",
  "contentHash": "sha256:...",           // unique per workspace
  "rawText": "full parsed text (normalised)",
  "rawRef": null,                          // optional GridFS/S3 ref if original bytes are kept
  "metadata": {                            // domain-specific; keep flexible
    "date": ISODate(), "version": "3", "author": "...", "tags": ["policy"], "docGroup": "retention"
  },
  "sections": [ { "id": "s1", "title": "2. Scope", "start": 1200, "end": 4100 } ],
  "stats": { "chars": 52000, "chunks": 41 },
  "status": "queued|parsing|chunked|embedding|searchable|failed",
  "progress": { "done": 12, "total": 41 },
  "error": null,
  "createdAt": ISODate(), "updatedAt": ISODate()
}
```

### `chunks`
```jsonc
{
  "_id": "chk_<nanoid>",
  "workspaceId": "ws_demo",
  "sourceId": "src_...",
  "ordinal": 17,                          // position in source
  "sectionId": "s2", "sectionTitle": "2. Scope",
  "text": "the chunk text used for BM25 + display",
  "textForEmbedding": "Title › Section › text",   // optional contextual prefix
  "charStart": 3120, "charEnd": 3980,     // offsets into sources.rawText → exact highlight
  "page": 4,                               // if known
  "tokenCount": 212,
  "embedding": [ /* float32[1024] */ ],    // omit if using autoEmbed
  "embeddingModel": "voyage-4",            // (verify) record what produced it
  "metadata": {                            // DENORMALISED copy of fields you filter on
    "type": "pdf", "date": ISODate(), "tags": ["policy"], "docGroup": "retention", "version": "3"
  },
  "flags": [],                             // e.g. ["suspicious"]
  "createdAt": ISODate()
}
```
**Why denormalise filter metadata onto chunks:** `$vectorSearch` pre-filters operate on fields in the indexed collection; joins aren't available inside the stage.

### `queries`
```jsonc
{
  "_id": "q_<nanoid>", "workspaceId": "...", "createdAt": ISODate(),
  "question": "...", "filters": {...}, "mode": "qa|compare|brief",
  "trace": [ { "chunkId": "...", "vecRank": 3, "vecScore": 0.81, "lexRank": 1, "lexScore": 9.4, "rrf": 0.032, "rerank": 0.88 } ],
  "state": "ANSWERED|PARTIAL|CONFLICTING|INSUFFICIENT",
  "claims": [ { "text": "...", "chunkIds": ["chk_.."], "quote": "...", "verified": true } ],
  "latencyMs": { "embed": 120, "vector": 210, "lexical": 90, "fuse": 2, "rerank": 160, "llm": 1900 },
  "tokens": { "in": 3200, "out": 420 },
  "config": "hybrid_v1"
}
```

### `eval_cases`
```jsonc
{
  "_id": "ev_001",
  "question": "...",
  "category": "single|multi|exact-token|conflict|unanswerable|filtered",
  "filters": null,
  "expectedSourceIds": ["src_a", "src_b"],     // use stable seed IDs, not random nanoids
  "expectedChunkIds": [],                       // optional
  "expectedState": "ANSWERED",
  "mustContain": ["..."],                       // optional key facts
  "notes": ""
}
```

### `eval_runs`
```jsonc
{
  "_id": "run_<ts>", "config": { "name": "hybrid_v1", "chunk": 800, "overlap": 100, "k": 10, "rerank": false },
  "createdAt": ISODate(),
  "metrics": { "recallAtK": 0.88, "mrr": 0.74, "stateAccuracy": 1.0, "citationVerifyRate": 0.97, "p50LatencyMs": 2100 },
  "perCase": [ { "caseId": "ev_001", "retrievedSourceIds": [], "hit": true, "state": "ANSWERED", "ok": true } ]
}
```
**Seed data must use deterministic IDs** (e.g. `src_policy_v3`) so `expectedSourceIds` stay valid across re-seeds.

## 3. Indexes

### 3.1 Regular indexes
```js
db.sources.createIndex({ workspaceId: 1, contentHash: 1 }, { unique: true });   // idempotent ingest
db.sources.createIndex({ workspaceId: 1, status: 1 });
db.chunks.createIndex({ sourceId: 1, ordinal: 1 });
db.chunks.createIndex({ workspaceId: 1 });
db.queries.createIndex({ workspaceId: 1, createdAt: -1 });
db.queries.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60*60*24*7 });  // TTL: logs 7d
db.workspaces.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });         // TTL: sandboxes
```
*TTL caveat:* TTL deletion of a workspace does not cascade; either also set `expiresAt` on its `sources`/`chunks` (denormalised) or run a cleanup in app code.

### 3.2 Vector index on `chunks` (self-managed embeddings — default on M0)
```js
db.chunks.createSearchIndex("chunks_vector", "vectorSearch", {
  fields: [
    { type: "vector", path: "embedding", numDimensions: 1024, similarity: "cosine" },
    { type: "filter", path: "workspaceId" },
    { type: "filter", path: "sourceId" },
    { type: "filter", path: "metadata.type" },
    { type: "filter", path: "metadata.date" },
    { type: "filter", path: "metadata.tags" },
    { type: "filter", path: "metadata.docGroup" }
  ]
});
```
`numDimensions` **must equal** `EMBEDDING_DIMS`; the same model must embed documents and queries (use Voyage `input_type: "document"` for chunks and `"query"` for questions).

### 3.2b Alternative: Automated Embedding (needs M10+ **(verify)**)
```js
db.chunks.createSearchIndex("chunks_vector_auto", "vectorSearch", {
  fields: [
    { type: "autoEmbed", modality: "text", path: "text", model: "voyage-4" },   // (verify model id)
    { type: "filter", path: "workspaceId" }
  ]
});
```
Then query with text (no client-side query embedding). Not mixable with a raw `vector` field on the same path.

### 3.3 Lexical (Atlas Search) index on `chunks`
```js
db.chunks.createSearchIndex("chunks_text", {
  mappings: {
    dynamic: false,
    fields: {
      text:         { type: "string", analyzer: "lucene.standard" },
      sectionTitle: { type: "string" },
      workspaceId:  { type: "token" },
      sourceId:     { type: "token" },
      metadata: { type: "document", fields: {
        type: { type: "token" }, tags: { type: "token" }, docGroup: { type: "token" }, date: { type: "date" }
      }}
    }
  }
});
```
For exact codes/IDs (e.g. `INC-2041`, `§4.2(b)`), consider an extra field with a keyword/whitespace analyzer or `token` mapping so they aren't tokenised away. Test with seeded exact-token cases.

**Free-tier note:** M0 allows only a small number of Search/Vector indexes **(verify limit)** — plan for exactly two on `chunks` (vector + text).

## 4. Query templates

**Vector (with pre-filter):**
```js
db.chunks.aggregate([
  { $vectorSearch: {
      index: "chunks_vector", path: "embedding", queryVector: qVec,
      numCandidates: 400, limit: 40,
      filter: { $and: [ { workspaceId: ws }, ...(extra) ] } } },
  { $project: { embedding: 0, score: { $meta: "vectorSearchScore" } } }
]);
```
**Lexical:**
```js
db.chunks.aggregate([
  { $search: { index: "chunks_text", compound: {
      must:   [ { text: { query: q, path: ["text","sectionTitle"] } } ],
      filter: [ { equals: { path: "workspaceId", value: ws } } ] } } },
  { $limit: 40 },
  { $project: { embedding: 0, score: { $meta: "searchScore" } } }
]);
```
Fuse in app code with RRF. For debugging relevance, use `explain("executionStats")` on the vector aggregation and screenshot the output for the deck ("Explain Vector Search Results" is in the track's docs list).

## 5. Schema validation (core collections)
```js
db.runCommand({ collMod: "chunks", validator: { $jsonSchema: {
  bsonType: "object",
  required: ["workspaceId","sourceId","ordinal","text","charStart","charEnd","createdAt"],
  properties: {
    text: { bsonType: "string", minLength: 1 },
    charStart: { bsonType: "int" }, charEnd: { bsonType: "int" },
    embedding: { bsonType: "array" }
  } } }, validationLevel: "moderate" });
```
Do the same for `sources` (`workspaceId`, `contentHash`, `status`, `title`). Keep `metadata` flexible.

## 6. Change streams (optional)
Use on `sources` to push live ingestion status to the UI (needs a long-lived connection → better on Render/Fly than serverless; on Vercel, poll instead).
