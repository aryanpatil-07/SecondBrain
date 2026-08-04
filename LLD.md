# Low Level Design (LLD) — Second Brain

## 1. Database Schema & Data Models

Second Brain uses MongoDB Atlas as its primary persistence layer. Mongoose schemas strictly define document structures, data types, enum validations, embedded sub-documents, and relationship references.

```mermaid
erDiagram
    NOTE ||--o{ CHAT : "has linked chats"
    NOTE ||--o| ANALYSIS : "embeds knowledge analysis"
    ANALYSIS ||--|{ FLOW_NODE : "contains DAG nodes"
    CHAT ||--|{ MESSAGE : "contains thread history"

    NOTE {
        ObjectId _id PK
        string title "Required"
        string content
        string_array tags
        string sourceType "text | image"
        string imagePath
        string imageUrl
        string originalFilename
        string processingStatus "pending | processed | needs_review"
        string ocrText
        array ocrBlocks
        number ocrConfidence
        string aiDraft
        Date createdAt
        Date updatedAt
    }

    ANALYSIS {
        number score "0 - 100"
        string level "beginner | intermediate | advanced | expert"
        string summary
        string_array strengths
        string_array gaps
        string currentNode
        Date analyzedAt
    }

    FLOW_NODE {
        string id "e.g. node_1"
        string label
        string level "beginner | intermediate | advanced"
        boolean isCurrent
        string_array parents "Array of parent node IDs"
    }

    CHAT {
        ObjectId _id PK
        ObjectId noteId FK "Ref Note (Nullable)"
        Date createdAt
        Date updatedAt
    }

    MESSAGE {
        string role "user | assistant"
        string content "Required"
        Date _id
    }
```

### 1.1 Mongoose Model Definitions

#### Note Schema (`backend/models/Note.js`)
```javascript
const flowNodeSchema = new mongoose.Schema({
  id:        { type: String, required: true },
  label:     { type: String, required: true },
  level:     { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  isCurrent: { type: Boolean, default: false },
  parents:   [String],
}, { _id: false });

const analysisSchema = new mongoose.Schema({
  score:       { type: Number, min: 0, max: 100, default: null },
  level:       { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: null },
  summary:     { type: String, default: '' },
  strengths:   [String],
  gaps:        [String],
  currentNode: { type: String, default: '' },
  nodes:       [flowNodeSchema],
  analyzedAt:  { type: Date, default: null },
}, { _id: false });

const noteSchema = new mongoose.Schema({
  title:            { type: String, required: true },
  content:          { type: String, default: '' },
  tags:             [String],
  sourceType:       { type: String, enum: ['text', 'image'], default: 'text' },
  imagePath:        { type: String, default: '' },
  imageUrl:         { type: String, default: '' },
  originalFilename: { type: String, default: '' },
  processingStatus: { type: String, enum: ['pending', 'processed', 'needs_review'], default: 'processed' },
  ocrText:          { type: String, default: '' },
  ocrBlocks:        { type: Array, default: [] },
  ocrConfidence:    { type: Number, default: null },
  aiDraft:          { type: String, default: '' },
  analysis:         { type: analysisSchema, default: null },
}, { timestamps: true });
```

#### Chat Schema (`backend/models/Chat.js`)
```javascript
const chatSchema = new mongoose.Schema({
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Note",
    default: null,
  },
  messages: [
    {
      role:    { type: String, enum: ["user", "assistant"], required: true },
      content: { type: String, required: true },
    },
  ],
}, { timestamps: true });
```

---

## 2. API Endpoint Specifications

### 2.1 Notes Endpoints (`/notes`)

