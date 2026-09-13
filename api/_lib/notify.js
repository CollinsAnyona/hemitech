// Notification of a new form submission.
//
// The provider is an environment variable (BUILD-BRIEF §11). Nothing here is
// allowed to affect whether the visitor sees success: the submission is
// already stored before this runs, and every path either returns or throws
// into a caller that swallows it.
//
//   NOTIFY_PROVIDER   "resend" | "webhook" | unset (no notification)
//   NOTIFY_TO         address that receives the alert, e.g. hello@hemitech.co.ke
//   NOTIFY_FROM       verified sender for the provider
//   RESEND_API_KEY    when NOTIFY_PROVIDER=resend
//   NOTIFY_WEBHOOK    when NOTIFY_PROVIDER=webhook

const TIMEOUT_MS = 5000;

function lines(record) {
  const rows = [
    ['Received', record.receivedAt],
    ['Kind', record.kind === 'audit' ? 'Audit request' : 'Contact form'],
    ['Name', record.name],
    ['Organisation', record.organisation],
    ['Email', record.email],
    ['Website', record.website],
    ['Message', record.message],
    ['Reference', record.id],
  ];
  return rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
}

async function withTimeout(promise, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await promise(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function viaResend(record) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_TO;
  const from = process.env.NOTIFY_FROM;
  if (!key || !to || !from) {
    console.warn('notify: resend selected but RESEND_API_KEY, NOTIFY_TO or NOTIFY_FROM is unset');
    return;
  }

  const subject =
    record.kind === 'audit'
      ? `Audit request — ${record.website}`
      : `Enquiry — ${record.organisation || record.email}`;

  const res = await withTimeout(
    (signal) =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        signal,
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: record.email,
          subject,
          text: lines(record),
        }),
      }),
    TIMEOUT_MS,
  );

  if (!res.ok) {
    console.error('notify: resend returned', res.status);
  }
}

async function viaWebhook(record) {
  const url = process.env.NOTIFY_WEBHOOK;
  if (!url) {
    console.warn('notify: webhook selected but NOTIFY_WEBHOOK is unset');
    return;
  }

  const res = await withTimeout(
    (signal) =>
      fetch(url, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: lines(record), submission: record }),
      }),
    TIMEOUT_MS,
  );

  if (!res.ok) {
    console.error('notify: webhook returned', res.status);
  }
}

/**
 * Tell somebody a submission arrived. Never throws in a way that matters:
 * the caller stores first and treats this as best effort.
 */
export async function notify(record) {
  const provider = (process.env.NOTIFY_PROVIDER || '').toLowerCase();

  if (!provider) {
    // Deliberate: a submission with no notification provider is still stored,
    // and the visitor is still told it arrived. It is not lost, only quiet.
    console.info(`submission ${record.id} stored; no NOTIFY_PROVIDER set`);
    return;
  }

  if (provider === 'resend') return viaResend(record);
  if (provider === 'webhook') return viaWebhook(record);

  console.warn(`notify: unknown NOTIFY_PROVIDER "${provider}"`);
}
