// Vercel route: /api/media/verify
//   POST -> validate an object uploaded straight to storage, and delete it if
//           it fails. Step 3 of the client-upload flow; without this the bytes
//           would reach a public URL having passed no checks at all.
import { verifyRoute } from '../_lib/handlers.js';
import { adapt } from '../_lib/vercel-adapt.js';

export default adapt((request) => verifyRoute(request));
