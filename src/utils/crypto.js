/**
 * URL Hash based zero-server vault encoder and decoder.
 * Enables instant link generation even if offline or serverless.
 */

export function encodeVaultPayload(data) {
  try {
    const jsonStr = JSON.stringify(data);
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    let binary = '';
    const len = utf8Bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const base64 = btoa(binary);
    return encodeURIComponent(base64);
  } catch (err) {
    console.error('Failed to encode vault payload', err);
    return null;
  }
}

export function decodeVaultPayload(encoded) {
  try {
    if (!encoded) return null;
    const base64 = decodeURIComponent(encoded);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to decode vault payload', err);
    return null;
  }
}
