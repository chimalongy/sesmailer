/**
 * Email Verification Script (ESM)
 * ---------------------------------
 *
 * Pipeline:
 *
 *   Email
 *     → Syntax validation
 *     → Disposable-domain check
 *     → MX lookup
 *     → DNS A/AAAA lookup
 *     → Role-account detection
 *     → Known-bad-domain check
 *     → Historical suppression list
 *     → Previous bounce database
 *     → VALID / RISKY / INVALID / UNKNOWN
 *
 * IMPORTANT:
 *
 * This script does NOT open any SMTP connection, probe recipients,
 * or send mail. It only performs DNS lookups and checks against
 * local/remote lists. That makes it safe to run from serverless
 * environments (Vercel, Trigger.dev) that don't allow raw TCP
 * sockets on port 25.
 *
 * Mailbox-level confirmation is expected to come from bounce
 * handling after you actually send — see `getBounceHistory` /
 * `isSuppressed` below for where to wire that in.
 *
 * Install:
 *
 *   npm install email-validator disposable-email-domains
 *
 * package.json:
 *
 *   { "type": "module" }
 *
 * Usage:
 *
 *   node verifyEmail.mjs someone@example.com
 *
 * ----------------------------------------------------
 */

import dns from 'dns/promises';
import validator from 'email-validator';
import disposableDomains from 'disposable-email-domains' with { type: 'json' };

// ----------------------------------------------------
// DNS SERVERS
// ----------------------------------------------------

dns.setServers(['8.8.8.8', '1.1.1.1']);

// ----------------------------------------------------
// STATIC LISTS
// ----------------------------------------------------

// Local-parts that indicate a shared/role mailbox rather than a
// specific person. These aren't hard-invalid — just lower
// confidence for 1:1 outbound.
const DEFAULT_ROLE_ACCOUNTS = new Set([
  'admin', 'administrator', 'support', 'info', 'help', 'sales',
  'contact', 'billing', 'accounts', 'accounting', 'hr', 'jobs',
  'careers', 'marketing', 'office', 'team', 'hello', 'no-reply',
  'noreply', 'donotreply', 'webmaster', 'postmaster', 'abuse',
  'security', 'privacy', 'legal', 'press', 'media', 'newsletter',
  'subscribe', 'unsubscribe', 'feedback', 'enquiries', 'inquiries',
  'orders', 'service', 'services', 'general', 'mail', 'root'
]);

// Domains you've decided are always bad — burner/parked/known
// spamtrap domains that aren't in the disposable-email-domains
// package. Pass your own list via `options.knownBadDomains`.
const DEFAULT_KNOWN_BAD_DOMAINS = new Set([]);

// ----------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------

const DEFAULT_CONFIG = {

  // Whether an unrecognized role-account local-part should
  // downgrade the verdict to "risky" instead of leaving it "valid".
  flagRoleAccounts: true,

  // Extra known-bad domains, merged with DEFAULT_KNOWN_BAD_DOMAINS.
  knownBadDomains: [],

  // async (normalizedEmail, domain) => boolean | { suppressed, reason }
  // Wire this to your suppression-list table (e.g. Supabase).
  // Defaults to "never suppressed".
  isSuppressed: async () => false,

  // async (normalizedEmail, domain) => { bounced: boolean, hardBounce?: boolean, count?: number, reason?: string }
  // Wire this to your bounce-tracking table, populated by your
  // ESP's bounce webhook. Defaults to "no bounce history".
  getBounceHistory: async () => ({ bounced: false })

};

// ----------------------------------------------------
// RESULT FACTORY
// ----------------------------------------------------
//
// Every check returns the same basic shape:
//
// {
//   success: true/false,
//   status: "valid" | "invalid" | "risky" | "unknown",
//   message: string,
//   details: {}
// }
//
// ----------------------------------------------------

function createCheckResult({ success = false, status = 'unknown', message = '', details = {} } = {}) {
  return { success, status, message, details };
}

// ----------------------------------------------------
// 1. SYNTAX VALIDATION
// ----------------------------------------------------

