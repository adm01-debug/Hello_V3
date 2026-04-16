import { useMemo } from 'react';

interface Props {
  text: string;
  terms?: string[];
}

export function HighlightedSnippet({ text, terms }: Props) {
  const parts = useMemo(() => {
    if (!terms || terms.length === 0) return [{ text, match: false }];
    const regex = new RegExp(`(${terms.filter(Boolean).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const segments: Array<{ text: string; match: boolean }> = [];
    let lastIndex = 0;
    let m;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > lastIndex) segments.push({ text: text.slice(lastIndex, m.index), match: false });
      segments.push({ text: m[0], match: true });
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex), match: false });
    return segments;
  }, [text, terms]);

  return (
    <span>
      {parts.map((p, i) =>
        p.match ? (
          <mark
            key={i}
            className="bg-primary/20 text-primary font-semibold rounded px-0.5 shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
          >
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </span>
  );
}
