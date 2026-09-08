import { Plugin } from 'vite';
import { slugify } from '../lib/content/slugify';

const SITE_URL = 'https://see-us-landing.vercel.app';

interface MovieSitemapEntry {
  id: string;
  title: string;
  updatedAt?: string;
  release_date?: string | null;
}

/**
 * Extract the release year from the release date (YYYY-MM-DD).
 * Returns undefined when the date is missing or not a plausible year,
 * so a year is never invented for the URL.
 */
function extractYear(releaseDate?: string | null): string | undefined {
  if (!releaseDate || typeof releaseDate !== 'string') return undefined;

  const match = releaseDate.match(/^(\d{4})/);
  if (!match) return undefined;

  const year = parseInt(match[1], 10);
  const currentYear = new Date().getFullYear();
  if (year < 1800 || year > currentYear + 5) return undefined;

  return String(year);
}

/**
 * Build the canonical movie path: /movies/{id}-{slug}-{year}
 * The year segment is only appended when a valid release date exists,
 * falling back to the app's existing {id}-{slug} format otherwise.
 */
function buildMoviePath(movie: MovieSitemapEntry): string {
  const slug = slugify(movie.title);
  const year = extractYear(movie.release_date);
  return `${SITE_URL}/movies/${movie.id}-${slug}${year ? `-${year}` : ''}`;
}

function generateMovieSitemap(movies: MovieSitemapEntry[]) {
  const urls = movies.map((movie) => {
    const lastmod = movie.updatedAt || new Date().toISOString().split('T')[0];
    return `  <url>
    <loc>${buildMoviePath(movie)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

async function fetchMoviesForSitemap(): Promise<MovieSitemapEntry[]> {
  const baseUrl = process.env.VITE_API_URL;

  if (!baseUrl) {
    console.warn('[Movie Sitemap Plugin] VITE_API_URL not configured, generating empty sitemap');
    return [];
  }

  const movies: MovieSitemapEntry[] = [];
  const pagesToFetch = 5; // Fetch first 5 pages (up to 100 movies)

  console.log('[Movie Sitemap Plugin] Fetching movies from backend...');

  for (let page = 1; page <= pagesToFetch; page++) {
    try {
      // Note: fetchAllMovies expects httpClient which uses VITE_API_URL
      // We need to temporarily set up tokens for unauthenticated access
      const response = await fetch(`${baseUrl}/movies?page=${page}&page_size=20`);

      if (!response.ok) {
        console.error(`[Movie Sitemap Plugin] Backend API error: ${response.status} ${response.statusText}`);
        break;
      }

      const data = await response.json();

      if (!data.data || !Array.isArray(data.data)) {
        break;
      }

      for (const movie of data.data) {
        // A valid id is required to avoid malformed URLs such as /movies--title-year
        const id = movie.tmdb_id || movie.id;
        if (!movie.title || typeof movie.title !== 'string' || !id) {
          continue;
        }
        movies.push({
          id: String(id),
          title: movie.title,
          updatedAt: new Date().toISOString().split('T')[0],
          release_date: movie.release_date,
        });
      }

      if (data.total_pages && page >= data.total_pages) {
        break;
      }
    } catch (error) {
      console.error(`[Movie Sitemap Plugin] Error fetching page ${page}:`, error);
      break;
    }
  }

  console.log(`[Movie Sitemap Plugin] Found ${movies.length} movies`);
  return movies;
}

export function VitePluginMovieSitemap(): Plugin {
  return {
    name: 'vite-plugin-movie-sitemap',
    apply: 'build',
    async generateBundle(options, bundle) {
      console.log('[Movie Sitemap Plugin] Generating movie-sitemap.xml...');

      const movies = await fetchMoviesForSitemap();

      if (movies.length === 0) {
        console.log('[Movie Sitemap Plugin] No movies found, generating empty sitemap');
        // Generate empty but valid sitemap
        const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
        this.emitFile({
          type: 'asset',
          fileName: 'movie-sitemap.xml',
          source: emptySitemap,
        });
        return;
      }

      const sitemap = generateMovieSitemap(movies);

      this.emitFile({
        type: 'asset',
        fileName: 'movie-sitemap.xml',
        source: sitemap,
      });

      console.log('[Movie Sitemap Plugin] movie-sitemap.xml generated successfully');
    },
  };
}