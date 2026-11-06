import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, Server, RefreshCw, Cpu, Sparkles } from 'lucide-react';
import { API_BASE, api } from '../api';
import { PageHeader, StatCard } from '../components/ui';

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/atlas',
    description: 'Returns array of all 3,648 alive features with labels, clusters, confidence, and 2D UMAP coordinates.',
    responseType: 'Array<AtlasFeature>',
    sample: `[
  {
    "feature_id": 0,
    "label": "automobile wheels",
    "confidence": "high",
    "cluster": 14,
    "x": -2.34,
    "y": 1.12
  },
  ...
]`,
  },
  {
    method: 'GET',
    path: '/feature/{feature_id}',
    description: "Returns metadata and top activating images for a specific SAE neuron.",
    responseType: 'FeatureDetail',
    sample: `{
  "feature_id": 127,
  "label": "fur texture",
  "confidence": "high",
  "cluster": 12,
  "top_images": [
    { "image_idx": 842, "position": 0, "activation": 2.14 },
    { "image_idx": 194, "position": 1, "activation": 1.98 }
  ]
}`,
  },
  {
    method: 'GET',
    path: '/image/{image_idx}',
    description: 'Returns the raw 32×32 PNG image from the CIFAR-10 evaluation set for the given index.',
    responseType: 'image/png',
    sample: 'Binary image/png payload (32x32 RGB)',
  },
];

export default function Settings() {
  const [serverStatus, setServerStatus] = useState('checking');
  const [pingTime, setPingTime] = useState(null);

  const checkHealth = () => {
    setServerStatus('checking');
    const start = performance.now();
    api
      .get('/')
      .then(() => {
        setPingTime(Math.round(performance.now() - start));
        setServerStatus('online');
      })
      .catch(() => {
        setServerStatus('offline');
      });
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-7">
      <PageHeader
        title="API Documentation & System Settings"
        description="Local environment connection, backend service health, and REST endpoint schemas."
      />

      {/* Connection Status Card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Backend Endpoint"
          value="localhost:8000"
          hint={`Proxy route: ${API_BASE}`}
          icon={Server}
          color="indigo"
        />
        <StatCard
          label="Server Health"
          value={serverStatus === 'online' ? 'Online' : serverStatus === 'offline' ? 'Offline' : 'Checking…'}
          hint={pingTime ? `Response time: ${pingTime}ms` : 'FastAPI local server'}
          icon={CheckCircle2}
          badge={serverStatus === 'online' ? 'Active' : 'Unreachable'}
          color={serverStatus === 'online' ? 'emerald' : 'rose'}
        />
        <StatCard
          label="Dictionary Size"
          value="4,096"
          hint="Overcomplete SAE (TopK=256)"
          icon={Cpu}
          color="purple"
        />
      </div>

      {/* REST API Endpoints Specification */}
      <section id="api" className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-6.5 backdrop-blur-xl shadow-xl shadow-black/20">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-base font-extrabold text-white">REST API Endpoints</h2>
          </div>
          <button
            type="button"
            onClick={checkHealth}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-1.5 text-xs font-bold text-slate-200 transition-all hover:border-indigo-500/40 hover:text-white hover:bg-slate-850 shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Test Connection</span>
          </button>
        </div>

        <p className="mt-3.5 text-xs leading-relaxed text-slate-400">
          The frontend strictly consumes only the existing FastAPI endpoints without fabricating or calling non-existent endpoints.
        </p>

        <div className="mt-5 space-y-4">
          {ENDPOINTS.map((ep) => (
            <div
              key={ep.path}
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 p-4.5 transition-all hover:border-indigo-500/30"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-200">{ep.path}</span>
                </div>
                <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-300">
                  {ep.responseType}
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-400">{ep.description}</p>

              <div className="mt-3.5 rounded-xl bg-black/60 p-3.5 border border-slate-800/80">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400/80">
                  Response Schema / Preview
                </div>
                <pre className="font-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap overflow-x-auto">
                  {ep.sample}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Theme & Platform Specs */}
      <section className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-6.5 backdrop-blur-xl shadow-xl shadow-black/20">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
          Visual Design System & Color Palette
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          NeuroLens Dark Theme is inspired by professional mechanistic interpretability tooling (Anthropic Circuit Explorer, OpenAI Neuron Viewer). Utilizes deep midnight slate surfaces (<code className="text-indigo-300">#090d16</code>, <code className="text-indigo-300">#0c111e</code>), rich luminous ambient gradients (indigo, violet, cyan, emerald), glowing accent borders, and nearest-neighbor pixelated rendering for 32×32 CIFAR images.
        </p>
      </section>
    </div>
  );
}

