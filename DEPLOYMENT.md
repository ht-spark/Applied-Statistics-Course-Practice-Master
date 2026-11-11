# Cloudflare 和 Neon 部署

正式地址：https://htspark.xyz

应用部署在 Cloudflare Workers，静态页面和 `/api/*` 使用同一域名。
NestJS 通过 Cloudflare 的 Node HTTP 适配器运行；Hyperdrive 连接 Neon
PostgreSQL，关闭查询结果缓存，保留订单及权益更新所需的数据库事务。

## 已连接资源

- Worker：`htspark-statistics-practice`
- Neon 项目：`billowing-firefly-50752344`
- Neon 分支：`production`
- Hyperdrive：`htspark-neon`
- 数据库结构：12 张业务表，迁移位于 `migrations/`

连接串和登录签名密钥只保存在被 Git 忽略的 `.env.local` / `.dev.vars`，
线上密钥使用 Cloudflare Secret。不要上传这些文件或把连接串写进前端变量。
`JWT_SECRET` 已配置；轮换它会使现有登录失效。

## 更新部署

使用 Node.js 22 或更新版本。首次安装：

```sh
npm ci --ignore-scripts
npx wrangler login
```

修改数据库结构后先生成并检查迁移，再应用：

```sh
npm run db:generate
npm run db:migrate
```

构建并部署：

```sh
npm run deploy:cloudflare
```

`scripts/build-cloudflare.mjs` 保留 Nest 所需的装饰器元数据，生成静态入口，
填充原平台的 HTML 占位符，确保路由、标题、图标均可在自定义域名工作。
它只将静态资源发布到 Workers，排除源码映射和环境文件。

`iconv-lite` 固定为 0.7.2，以兼容 Workers 对 Express 请求体解析依赖的打包。
Nest 未使用的 WebSocket 和微服务可选模块不打包到 HTTP 应用中。

## 本地验证

`.env.local` 需要 `DATABASE_URL`、`DATABASE_URL_UNPOOLED`、`JWT_SECRET`。
`.dev.vars` 需要 `JWT_SECRET`。将
`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` 设置为测试数据库连接串，
然后运行 `npx wrangler dev`。

```sh
npm run type:check
node scripts/smoke-cloudflare.mjs http://localhost:8787
```

完整检查覆盖注册登录、Cookie、权限、答题、错题、收藏、学习记录、模拟支付事务、
权益开通及跨站写入保护。检查创建临时记录，并仅删除本次检查的数据。

部署环境直连 Cloudflare 域名可能受网络影响。本次也通过 Cloudflare 远程浏览器
在正式 HTTPS 域名完成了注册、登录、答题、收藏、错题、支付和权益检查。

## 示例与管理员

已按授权写入两所虚构院校、两套示例卷、六道示例题及两个零元演示商品。
院校和题目明确标注为示例，非真实院校真题；支付仍为模拟支付。
`node scripts/seed-demo.mjs` 可以重复执行，已有示例不会覆盖或重复插入。

不提供默认管理员密码。先在网站注册，再通过 Neon SQL Editor 将指定账号设为管理员：

```sql
UPDATE app_users SET is_admin = true WHERE email = 'your-email@example.com';
```

不要将所有用户提升为管理员。刷新登录信息后，指定账号可进入后台录入真实内容。

## Neon 工具

Neon 官方初始化已连接指定项目，写入 `.neon` 和 `neon.ts`，并安装 Neon 插件。
初始化时官方最新包引用了缺失的 `@neon/config@1.14.0`；本地改用可用的
`neon@9.2.0`、`@neon/config@1.13.2`、`@neon/env@2.1.2`，
通过 `neon env pull --file .env.local --service postgres` 获取连接配置。
若需要在后续聊天使用插件提供的 Neon MCP 工具，重启 Codex 以加载插件。
