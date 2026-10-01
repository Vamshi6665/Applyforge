// Word-level diff (LCS) so the chat can show exactly what a revision changed.

const tokenize = (s) => String(s).match(/\s+|[^\s]+/g) || [];

export function wordDiff(before = '', after = '') {
  const a = tokenize(before);
  const b = tokenize(after);
  // Guard against huge inputs: fall back to a whole replace.
  if (a.length * b.length > 400000) {
    return [
      { type: 'del', text: before },
      { type: 'add', text: after },
    ];
  }
  const dp = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out = [];
  const push = (type, text) => {
    const last = out[out.length - 1];
    if (last && last.type === type) last.text += text;
    else out.push({ type, text });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push('same', a[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push('del', a[i++]);
    } else {
      push('add', b[j++]);
    }
  }
  while (i < a.length) push('del', a[i++]);
  while (j < b.length) push('add', b[j++]);
  return out;
}

export function diffStats(parts) {
  const count = (t) => parts.filter((p) => p.type === t).reduce((n, p) => n + (p.text.trim() ? p.text.trim().split(/\s+/).length : 0), 0);
  return { added: count('add'), removed: count('del') };
}