export function checkSyntax(email) {

  if (typeof email !== 'string' || !email.trim()) {
    return createCheckResult({
      status: 'invalid',
      message: 'Email address is empty or invalid.',
      details: { email }
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const valid = validator.validate(normalizedEmail);

  if (!valid) {
    return createCheckResult({
      status: 'invalid',
      message: 'Invalid email address syntax.',
      details: { email: normalizedEmail }
    });
  }

  return createCheckResult({
    success: true,
    status: 'valid',
    message: 'Email address syntax is valid.',
    details: { email: normalizedEmail }
  });
}

// ----------------------------------------------------
// 2. DISPOSABLE DOMAIN CHECK
// ----------------------------------------------------

export function checkDisposableDomain(domain) {

  const isDisposable = disposableDomains.includes(domain.toLowerCase());

  if (isDisposable) {
    return createCheckResult({
      success: true,
      status: 'risky',
      message: 'Email domain is a known disposable or temporary email provider.',
      details: { domain, disposable: true }
    });
  }

  return createCheckResult({
    success: true,
    status: 'valid',
    message: 'Email domain is not listed as a known disposable provider.',
    details: { domain, disposable: false }
  });
}

// ----------------------------------------------------
// 3. MX RECORD LOOKUP
// ----------------------------------------------------

export async function checkMxRecords(domain) {

  try {

    const records = await dns.resolveMx(domain);

    if (!records || records.length === 0) {
      return createCheckResult({
        status: 'invalid',
        message: 'Domain does not have any MX records.',
        details: { domain, mxRecords: [] }
      });
    }

    const sortedRecords = records.sort((a, b) => a.priority - b.priority);

    return createCheckResult({
      success: true,
      status: 'valid',
      message: 'Domain has valid MX records.',
      details: { domain, mxRecords: sortedRecords }
    });

  } catch (err) {

    // NXDOMAIN / ENODATA means the domain (or its mail routing)
    // genuinely doesn't exist — that's invalid, not unknown.
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      return createCheckResult({
        status: 'invalid',
        message: 'Domain does not exist or has no mail routing.',
        details: { domain, errorCode: err.code }
      });
    }

    return createCheckResult({
      status: 'unknown',
      message: 'Unable to resolve MX records.',
      details: { domain, errorCode: err.code || null, error: err.message }
    });
  }
}

// ----------------------------------------------------
// 4. DNS A / AAAA LOOKUP
// ----------------------------------------------------
//
// Confirms the domain resolves to something on the open internet
// at all. Mainly catches domains with MX records pointing at dead
// infrastructure, or misconfigured/parked domains.
//
// ----------------------------------------------------

export async function checkDnsRecords(domain) {

  const [aResult, aaaaResult] = await Promise.allSettled([
    dns.resolve4(domain),
    dns.resolve6(domain)
  ]);

  const aRecords = aResult.status === 'fulfilled' ? aResult.value : [];
  const aaaaRecords = aaaaResult.status === 'fulfilled' ? aaaaResult.value : [];

  if (aRecords.length > 0 || aaaaRecords.length > 0) {
    return createCheckResult({
      success: true,
      status: 'valid',
      message: 'Domain resolves to a valid A or AAAA record.',
      details: { domain, aRecords, aaaaRecords }
    });
  }

  const aError = aResult.status === 'rejected' ? aResult.reason?.code : null;
  const aaaaError = aaaaResult.status === 'rejected' ? aaaaResult.reason?.code : null;

  // Both lookups explicitly came back empty/not-found.
  if (
    (aError === 'ENOTFOUND' || aError === 'ENODATA') &&
    (aaaaError === 'ENOTFOUND' || aaaaError === 'ENODATA')
  ) {
    return createCheckResult({
      status: 'invalid',
      message: 'Domain has no A or AAAA records.',
      details: { domain, aError, aaaaError }
    });
  }

  return createCheckResult({
    status: 'unknown',
    message: 'Unable to resolve A/AAAA records for domain.',
    details: { domain, aError, aaaaError }
  });
}

// ----------------------------------------------------
// 5. ROLE ACCOUNT DETECTION
// ----------------------------------------------------

export function checkRoleAccount(localPart, options = {}) {

  const roleAccounts = options.roleAccounts || DEFAULT_ROLE_ACCOUNTS;
  const normalizedLocalPart = localPart.toLowerCase();

  const isRoleAccount = roleAccounts.has(normalizedLocalPart);

  if (isRoleAccount) {
    return createCheckResult({
      success: true,
      status: 'risky',
      message: 'Local-part matches a known role/shared mailbox pattern.',
      details: { localPart: normalizedLocalPart, roleAccount: true }
    });
  }

  return createCheckResult({
    success: true,
    status: 'valid',
    message: 'Local-part does not match a known role/shared mailbox pattern.',
    details: { localPart: normalizedLocalPart, roleAccount: false }
  });
}

// ----------------------------------------------------
// 6. KNOWN BAD DOMAINS
// ----------------------------------------------------

export function checkKnownBadDomain(domain, options = {}) {

  const extraBadDomains = options.knownBadDomains || [];
  const badDomains = new Set([...DEFAULT_KNOWN_BAD_DOMAINS, ...extraBadDomains]);

  const isKnownBad = badDomains.has(domain.toLowerCase());

  if (isKnownBad) {
    return createCheckResult({
      status: 'invalid',
      message: 'Domain is on the known-bad-domains list.',
      details: { domain, knownBad: true }
    });
  }

  return createCheckResult({
    success: true,
    status: 'valid',
    message: 'Domain is not on the known-bad-domains list.',
    details: { domain, knownBad: false }
  });
}

// ----------------------------------------------------
// 7. HISTORICAL SUPPRESSION LIST
// ----------------------------------------------------
//
// Wire `options.isSuppressed` to your own store (Supabase table,
// ESP suppression export, etc). It should resolve quickly — this
// runs per-email, so a single indexed lookup, not a table scan.
//
// ----------------------------------------------------

export async function checkSuppressionList(normalizedEmail, domain, options = {}) {

  const isSuppressed = options.isSuppressed || DEFAULT_CONFIG.isSuppressed;

  try {

    const result = await isSuppressed(normalizedEmail, domain);
    const suppressed = typeof result === 'boolean' ? result : Boolean(result?.suppressed);
    const reason = typeof result === 'object' ? result?.reason : null;

    if (suppressed) {
      return createCheckResult({
        status: 'invalid',
        message: 'Email is on the historical suppression list.',
        details: { email: normalizedEmail, suppressed: true, reason: reason || null }
      });
    }

    return createCheckResult({
      success: true,
      status: 'valid',
      message: 'Email is not on the historical suppression list.',
      details: { email: normalizedEmail, suppressed: false }
    });

  } catch (err) {

    return createCheckResult({
      status: 'unknown',
      message: 'Unable to check suppression list.',
      details: { email: normalizedEmail, error: err.message }
    });
  }
}

// ----------------------------------------------------
// 8. PREVIOUS BOUNCE DATABASE
// ----------------------------------------------------
//
// Wire `options.getBounceHistory` to your bounce-tracking table,
// populated from your ESP's bounce/complaint webhooks. A hard
// bounce should mark the address invalid going forward; a soft
// bounce (or a handful of them) is treated as risky.
//
// ----------------------------------------------------

export async function checkBounceHistory(normalizedEmail, domain, options = {}) {

  const getBounceHistory = options.getBounceHistory || DEFAULT_CONFIG.getBounceHistory;

  try {

    const history = await getBounceHistory(normalizedEmail, domain);

    if (history?.hardBounce) {
      return createCheckResult({
        status: 'invalid',
        message: 'Email has a previous hard bounce on record.',
        details: { email: normalizedEmail, ...history }
      });
    }

    if (history?.bounced) {
      return createCheckResult({
        success: true,
        status: 'risky',
        message: 'Email has previous soft bounce(s) on record.',
        details: { email: normalizedEmail, ...history }
      });
    }

    return createCheckResult({
      success: true,
      status: 'valid',
      message: 'No previous bounce history for this email.',
      details: { email: normalizedEmail, bounced: false }
    });

  } catch (err) {

    return createCheckResult({
      status: 'unknown',
      message: 'Unable to check bounce history.',
      details: { email: normalizedEmail, error: err.message }
    });
  }
}

// ----------------------------------------------------
// VERDICT PRIORITY
// ----------------------------------------------------
//
// invalid > risky > unknown > valid, but each step can only move
// the verdict *down* in confidence — an earlier "risky" is never
// cleared by a later "valid" step.
//
// ----------------------------------------------------

const VERDICT_RANK = { valid: 0, unknown: 1, risky: 2, invalid: 3 };

function applyVerdict(current, next) {
  return VERDICT_RANK[next] > VERDICT_RANK[current] ? next : current;
}

// ----------------------------------------------------
// COMPLETE EMAIL CHECK
// ----------------------------------------------------

export async function checkEmail(email, options = {}) {

  const config = { ...DEFAULT_CONFIG, ...options };

  const result = {
    email,
    normalizedEmail: null,
    domain: null,
    localPart: null,
    syntaxCheck: null,
    disposableCheck: null,
    mxCheck: null,
    dnsCheck: null,
    roleAccountCheck: null,
    knownBadDomainCheck: null,
    suppressionCheck: null,
    bounceCheck: null,
    verdict: 'unknown'
  };

  // Step 1: Syntax
  const syntaxCheck = checkSyntax(email);
  result.syntaxCheck = syntaxCheck;

  if (!syntaxCheck.success) {
    result.verdict = 'invalid';
    return result;
  }

  result.normalizedEmail = syntaxCheck.details.email;
  const [localPart, domain] = result.normalizedEmail.split('@');
  result.localPart = localPart;
  result.domain = domain;

  let verdict = 'valid';

  // Step 2: Disposable domain
  result.disposableCheck = checkDisposableDomain(domain);
  verdict = applyVerdict(verdict, result.disposableCheck.status);

  // Step 3: MX lookup
  result.mxCheck = await checkMxRecords(domain);
  verdict = applyVerdict(verdict, result.mxCheck.status);

  if (result.mxCheck.status === 'invalid') {
    result.verdict = verdict;
    return result;
  }

  // Step 4: DNS A/AAAA lookup
  result.dnsCheck = await checkDnsRecords(domain);
  verdict = applyVerdict(verdict, result.dnsCheck.status);

  if (result.dnsCheck.status === 'invalid') {
    result.verdict = verdict;
    return result;
  }

  // Step 5: Role account detection (optional)
  if (config.flagRoleAccounts) {
    result.roleAccountCheck = checkRoleAccount(localPart, config);
    verdict = applyVerdict(verdict, result.roleAccountCheck.status);
  }

  // Step 6: Known bad domains
  result.knownBadDomainCheck = checkKnownBadDomain(domain, config);
  verdict = applyVerdict(verdict, result.knownBadDomainCheck.status);

  if (result.knownBadDomainCheck.status === 'invalid') {
    result.verdict = verdict;
    return result;
  }

  // Step 7: Historical suppression list
  result.suppressionCheck = await checkSuppressionList(result.normalizedEmail, domain, config);
  verdict = applyVerdict(verdict, result.suppressionCheck.status);

  if (result.suppressionCheck.status === 'invalid') {
    result.verdict = verdict;
    return result;
  }

  // Step 8: Previous bounce database
  result.bounceCheck = await checkBounceHistory(result.normalizedEmail, domain, config);
  verdict = applyVerdict(verdict, result.bounceCheck.status);

  result.verdict = verdict;
  return result;
}

// ----------------------------------------------------
// CLI ENTRY POINT
// ----------------------------------------------------

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (isMain) {

  const email = process.argv[2];

  if (!email) {
    console.error('Usage: node verifyEmail.mjs <email>');
    process.exit(1);
  }

  checkEmail(email)
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((err) => {
      console.error('Error verifying email:', err);
      process.exit(1);
    });
}
