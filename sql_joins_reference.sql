-- ==============================================================================
-- SECOND BRAIN - SQL JOINS REFERENCE & MONGO DB RELATIONAL TRANSLATION
-- File: /sql_joins_reference.sql
-- Description: Standalone SQL reference file demonstrating relational database schema
--              design and SQL JOIN operations based on the SecondBrain MongoDB structure.
-- ==============================================================================

-- ==============================================================================
-- SECTION 1: RELATIONAL SCHEMA DEFINITIONS (DDL)
-- Translates MongoDB embedded schemas (Note, Chat, Analysis, FlowNodes) into 3NF SQL Tables
-- ==============================================================================

-- 1. Notes Table (Primary entity representing captured notes)
CREATE TABLE IF NOT EXISTS notes (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    source_type VARCHAR(20) DEFAULT 'text' CHECK (source_type IN ('text', 'image')),
    image_url VARCHAR(500),
    processing_status VARCHAR(20) DEFAULT 'processed' CHECK (processing_status IN ('pending', 'processed', 'needs_review')),
    ocr_text TEXT,
    ai_draft TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Note Tags Table (Normalizes Mongo `tags: [String]` array into 1:N relationship)
CREATE TABLE IF NOT EXISTS note_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_id VARCHAR(36) NOT NULL,
    tag_name VARCHAR(50) NOT NULL,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_note_tag (note_id, tag_name)
);

-- 3. Note Analyses Table (Normalizes Mongo embedded `analysis` object)
CREATE TABLE IF NOT EXISTS note_analyses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_id VARCHAR(36) UNIQUE NOT NULL,
    score INT CHECK (score BETWEEN 0 AND 100),
    level VARCHAR(20) CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    summary TEXT,
    current_node VARCHAR(100),
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

-- 4. Flow Nodes Table (Normalizes Mongo embedded `analysis.nodes` DAG array)
CREATE TABLE IF NOT EXISTS flow_nodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    analysis_id INT NOT NULL,
    node_key VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    level VARCHAR(20) CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    is_current BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (analysis_id) REFERENCES note_analyses(id) ON DELETE CASCADE
);

-- 5. Chats Table (Represents chat sessions linked to a note or global)
CREATE TABLE IF NOT EXISTS chats (
    id VARCHAR(36) PRIMARY KEY,
    note_id VARCHAR(36) NULL, -- NULL indicates global/standalone chat session
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

-- 6. Chat Messages Table (Normalizes Mongo embedded `messages` array in Chat schema)
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id VARCHAR(36) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);


-- ==============================================================================
-- SECTION 2: SAMPLE DATA SEEDING
-- ==============================================================================

INSERT INTO notes (id, title, content, source_type, processing_status, ocr_text) VALUES
('note-101', 'Operating Systems', 'A process is a program in execution. Threads share memory space.', 'text', 'processed', NULL),
('note-102', 'Database Indexing', 'B-Trees and Hash Indexes improve query retrieval performance.', 'text', 'processed', NULL),
('note-103', 'Machine Learning Basics', 'Supervised learning uses labeled training datasets.', 'image', 'processed', 'Supervised vs Unsupervised learning notes extracted via OCR');

INSERT INTO note_tags (note_id, tag_name) VALUES
('note-101', 'cs'), ('note-101', 'os'),
('note-102', 'cs'), ('note-102', 'db'),
('note-103', 'ai'), ('note-103', 'ml');

INSERT INTO note_analyses (id, note_id, score, level, summary, current_node) VALUES
(1, 'note-101', 75, 'intermediate', 'Good understanding of processes and threads.', 'node-threads'),
(2, 'note-102', 85, 'advanced', 'Strong grasp of B-Tree indexing mechanisms.', 'node-btrees');

INSERT INTO flow_nodes (analysis_id, node_key, label, level, is_current) VALUES
(1, 'node-process', 'Process Concepts', 'beginner', FALSE),
(1, 'node-threads', 'Thread Concurrency', 'intermediate', TRUE),
(1, 'node-deadlock', 'Deadlock Prevention', 'advanced', FALSE);

INSERT INTO chats (id, note_id) VALUES
('chat-001', 'note-101'),
('chat-002', 'note-102'),
('chat-003', NULL); -- Standalone chat (no linked note)

INSERT INTO chat_messages (chat_id, role, content) VALUES
('chat-001', 'user', 'What is the difference between a process and a thread?'),
('chat-001', 'assistant', 'A process is an independent program with its own memory space, whereas threads share memory within the process.'),
('chat-002', 'user', 'Explain how B-Trees optimize SQL query lookups.'),
('chat-002', 'assistant', 'B-Trees reduce I/O reads by maintaining a self-balancing tree hierarchy of page pointers.'),
('chat-003', 'user', 'Hello AI, give me general study tips.');


