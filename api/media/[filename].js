// Vercel route: /api/media/<filename>
//   DELETE -> remove, idempotent
import { itemRoute } from '../_lib/handlers.js';
import { adapt, lastPathSegment } from '../_lib/vercel-adapt.js';

export default adapt((request) => itemRoute(request, lastPathSegment(request)));
