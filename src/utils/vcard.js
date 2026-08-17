/**
 * Zero-friction contact installer.
 * 
 * The KEY insight: Mobile browsers (iOS Safari, Android Chrome) automatically
 * open the native Contacts app when they receive a response with
 * Content-Type: text/vcard from a real server URL.
 * 
 * Client-side approaches (data URIs, blobs) do NOT work reliably.
 * A Netlify Function serves the VCF with the correct header.
 */

/**
 * Navigate the browser to the Netlify Function URL that serves a real .vcf file.
 * The phone's OS will automatically detect the vCard content type and
 * open the native Contacts app with "Add Contact" dialog.
 */
export function addEmailToPhone(email, name) {
  if (!email) return;
  const params = new URLSearchParams({
    email: email.trim(),
    name: (name || 'Email Contact').trim()
  });
  // Navigate to the serverless function that returns Content-Type: text/vcard
  // This is what triggers the native Contacts app on both iOS and Android
  window.location.href = `/.netlify/functions/contact?${params.toString()}`;
}

/**
 * Copy text to clipboard (works in secure contexts and older webviews)
 */
export async function copyText(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;left:-9999px';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  return ok;
}
