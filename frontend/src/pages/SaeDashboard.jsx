import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Sparkles, Activity, CheckCircle2, ArrowRight } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { useAtlas } from '../hooks/useAtlas';
import { PLATFORM_STATS, topClustersBySize } from '../lib/clusters';
import { PageHeader, StatCard, LoadingState, ErrorState } from '../components/ui';

export default function SaeDashboard() {
  const { atlas, loading, error } = useAtlas();

  const topClusters = useMemo(() => {
    return topClustersBySize(atlas, 10);
  }, [atlas]);

  const deadVsAliveData = [
    { name: 'Alive Features', value: PLATFORM_STATS.alive, color: '#6366f1' },
    { name: 'Dead Neurons', value: PLATFORM_STATS.dead, color: '#334155' },
  ];

  const confidenceData = useMemo(() => {
    const high = atlas.filter((f) => f.confidence === 'high').length;
    const medium = atlas.filter((f) => f.confidence === 'medium').length;
    const low = atlas.filter((f) => f.confidence === 'low').length;
    return [
      { name: 'High Confidence', value: high, color: '#10b981' },
      { name: 'Medium Confidence', value: medium, color: '#f59e0b' },
      { name: 'Low Confidence', value: low, color: '#f43f5e' },
    ];
  }, [atlas]);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Sparse Autoencoder (SAE) Dashboard"
        description="Comprehensive metrics on dictionary sparsity, dead neuron ratio, cluster distributions, and feature confidence."
      />

      {error && <ErrorState message={error} />}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Dictionary Expansion"
          value="8× (4,096d)"
          hint="From 512d CNN activations"
          icon={Cpu}
          color="indigo"
        />
        <StatCard
          label="Sparsity Constraint"
          value="TopK = 256"
          hint="93.75% active vector sparsity"
          icon={Activity}
          badge="L0 Norm"
          color="emerald"
        />
        <StatCard
          label="Alive Feature Ratio"
          value="89.06%"
          hint="3,648 / 4,096 candidate features"
          icon={Sparkles}
          color="purple"
        />
        <StatCard
          label="Reconstruction MSE"
          value="0.018"
          hint="Mean squared error on test set"
          icon={CheckCircle2}
          color="cyan"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Alive vs Dead Distribution */}
        <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-6 backdrop-blur-xl shadow-xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              Neuron Vitality Distribution
            </h3>
            <span className="font-mono text-xs text-indigo-300 font-bold bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-lg">
              4,096 total
            </span>
          </div>

          <div className="mt-4 flex flex-col items-center justify-center sm:flex-row sm:gap-8">
            <div className="h-44 w-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deadVsAliveData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                  >
                    {deadVsAliveData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-3 sm:mt-0">
              <div className="flex items-center gap-3">
                <span className="h-3.5 w-3.5 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/40" />
                <div>
                  <div className="text-xs font-bold text-slate-100">Alive Features (3,648)</div>
                  <div className="text-[11px] text-slate-400">Meaningfully fire on CIFAR images (89.1%)</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3.5 w-3.5 rounded-full bg-slate-700" />
                <div>
                  <div className="text-xs font-bold text-slate-300">Dead Neurons (448)</div>
                  <div className="text-[11px] text-slate-400">Zero activation on all test data (10.9%)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confidence Breakdown */}
        <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-6 backdrop-blur-xl shadow-xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Gemini Vision Label Confidence
            </h3>
            <span className="font-mono text-xs text-emerald-300 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
              3,648 labeled
            </span>
          </div>

          {loading ? (
            <LoadingState label="Computing label distributions…" />
          ) : (
            <div className="mt-5 space-y-4">
              {confidenceData.map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">{item.name}</span>
                    <span className="font-mono font-bold text-slate-100">
                      {item.value.toLocaleString()} (
                      {((item.value / (atlas.length || 1)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/90 shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-500 shadow-sm"
                      style={{
                        width: `${(item.value / (atlas.length || 1)) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Largest Clusters Breakdown Bar Chart */}
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-6 backdrop-blur-xl shadow-xl shadow-black/20">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              Top 10 Largest Feature Clusters
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">HDBSCAN groupings by number of learned features</p>
          </div>
          <Link
            to="/clusters"
            className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View all 198 clusters</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <LoadingState label="Loading cluster statistics…" />
        ) : (
          <div className="mt-5 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topClusters.map((c) => ({
                  name: c.samples[0] || `C${c.id}`,
                  count: c.count,
                  id: c.id,
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  angle={-20}
                  textAnchor="end"
                  tickLine={false}
                />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-900/95 px-3 py-1.5 text-xs text-slate-100 shadow-xl">
                        <div className="font-bold capitalize text-indigo-300">{d.name}</div>
                        <div className="font-mono text-slate-400">Cluster #{d.id} · {d.count} features</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {topClusters.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(${240 + index * 10}, 80%, 60%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

