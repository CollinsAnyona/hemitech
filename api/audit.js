// POST /api/audit — the audit request form.
// Email and website. Which checks the visitor ticked is never sent.

import { adapt } from './_lib/vercel-adapt.js';
import { handleSubmission } from './_lib/submissions.js';

export default adapt((request) => handleSubmission(request, 'audit'));
