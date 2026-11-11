import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local', quiet: true });
const base = process.argv[2] || 'http://localhost:8787';
const db = postgres(process.env.DATABASE_URL_UNPOOLED, { max: 1 });
const universityId = randomUUID();
const paperId = randomUUID();
const questionId = randomUUID();
const productId = randomUUID();
const email = `deploy-${randomUUID()}@example.com`;
const password = randomBytes(24).toString('base64url');
let cookie = '';

async function api(path, { method = 'GET', body, status = 200, headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { ...(cookie ? { Cookie: cookie } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  assert.equal(response.status, status, `${method} ${path} returned ${response.status}`);
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  return response.json();
}

try {
  assert.equal((await fetch(base)).status, 200);
  assert.equal((await fetch(`${base}/universities`)).status, 200);
  assert.deepEqual(await api('/api/auth/me'), { user: null });
  await api('/api/study/stats', { status: 401 });
  await api('/api/auth/register', { method: 'POST', body: { email: 'invalid' }, status: 400 });
  await api('/api/auth/register', { method: 'POST', body: { email, password, nickname: '部署验证' }, status: 201 });
  assert.equal((await api('/api/auth/me')).user.email, email);
  await api('/api/auth/logout', { method: 'POST' });
  cookie = '';
  await api('/api/auth/login', { method: 'POST', body: { email, password } });
  assert.equal((await api('/api/auth/me')).user.email, email);
  await api('/api/admin/qr-codes', { status: 403 });

  await db`insert into universities (id,name,short_name,location,description,logo_url)
    values (${universityId},'部署验证院校','验证','测试','临时验证数据','')`;
  await db`insert into exam_papers (id,university_id,year,title,description)
    values (${paperId},${universityId},2026,'部署验证套卷','临时验证数据')`;
  await db`insert into questions (id,paper_id,question_type,question_number,content,correct_answer,analysis,knowledge_point)
    values (${questionId},${paperId},'single_choice',1,'1 + 1 = ?','A','2','加法')`;
  await db`insert into question_options (question_id,option_key,content)
    values (${questionId},'A','2'),(${questionId},'B','3')`;
  const universities = await api('/api/universities');
  assert(universities.some((item) => item.id === universityId));
  assert.equal((await api(`/api/papers/${paperId}`)).questions.length, 1);
  assert.equal((await api(`/api/questions/${questionId}/submit`, {
    method: 'POST', body: { userAnswer: 'B' }, status: 201,
  })).isCorrect, false);
  await api(`/api/questions/${questionId}/favorite`, {
    method: 'POST', body: { favorite: true }, status: 201,
  });
  assert.equal((await api('/api/favorites')).total, 1);
  assert.equal((await api('/api/wrong-questions')).total, 1);
  await api('/api/study/stats');
  await db`insert into products (id,name,description,product_type,target_id,price,original_price)
    values (${productId},'部署验证商品','临时验证数据','university_bundle',${universityId},0,0)`;
  const order = await api('/api/orders', { method: 'POST', body: { productId }, status: 201 });
  assert.equal((await api(`/api/orders/${order.id}/pay`, { method: 'POST', status: 201 })).status, 'paid');
  assert.equal((await api(`/api/entitlements/check-university/${universityId}`)).unlocked, true);
  await api('/api/auth/logout', { method: 'POST', headers: { Origin: 'https://untrusted.example' }, status: 403 });
  console.log('PASS: pages, validation, registration, login, cookies, access control, questions, wrong answers, favorites, study records, payment transaction, entitlements, cross-site protection.');
} finally {
  // Remove only this run's randomly identified test records.
  await db`delete from user_entitlements where user_id in (select id from app_users where email=${email})`;
  await db`delete from orders where product_id=${productId}`;
  await db`delete from products where id=${productId}`;
  await db`delete from universities where id=${universityId}`;
  await db`delete from app_users where email=${email}`;
  await db.end({ timeout: 5 });
}
