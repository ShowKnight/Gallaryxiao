import { getCollection, type CollectionEntry } from "astro:content";

const notDraft = (e: { data: { draft?: boolean } }) => !e.data.draft;

export async function getPublishedSeries(): Promise<CollectionEntry<"series">[]> {
  const all = await getCollection("series", notDraft);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getPublishedJournal(): Promise<CollectionEntry<"journal">[]> {
  const all = await getCollection("journal", notDraft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getPublishedPhotos(): Promise<CollectionEntry<"photos">[]> {
  return await getCollection("photos", notDraft);
}

/** Build static paths for /works/[series] (and en mirror). One entry per series. */
export async function getSeriesPaths() {
  const series = await getPublishedSeries();
  return series.map((entry) => ({
    params: { series: entry.id },
    props: { entry },
  }));
}

/** Build static paths for /works/[series]/[photo]. One entry per (series, photo) pair. */
export async function getPhotoPaths() {
  const series = await getPublishedSeries();
  const out: Array<{
    params: { series: string; photo: string };
    props: {
      seriesEntry: CollectionEntry<"series">;
      photoId: string;
      index: number;
      total: number;
    };
  }> = [];
  for (const s of series) {
    const total = s.data.photos.length;
    s.data.photos.forEach((ref, index) => {
      out.push({
        params: { series: s.id, photo: ref.id },
        props: { seriesEntry: s, photoId: ref.id, index, total },
      });
    });
  }
  return out;
}

/** Build static paths for /journal/[year]/[month]/[slug]. */
export async function getJournalPaths() {
  const entries = await getPublishedJournal();
  return entries.map((entry) => {
    const d = entry.data.date;
    const year = String(d.getFullYear());
    const month = String(d.getMonth() + 1).padStart(2, "0");
    // entry.id may include subdir like "2024-04/foo"; take the last segment as slug
    const slug = entry.id.split("/").pop()!;
    return {
      params: { year, month, slug },
      props: { entry },
    };
  });
}
