// Vercel route: /api/media/sweep
//   GET  -> invoked by Vercel Cron (which sends CRON_SECRET, not the upload token)
//   POST -> manual run with the upload token
// Deletes uploads still unverified 24 hours after their token was issued.
import { sweepRoute } from '../_lib/handlers.js';
import { adapt } from '../_lib/vercel-adapt.js';

export default adapt((request) => sweepRoute(request));