| Method | Path | Request Body / Params | Success Status | Response Body | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/notes` | `{ title: string, content?: string, tags?: string[] \| string }` | `201 Created` | Saved `Note` Document | `500 Internal Server Error` |
| `POST` | `/notes/upload` | `multipart/form-data`: `image` (File), `title`, `content`, `tags` | `201 Created` | Saved `Note` Document (with OCR fields & imageUrl) | `400 Bad Request` (no image), `500 Server Error` |
| `GET` | `/notes` | Query string: `?q=keyword&tag=filterTag` | `200 OK` | Array of `Note` Documents (sorted `createdAt: -1`) | `500 Internal Server Error` |
| `GET` | `/notes/:id` | Route param: `:id` (ObjectId) | `200 OK` | Single `Note` Document | `404 Not Found`, `500 Error` |
| `PUT` | `/notes/:id` | `{ title: string, content: string, tags: string[] }` | `200 OK` | Updated `Note` Document | `404 Not Found`, `500 Error` |
| `DELETE`| `/notes/:id` | Route param: `:id` (ObjectId) | `200 OK` | `{ message: "Note deleted successfully" }` | `404 Not Found`, `500 Error` |

### 2.2 AI Endpoints (`/api/ai`)

| Method | Path | Request Body / Params | Success Status | Response Body | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/ask` | `{ question: string }` | `200 OK` | `{ answer: string }` | `400 Bad Request`, `500 LLM Error` |
| `POST` | `/api/ai/test-retrieval` | `{ question: string }` | `200 OK` | Array of retrieved `Note` Documents | `400 Bad Request`, `500 Error` |
| `POST` | `/api/ai/note-action` | `{ noteId: string, mode: "convert" \| "improve" }` | `200 OK` | `{ noteId, mode, draft: string }` | `400 Bad Request`, `404 Not Found`, `500 Error` |
| `POST` | `/api/ai/analyze/:id` | Route param: `:id` (ObjectId) | `200 OK` | `{ analysis: AnalysisObject }` | `404 Not Found`, `422 Unprocessable` (short text), `500 Error` |
| `POST` | `/api/ai/learning-diagnosis`| `{ tags: string[] }` | `200 OK` | Structured Diagnosis JSON (proficiency, covered, gaps, roadmap) | `400 Bad Request` (empty tags), `404 Not Found`, `500 Error` |

### 2.3 Chat Endpoints (`/api/chat`)

| Method | Path | Request Body / Params | Success Status | Response Body | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/chat/new` | `{ noteId?: string \| null }` | `201 Created` | Created `Chat` Document | `500 Internal Server Error` |
| `GET` | `/api/chat/:chatId` | Route param: `:chatId` | `200 OK` | `Chat` Document with `messages[]` | `404 Not Found`, `500 Error` |
| `POST` | `/api/chat/:chatId` | `{ message: string, noteId?: string }` | `200 OK` | `{ answer: string, chatId: string }` | `400 Bad Request`, `404 Chat Not Found`, `500 Error` |

---

## 3. Algorithmic Implementations & Pseudo-Code

### 3.1 RAG Tokenization & Keyword Relevance Scoring Algorithm (`retrievalService.js`)

```typescript
function getRelevantNotes(question: string): Promise<Note[]> {
    if (!question || question.trim() === "") return [];

    // 1. Normalize and extract non-stopword tokens
    const normalized = question.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
    const tokens = normalized.split(" ");
    const keywords = tokens.filter(word => word.length > 2 && !STOP_WORDS.has(word));

    if (keywords.length === 0) return [];

    // 2. Query DB for candidate match
    const regexes = keywords.map(kw => new RegExp(escapeRegex(kw), "i"));
    const candidateNotes = await Note.find({
        $or: [
            { title: { $in: regexes } },
            { content: { $in: regexes } },
            { ocrText: { $in: regexes } },
            { tags: { $in: regexes } }
        ]
    });

    // 3. Compute weighted relevance score per note
    const scoredNotes = candidateNotes.map(note => {
        let score = 0;
        const titleText = normalizeText(note.title);
        const contentText = normalizeText(note.content);
        const ocrText = normalizeText(note.ocrText);
        const tagsText = note.tags.map(t => normalizeText(t)).join(" ");

        for (const kw of keywords) {
            if (titleText.includes(kw)) score += 3;
            if (tagsText.includes(kw)) score += 3;
            if (contentText.includes(kw)) score += 2;
            if (ocrText.includes(kw)) score += 2;
        }
        return { note, score };
    });

    // 4. Sort descending, filter non-zero, and return top 3
    return scoredNotes
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => item.note);
}
```

---

### 3.2 OpenRouter Multi-Model Resilience & Fallback Algorithm (`aiService.js`)

```typescript
const MODEL_FALLBACK_CHAIN = [
    process.env.OPENROUTER_MODEL || "meta-llama/llama-3.2-3b-instruct:free",
    "openai/gpt-oss-20b:free",
    "google/gemma-4-26b-a4b-it:free",
    "qwen/qwen3-coder:free",
    "poolside/laguna-xs-2.1:free"
];

