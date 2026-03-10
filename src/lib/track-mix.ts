type GenreTrack = {
  genre?: string | null;
};

export function mixTracksByGenre<T extends GenreTrack>(tracks: T[], limit: number): T[] {
  if (!tracks.length || limit <= 0) return [];

  const buckets = new Map<string, T[]>();
  for (const track of tracks) {
    const genreKey = (track.genre || "unknown").trim().toLowerCase();
    const bucket = buckets.get(genreKey);
    if (bucket) {
      bucket.push(track);
    } else {
      buckets.set(genreKey, [track]);
    }
  }

  const genreBuckets = [...buckets.values()].sort((a, b) => b.length - a.length);
  const mixed: T[] = [];

  while (mixed.length < limit) {
    let inserted = false;
    for (const bucket of genreBuckets) {
      const next = bucket.shift();
      if (!next) continue;
      mixed.push(next);
      inserted = true;
      if (mixed.length >= limit) break;
    }
    if (!inserted) break;
  }

  return mixed;
}
