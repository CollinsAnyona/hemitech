// Vercel route: /api/submissions/sweep
//   GET  -> invoked by Vercel Cron (which presents CRON_SECRET)
//   POST -> manual run with the upload token; ?dry=1 reports without deleting
//
// Deletes every stored contact and audit submission older than the retention
// period published in the privacy notice. A retention policy that only exists
// in a policy document is not a retention policy.

import { isAuthorised, isCron } from '../_lib/auth.js';
import { json, methodNotAllowed, unauthorized, serverError } from '../_lib/respond.js';
import { adapt } from '../_lib/vercel-adapt.js';
import { sweepSubmissions } from '../_lib/retention.js';

async function route(request) {
  const method = request.method.toUpperCase();
  if (method !== 'GET' && method !== 'POST') return methodNotAllowed(['GET', 'POST']);

  const allowed = method === 'GET' ? isCron(request) || isAuthorised(request) : isAuthorised(request);
  if (!allowed) return unauthorized();

  const dryRun = new URL(request.url).searchParams.get('dry') === '1';

  try {
    const result = await sweepSubmissions({ dryRun });
    return json({ ok: true, ...result });
  } catch (error) {
    console.error('submission sweep failed', error);
    return serverError('sweep failed');
  }
}

export default adapt(route);
