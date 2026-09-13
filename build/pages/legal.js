// Privacy notice and terms.
//
// We sell data-protection work, so this notice has to describe what the site
// genuinely does — not a template. Everything below is true of the code in
// this repository: two forms, two fields of storage, one browser-local key,
// no analytics, no cookies and no third-party requests at runtime.

import { SITE } from '../site.js';
import { esc, mailLink, phoneLink } from '../layout.js';

const privacy = {
  url: '/privacy',
  nav: '/how-we-work',
  title: 'Privacy notice — Hemi Tech Co.',
  description:
    'What this site collects, why, how long we keep it and who can see it, under the Data Protection Act 2019. Two forms, no cookies, no analytics, no mailing list.',
  body: `    <div class="ground-top">
      <div class="wrap" style="padding-top:64px;padding-bottom:44px">
        <div class="stack stack-5">
          <p class="eyebrow">Privacy notice</p>
          <h1 class="max-20">What we collect, why, and how long we keep it.</h1>
          <div class="rule"></div>
          <p class="lede" style="max-width:62ch">We sell data-protection work. It would be embarrassing to get this wrong on our own site, so this notice describes what the code on this site actually does rather than what a template says.</p>
          <p class="updated">Last updated ${esc(SITE.lastUpdated)} · Data controller: ${esc(SITE.name)}, ${esc(SITE.city)}</p>
        </div>
      </div>
    </div>

    <section class="wrap sec-tight">
      <div class="prose">
        <h2>The short version</h2>
        <p>This site has two forms. If you use one, we store what you typed and reply to you. We do not add you to a mailing list, we do not sell or share your details, and there are no cookies, no analytics and no third-party trackers on any page.</p>

        <h2>What we collect</h2>
        <p><strong>The contact form</strong> collects your name, your organisation, your email address, your website if you give it, and your message. All of it is needed to reply sensibly; the website field is optional and marked as such.</p>
        <p><strong>The audit form</strong> collects your email address and the website you want checked. Nothing else — in particular, which of the seven checks you ticked is never sent to us unless you type it into a message yourself.</p>
        <p>Both forms include a hidden field that real people never fill in. If it is filled in, the submission is discarded as automated. That field is not personal data.</p>
        <p>Our server records the usual request information for a short period as part of ordinary operation and abuse prevention, including a rate-limiting counter. We do not build a profile from it.</p>

        <h2>What we do not collect</h2>
        <ul>
          <li>No cookies are set by this site, for any purpose.</li>
          <li>No analytics. If we ever add any it will be cookieless and self-hosted, and this notice will say so before it goes live.</li>
          <li>No third-party scripts, fonts, embeds or pixels. Every asset on every page is served from this domain.</li>
          <li>No tracking of what you ticked in the audit tool.</li>
        </ul>

        <h2>What stays in your own browser</h2>
        <p>The audit tool remembers your ticks in <code>sessionStorage</code> under a single key, so a reload does not lose them. That value never leaves your device, is not readable by us, and is discarded when you close the tab.</p>

        <h2>Why we are allowed to hold it</h2>
        <p>Under the Data Protection Act 2019 our lawful basis is your consent, given by choosing to send us the form, together with our legitimate interest in responding to an enquiry about our services. You are never required to give us anything to read this site.</p>

        <h2>Where it is stored, and who can see it</h2>
        <p>Submissions are stored in our hosting provider's object storage and a notification is sent to us by email. Access is limited to the people at ${esc(SITE.name)} who need it to reply to you. We do not pass it to anyone else, and we do not use it to train anything.</p>
        <p>Our hosting and storage provider processes the data on our instructions as a processor. Data residency for that provider is <strong>[TO CONFIRM]</strong> and will be stated here precisely once it is.</p>

        <h2>How long we keep it</h2>
        <p>Submissions are deleted after <strong>${esc(SITE.retention)}</strong> unless you become a client, in which case the correspondence is kept for the life of the engagement and the period our records obligations require. The deletion is implemented in the system, not merely promised here.</p>

        <h2>Your rights</h2>
        <p>You can ask us for a copy of what we hold about you, ask us to correct it, ask us to delete it, or object to us holding it at all. Write to ${mailLink(SITE.email)} and we will act within the statutory period. You do not have to give a reason.</p>
        <p>If you are not satisfied with how we have handled it, you can complain to the Office of the Data Protection Commissioner (ODPC) in Kenya. Our own ODPC registration is listed on the <a href="/credentials">credentials page</a> with its real status, which is currently [PENDING].</p>

        <h2>Changes</h2>
        <p>If this notice changes, the date at the top changes with it. We will not quietly broaden what we collect.</p>

        <h2>Contact</h2>
        <p>${esc(SITE.name)} · ${esc(SITE.address)}, ${esc(SITE.city)} · ${mailLink(SITE.email)} · ${phoneLink()}</p>
      </div>
    </section>`,
};

const terms = {
  url: '/terms',
  nav: '/how-we-work',
  title: 'Terms — Hemi Tech Co.',
  description:
    'Terms for using this website and the standing commitments in our contracts: ownership of code and hosting, published service levels, and how quotations work.',
  body: `    <div class="ground-top">
      <div class="wrap" style="padding-top:64px;padding-bottom:44px">
        <div class="stack stack-5">
          <p class="eyebrow">Terms</p>
          <h1 class="max-20">Using this site, and what applies to work we do.</h1>
          <div class="rule"></div>
          <p class="lede" style="max-width:62ch">The short terms that govern this website, and a plain summary of the standing commitments that go into every contract we sign.</p>
          <p class="updated">Last updated ${esc(SITE.lastUpdated)}</p>
        </div>
      </div>
    </div>

    <section class="wrap sec-tight">
      <div class="prose">
        <h2>This website</h2>
        <p>This site is published by ${esc(SITE.name)}, registered in Kenya ${esc(SITE.regNo)}. It is provided for information. We take care to keep it accurate, but nothing on it is a contractual offer on its own.</p>
        <p>Prices shown are indicative ranges current at the date above. A binding price comes from a written scope document for your specific project, and holds for the period stated in it.</p>

        <h2>The free audit</h2>
        <p>The audit is genuinely free and carries no obligation. The report we send is yours to keep and to act on, including by giving it to another supplier. We do not make it conditional on a meeting.</p>
        <p>It is an assessment against seven stated checks, not a security audit, a penetration test or a legal opinion, and it does not constitute professional advice beyond its own scope.</p>

        <h2>What you own</h2>
        <p>On full payment, the source code we write for you, the domain and the hosting accounts are transferred into your name. This is not an optional extra and is not charged for. Third-party components keep their own licences, which we list at handover.</p>

        <h2>Service levels</h2>
        <p>Where we support a system under a Care Plan, the uptime target and fault response time in your contract apply. The current published figures are on the <a href="/standards">standards page</a>; where one of them still reads as a bracketed placeholder, it has not yet been set and is not being claimed.</p>

        <h2>Your responsibilities</h2>
        <p>Content you give us to publish must be yours to publish. Where we build a form that collects personal data, you are the data controller for what it collects and we are your processor; the split of duties goes into the contract.</p>

        <h2>Liability</h2>
        <p>Nothing here limits liability that cannot be limited in law. Otherwise our liability for a project is limited to the fees paid for that project, and we are not liable for indirect or consequential loss.</p>

        <h2>Governing law</h2>
        <p>These terms and any contract arising from them are governed by the laws of Kenya.</p>

        <h2>Contact</h2>
        <p>Questions about these terms: ${mailLink(SITE.email)}.</p>
      </div>
    </section>`,
};

export default [privacy, terms];