-- ==============================================================================
-- SECTION 3: SQL JOIN OPERATIONS (RELEVANT TO MONGO DB STRUCTURE)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. INNER JOIN
-- Mongo Equivalent: Chat.find({ noteId: { $ne: null } }).populate('noteId')
-- Purpose: Retrieves all chat sessions along with their associated note title and content.
-- Excludes global chats where note_id is NULL.
-- ------------------------------------------------------------------------------
SELECT 
    c.id AS chat_id,
    c.note_id,
    n.title AS note_title,
    n.source_type,
    c.created_at AS chat_started_at
FROM chats c
INNER JOIN notes n ON c.note_id = n.id;


-- ------------------------------------------------------------------------------
-- 2. LEFT JOIN (LEFT OUTER JOIN)
-- Mongo Equivalent: Note.aggregate([{ $lookup: { from: 'chats', localField: '_id', foreignField: 'noteId', as: 'chats' } }])
-- Purpose: Retrieves ALL notes, including notes that do not have an active chat session yet.
-- ------------------------------------------------------------------------------
SELECT 
    n.id AS note_id,
    n.title AS note_title,
    n.processing_status,
    c.id AS chat_id,
    c.created_at AS chat_created_at
FROM notes n
LEFT JOIN chats c ON n.id = c.note_id
ORDER BY n.created_at DESC;


-- ------------------------------------------------------------------------------
-- 3. LEFT JOIN WITH AGGREGATION (GROUP BY & COUNT)
-- Mongo Equivalent: Note aggregation with $lookup and $size of messages
-- Purpose: Summarizes notes with their total associated chat sessions and message count.
-- ------------------------------------------------------------------------------
SELECT 
    n.id AS note_id,
    n.title AS note_title,
    COUNT(DISTINCT c.id) AS total_chat_sessions,
    COUNT(m.id) AS total_messages_exchanged
FROM notes n
LEFT JOIN chats c ON n.id = c.note_id
LEFT JOIN chat_messages m ON c.id = m.chat_id
GROUP BY n.id, n.title;


-- ------------------------------------------------------------------------------
-- 4. MULTI-TABLE JOIN (Notes + Tags + AI Analysis)
-- Mongo Equivalent: Querying Note document with embedded tags array & embedded analysis object
-- Purpose: Fetches note content, associated tags aggregated as a string, and AI analysis score.
-- ------------------------------------------------------------------------------
SELECT 
    n.id AS note_id,
    n.title,
    GROUP_CONCAT(t.tag_name ORDER BY t.tag_name SEPARATOR ', ') AS tags,
    na.score AS knowledge_score,
    na.level AS knowledge_level,
    na.summary AS analysis_summary
FROM notes n
LEFT JOIN note_tags t ON n.id = t.note_id
LEFT JOIN note_analyses na ON n.id = na.note_id
GROUP BY n.id, n.title, na.score, na.level, na.summary;


-- ------------------------------------------------------------------------------
-- 5. COMPLEX 5-TABLE JOIN (Full Context RAG Assembly)
-- Purpose: Assembles full context for RAG AI system: Note + Analysis + Current Flow Node + Chat Messages.
-- ------------------------------------------------------------------------------
SELECT 
    n.title AS note_title,
    n.content AS note_content,
    na.score AS ai_score,
    na.level AS ai_level,
    fn.label AS active_learning_topic,
    cm.role AS message_sender,
    cm.content AS message_text
FROM notes n
INNER JOIN note_analyses na ON n.id = na.note_id
LEFT JOIN flow_nodes fn ON na.id = fn.analysis_id AND fn.is_current = TRUE
INNER JOIN chats c ON n.id = c.note_id
INNER JOIN chat_messages cm ON c.id = cm.chat_id
WHERE n.id = 'note-101'
ORDER BY cm.created_at ASC;


-- ------------------------------------------------------------------------------
-- 6. RIGHT JOIN / FULL OUTER JOIN (Finding Standalone / Orphaned Chats)
-- Mongo Equivalent: Chat.find({ noteId: null })
-- Purpose: Finds chat sessions that are NOT linked to any note (standalone AI tutor chats).
-- ------------------------------------------------------------------------------
SELECT 
    c.id AS chat_id,
    c.note_id,
    n.title AS linked_note_title,
    c.created_at
FROM notes n
RIGHT JOIN chats c ON n.id = c.note_id
WHERE n.id IS NULL;


-- ==============================================================================
-- SECTION 4: MONGODB AGGREGATION VS SQL JOIN COMPARISON MATRIX
-- ==============================================================================
/*
+-----------------------------+-----------------------------------+------------------------------------+
| Operation Concept           | MongoDB Aggregation               | Relational SQL Equivalent          |
+-----------------------------+-----------------------------------+------------------------------------+
| Join collections/tables     | $lookup ({ from, localField, ...})| INNER JOIN / LEFT JOIN             |
| Unwind embedded array       | $unwind                           | JOIN on child normalized table     |
| Grouping & Counting         | $group ({ _id, count: {$sum: 1}})| GROUP BY ... COUNT()               |
| Filtering joined records    | $match                            | WHERE / HAVING clause              |
| Embedded Objects            | Built-in document embedding       | Foreign Key 1:1 or 1:N Join        |
+-----------------------------+-----------------------------------+------------------------------------+
*/
