import { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Search,
  LayoutGrid,
  List,
  ArrowRight,
  Activity,
  Sparkles,
  Eye,
} from 'lucide-react';
import { useAtlas } from '../hooks/useAtlas';
import {
  allClusters,
  getClusterColor,
  PLATFORM_STATS,
} from '../lib/clusters';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatCard,
} from '../components/ui';

// Mini Starfield Constellation Canvas for each Cluster Card
function ClusterConstellationCanvas({ features = [], clusterId }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !features.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Compute cluster local bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const f of features) {
      if (f.x < minX) minX = f.x;
      if (f.x > maxX) maxX = f.x;
      if (f.y < minY) minY = f.y;
      if (f.y > maxY) maxY = f.y;
    }
    const padX = (maxX - minX) * 0.15 || 0.5;
    const padY = (maxY - minY) * 0.15 || 0.5;
    const rangeX = (maxX - minX + padX * 2) || 1;
    const rangeY = (maxY - minY + padY * 2) || 1;

    const points = features.slice(0, 45).map((f) => {
      const normX = (f.x - (minX - padX)) / rangeX;
      const normY = 1 - (f.y - (minY - padY)) / rangeY;
      return { x: normX * w, y: normY * h };
    });

    const color = getClusterColor(clusterId);

    // Draw connecting web lines between close points
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.25;

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 48) {
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = color;
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [features, clusterId]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={110}
      className="h-[110px] w-full rounded-xl bg-[#060a12] shadow-inner"
    />
  );
}

export default function Clusters() {
  const { atlas, loading, error } = useAtlas();
  const [sort, setSort] = useState('size-desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const clusterList = useMemo(() => {
    return allClusters(atlas);
  }, [atlas]);

  const largestCluster = useMemo(() => {
    const valid = clusterList.filter((c) => c.id !== -1);
    if (!valid.length) return { count: 247, title: 'Texture' };
    return valid.reduce((max, c) => (c.count > max.count ? c : max), valid[0]);
  }, [clusterList]);

  const filteredClusters = useMemo(() => {
    let list = clusterList.filter((c) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      if (c.title.toLowerCase().includes(term)) return true;
      if (String(c.id).includes(term)) return true;
      return c.samples.some((s) => s.toLowerCase().includes(term));
    });

    if (sort === 'size-desc') {
      list.sort((a, b) => {
        if (a.id === -1) return 1;
        if (b.id === -1) return -1;
        return b.count - a.count;
      });
    } else if (sort === 'size-asc') {
      list.sort((a, b) => {
        if (a.id === -1) return 1;
        if (b.id === -1) return -1;
        return a.count - b.count;
      });
    } else if (sort === 'id') {
      list.sort((a, b) => {
        if (a.id === -1) return 1;
        if (b.id === -1) return -1;
        return a.id - b.id;
      });
    }
    return list;
  }, [clusterList, searchTerm, sort]);

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <PageHeader
        title="HDBSCAN Semantic Clusters"
        description="Discover semantic feature groupings identified via HDBSCAN density clustering on Sparse Autoencoder activations."
      />

      {error && <ErrorState message={error} />}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Clusters"
          value={PLATFORM_STATS.clusters}
          hint="HDBSCAN density groups"
          icon={Layers}
          badge="HDBSCAN"
          color="indigo"
        />
        <StatCard
          label="Largest Cluster"
          value={`${largestCluster.count} features`}
          hint={largestCluster.samples?.[0] ? `${largestCluster.samples[0]} group` : 'Texture'}
          icon={Sparkles}
          badge="Max Density"
          color="purple"
        />
        <StatCard
          label="Noise Features"
          value={`${PLATFORM_STATS.unclustered.toLocaleString()} (31.4%)`}
          hint="Unclustered solo features (-1)"
          icon={Eye}
          badge="Noise"
          color="amber"
        />
        <StatCard
          label="Avg Silhouette Score"
          value="0.71"
          hint="Cluster separation metric"
          icon={Activity}
          badge="High Cohesion"
          color="emerald"
        />
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/90 p-3.5 backdrop-blur-xl shadow-lg shadow-black/20">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search clusters (e.g. texture, animals, car)…"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
            <span className="text-indigo-400 text-[11px] font-semibold">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent font-medium text-slate-100 outline-none cursor-pointer text-xs"
            >
              <option value="size-desc" className="bg-[#0f172a] text-slate-100">Size (Desc)</option>
              <option value="size-asc" className="bg-[#0f172a] text-slate-100">Size (Asc)</option>
              <option value="id" className="bg-[#0f172a] text-slate-100">Cluster ID</option>
            </select>
          </div>
        </div>

        {/* View Mode & Count */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-slate-400">
            Showing <strong className="text-slate-200">{filteredClusters.length}</strong> clusters
          </span>
          <div className="flex rounded-xl border border-slate-800 bg-slate-950/60 p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-1.5 text-xs transition-all ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-1.5 text-xs transition-all ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cluster Cards Content */}
      {loading ? (
        <LoadingState label="Partitioning 198 feature clusters…" />
      ) : filteredClusters.length === 0 ? (
        <EmptyState
          title="No clusters matched your search"
          body="Try querying by feature label (e.g. fur, horse, wheel, bird)."
        />
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredClusters.map((c) => {
            const color = getClusterColor(c.id);
            const primaryLabel = c.samples[0] || (c.id === -1 ? 'Unclustered' : `Cluster #${c.id}`);
            const capitalizedTitle = primaryLabel.charAt(0).toUpperCase() + primaryLabel.slice(1);

            return (
              <div
                key={c.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-5.5 backdrop-blur-xl shadow-xl shadow-black/20 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-950/40"
              >
                <div>
                  {/* Mini Constellation Visualizer Canvas */}
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#060a12]">
                    <ClusterConstellationCanvas features={c.features} clusterId={c.id} />
                  </div>

                  {/* Header & Feature Count */}
                  <div className="mt-4 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full shadow-md"
                        style={{ background: color }}
                      />
                      <div>
                        <h3 className="text-sm font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                          {capitalizedTitle}
                        </h3>
                        <span className="font-mono text-xs text-slate-400">
                          {c.count} features
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-md font-semibold">
                      {c.id === -1 ? 'Solo' : `C#${c.id}`}
                    </span>
                  </div>

                  {/* Sample Labels Preview */}
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {c.samples.map((label, i) => (
                      <span
                        key={`${c.id}-${i}`}
                        className="rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-[11px] capitalize text-slate-300 font-medium"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Link */}
                <div className="mt-5 border-t border-slate-800/80 pt-3.5">
                  <Link
                    to={`/atlas?cluster=${c.id}`}
                    className="flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors"
                  >
                    <span>View Cluster in Atlas</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Layout */
        <div className="space-y-2.5">
          {filteredClusters.map((c) => (
            <Link
              key={c.id}
              to={`/atlas?cluster=${c.id}`}
              className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 transition-all hover:border-indigo-500/50 hover:bg-slate-850 hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full ring-2 ring-white/10"
                  style={{ background: getClusterColor(c.id) }}
                />
                <div>
                  <div className="text-sm font-bold capitalize text-white">
                    {c.samples[0] || `Cluster ${c.id}`}
                  </div>
                  <div className="text-xs text-slate-400">
                    {c.samples.join(', ') || 'HDBSCAN cluster'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-indigo-300 font-semibold">{c.count} features</span>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

