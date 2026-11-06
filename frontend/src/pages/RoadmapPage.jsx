import { Link, useLocation } from 'react-router-dom';
import { Sliders, Sparkles, BarChart3, ArrowLeft, Clock } from 'lucide-react';
import { PageHeader } from '../components/ui';

export default function RoadmapPage({ type = 'steering' }) {
  const location = useLocation();
  const isActMax = location.pathname.includes('activation-maximization') || type === 'activation-maximization';
  const isPerf = location.pathname.includes('performance') || type === 'performance';

  const config = isActMax
    ? {
        title: 'Activation Maximization',
        subtitle: 'Synthesize feature-maximal visual stimuli via gradient ascent in pixel space.',
        icon: Sparkles,
        badge: 'Roadmap Target: v2.1',
        description:
          'Activation maximization computes the input image x that maximizes the activation of a specific SAE feature direction f_i(x) using regularized gradient ascent. This synthesizes canonical receptive field patterns.',
        specs: [
          ['Optimization Algorithm', 'Adam / SGD with Total Variation (TV) regularizer'],
          ['Target Steps', '512 to 1024 optimization steps'],
          ['Transformations', 'Jitter (22%), Random Scaling, Gaussian Blur smoothing'],
          ['Backend Requirement', 'Torch autograd hook on input tensor (FastAPI async worker)'],
        ],
      }
    : isPerf
    ? {
        title: 'Model Performance & Circuit Analysis',
        subtitle: 'Classification metrics, loss distributions, and causal feature ablation.',
        icon: BarChart3,
        badge: 'Roadmap Target: v2.2',
        description:
          'Quantitative evaluation of the ResNet classifier on CIFAR-10, analyzing per-class confusion matrices, top-1/top-5 accuracy breakdowns, and causal knockout effects of SAE features.',
        specs: [
          ['CIFAR-10 Test Accuracy', '94.83% (Top-1) / 99.64% (Top-5)'],
          ['Total Parameters', '11.17 Million parameters'],
          ['Downstream Loss Metric', 'Cross-Entropy with CE Loss Reconstruction Δ < 0.05'],
          ['Backend Requirement', 'Full validation batch inference pipeline'],
        ],
      }
    : {
        title: 'Feature Steering Playground',
        subtitle: 'Interactively clamp and amplify SAE feature directions during inference.',
        icon: Sliders,
        badge: 'Roadmap Target: v2.0',
        description:
          'Activation steering alters the internal representations of the CNN by adding or subtracting SAE feature vectors: h\' = h + α · v_i. This enables testing causal hypotheses regarding what concept a feature controls.',
        specs: [
          ['Steering Mechanism', 'Hooked forward pass with linear feature injection'],
          ['Intensity Coefficient (α)', 'Continuous range [-5.0, +5.0]'],
          ['Real-Time Feedback', 'Prediction delta & softmax probability shift'],
          ['Backend Requirement', 'Live model steering endpoint (POST /steer)'],
        ],
      };

  const Icon = config.icon;

  return (
    <div className="space-y-7">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Overview</span>
        </Link>
        <span>&gt;</span>
        <span className="font-mono text-slate-200 font-bold">{config.title}</span>
      </div>

      <PageHeader
        title={config.title}
        description={config.subtitle}
        badge={
          <span className="flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-1 text-xs font-bold text-indigo-300 shadow-sm shadow-indigo-500/20">
            <Clock className="h-3.5 w-3.5" />
            <span>{config.badge}</span>
          </span>
        }
      />

      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-8 backdrop-blur-xl shadow-2xl shadow-black/30">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/25">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-extrabold text-white">Module In Active Development</h2>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                Backend Endpoint Pending
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300 max-w-2xl">
              {config.description}
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pb-2 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Technical Architecture & Interface Blueprint
          </h3>
          <dl className="mt-4 divide-y divide-slate-800/80">
            {config.specs.map(([k, v]) => (
              <div key={k} className="grid grid-cols-1 gap-1 py-3 text-xs sm:grid-cols-[240px_1fr] sm:gap-4">
                <dt className="font-semibold text-slate-400">{k}</dt>
                <dd className="font-mono font-bold text-slate-200">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-slate-800 pt-6">
          <Link
            to="/atlas"
            className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-4.5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/30 transition-all hover:from-indigo-500 hover:to-purple-500"
          >
            Explore 3,648 Alive Features in Atlas
          </Link>
          <Link
            to="/dataset"
            className="rounded-xl border border-slate-700 bg-slate-900/80 px-4.5 py-2.5 text-xs font-bold text-slate-200 transition-all hover:border-indigo-500/40 hover:text-white hover:bg-slate-850"
          >
            View Model & SAE Specifications
          </Link>
        </div>
      </div>
    </div>
  );
}