async function askLLM(prompt: string): Promise<string> {
    let lastError = null;

    for (const model of MODEL_FALLBACK_CHAIN) {
        try {
            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: model,
                    messages: [
                        { role: "system", content: "You are a personal knowledge assistant..." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.2
                },
                {
                    headers: {
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "HTTP-Referer": process.env.OPENROUTER_SITE_URL,
                        "X-Title": process.env.OPENROUTER_APP_NAME
                    },
                    timeout: 120000
                }
            );

            const answer = response.data?.choices?.[0]?.message?.content?.trim();
            if (answer) return answer;
        } catch (error) {
            lastError = error;
            const status = error.response?.status;
            // Only retry next model if status is 404 (model not found) or 429 (rate limited)
            if (status !== 404 && status !== 429) {
                throw error;
            }
        }
    }
    throw lastError || new Error("OpenRouter returned no response");
}
```

---

### 3.3 Non-Blocking Asynchronous Background Note Analysis Algorithm (`noteController.js`)

```typescript
function runAnalysisAsync(noteId: ObjectId, note: NoteDocument): void {
    // setImmediate yields control back to event loop immediately
    setImmediate(async () => {
        try {
            const analysis = await analyzeNote(note);
            if (analysis) {
                await Note.findByIdAndUpdate(noteId, { analysis: analysis });
                console.log(`Analysis completed for note ${noteId}`);
            }
        } catch (err) {
            console.error(`Background analysis error for note ${noteId}:`, err.message);
        }
    });
}
```

---

### 3.4 LLM Response Sanitization & Validation (`analysisService.js`)

```typescript
async function analyzeNote(note: NoteDocument): Promise<AnalysisResult | null> {
    const text = (note.content || note.ocrText || "").trim();
    if (!text || text.length < 20) return null; // Defensive check for empty/short notes

    const rawResponse = await askLLM(buildAnalysisPrompt(note, text));
    
    // Strip accidental markdown code block fences (e.g. ```json ... ```)
    const cleaned = rawResponse
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    try {
        const parsed = JSON.parse(cleaned);

        // Strict Runtime Schema Validation
        if (
            typeof parsed.score !== "number" ||
            !parsed.level ||
            !parsed.summary ||
            !Array.isArray(parsed.nodes) ||
            parsed.nodes.length === 0
        ) {
            return null;
        }

        parsed.analyzedAt = new Date();
        return parsed;
    } catch (parseError) {
        return null;
    }
}
```

---

## 4. Frontend Architecture & Component Specifications

```mermaid
graph TD
    subgraph State Hierarchy
        AppRoot[App.jsx<br/>State: activePage, selectedNote, prefillTopic]
    end

    subgraph Pages
        Home[Home.jsx<br/>State: notes, search, activeTag, activeModal]
        ChatPage[ChatPage.jsx<br/>State: chats, activeChatId, messages, inputMsg]
    end

    subgraph Components
        NoteCard[NoteCard.jsx<br/>Displays preview, tone colors, tags]
        NoteDetail[NoteDetail.jsx<br/>Markdown view, AI draft modal, re-analyze action]
        AddNote[AddNote.jsx<br/>Text / Image upload form]
        KA[KnowledgeAnalysis.jsx<br/>ReactFlow DAG graph, score ring, strengths/gaps]
        SearchBar[SearchBar.jsx]
        TagFilter[TagFilter.jsx]
    end

    AppRoot -->|activePage === 'notes'| Home
    AppRoot -->|activePage === 'chat'| ChatPage
    Home --> SearchBar
    Home --> TagFilter
    Home --> NoteCard
    Home --> NoteDetail
    Home --> AddNote
    NoteDetail --> KA
    KA -->|nodeClick: openChatWithTopic| AppRoot
