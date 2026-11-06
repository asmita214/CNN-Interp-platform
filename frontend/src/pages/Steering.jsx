import { useState, useMemo, useCallback } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import {
  Sliders,
  Shuffle,
  Play,
  Search,
  Image,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  Zap,
  ScanLine,
  ArrowRight,
} from "lucide-react";
import { useAtlas } from "../hooks/useAtlas";
import { api, API_BASE } from "../api";
import {
  PageHeader,
  ConfidenceBadge,
  LoadingState,
  ErrorState,
  EmptyState,
} from "../components/ui";

const CLASS_DISPLAY = {
  plane: "Airplane",
  car: "Automobile",
  bird: "Bird",
  cat: "Cat",
  deer: "Deer",
  dog: "Dog",
  frog: "Frog",
  horse: "Horse",
  ship: "Ship",
  truck: "Truck",
};

const CLASS_ORDER = ["plane", "car", "bird", "cat", "deer", "dog", "frog", "horse", "ship", "truck"];

const BAR_COLORS = {
  original: { default: "#6366f1", top: "#818cf8" },
  steered:  { default: "#8b5cf6", top: "#a78bfa" },
};

function formatPct(v) {
  return `${(v * 100).toFixed(1)}%`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/90 px-3 py-2 shadow-xl backdrop-blur-md text-xs">
      <p className="font-semibold text-slate-200">{label}</p>
      <p className="font-mono text-indigo-300 mt-0.5">{formatPct(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

function PredictionChart({ data, topKey, color }) {
  const sorted = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 2, right: 16, bottom: 2, left: 0 }}>
        <XAxis
          type="number"
          domain={[0, 1]}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={76}
          tick={{ fontSize: 10, fill: "#cbd5e1" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {sorted.map((entry) => (
            <Cell
              key={entry.key}
              fill={entry.key === topKey ? color.top : color.default}
              fillOpacity={entry.key === topKey ? 1 : 0.55}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function DeltaBadge({ origTop, steeredTop, origVal, steeredVal }) {
  const delta = steeredVal - origVal;
  const sameClass = origTop === steeredTop;
  if (sameClass) {
    if (Math.abs(delta) < 0.005)
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/60 border border-slate-600/50 px-2.5 py-1 text-[11px] font-medium text-slate-300">
          <Minus className="h-3 w-3" /> No change
        </span>
      );
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${delta > 0 ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "bg-rose-500/15 border-rose-500/30 text-rose-300"}`}>
        {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {CLASS_DISPLAY[origTop] ?? origTop}: {formatPct(origVal)} {"->"} {formatPct(steeredVal)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-[11px] font-semibold text-violet-300">
      <ArrowRight className="h-3 w-3" />
      {CLASS_DISPLAY[origTop] ?? origTop} {"->"} {CLASS_DISPLAY[steeredTop] ?? steeredTop}
    </span>
  );
}

function FeaturePicker({ atlas, selected, onSelect }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return atlas.slice(0, 60);
    const q = search.toLowerCase();
    return atlas.filter(
      (f) => f.label.toLowerCase().includes(q) || String(f.feature_id).includes(q)
    ).slice(0, 60);
  }, [atlas, search]);

  const handleSelect = (f) => { onSelect(f); setOpen(false); setSearch(""); };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-700/60 bg-slate-800/60 px-3.5 py-2.5 text-left text-sm text-slate-200 transition hover:border-indigo-500/50 hover:bg-slate-800/80 focus:outline-none"
      >
        <span className="flex items-center gap-2 truncate">
          <ScanLine className="h-4 w-4 shrink-0 text-indigo-400" />
          {selected ? (
            <span className="truncate">
              <span className="font-mono text-[11px] text-slate-400 mr-1.5">#{selected.feature_id}</span>
              {selected.label}
            </span>
          ) : (
            <span className="text-slate-400 text-xs">Search features by label or ID…</span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/40 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-700/50 px-3 py-2.5">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to filter…"
              className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">No features match.</p>
            ) : (
              filtered.map((f) => (
                <button
                  key={f.feature_id}
                  onClick={() => handleSelect(f)}
                  className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs transition hover:bg-indigo-500/10 ${selected?.feature_id === f.feature_id ? "bg-indigo-500/15 text-indigo-200" : "text-slate-300"}`}
                >
                  <span className="font-mono text-[10px] text-slate-500 w-12 shrink-0">#{f.feature_id}</span>
                  <span className="truncate">{f.label}</span>
                  <ConfidenceBadge value={f.confidence} />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StrengthSlider({ value, onChange }) {
  const label =
    value < 0.05 ? "Fully suppressed" :
    value < 0.95 ? `${Math.round((1 - value) * 100)}% suppressed` :
    value > 1.05 ? `${((value - 1) * 100).toFixed(0)}% amplified` :
    "Baseline (unchanged)";
  const pct = (value / 3) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400">Strength</span>
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-bold text-white">{value.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400">({label})</span>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={3}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full appearance-none h-1.5 rounded-full outline-none cursor-pointer"
        style={{ background: `linear-gradient(to right, #6366f1 ${pct}%, rgba(99,102,241,0.2) ${pct}%)` }}
      />
      <div className="flex justify-between text-[9px] font-mono text-slate-500">
        <span>0 — suppress</span>
        <span>1 — baseline</span>
        <span>3 — amplify</span>
      </div>
    </div>
  );
}

export default function Steering() {
  const { atlas, loading: atlasLoading, error: atlasError } = useAtlas();

  const [imageIdx, setImageIdx] = useState(() => Math.floor(Math.random() * 10000));
  const [imageInput, setImageInput] = useState(() => {
    const r = Math.floor(Math.random() * 10000);
    return String(r);
  });
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [strength, setStrength] = useState(1.0);

  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [steerError, setSteerError] = useState(null);

  const commitImageIdx = useCallback(() => {
    const v = parseInt(imageInput, 10);
    if (!isNaN(v) && v >= 0 && v <= 9999) setImageIdx(v);
    else setImageInput(String(imageIdx));
  }, [imageInput, imageIdx]);

  const randomImage = () => {
    const r = Math.floor(Math.random() * 10000);
    setImageIdx(r);
    setImageInput(String(r));
    setResult(null);
  };

  const handleSteer = async () => {
    if (!selectedFeature) return;
    setRunning(true);
    setSteerError(null);
    setResult(null);
    try {
      const { data } = await api.post("/steer", {
        image_idx: imageIdx,
        feature_id: selectedFeature.feature_id,
        strength,
      });
      setResult(data);
    } catch (err) {
      setSteerError(err?.response?.data?.detail || err.message || "Unknown error");
    } finally {
      setRunning(false);
    }
  };

  const { origData, steeredData, origTopKey, steeredTopKey } = useMemo(() => {
    if (!result) return {};
    const origData = CLASS_ORDER.map((k) => ({
      key: k,
      name: CLASS_DISPLAY[k] ?? k,
      value: result.original_predictions?.[k] ?? 0,
    }));
    const steeredData = CLASS_ORDER.map((k) => ({
      key: k,
      name: CLASS_DISPLAY[k] ?? k,
      value: result.steered_predictions?.[k] ?? 0,
    }));
    const origTopKey = origData.reduce((a, b) => (b.value > a.value ? b : a)).key;
    const steeredTopKey = steeredData.reduce((a, b) => (b.value > a.value ? b : a)).key;
    return { origData, steeredData, origTopKey, steeredTopKey };
  }, [result]);

  if (atlasLoading) return <LoadingState label="Loading feature index…" />;
  if (atlasError) return <ErrorState message={atlasError} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Steering Playground"
        description="Intervene on individual SAE features during inference. Suppress or amplify a feature and watch how the model's class predictions shift in real time."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300">
            <Zap className="h-3 w-3" /> Live
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Image */}
        <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Image className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold tracking-wide text-indigo-300 uppercase">Image</span>
          </div>
          <div className="flex justify-center">
            <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/40 shadow-lg">
              <img
                src={`${API_BASE}/image/${imageIdx}`}
                alt={`CIFAR-10 image ${imageIdx}`}
                className="h-28 w-28 object-cover"
                style={{ imageRendering: "pixelated" }}
              />
              {result?.true_label && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 py-1 text-center text-[10px] font-semibold text-white capitalize backdrop-blur-sm">
                  {result.true_label}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              max={9999}
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onBlur={commitImageIdx}
              onKeyDown={(e) => e.key === "Enter" && commitImageIdx()}
              className="flex-1 min-w-0 rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-2 font-mono text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              placeholder="0–9999"
            />
            <button
              onClick={randomImage}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-xs text-slate-300 transition hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-300"
            >
              <Shuffle className="h-3.5 w-3.5" />
              Random
            </button>
          </div>
          <p className="text-[10px] text-slate-500">Index 0–9999. True label appears after steering.</p>
        </div>

        {/* Feature */}
        <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-400">
              <ScanLine className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold tracking-wide text-violet-300 uppercase">Feature</span>
          </div>
          <FeaturePicker atlas={atlas} selected={selectedFeature} onSelect={setSelectedFeature} />
          {selectedFeature ? (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-3.5 py-3 space-y-1.5">
              <p className="text-sm font-semibold text-slate-100 truncate">{selectedFeature.label}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <ConfidenceBadge value={selectedFeature.confidence} />
                <span className="font-mono text-[10px] text-slate-400">
                  Cluster {selectedFeature.cluster === -1 ? "none" : selectedFeature.cluster}
                </span>
              </div>
              <p className="font-mono text-[10px] text-slate-500">Feature ID #{selectedFeature.feature_id}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700/50 bg-slate-800/20 px-3.5 py-4 text-center">
              <p className="text-[11px] text-slate-500">Select a feature above to steer</p>
            </div>
          )}
        </div>

        {/* Strength + Run */}
        <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Sliders className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold tracking-wide text-emerald-300 uppercase">Strength</span>
          </div>
          <StrengthSlider value={strength} onChange={setStrength} />
          <div className="flex gap-2">
            {[0, 0.5, 1, 2, 3].map((v) => (
              <button
                key={v}
                onClick={() => setStrength(v)}
                className={`flex-1 rounded-lg border py-1 text-[10px] font-semibold transition ${
                  strength === v
                    ? "border-indigo-500/60 bg-indigo-500/20 text-indigo-300"
                    : "border-slate-700/50 bg-slate-800/40 text-slate-400 hover:border-slate-600/60 hover:text-slate-300"
                }`}
              >
                {v}x
              </button>
            ))}
          </div>
          <button
            onClick={handleSteer}
            disabled={!selectedFeature || running}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-950/50 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {running ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Running…
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Steering
              </>
            )}
          </button>
          {!selectedFeature && (
            <p className="text-center text-[10px] text-slate-500">Select a feature to enable</p>
          )}
        </div>
      </div>

      {steerError && <ErrorState message={steerError} />}

      {result ? (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 px-5 py-3.5 backdrop-blur-xl shadow-xl shadow-black/20">
            <TrendingUp className="h-4 w-4 text-violet-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300 mr-1">Steering result:</span>
            <DeltaBadge
              origTop={origTopKey}
              steeredTop={steeredTopKey}
              origVal={result.original_predictions?.[origTopKey] ?? 0}
              steeredVal={result.steered_predictions?.[origTopKey] ?? 0}
            />
            <span className="ml-auto font-mono text-[10px] text-slate-500">
              feature #{selectedFeature?.feature_id} · strength {strength.toFixed(2)}
            </span>
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-indigo-950/20 via-slate-900/80 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl shadow-black/20">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 ring-2 ring-indigo-400/20" />
                <span className="text-xs font-bold text-indigo-300 tracking-wide uppercase">Original Predictions</span>
                <span className="ml-auto rounded-full border border-indigo-500/25 bg-indigo-500/15 px-2 py-0.5 font-mono text-[10px] text-indigo-300">baseline</span>
              </div>
              <PredictionChart data={origData} topKey={origTopKey} color={BAR_COLORS.original} />
              <p className="mt-1 text-[10px] text-slate-500">
                Top: <span className="text-slate-300 font-semibold">{CLASS_DISPLAY[origTopKey]}</span>
                {" "}at <span className="font-mono text-indigo-300">{formatPct(result.original_predictions?.[origTopKey] ?? 0)}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-violet-950/20 via-slate-900/80 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl shadow-black/20">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-400 ring-2 ring-violet-400/20" />
                <span className="text-xs font-bold text-violet-300 tracking-wide uppercase">Steered Predictions</span>
                <span className="ml-auto rounded-full border border-violet-500/25 bg-violet-500/15 px-2 py-0.5 font-mono text-[10px] text-violet-300">strength {strength.toFixed(2)}</span>
              </div>
              <PredictionChart data={steeredData} topKey={steeredTopKey} color={BAR_COLORS.steered} />
              <p className="mt-1 text-[10px] text-slate-500">
                Top: <span className="text-slate-300 font-semibold">{CLASS_DISPLAY[steeredTopKey]}</span>
                {" "}at <span className="font-mono text-violet-300">{formatPct(result.steered_predictions?.[steeredTopKey] ?? 0)}</span>
              </p>
            </div>
          </div>

          {/* Per-class delta grid */}
          <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl shadow-black/20">
            <p className="mb-3 text-xs font-bold tracking-wide text-slate-300 uppercase">Class-level Delta</p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
              {CLASS_ORDER.map((k) => {
                const orig = result.original_predictions?.[k] ?? 0;
                const steered = result.steered_predictions?.[k] ?? 0;
                const delta = steered - orig;
                const isOrigTop = k === origTopKey;
                const isSteeredTop = k === steeredTopKey;
                return (
                  <div
                    key={k}
                    className={`rounded-xl border px-3 py-2.5 text-center transition ${
                      isSteeredTop
                        ? "border-violet-500/40 bg-violet-500/10"
                        : isOrigTop
                        ? "border-indigo-500/30 bg-indigo-500/10"
                        : "border-slate-700/40 bg-slate-800/30"
                    }`}
                  >
                    <p className="text-[11px] font-semibold text-slate-200">{CLASS_DISPLAY[k]}</p>
                    <p className="font-mono text-xs font-bold text-white mt-0.5">{formatPct(steered)}</p>
                    <p className={`font-mono text-[10px] font-semibold mt-0.5 ${Math.abs(delta) < 0.005 ? "text-slate-500" : delta > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {delta >= 0 ? "+" : ""}{formatPct(delta)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : !running && (
        <EmptyState
          title="No steering result yet"
          body="Select an image, pick a SAE feature, adjust the strength slider, then hit Run Steering to see how predictions change."
        />
      )}
    </div>
  );
}
