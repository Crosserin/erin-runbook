interface Env { GITHUB_PAT: string }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!context.env.GITHUB_PAT) return new Response('GITHUB_PAT not configured', { status: 503 });

  const url = new URL(context.request.url);
  const pathParam = url.searchParams.get('path');
  if (!pathParam || !pathParam.endsWith('.md')) return new Response('bad path', { status: 400 });
  if (pathParam.includes('..') || pathParam.startsWith('/')) return new Response('nope', { status: 400 });

  const ghUrl = `https://api.github.com/repos/Crosserin/erin-runbook-data/contents/${pathParam.split('/').map(encodeURIComponent).join('/')}`;
  const r = await fetch(ghUrl, {
    headers: {
      Authorization: `Bearer ${context.env.GITHUB_PAT}`,
      'User-Agent': 'erin-runbook',
      Accept: 'application/vnd.github.raw',
    },
  });
  if (!r.ok) return new Response(`github ${r.status}`, { status: 502 });

  const text = await r.text();
  return new Response(text, {
    headers: { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'max-age=30' },
  });
};