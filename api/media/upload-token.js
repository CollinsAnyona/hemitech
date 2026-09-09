// Vercel route: /api/media/upload-token
//   POST -> mint a scoped, short-lived credential for one client upload.
// Step 1 of the three-step flow for files over Vercel's 4.5 MB body limit.
import { uploadTokenRoute } from '../_lib/handlers.js';
import { adapt } from '../_lib/vercel-adapt.js';

export default adapt((request) => uploadTokenRoute(request));
