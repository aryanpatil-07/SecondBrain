import { useEffect, useMemo, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { getNote, reAnalyzeNote } from "../services/api";

/* ─── Layout constants ─────────────────────────────────────────────────────── */
const NODE_W  = 180;
const NODE_H  = 72;
const H_GAP   = 32;
const V_GAP   = 100;
const LANE_Y  = { beginner: 40, intermediate: 40 + NODE_H + V_GAP, advanced: 40 + (NODE_H + V_GAP) * 2 };

function buildLayout(nodes) {
  const byLevel = { beginner: [], intermediate: [], advanced: [] };
  nodes.forEach((n) => {
    const key = n.level in byLevel ? n.level : "beginner";
    byLevel[key].push(n);
  });

  const positioned = [];
  Object.entries(byLevel).forEach(([lvl, group]) => {
    const total = group.length * NODE_W + (group.length - 1) * H_GAP;
    const startX = -total / 2 + NODE_W / 2;
    group.forEach((n, i) => {
      positioned.push({ ...n, px: startX + i * (NODE_W + H_GAP), py: LANE_Y[lvl] ?? 40 });
    });
  });
  return positioned;
}

/* ─── Theme ────────────────────────────────────────────────────────────────── */
const LEVEL_THEME = {
  beginner:     { bg: "#0d1f12", border: "#22c55e", glow: "rgba(34,197,94,0.3)",  text: "#86efac", pill: "#14532d", pillText: "#bbf7d0", label: "Beginner"     },
  intermediate: { bg: "#130d24", border: "#8b5cf6", glow: "rgba(139,92,246,0.3)", text: "#c4b5fd", pill: "#3b0764", pillText: "#e9d5ff", label: "Intermediate"  },
  advanced:     { bg: "#1f0d07", border: "#f97316", glow: "rgba(249,115,22,0.3)", text: "#fdba74", pill: "#431407", pillText: "#fed7aa", label: "Advanced"      },
};

const CURRENT_THEME = {
  bg: "#1a1040", border: "#e2e8f0", glow: "rgba(255,255,255,0.4)",
  text: "#f8fafc", pill: "#7c3aed", pillText: "#fff", label: "Your Level",
};

/* ─── Custom Node ──────────────────────────────────────────────────────────── */
function TopicNode({ data }) {
  const [hovered, setHovered] = useState(false);
  const t = data.isCurrent ? CURRENT_THEME : (LEVEL_THEME[data.level] || LEVEL_THEME.beginner);

  return (
    <div
      onClick={data.onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Click to explore this topic in chat"
      style={{
        width: NODE_W,
        minHeight: NODE_H,
        background: hovered ? (data.isCurrent ? "#261658" : t.bg.replace("0d", "15").replace("13", "1e").replace("1f", "2a")) : t.bg,
        border: `2px solid ${hovered ? t.border : (data.isCurrent ? t.border : t.border + "bb")}`,
        borderRadius: 14,
        padding: "12px 14px 10px",
        cursor: "pointer",
        boxShadow: hovered || data.isCurrent
          ? `0 0 0 3px ${t.glow}, 0 6px 28px ${t.glow}`
          : "0 2px 10px rgba(0,0,0,0.5)",
        transform: hovered ? "translateY(-3px) scale(1.02)" : "none",
        transition: "all 0.18s ease",
        position: "relative",
        userSelect: "none",
      }}
    >
      <Handle type="target" position={Position.Top}    style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none" }} />

      {/* YOU ARE HERE badge */}
      {data.isCurrent && (
        <div style={{
          position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(90deg,#7c3aed,#a855f7)", color: "#fff",
          fontSize: "0.58rem", fontWeight: 800, padding: "3px 10px",
          borderRadius: 999, whiteSpace: "nowrap", letterSpacing: "0.08em",
          boxShadow: "0 2px 10px rgba(139,92,246,0.5)",
        }}>◆ YOU ARE HERE</div>
      )}

      <div style={{ fontSize: "0.83rem", fontWeight: 700, color: t.text, lineHeight: 1.35, marginBottom: 7 }}>
        {data.label}
      </div>

      <span style={{
        fontSize: "0.62rem", fontWeight: 800,
        background: t.pill, color: t.pillText,
        padding: "2px 8px", borderRadius: 999,
        textTransform: "uppercase", letterSpacing: "0.07em",
      }}>{data.isCurrent ? "Your Level" : t.label}</span>
    </div>
  );
}

const nodeTypes = { topic: TopicNode };

/* ─── Lane background panels ───────────────────────────────────────────────── */
const LANE_LABELS = [
  { y: LANE_Y.beginner - 20,     label: "🟢  Beginner",     color: "#22c55e" },
  { y: LANE_Y.intermediate - 20, label: "🟣  Intermediate",  color: "#8b5cf6" },
  { y: LANE_Y.advanced - 20,     label: "🟠  Advanced",      color: "#f97316" },
];

/* ─── Score ring ───────────────────────────────────────────────────────────── */
function ScoreRing({ score }) {
  const r = 44, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? "#4ade80" : score >= 45 ? "#a78bfa" : "#f97316";
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
      <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "55px 55px", transition: "stroke-dashoffset 1s ease" }}
      />
      <text x="55" y="51" textAnchor="middle" fill={color} fontSize="22" fontWeight="800" fontFamily="inherit">{score}</text>
      <text x="55" y="67" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="inherit">/ 100</text>
    </svg>
  );
}

