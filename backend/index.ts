import { router, json, error, requireAuth } from '@appdeploy/sdk';
import { db } from '@appdeploy/sdk';

type Body = Record<string, unknown>;
const resources = [
  'properties',
  'units',
  'tenants',
  'leases',
  'payments',
  'expenses',
  'maintenance',
] as const;
type Resource = (typeof resources)[number];

function table(userId: string, resource: Resource) {
  return userId + ':' + resource;
}
function body(ctx: any): Body {
  return (ctx.body || {}) as Body;
}

async function list(ctx: any, resource: Resource) {
  const result = await db.list<Body>(table(ctx.user!.userId, resource), {
    limit: 100,
  });
  return json({ items: result.items, nextToken: result.nextToken });
}
async function create(ctx: any, resource: Resource) {
  const b = body(ctx);
  const [id] = await db.add(table(ctx.user!.userId, resource), [
    { ...b, createdAt: new Date().toISOString() },
  ]);
  if (!id) return error('Unable to create record', 500);
  return json({ id });
}
async function update(ctx: any, resource: Resource) {
  const id = ctx.params.id;
  const existing = await db.get<Body>(table(ctx.user!.userId, resource), [id]);
  if (!existing[0]) return error('Record not found', 404);
  const ok = await db.update(table(ctx.user!.userId, resource), [
    {
      id,
      record: {
        ...existing[0],
        ...body(ctx),
        updatedAt: new Date().toISOString(),
      },
    },
  ]);
  return ok[0] ? json({ ok: true }) : error('Unable to update record', 500);
}
async function remove(ctx: any, resource: Resource) {
  const ok = await db.delete(table(ctx.user!.userId, resource), [
    ctx.params.id,
  ]);
  return ok[0] ? json({ ok: true }) : error('Record not found', 404);
}

const routes: any = {};
for (const resource of resources) {
  routes['GET /api/' + resource] = [
    requireAuth(),
    async ctx => list(ctx, resource),
  ];
  routes['POST /api/' + resource] = [
    requireAuth(),
    async ctx => create(ctx, resource),
  ];
  routes['PUT /api/' + resource + '/:id'] = [
    requireAuth(),
    async ctx => update(ctx, resource),
  ];
  routes['DELETE /api/' + resource + '/:id'] = [
    requireAuth(),
    async ctx => remove(ctx, resource),
  ];
}
routes['GET /api/_healthcheck'] = [async () => json({ message: 'Success' })];

export const handler = router(routes);
