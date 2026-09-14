import { Plugin } from 'vite';
import { slugify } from '../lib/content/slugify';

const SITE_URL = 'https://see-us-landing.vercel.app';

interface TVShowSitemapEntry {
  id: string;
  name: string;
  updatedAt?: string;
  first_air_date?: string | null;
}

/**
 * Extract the release year from the first air date (YYYY-MM-DD).
 * Returns undefined when the date is missing or not a plausible year,
 * so a year is never invented for the URL.
 */
function extractYear(firstAirDate?: string | null): string | undefined {
  if (!firstAirDate || typeof firstAirDate !== 'string') return undefined;

  const match = firstAirDate.match(/^(\d{4})/);
  if (!match) return undefined;

  const year = parseInt(match[1], 10);
  const currentYear = new Date().getFullYear();
  if (year < 1800 || year > currentYear + 5) return undefined;

  return String(year);
}

/**
 * Build the canonical TV show path: /tv-shows/{id}-{slug}-{year}
 * The year segment is only appended when a valid first air date exists,
 * falling back to the app's existing {id}-{slug} format otherwise.
 */
function buildTVShowPath(show: TVShowSitemapEntry): string {
  const slug = slugify(show.name);
  const year = extractYear(show.first_air_date);
  return `${SITE_URL}/tv-shows/${show.id}-${slug}${year ? `-${year}` : ''}`;
}

function generateTVShowSitemap(shows: TVShowSitemapEntry[]) {
  const urls = shows.map((show) => {
    const lastmod = show.updatedAt || new Date().toISOString().split('T')[0];
    return `  <url>
    <loc>${buildTVShowPath(show)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

async function fetchShowsForSitemap(): Promise<TVShowSitemapEntry[]> {
  try {
    const { fetchPopularShows, fetchTopRatedShows, fetchTrendingShows } = await import('../lib/api/tvDataSource');
    const shows: TVShowSitemapEntry[] = [];
    const seenIds = new Set<string>();

    // Fetch from multiple endpoints to get a broader set of shows
    const endpoints = [
      fetchPopularShows(),
      fetchTopRatedShows(),
      fetchTrendingShows(),
    ];

    const results = await Promise.all(endpoints.map(p => p.catch(err => {
      console.error('[TV Show Sitemap Plugin] TMDB endpoint error:', err);
      return { page: 1, results: [], total_pages: 1, total_results: 0 };
    })));

    for (const result of results) {
      for (const show of result.results) {
        const id = String(show.id);
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        shows.push({
          id,
          name: show.name,
          updatedAt: new Date().toISOString().split('T')[0],
          first_air_date: show.first_air_date || null,
        });
      }
    }

    return shows;
  } catch (error) {
    console.error('Error fetching TV shows for sitemap:', error);
    // Return empty array to avoid breaking the build
    return [];
  }
}

export function VitePluginTVShowSitemap(): Plugin {
  return {
    name: 'vite-plugin-tv-show-sitemap',
    apply: 'build',
    async generateBundle(options, bundle) {
      console.log('[TV Show Sitemap Plugin] Generating tv-show-sitemap.xml...');

      const shows = await fetchShowsForSitemap();

      if (shows.length === 0) {
        console.log('[TV Show Sitemap Plugin] No TV shows found, generating empty sitemap');
        // Generate empty but valid sitemap
        const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
        this.emitFile({
          type: 'asset',
          fileName: 'tv-show-sitemap.xml',
          source: emptySitemap,
        });
        return;
      }

      const sitemap = generateTVShowSitemap(shows);

      this.emitFile({
        type: 'asset',
        fileName: 'tv-show-sitemap.xml',
        source: sitemap,
      });

      console.log('[TV Show Sitemap Plugin] tv-show-sitemap.xml generated successfully');
    },
  };
}