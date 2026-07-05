/**
 * `<Shelf source view? scope?>` -- collection views that make a folder or a
 * tenant's memory read like a publication. Stream (reverse-chron cards), archive
 * (year/month), tag lens, and thread (supersession lineage). Card shape follows
 * the item's kind (the recipe class), and the compose quiet rules hold: no
 * counts, no badges.
 */

import type { ReactElement } from "react";
import type { ShelfAdapter, ShelfItem, ShelfScope } from "./types.js";

export type ShelfView = "stream" | "archive" | "tag" | "thread";

export interface ShelfProps {
  source: ShelfAdapter;
  view?: ShelfView;
  scope?: ShelfScope;
  className?: string;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function parts(iso: string | undefined): { y: string; m: number; d: number } | undefined {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? { y: m[1]!, m: Number(m[2]), d: Number(m[3]) } : undefined;
}
function formatDate(iso?: string): string | undefined {
  const p = parts(iso);
  return p ? `${MONTHS[p.m - 1]} ${p.d}, ${p.y}` : iso;
}
function byDateDesc(a: ShelfItem, b: ShelfItem): number {
  return (b.date ?? "").localeCompare(a.date ?? "");
}

function Card({ item }: { item: ShelfItem }): ReactElement {
  return (
    <article className="galley-card" data-kind={item.kind}>
      <a className="galley-card-title" href={item.href ?? `#${item.id}`}>
        {item.title}
      </a>
      {item.gist ? <p className="galley-card-deck">{item.gist}</p> : null}
      <div className="galley-card-meta">
        {item.kind ? <span className="galley-card-kind">{item.kind}</span> : null}
        {item.date ? (
          <time className="galley-card-date" dateTime={item.date}>
            {formatDate(item.date)}
          </time>
        ) : null}
        {item.tags.map((t) => (
          <span key={t} className="galley-card-tag">
            {t}
          </span>
        ))}
      </div>
    </article>
  );
}

function Stream({ items }: { items: ShelfItem[] }): ReactElement {
  const sorted = [...items].sort(byDateDesc);
  return (
    <div className="galley-shelf-stream">
      {sorted.map((i) => (
        <Card key={i.id} item={i} />
      ))}
    </div>
  );
}

function Archive({ items }: { items: ShelfItem[] }): ReactElement {
  const groups = new Map<string, ShelfItem[]>();
  for (const item of [...items].sort(byDateDesc)) {
    const p = parts(item.date);
    const key = p ? `${p.y}` : "Undated";
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(item);
  }
  return (
    <div className="galley-shelf-archive">
      {[...groups.entries()].map(([year, group]) => (
        <section key={year}>
          <h2 className="galley-shelf-heading">{year}</h2>
          {group.map((i) => (
            <Card key={i.id} item={i} />
          ))}
        </section>
      ))}
    </div>
  );
}

function TagLens({ items }: { items: ShelfItem[] }): ReactElement {
  const tags = [...new Set(items.flatMap((i) => i.tags))].sort();
  return (
    <div className="galley-shelf-tags">
      {tags.map((tag) => (
        <section key={tag}>
          <h2 className="galley-shelf-heading">#{tag}</h2>
          {items
            .filter((i) => i.tags.includes(tag))
            .sort(byDateDesc)
            .map((i) => (
              <Card key={`${tag}-${i.id}`} item={i} />
            ))}
        </section>
      ))}
    </div>
  );
}

function Thread({ items, source }: { items: ShelfItem[]; source: ShelfAdapter }): ReactElement {
  const byId = new Map(items.map((i) => [i.id, i]));
  const edges = items.flatMap((i) => source.edges?.(i.id) ?? []);
  const supersedes = edges.filter((e) => e.type === "supersedes");
  const relates = edges.filter((e) => e.type === "relates");

  // A head is a current document: nothing supersedes it.
  const heads = items.filter((i) => !supersedes.some((e) => e.to === i.id));

  const predecessors = (id: string, seen = new Set<string>()): ShelfItem[] => {
    const out: ShelfItem[] = [];
    for (const e of supersedes.filter((s) => s.from === id)) {
      const prev = byId.get(e.to);
      if (prev && !seen.has(prev.id)) {
        seen.add(prev.id);
        out.push(prev, ...predecessors(prev.id, seen));
      }
    }
    return out;
  };

  const connected = (id: string): ShelfItem[] =>
    relates
      .filter((e) => e.from === id || e.to === id)
      .map((e) => byId.get(e.from === id ? e.to : e.from))
      .filter((x): x is ShelfItem => Boolean(x));

  return (
    <div className="galley-shelf-thread">
      {heads.sort(byDateDesc).map((head) => {
        const revisedFrom = predecessors(head.id);
        const links = connected(head.id);
        return (
          <section key={head.id} className="galley-thread-item">
            <Card item={head} />
            {revisedFrom.length > 0 ? (
              <p className="galley-thread-lineage">
                revised from{" "}
                {revisedFrom.map((p, idx) => (
                  <span key={p.id}>
                    {idx > 0 ? ", " : ""}
                    <a href={`#${p.id}`}>{p.title}</a>
                  </span>
                ))}
              </p>
            ) : null}
            {links.length > 0 ? (
              <p className="galley-thread-connected">
                connected:{" "}
                {links.map((c, idx) => (
                  <span key={c.id}>
                    {idx > 0 ? ", " : ""}
                    <a href={`#${c.id}`}>{c.title}</a>
                  </span>
                ))}
              </p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

export function Shelf({ source, view = "stream", scope, className }: ShelfProps): ReactElement {
  const items = source.list(scope);
  const cls = className ? `galley-shelf ${className}` : "galley-shelf";
  return (
    <div className={cls} data-view={view}>
      {view === "archive" ? (
        <Archive items={items} />
      ) : view === "tag" ? (
        <TagLens items={items} />
      ) : view === "thread" ? (
        <Thread items={items} source={source} />
      ) : (
        <Stream items={items} />
      )}
    </div>
  );
}

/** The current successor of a superseded document (for the reader's "revised" banner). */
export function successorOf(source: ShelfAdapter, id: string): ShelfItem | undefined {
  const edge = source.edges?.(id)?.find((e) => e.type === "supersedes" && e.to === id);
  return edge ? source.get(edge.from) : undefined;
}
