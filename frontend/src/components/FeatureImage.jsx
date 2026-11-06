import { useState } from 'react';
import { imageUrl } from '../api';

export function FeatureImage({ imageIdx, activation, rank, className = '', showRank = false }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#0c0c10] transition-all duration-150 hover:border-white/25 hover:shadow-md ${className}`}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-zinc-900" />
      )}

      {error ? (
        <div className="flex aspect-square w-full items-center justify-center bg-zinc-900 text-[10px] text-zinc-600">
          N/A
        </div>
      ) : (
        <img
          src={imageUrl(imageIdx)}
          alt={`CIFAR image idx ${imageIdx}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`aspect-square w-full object-cover transition-opacity duration-150 [image-rendering:pixelated] ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {showRank && rank != null && (
        <div className="absolute left-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded bg-black/80 px-1 font-mono text-[9px] font-medium text-zinc-300">
          #{rank}
        </div>
      )}

      {activation != null && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-1.5 pb-1 pt-2.5">
          <div className="flex items-center justify-between font-mono text-[9px]">
            <span className="text-zinc-500">act</span>
            <span className="font-semibold text-zinc-200">{Number(activation).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
