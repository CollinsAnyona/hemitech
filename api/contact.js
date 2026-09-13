// POST /api/contact — the contact form.
// Name, organisation, email, optional website, message. Nothing else.

import { adapt } from './_lib/vercel-adapt.js';
import { handleSubmission } from './_lib/submissions.js';

export default adapt((request) => handleSubmission(request, 'contact'));