/* ─── Main component ───────────────────────────────────────────────────────── */
export default function KnowledgeAnalysis({ note, onClose, onTopicChat }) {
  const [analysis, setAnalysis] = useState(note?.analysis || null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [syncKey, setSyncKey]   = useState(0);
  const flowRef                 = useRef(null);

  const handleReAnalyze = async () => {
    setLoading(true); setError("");
    try {
      const res = await reAnalyzeNote(note._id);
      if (res?.analysis) {
        setAnalysis(res.analysis);
        setSyncKey((k) => k + 1);
      } else {
        setError("Analysis could not be generated — try again.");
      }
    } catch (e) {
      setError(e.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  // On open: only check DB for existing analysis — never auto-trigger LLM
  useEffect(() => {
    if (analysis) return; // already have it from the note prop
    const checkDB = async () => {
      try {
        const fresh = await getNote(note._id);
        if (fresh?.analysis) setAnalysis(fresh.analysis);
        // If still nothing — user must click "Analyse Knowledge" button
      } catch (e) {
        console.error("Could not fetch note:", e.message);
      }
    };
    checkDB();
  }, [note._id]);

  /* Build flow nodes + edges */
  const { initNodes, initEdges } = useMemo(() => {
    if (!analysis?.nodes?.length) return { initNodes: [], initEdges: [] };

    const positioned = buildLayout(analysis.nodes);

    const initNodes = positioned.map((n) => ({
      id: n.id,
      type: "topic",
      position: { x: n.px, y: n.py },
      draggable: false,
      data: {
        label: n.label,
        level: n.level,
        isCurrent: n.id === analysis.currentNode || !!n.isCurrent,
      },
    }));

    const initEdges = [];
    analysis.nodes.forEach((n) => {
      (n.parents || []).forEach((pid) => {
        const isCurrent = n.id === analysis.currentNode || n.isCurrent;
        initEdges.push({
          id: `${pid}->${n.id}`,
          source: pid, target: n.id,
          type: "smoothstep",
          animated: isCurrent,
          markerEnd: { type: MarkerType.ArrowClosed, color: isCurrent ? "#a78bfa" : "rgba(255,255,255,0.2)" },
          style: {
            stroke: isCurrent ? "#a78bfa" : "rgba(255,255,255,0.18)",
            strokeWidth: isCurrent ? 2 : 1.5,
          },
        });
      });
    });

    return { initNodes, initEdges };
  }, [analysis, note]);

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  const handleNodeClick = (nodeLabel) => {
    onTopicChat(nodeLabel, note);
  };

  const LEVEL = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", expert: "Expert" };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="analysis-modal" role="dialog" aria-modal="true">

        {/* ── Header ── */}
        <div className="analysis-modal-header">
          <div>
            <p className="detail-kicker">Knowledge Analysis</p>
            <h2>{note.title}</h2>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="secondary-button" onClick={handleReAnalyze} disabled={loading}>
              {loading ? "Analyzing…" : "Re-analyze"}
            </button>
            <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
          </div>
        </div>

        {error && <div className="analysis-error">{error}</div>}

        {loading && (
          <div className="analysis-loading">
            <div className="analysis-spinner" />
            <p>Analyzing your knowledge depth…</p>
          </div>
        )}

        {!loading && !analysis && !error && (
          <div className="analysis-loading">
            <p style={{ color: "var(--muted)", marginBottom: 18, fontSize: "0.95rem" }}>
              No analysis yet for this note.
            </p>
            <button className="primary-button" onClick={handleReAnalyze}>
              Analyse Knowledge
            </button>
          </div>
        )}

        {analysis && (
          <div className="analysis-body">

            {/* ── Score + Summary ── */}
            <div className="analysis-overview">
              <div className="analysis-score-wrap">
                <ScoreRing score={analysis.score ?? 0} />
                <span className={`analysis-level-badge level-${analysis.level}`}>
                  {LEVEL[analysis.level] || analysis.level}
                </span>
              </div>
              <div className="analysis-summary-wrap">
                <p className="analysis-summary">{analysis.summary}</p>
                <div className="analysis-lists">
                  {analysis.strengths?.length > 0 && (
                    <div className="analysis-list strengths">
                      <p className="list-label">✓ Strengths</p>
                      <ul>{analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  )}
                  {analysis.gaps?.length > 0 && (
                    <div className="analysis-list gaps">
                      <p className="list-label">△ Gaps to explore</p>
                      <ul>{analysis.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Flowchart ── */}
            {initNodes.length > 0 && (
              <div className="analysis-flow-wrap">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <p className="panel-label" style={{ margin: 0 }}>Learning Roadmap</p>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    {[["#22c55e","Beginner"],["#8b5cf6","Intermediate"],["#f97316","Advanced"],["#e2e8f0","Your Level"]].map(([c,l]) => (
                      <span key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: "inline-block" }} />{l}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="analysis-flow">
                  <ReactFlow
                    key={syncKey}
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.25 }}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    panOnScroll
                    zoomOnScroll={false}
                    minZoom={0.5}
                    maxZoom={1.5}
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background color="rgba(255,255,255,0.03)" gap={28} size={1} />
                    <Controls
                      showInteractive={false}
                      style={{ background: "rgba(17,19,24,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
                    />
                  </ReactFlow>
                </div>

                <p className="analysis-flow-hint">
                  Click any node to open an in-depth explanation in chat · Highlighted node = your current estimated level
                </p>

                {/* Separate clickable cards grid below the flowchart */}
                <div style={{
                  marginTop: 20,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 12,
                }}>
                  {analysis?.nodes?.map((n) => {
                    const t = n.id === analysis.currentNode ? CURRENT_THEME : (LEVEL_THEME[n.level] || LEVEL_THEME.beginner);
                    return (
                      <button
                        key={n.id}
                        onClick={() => onTopicChat(n.label, note)}
                        style={{
                          background: t.bg,
                          border: `2px solid ${t.border}`,
                          borderRadius: 12,
                          padding: "12px 14px",
                          cursor: "pointer",
                          color: t.text,
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          transition: "all 0.18s ease",
                          textAlign: "center",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.boxShadow = `0 0 0 3px ${t.glow}, 0 6px 28px ${t.glow}`;
                          e.target.style.transform = "translateY(-3px) scale(1.02)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.boxShadow = "0 2px 10px rgba(0,0,0,0.5)";
                          e.target.style.transform = "none";
                        }}
                      >
                        {n.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
