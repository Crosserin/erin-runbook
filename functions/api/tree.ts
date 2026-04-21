interface Env { GITHUB_PAT: string }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!context.env.GITHUB_PAT) return json({ error: 'GITHUB_PAT secret not configured' }, 503);

  const r = await fetch('https://api.github.com/repos/Crosserin/erin-runbook-data/git/trees/main?recursive=1', {
    headers: {
      Authorization: `Bearer ${context.env.GITHUB_PAT}`,
      'User-Agent': 'erin-runbook',
      Accept: 'application/vnd.github+json',
    },
  });
  if (!r.ok) return json({ error: `github ${r.status}`, detail: await r.text() }, 502);

  const data: any = await r.json();
  const files = (data.tree || [])
    .filter((n: any) => n.type === 'blob' && n.path.endsWith('.md'))
    .filter((n: any) => !n.path.split('/').pop().startsWith('_') && n.path.toLowerCase() !== 'readme.md')
    .map((n: any) => ({ path: n.path, sha: n.sha, size: n.size }))
    .sort((a: any, b: any) => a.path.localeCompare(b.path));

  return json({ files, count: files.length, fetched_at: new Date().toISOString() });
};

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'max-age=30' },
  });
}