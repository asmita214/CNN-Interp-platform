import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Layers,
  Cpu,
  Database,
  ArrowRight,
  Sliders,
  Eye,
  Activity,
  Compass,
} from 'lucide-react';
import { useAtlas } from '../hooks/useAtlas';
import { api } from '../api';
import { PLATFORM_STATS, getClusterColor, clusterLabel } from '../lib/clusters';
import { AtlasScatter } from '../components/AtlasScatter';
import { FeatureImage } from '../components/FeatureImage';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatCard,
} from '../components/ui';

function pickNotable(atlas) {
  const high = atlas.filter((f) => f.confidence === 'high');
  const byCluster = new Map();
  for (const f of high) {
    const key = f.cluster === -1 ? `solo-${f.feature_id}` : f.cluster;
    if (!byCluster.has(key)) byCluster.set(key, f);
  }
  const list = [...byCluster.values()];
  if (list.length <= 6) return list;
  const step = list.length / 6;
  return Array.from({ length: 6 }, (_, i) => list[Math.floor(i * step)]);
}

function NotableCard({ feature }) {
  const [thumb, setThumb] = useState(null);
  const clusterColor = getClusterColor(feature.cluster);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/feature/${feature.feature_id}`)
      .then((res) => {
        if (!cancelled) setThumb(res.data.top_images?.[0] || null);
      })
      .catch(() => {
        if (!cancelled) setThumb(null);
      });
    return () => {
      cancelled = true;
    };
  }, [feature.feature_id]);

  return (
    <Link
      to={`/feature/${feature.feature_id}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-950/40"
    >
      <div>
        <div className="overflow-hidden rounded-xl bg-black/60 ring-1 ring-white/10 group-hover:ring-indigo-500/30 transition-all">
          {thumb ? (
            <FeatureImage imageIdx={thumb.image_idx} activation={thumb.activation} />
          ) : (
            <div className="aspect-square rounded-xl bg-slate-900 animate-pulse" />
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-md">
            #{feature.feature_id}
          </span>
          <span
            className="h-2.5 w-2.5 rounded-full ring-2 ring-white/20 shadow-xs"
            style={{ background: clusterColor }}
          />
        </div>

        <h3 className="mt-2 text-xs font-bold capitalize text-slate-100 group-hover:text-white truncate">
          {feature.label}
        </h3>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-[11px] text-slate-400">
        <span className="truncate font-medium">{clusterLabel(feature.cluster)}</span>
        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 font-mono text-[10px] font-bold text-emerald-300 shrink-0">
          94%
        </span>
      </div>
    </Link>
  );
}

export default function Overview() {
  const { atlas, loading, error } = useAtlas();
  const notable = useMemo(() => pickNotable(atlas), [atlas]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Dashboard Overview"
        description="Sparse Autoencoder (SAE) mechanistic decomposition of CIFAR-10 ResNet internal representations across 4,096 latent directions."
      />

      {error && <ErrorState message={error} />}

      {/* Colorful Stats Cards Row */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total Features"
          value={PLATFORM_STATS.total}
          hint="Overcomplete SAE dictionary"
          icon={Database}
          badge="4,096d"
          color="indigo"
        />
        <StatCard
          label="Alive Features"
          value={PLATFORM_STATS.alive}
          hint="Active interpretable features"
          icon={Sparkles}
          badge="89.1%"
          color="emerald"
        />
        <StatCard
          label="Dead Neurons"
          value={PLATFORM_STATS.dead}
          hint="Zero test activations"
          icon={Activity}
          badge="10.9%"
          color="rose"
        />
        <StatCard
          label="HDBSCAN Clusters"
          value={PLATFORM_STATS.clusters}
          hint="Semantic density groupings"
          icon={Layers}
          badge="198 Groups"
          color="amber"
        />
        <StatCard
          label="Unclustered"
          value={PLATFORM_STATS.unclustered}
          hint="Unique solo features (-1)"
          icon={Eye}
          badge="31.4%"
          color="cyan"
        />
      </div>

      {/* Feature Atlas Preview & Roadmap Column */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        {/* Feature Atlas 2D Scatter Preview Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-5.5 backdrop-blur-xl shadow-xl shadow-black/20">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Compass className="h-3.5 w-3.5" />
                </div>
                <h2 className="text-sm font-extrabold text-white">Feature Atlas (2D UMAP Manifold)</h2>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                2D manifold projection of 3,648 alive features colored by HDBSCAN semantic cluster.
              </p>
            </div>
            <Link
              to="/atlas"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/40"
            >
              <span>Explore Atlas</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <LoadingState label="Rendering atlas manifold preview…" />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#070b14] shadow-inner">
              <AtlasScatter data={atlas} height={350} interactive={true} />
            </div>
          )}
        </div>

        {/* Roadmap / Coming Soon Preview Box */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-5.5 backdrop-blur-xl shadow-xl shadow-black/20">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Cpu className="h-3.5 w-3.5" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Roadmap Modules</h2>
              </div>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 font-mono text-[9px] font-bold text-purple-300">
                v2.0 Beta
              </span>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Mechanistic interpretability tools in active research development:
            </p>

            <div className="mt-4 space-y-3">
              {/* Activation Maximization Preview */}
              <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-3.5 transition-all hover:border-purple-500/40">
                <div className="flex items-center justify-between text-xs font-bold text-purple-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    <span>Activation Maximization</span>
                  </div>
                  <span className="font-mono text-[9px] font-semibold text-purple-300 bg-purple-500/20 px-1.5 py-0.2 rounded border border-purple-500/30">
                    Planned
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  Synthesize high-fidelity canonical feature stimuli via gradient ascent in pixel space.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-800 pt-3">
            <Link
              to="/dataset"
              className="flex items-center justify-between text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-colors"
            >
              <span>View Technical Specifications</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Notable Features Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Curated Interpretable Features
            </h2>
            <p className="text-xs text-slate-400">
              High-confidence features auto-labeled by Gemini Vision from highest firing test activations.
            </p>
          </div>
          <Link
            to="/atlas?confidence=high"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            <span>View all high-confidence</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {loading ? (
          <LoadingState label="Loading curated features…" />
        ) : notable.length === 0 ? (
          <EmptyState title="No high-confidence features found" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {notable.map((f) => (
              <NotableCard key={f.feature_id} feature={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

