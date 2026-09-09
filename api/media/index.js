// Vercel route: /api/media
//   POST -> upload, GET -> list
// Logic lives in _lib so the same handlers back the local dev server and the
// acceptance tests. adapt() copes with either Vercel calling convention.
import { collectionRoute } from '../_lib/handlers.js';
import { adapt } from '../_lib/vercel-adapt.js';

export default adapt((request) => collectionRoute(request));
