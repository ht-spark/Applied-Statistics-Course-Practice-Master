import 'reflect-metadata';
import { httpServerHandler } from 'cloudflare:node';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
// Use SWC output: Nest needs emitted decorator metadata for dependency injection.
import { bootstrapWorker } from '../dist/server/cloudflare/bootstrap.js';
import { databaseContext } from '../dist/server/database/context.js';
import { configureJwtSecret } from '../dist/server/modules/auth/auth.service.js';

const nodeHandler = httpServerHandler({ port: 3000 });
let application: ReturnType<typeof bootstrapWorker> | undefined;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (!env.JWT_SECRET) return Response.json({ error: { message: '服务配置不完整' } }, { status: 503 });
    configureJwtSecret(env.JWT_SECRET);

    // Cookies are same-origin only. Reject cross-site writes before forwarding.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const origin = request.headers.get('origin');
      if ((origin && origin !== url.origin) ||
          request.headers.get('sec-fetch-site') === 'cross-site') {
        return Response.json({ error: { message: '不允许跨站请求' } }, { status: 403 });
      }
    }

    application ??= bootstrapWorker().catch((error: unknown) => {
      application = undefined;
      throw error;
    });

    const client = postgres(env.HYPERDRIVE.connectionString, {
      max: 5,
      fetch_types: false,
      prepare: true,
      connect_timeout: 15,
    });
    try {
      await application;
      const response = await databaseContext.run(drizzle(client), () =>
        nodeHandler.fetch(request, env, ctx));
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-store');
      headers.set('X-Content-Type-Options', 'nosniff');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      console.error('API request failed', error instanceof Error ? error.message : 'Unknown error');
      return Response.json({ error: { message: '服务暂时不可用，请稍后重试' } }, { status: 503 });
    } finally {
      ctx.waitUntil(client.end({ timeout: 5 }));
    }
  },
} satisfies ExportedHandler<Env>;
