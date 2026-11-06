export function getClusterColor(cluster) {
  if (cluster === -1 || cluster === null || cluster === undefined) {
    return '#52525b';
  }
  // Golden ratio hue distribution for vibrant distinct cluster colors
  const goldenRatio = 0.618033988749895;
  const hue = Math.floor(((cluster * goldenRatio) % 1) * 360);
  return `hsl(${hue}, 80%, 60%)`;
}

export function getClusterRgb(cluster) {
  if (cluster === -1 || cluster === null || cluster === undefined) {
    return '113, 113, 122';
  }
  const goldenRatio = 0.618033988749895;
  const hue = ((cluster * goldenRatio) % 1) * 360;
  const s = 0.8;
  const l = 0.6;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (hue < 60) { r = c; g = x; b = 0; }
  else if (hue < 120) { r = x; g = c; b = 0; }
  else if (hue < 180) { r = 0; g = c; b = x; }
  else if (hue < 240) { r = 0; g = x; b = c; }
  else if (hue < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return `${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)}`;
}

export function getClusterTitle(clusterId, samples = []) {
  if (clusterId === -1) return 'Unclustered / Unique Features';
  if (samples && samples.length > 0) {
    const primary = samples[0];
    const capitalized = primary.charAt(0).toUpperCase() + primary.slice(1);
    return `${capitalized} & related (C${clusterId})`;
  }
  return `Cluster #${clusterId}`;
}

export function clusterLabel(cluster) {
  if (cluster === -1 || cluster === '-1') return 'Unclustered';
  return `Cluster #${cluster}`;
}

export function groupByCluster(atlas) {
  const map = new Map();
  for (const feature of atlas) {
    const id = feature.cluster;
    if (!map.has(id)) {
      map.set(id, []);
    }
    map.get(id).push(feature);
  }
  return map;
}

export function topClustersBySize(atlas, limit = 8) {
  const grouped = groupByCluster(atlas);
  return [...grouped.entries()]
    .filter(([id]) => id !== -1)
    .map(([id, features]) => {
      // Find top frequent words or unique labels
      const samples = Array.from(new Set(features.map((f) => f.label.trim()))).slice(0, 4);
      return {
        id,
        count: features.length,
        samples,
        features,
        title: getClusterTitle(id, samples),
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function allClusters(atlas) {
  const grouped = groupByCluster(atlas);
  return [...grouped.entries()].map(([id, features]) => {
    const samples = Array.from(new Set(features.map((f) => f.label.trim()))).slice(0, 4);
    return {
      id,
      count: features.length,
      samples,
      features,
      title: id === -1 ? 'Unclustered' : getClusterTitle(id, samples),
    };
  });
}

export const PLATFORM_STATS = {
  total: 4096,
  alive: 3648,
  dead: 448,
  clusters: 198,
  unclustered: 1145,
  avgSilhouette: 0.71,
  l0Sparsity: '93.75%',
  topK: 256,
  testAccuracy: '94.83%',
  classifier: 'ResNet (11M params)',
  dataset: 'CIFAR-10 (10 classes)',
};
