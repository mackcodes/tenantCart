import { createHmac } from 'crypto';
import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tenantcart';
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
const BASE_URL = 'http://localhost:8080/api/v1';

function base64Url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function createJWT(payload) {
  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const headerB64 = base64Url(Buffer.from(header));
  const payloadB64 = base64Url(Buffer.from(JSON.stringify(payload)));
  const signature = createHmac('sha256', JWT_SECRET).update(`${headerB64}.${payloadB64}`).digest();
  const signatureB64 = base64Url(signature);
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

console.log('Starting OpenAI SDK integration test...\n');

try {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const users = db.collection('users');
  
  console.log('Creating test user...');
  const testUserId = new ObjectId();
  const result = await users.insertOne({
    _id: testUserId,
    email: 'test-openai-sdk@example.com',
    passwordHash: 'dummy-hash',
    createdAt: new Date()
  });
  
  console.log(`✓ Test user created: ${testUserId}`);

  const token = createJWT({
    id: testUserId.toString(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  });

  console.log('Testing template generation endpoint...');
  const response = await fetch(`${BASE_URL}/templates/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description: 'A luxury fashion boutique with premium products',
      category: 'elegant'
    })
  });

  console.log('✓ HTTP Status:', response.status);
  const data = await response.json();
  
  if (response.ok) {
    console.log('✓ isAIGenerated:', data.isAIGenerated);
    console.log('✓ layout:', data.layout);
    console.log('✓ Has colors:', !!data.colors);
    console.log('✓ Has fonts:', !!data.fonts);
    console.log('✓ Has components:', !!data.components);
    console.log('\n✓ OPENAI_SDK_TEST=PASSED');
  } else {
    console.log('✗ Error:', data.error || data.message);
    console.log('\n✗ OPENAI_SDK_TEST=FAILED');
  }

  await users.deleteOne({ _id: testUserId });
  await client.close();
  process.exit(response.ok ? 0 : 1);
} catch (error) {
  console.error('✗ Error:', error.message);
  console.log('\n✗ OPENAI_SDK_TEST=FAILED');
  process.exit(1);
}
