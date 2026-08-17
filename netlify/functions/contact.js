// Netlify Serverless Function: Serves a .vcf vCard file with correct Content-Type
// so that iOS Safari and Android Chrome automatically open the native Contacts app.

export default async (req) => {
  const url = new URL(req.url);
  const email = url.searchParams.get('email');
  const name = url.searchParams.get('name') || 'Contact';

  if (!email) {
    return new Response('Missing email parameter', { status: 400 });
  }

  const cleanName = decodeURIComponent(name).replace(/[\r\n:]+/g, ' ');
  const cleanEmail = decodeURIComponent(email).trim();

  // Generate valid vCard 3.0 string with UTF-8
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN;CHARSET=UTF-8:${cleanName}`,
    `N;CHARSET=UTF-8:;${cleanName};;;`,
    `EMAIL;TYPE=INTERNET,PREF:${cleanEmail}`,
    'ORG:UserVault',
    'END:VCARD'
  ].join('\r\n');

  const encodedFilename = encodeURIComponent(cleanName);

  return new Response(vcard, {
    status: 200,
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `inline; filename="contact.vcf"; filename*=UTF-8''${encodedFilename}.vcf`,
      'Cache-Control': 'no-cache, no-store',
      'Access-Control-Allow-Origin': '*'
    },
  });
};
