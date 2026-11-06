import { Database, Cpu, Sparkles, Layers, CheckCircle2 } from 'lucide-react';
import { PageHeader, StatCard } from '../components/ui';

const CIFAR_CLASSES = [
  'airplane', 'automobile', 'bird', 'cat', 'deer',
  'dog', 'frog', 'horse', 'ship', 'truck'
];

const SPECS = [
  {
    title: 'CIFAR-10 Benchmark Dataset',
    icon: Database,
    color: 'indigo',
    description: 'Standard computer vision dataset of 60,000 tiny natural images across 10 balanced semantic classes.',
    rows: [
      ['Dataset Name', 'CIFAR-10 (Canadian Institute for Advanced Research)'],
      ['Total Image Count', '60,000 images (50,000 train / 10,000 test)'],
      ['Native Resolution', '32 × 32 pixels, 3 color channels (RGB)'],
      ['Class Count', '10 mutually exclusive classes (6,000 images per class)'],
      ['Evaluation Split', 'Pre-extracted activations evaluated on 10K test set'],
    ],
  },
  {
    title: 'Target CNN Classifier (ResNet)',
    icon: Cpu,
    color: 'emerald',
    description: 'Deep convolutional neural network trained on CIFAR-10 reaching near state-of-the-art accuracy.',
    rows: [
      ['Model Architecture', 'ResNet with residual skip connections'],
      ['Parameter Count', '11.17 Million learnable parameters'],
      ['Top-1 Test Accuracy', '94.83% on CIFAR-10 test set'],
      ['Interpreted Layer', 'Penultimate convolutional feature map layer'],
      ['Activation Dimensions', '512-dimensional hidden representations'],
    ],
  },
  {
    title: 'Sparse Autoencoder (SAE) Dictionary',
    icon: Sparkles,
    color: 'purple',
    description: 'Overcomplete dictionary learned to decompose polysemantic neural activations into monosemantic feature directions.',
    rows: [
      ['Dictionary Dimension', '4,096 candidate feature vectors (8× overcomplete expansion)'],
      ['Sparsity Constraint', 'TopK = 256 active features per sample (93.75% sparsity)'],
      ['Training Corpus', '800,000 internal activation vectors sampled across training pass'],
      ['Active Interpretable Features', '3,648 alive features (89.1%)'],
      ['Dead / Inactive Neurons', '448 dead features (10.9%)'],
      ['Clustering Engine', 'HDBSCAN on SAE latent space (198 semantic clusters)'],
      ['2D Projection', 'UMAP non-linear manifold dimensionality reduction'],
    ],
  },
];

export default function Dataset() {
  return (
    <div className="space-y-7">
      <PageHeader
        title="Dataset & Model Specifications"
        description="Detailed architectural specifications for the CIFAR-10 dataset, the ResNet convolutional neural network, and the 4,096-dimensional Sparse Autoencoder."
      />

      {/* Top Stat Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Dataset Images"
          value="60,000"
          hint="50K train + 10K test"
          icon={Database}
          color="indigo"
        />
        <StatCard
          label="Model Accuracy"
          value="94.83%"
          hint="ResNet on CIFAR-10"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          label="SAE Dimensions"
          value="4,096"
          hint="Overcomplete TopK=256"
          icon={Sparkles}
          color="purple"
        />
        <StatCard
          label="Alive Features"
          value="3,648"
          hint="Auto-labeled by Gemini"
          icon={Layers}
          color="cyan"
        />
      </div>

      {/* CIFAR-10 Classes Chips */}
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-5.5 backdrop-blur-xl shadow-xl shadow-black/20">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          CIFAR-10 Semantic Classes
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          The 10 object classes represented in the training and evaluation sets:
        </p>
        <div className="mt-3.5 flex flex-wrap gap-2.5">
          {CIFAR_CLASSES.map((cls, i) => (
            <span
              key={cls}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-1.5 text-xs font-semibold capitalize text-slate-200 transition-all hover:border-indigo-500/40 hover:bg-slate-900"
            >
              <span className="font-mono text-[10px] text-indigo-400 font-bold">#{i}</span>
              <span>{cls}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Specification Blocks */}
      <div className="space-y-5">
        {SPECS.map((spec) => {
          const Icon = spec.icon;
          return (
            <section
              key={spec.title}
              id={spec.title.toLowerCase().includes('sae') ? 'sae' : undefined}
              className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-6.5 backdrop-blur-xl shadow-xl shadow-black/20"
            >
              <div className="flex items-start gap-3.5 border-b border-slate-800 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-500/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">{spec.title}</h2>
                  <p className="mt-0.5 text-xs text-slate-400">{spec.description}</p>
                </div>
              </div>

              <dl className="mt-4 divide-y divide-slate-800/80">
                {spec.rows.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-1 gap-1 py-3 text-xs sm:grid-cols-[260px_1fr] sm:gap-4"
                  >
                    <dt className="font-semibold text-slate-400">{label}</dt>
                    <dd className="font-mono font-bold text-slate-200">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}
      </div>

      {/* Auto-Labeling Pipeline Note */}
      <section className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-6.5 backdrop-blur-xl shadow-xl shadow-black/20">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
          Auto-Labeling Pipeline with Gemini Vision
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          All 3,648 alive SAE features were automatically annotated by prompting Gemini Vision with the top activating 32×32 CIFAR-10 test set images for each feature direction. Gemini generated descriptive monosemantic labels, provided high / medium / low confidence ratings, and grouped features into HDBSCAN clusters. The 2D coordinates were extracted via UMAP projection to allow visual manifold exploration.
        </p>
      </section>
    </div>
  );
}

