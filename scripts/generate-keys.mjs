import crypto from 'crypto';

function base64url(str) {
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function generateJWT(role, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    role: role,
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 years
  };
  
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  const signature = crypto.createHmac('sha256', secret).update(signatureInput).digest();
  const encodedSignature = base64url(signature);
  
  return `${signatureInput}.${encodedSignature}`;
}

const secret = 'kXPb4RiIDexqzI0QztZDZyf6semyL18G2k5RGJi2';
console.log('ANON_KEY:', generateJWT('anon', secret));
console.log('SERVICE_ROLE_KEY:', generateJWT('service_role', secret));
