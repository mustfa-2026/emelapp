// Netlify Serverless Function: Serves a .vcf vCard file with correct Content-Type
// so that iOS Safari and Android Chrome automatically open the native Contacts app.
//
// Usage: /.netlify/functions/contact?email=test@gmail.com&name=MyEmail
//
// On iOS: Safari sees text/vcard → opens native "Add Contact" dialog instantly.
// On Android: Chrome downloads .vcf → tapping it opens Contacts app automatically.

export default async (req) => {
  const url = new URL(req.url);
  const email = url.searchParams.get('email');
  const name = url.searchParams.get('name') || 'Email Contact';

  if (!email) {
    return new Response('Missing email parameter', { status: 400 });
  }

  const cleanName = decodeURIComponent(name).replace(/[\r\n:]+/g, ' ');
  const cleanEmail = decodeURIComponent(email).trim();

  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${cleanName}`,
    `N:;${cleanName};;;`,
    `EMAIL;TYPE=INTERNET:${cleanEmail}`,
    'ORG:UserVault',
    'END:VCARD'
  ].join('\r\n');

  return new Response(vcard, {
    status: 200,
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `inline; filename="${cleanName}.vcf"`,
      'Cache-Control': 'no-cache, no-store',
    },
  });
};
