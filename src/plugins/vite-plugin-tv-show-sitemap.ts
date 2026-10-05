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
  const baseUrl = process.env.VITE_API_URL;

  if (!baseUrl) {
    console.warn('[TV Show Sitemap Plugin] VITE_API_URL not configured, generating empty sitemap');
    return [];
  }

  const shows: TVShowSitemapEntry[] = [];
  const pagesToFetch = 5; // Fetch first 5 pages (up to 100 shows)

  console.log('[TV Show Sitemap Plugin] Fetching TV shows from backend...');

  for (let page = 1; page <= pagesToFetch; page++) {
    try {
      const response = await fetch(`${baseUrl}/tv?page=${page}&page_size=20`);

      if (!response.ok) {
        console.error(`[TV Show Sitemap Plugin] Backend API error: ${response.status} ${response.statusText}`);
        break;
      }

      const data = await response.json();

      if (!data.data || !Array.isArray(data.data)) {
        break;
      }

      for (const show of data.data) {
        // A valid id is required to avoid malformed URLs such as /tv-shows--name-year
        const id = show.tmdb_id || show.id;
        if (!show.name || typeof show.name !== 'string' || !id) {
          continue;
        }
        shows.push({
          id: String(id),
          name: show.name,
          updatedAt: new Date().toISOString().split('T')[0],
          first_air_date: show.first_air_date,
        });
      }

      if (data.total_pages && page >= data.total_pages) {
        break;
      }
    } catch (error) {
      console.error(`[TV Show Sitemap Plugin] Error fetching page ${page}:`, error);
      break;
    }
  }

  console.log(`[TV Show Sitemap Plugin] Found ${shows.length} TV shows`);
  return shows;
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