```

### 4.1 Frontend Component Specs

1. **`App.jsx`**: Top-level router managing active view tab (`"notes"` vs `"chat"`), currently selected note, and `prefillTopic` state bridging flowchart node clicks into chat prompts.
2. **`Home.jsx`**: Controls main notes grid, tag filtering bar, real-time search input, note creation modal (`AddNote.jsx`), and note detail view (`NoteDetail.jsx`).
3. **`KnowledgeAnalysis.jsx`**: Renders ReactFlow interactive DAG flowchart. Automatically transforms `analysis.nodes` into ReactFlow node coordinates and dependency edges. Computes SVG score ring gauge.
4. **`ChatPage.jsx`**: Implements persistent chat session sidebar. Reads/writes note-to-chat ID mapping from `localStorage`. Renders conversation history with `ReactMarkdown`.
5. **`services/api.js`**: Centralized HTTP client wrapper providing type-safe error handling and automatic `FormData` header resolution.

---

## 5. State Machine Diagram: Note Processing Status

```mermaid
stateDiagram-v2
    [*] --> Ingestion: Note Creation Request

    state Ingestion {
        [*] --> CheckType
        CheckType --> DirectSave: sourceType === 'text'
        CheckType --> ProcessOCR: sourceType === 'image'

        ProcessOCR --> SaveProcessed: OCR text extracted & confidence > threshold
        ProcessOCR --> SaveReview: OCR text empty or failure

        DirectSave --> [*]: status = 'processed'
        SaveProcessed --> [*]: status = 'processed'
        SaveReview --> [*]: status = 'needs_review'
    }

    Ingestion --> BackgroundAnalysis: Return 201 Created & Trigger setImmediate()

    state BackgroundAnalysis {
        [*] --> Analyzing: Call analyzeNote()
        Analyzing --> EmbeddedSuccess: LLM returns valid JSON DAG
        Analyzing --> AnalysisFailed: Error / Timeout / Short text
        EmbeddedSuccess --> [*]: note.analysis updated in DB
        AnalysisFailed --> [*]: note.analysis remains null
    }

    BackgroundAnalysis --> [*]
```

---

## 6. Defensive Programming & Edge Case Matrix

| Subsystem | Potential Edge Case | Defensive Guard / Resolution |
| :--- | :--- | :--- |
| **OCR Processing** | Corrupted or unreadable image uploaded | Wrap `extractTextFromImage` in `try/catch`. Fall back to empty `ocrText` string and set `processingStatus: "needs_review"`. Delete disk file if upload fails. |
| **OpenRouter API** | Model returns `404` or `429 Rate Limit` | `askLLM()` catches error status and automatically retries with next model in `MODEL_FALLBACK_CHAIN`. |
| **LLM Output Parsing** | LLM outputs text or markdown fences around JSON | Strip code fences with regex `replace(/^```(?:json)?/i, "")` and validate required keys (`score`, `level`, `nodes`) before DB update. |
| **RAG Retrieval** | Query contains only stop words (e.g. "what is the") | `extractKeywords()` returns empty array. System bypasses note filtering and answers using tutor general knowledge. |
| **Note Deletion** | Note deleted while linked chat exists | `deleteNote` controller issues cascading delete `Chat.deleteMany({ noteId: note._id })` and unlinks image asset via `fs.unlinkSync()`. |
| **Short Notes** | Note content $<20$ characters | `analyzeNote()` returns `null` immediately to prevent low-quality LLM analysis. |
