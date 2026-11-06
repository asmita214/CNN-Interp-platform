import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  X,
  Sparkles,
  Compass,
} from 'lucide-react';
import { useAtlas } from '../hooks/useAtlas';
import { api } from '../api';
import {
  clusterLabel,
  getClusterColor,
  topClustersBySize,
  allClusters,
} from '../lib/clusters';
import { AtlasScatter } from '../components/AtlasScatter';
import { FeatureImage } from '../components/FeatureImage';
import {
  ConfidenceBadge,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '../components/ui';

export default function FeatureAtlas() {
  const { atlas, loading, error } = useAtlas();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [confidence, setConfidence] = useState(searchParams.get('confidence') || 'all');
  const [colorBy, setColorBy] = useState('cluster');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const clusterParam = searchParams.get('cluster');
  const clusterFilter = clusterParam === null ? null : Number(clusterParam);

  const [selectedId, setSelectedId] = useState(null);
  const [featureDetail, setFeatureDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Top clusters for right-side legend
  const legend = useMemo(() => topClustersBySize(atlas, 8), [atlas]);
  const allClusterList = useMemo(() => allClusters(atlas), [atlas]);

  // Filter features
  const filtered = useMemo(() => {
    return atlas.filter((f) => {
      if (searchTerm && !f.label.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (confidence !== 'all' && f.confidence !== confidence) return false;
      if (clusterFilter !== null && !Number.isNaN(clusterFilter) && f.cluster !== clusterFilter) {
        return false;
      }
      return true;
    });
  }, [atlas, searchTerm, confidence, clusterFilter]);

  // Synchronize URL parameters
  useEffect(() => {
    const next = {};
    if (searchTerm) next.q = searchTerm;
    if (confidence !== 'all') next.confidence = confidence;
    if (clusterFilter !== null && !Number.isNaN(clusterFilter)) next.cluster = String(clusterFilter);
    setSearchParams(next, { replace: true });
  }, [searchTerm, confidence, clusterFilter, setSearchParams]);

  // When a scatter point is clicked
  const handlePointClick = (point) => {
    const id = point?.feature_id ?? point?.payload?.feature_id;
    if (id == null) return;
    setSelectedId(id);
    setDetailLoading(true);
    api
      .get(`/feature/${id}`)
      .then((res) => setFeatureDetail(res.data))
      .catch(() => setFeatureDetail(null))
      .finally(() => setDetailLoading(false));
  };

  const handleClusterSelect = (cId) => {
    if (cId === 'all') {
      const next = new URLSearchParams(searchParams);
      next.delete('cluster');
      setSearchParams(next);
    } else {
      setSearchParams({ ...Object.fromEntries(searchParams), cluster: String(cId) });
    }
  };

  const clearCluster = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('cluster');
    setSearchParams(next);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <PageHeader
        title="2D Feature Atlas"
        description="Interactive 2D UMAP projection of 3,648 alive Sparse Autoencoder features colored by HDBSCAN semantic density clusters."
      />

      {error && <ErrorState message={error} />}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/90 p-3.5 backdrop-blur-xl shadow-lg shadow-black/20">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search features (e.g. horse, wheel)…"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2 pl-9 pr-7 text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Color by Select */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
            <span className="text-indigo-400 text-[11px] font-semibold">Color:</span>
            <select
              value={colorBy}
              onChange={(e) => setColorBy(e.target.value)}
              className="bg-transparent font-medium text-slate-100 outline-none cursor-pointer text-xs"
            >
              <option value="cluster" className="bg-[#0f172a] text-slate-100">Cluster</option>
              <option value="confidence" className="bg-[#0f172a] text-slate-100">Confidence</option>
            </select>
          </div>

          {/* Filter by Cluster Select */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
            <span className="text-indigo-400 text-[11px] font-semibold">Cluster:</span>
            <select
              value={clusterFilter === null ? 'all' : String(clusterFilter)}
              onChange={(e) => handleClusterSelect(e.target.value)}
              className="max-w-[150px] truncate bg-transparent font-medium text-slate-100 outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-[#0f172a] text-slate-100">All Clusters</option>
              <option value="-1" className="bg-[#0f172a] text-slate-100">Unclustered (-1)</option>
              {allClusterList
                .filter((c) => c.id !== -1)
                .slice(0, 50)
                .map((c) => (
                  <option key={c.id} value={String(c.id)} className="bg-[#0f172a] text-slate-100">
                    Cluster {c.id} ({c.count})
                  </option>
                ))}
            </select>
          </div>

          {/* Confidence Filter Tabs */}
          <div className="flex rounded-xl border border-slate-800 bg-slate-950/60 p-1">
            {['all', 'high', 'medium', 'low'].map((c) => {
              const active = confidence === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setConfidence(c)}
                  className={`rounded-lg px-3 py-1 text-[11px] font-bold capitalize transition-all ${
                    active
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* Advanced Filters Button */}
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
              advancedOpen
                ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-200'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400" />
            <span>Filters</span>
          </button>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-950/50 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-500/30" />
          <span>
            <strong className="text-white font-bold">{filtered.length.toLocaleString()}</strong> /{' '}
            <span className="text-slate-400">{atlas.length.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Advanced Filters Drawer (Collapsible) */}
      {advancedOpen && (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 text-xs backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="font-bold text-slate-200">Active Scope & Filters</span>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setConfidence('all');
                clearCluster();
              }}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Reset Filters
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div>
              <span className="text-slate-400">Selected Cluster: </span>
              {clusterFilter !== null ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-1 text-indigo-200 font-semibold">
                  {clusterLabel(clusterFilter)}
                  <button type="button" onClick={clearCluster} className="hover:text-white ml-1">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                <span className="text-slate-300 font-medium">All Clusters (198)</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Visual Content */}
      {loading ? (
        <LoadingState label="Indexing 3,648 alive features with UMAP…" />
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
          {/* Scatter Chart Canvas */}
          <div className="relative rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-4 backdrop-blur-xl shadow-xl shadow-black/20">
            {filtered.length === 0 ? (
              <EmptyState
                title="No features match your filter criteria"
                body="Try resetting your search query or cluster filter."
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setConfidence('all');
                      clearCluster();
                    }}
                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/30 hover:from-indigo-500 hover:to-purple-500"
                  >
                    Clear Filters
                  </button>
                }
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-800/90 bg-[#070b14] shadow-inner">
                <AtlasScatter
                  data={filtered}
                  selectedId={selectedId}
                  onPointClick={handlePointClick}
                  height={660}
                  colorBy={colorBy}
                  highlightCluster={clusterFilter}
                />
              </div>
            )}
          </div>

          {/* Right Panel: Selected Feature Inspector OR Cluster Legend */}
          <aside className="flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-5 backdrop-blur-xl shadow-xl shadow-black/20">
            {detailLoading ? (
              <LoadingState label="Loading feature profile…" />
            ) : featureDetail ? (
              /* Selected Feature Quick Inspector */
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                      Feature #{featureDetail.feature_id}
                    </span>
                    <h2 className="mt-2 text-base font-extrabold capitalize text-white">
                      {featureDetail.label}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(null);
                      setFeatureDetail(null);
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <ConfidenceBadge value={featureDetail.confidence} showPercent />
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-200">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: getClusterColor(featureDetail.cluster) }}
                    />
                    <span className="font-medium">{clusterLabel(featureDetail.cluster)}</span>
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      Top Activating Images
                    </span>
                    <span className="font-mono text-[10px] text-indigo-300">
                      {featureDetail.top_images?.length || 0} images
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Highest firing test images for this SAE neuron.
                  </p>

                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {featureDetail.top_images?.slice(0, 8).map((img, idx) => (
                      <FeatureImage
                        key={`${img.image_idx}-${img.position}`}
                        imageIdx={img.image_idx}
                        activation={img.activation}
                        rank={idx + 1}
                        showRank
                      />
                    ))}
                  </div>
                </div>

                <Link
                  to={`/feature/${featureDetail.feature_id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/30 transition-all hover:from-indigo-500 hover:to-purple-500"
                >
                  <span>Open Full Feature Profile</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              /* Cluster Legend */
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
                    <Layers className="h-4 w-4 text-indigo-400" />
                    <span>Cluster Legend</span>
                  </div>
                  <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                    198 total
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Top clusters by feature density. Select to filter manifold.
                </p>

                <div className="mt-3.5 space-y-1.5">
                  {legend.map((c) => {
                    const isSelected = clusterFilter === c.id;
                    const sampleText = c.samples.slice(0, 2).join(', ');
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleClusterSelect(isSelected ? 'all' : c.id)}
                        className={`group flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-500/50 bg-indigo-500/20 text-white shadow-md shadow-indigo-500/20'
                            : 'border-slate-800/60 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/20"
                            style={{ background: getClusterColor(c.id) }}
                          />
                          <div className="truncate">
                            <div className="text-xs font-bold capitalize text-slate-200 group-hover:text-white">
                              {c.samples[0] || `Cluster ${c.id}`}
                            </div>
                            <div className="truncate text-[10px] text-slate-400">
                              {sampleText || `HDBSCAN #${c.id}`}
                            </div>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-semibold text-slate-400 group-hover:text-indigo-300">
                          {c.count}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handleClusterSelect(clusterFilter === -1 ? 'all' : -1)}
                    className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all ${
                      clusterFilter === -1
                        ? 'border-indigo-500/50 bg-indigo-500/20 text-white shadow-md shadow-indigo-500/20'
                        : 'border-slate-800/60 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-600 ring-2 ring-white/10" />
                      <div>
                        <div className="text-xs font-bold text-slate-300">Unclustered / Noise</div>
                        <div className="text-[10px] text-slate-400">Unique solo features</div>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-slate-400">1,145</span>
                  </button>
                </div>

                <Link
                  to="/clusters"
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/70 py-2.5 text-xs font-bold text-indigo-300 transition-all hover:border-indigo-500/40 hover:bg-slate-800 hover:text-white"
                >
                  <span>View All 198 Clusters</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

