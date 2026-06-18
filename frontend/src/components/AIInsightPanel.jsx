import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { api } from "../lib/api";
import { toast } from "sonner";

function renderMd(text) {
  if (!text) return null;
  // Very small markdown-ish renderer (handles ### headings, - bullets, **bold**)
  const lines = text.split("\n");
  const blocks = [];
  let buf = [];
  const flush = () => {
    if (buf.length === 0) return;
    blocks.push({ kind: "ul", items: buf });
    buf = [];
  };
  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) { flush(); blocks.push({ kind: "br" }); return; }
    if (line.startsWith("### ")) { flush(); blocks.push({ kind: "h3", text: line.slice(4) }); return; }
    if (line.startsWith("## ")) { flush(); blocks.push({ kind: "h3", text: line.slice(3) }); return; }
    if (line.startsWith("- ") || line.startsWith("* ")) { buf.push(line.slice(2)); return; }
    if (/^\d+\.\s/.test(line)) { buf.push(line.replace(/^\d+\.\s/, "")); return; }
    flush();
    blocks.push({ kind: "p", text: line });
  });
  flush();
  const bold = (s) => s.split(/(\*\*[^*]+\*\*)/).map((p, i) => p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p);
  return (
    <div className="ai-md">
      {blocks.map((b, i) => {
        if (b.kind === "h3") return <h3 key={i}>{b.text}</h3>;
        if (b.kind === "p") return <p key={i}>{bold(b.text)}</p>;
        if (b.kind === "br") return null;
        if (b.kind === "ul") return <ul key={i}>{b.items.map((it, j) => <li key={j}>{bold(it)}</li>)}</ul>;
        return null;
      })}
    </div>
  );
}

export default function AIInsightPanel({ visitId, segmentKey, currentInsight, onUpdate, label = "Generate AI Insight" }) {
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/visits/${visitId}/analyze/${segmentKey}`);
      onUpdate(data.insight);
      toast.success("AI insight ready");
    } catch (e) {
      toast.error("AI analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-panel p-5 mt-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-primary">AI Analyst · Claude Sonnet</div>
            <div className="text-sm font-semibold">Segment Insights · Suggestions · 30-60-90 Plan</div>
          </div>
        </div>
        <Button data-testid={`ai-analyze-${segmentKey}-btn`} onClick={run} disabled={loading} className="rounded-none bg-primary hover:bg-primary/90 h-9">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {currentInsight ? "Regenerate" : label}
        </Button>
      </div>
      {currentInsight ? (
        <div data-testid={`ai-insight-${segmentKey}`} className="bg-white border border-border p-5 mt-3">
          {renderMd(currentInsight)}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">Fill the form, then click &ldquo;Generate&rdquo; to get ready-to-act insights from the AI analyst.</div>
      )}
    </div>
  );
}

export { renderMd };
