// Static content for the seeded `octo-org/theme-playground` repository.
// Everything here is plain data; tools/seed/seed.mjs decides when to write it.
import zlib from 'node:zlib';

// ---------------------------------------------------------------- binary helpers

/** Minimal RGBA PNG encoder (no deps). pixel(x, y) -> [r, g, b, a] */
export function makePng(width, height, pixel) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixel(x, y);
      const o = row + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Abstract "tile" logo: rounded square with diagonal bands. variant changes the palette. */
export function logoPng(size = 96, variant = 0) {
  const palettes = [
    [[31, 111, 235], [130, 80, 223], [26, 127, 55]],
    [[207, 34, 46], [191, 135, 0], [9, 105, 218]],
  ];
  const pal = palettes[variant % palettes.length];
  const r = size * 0.18;
  return makePng(size, size, (x, y) => {
    const cx = Math.min(Math.max(x, r), size - 1 - r);
    const cy = Math.min(Math.max(y, r), size - 1 - r);
    const inside = (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
    if (!inside) return [0, 0, 0, 0];
    const band = Math.floor(((x + y) / (size * 2)) * 3) % 3;
    const c = pal[band];
    const ring = Math.hypot(x - size / 2, y - size / 2);
    if (ring < size * 0.2) return [255, 255, 255, 255];
    return [c[0], c[1], c[2], 255];
  });
}

export function avatarPng(seed, size = 128) {
  // deterministic 5x5 symmetric identicon-ish avatar (not an image of anything real)
  let h = 2166136261;
  for (const ch of seed) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const color = [(h >> 16) & 0xff, (h >> 8) & 0xff, h & 0xff].map((v) => 60 + (v % 160));
  const cells = [];
  for (let i = 0; i < 15; i++) cells.push(((h >> i) & 1) === 1);
  const cell = size / 5;
  return makePng(size, size, (x, y) => {
    let cx = Math.floor(x / cell); const cy = Math.floor(y / cell);
    if (cx > 2) cx = 4 - cx;
    return cells[cy * 3 + cx] ? [...color, 255] : [240, 242, 245, 255];
  });
}

/** Minimal ustar writer. entries: [{ name, content: Buffer|string, mode? }] */
export function makeTar(entries) {
  const blocks = [];
  const mtime = Math.floor(Date.UTC(2026, 0, 1) / 1000);
  for (const e of entries) {
    const body = Buffer.isBuffer(e.content) ? e.content : Buffer.from(e.content);
    const h = Buffer.alloc(512);
    const put = (str, off, len) => h.write(str, off, len, 'ascii');
    const oct = (n, len) => n.toString(8).padStart(len - 1, '0') + '\0';
    put(e.name, 0, 100);
    put(oct(e.mode ?? 0o644, 8), 100, 8);
    put(oct(0, 8), 108, 8);
    put(oct(0, 8), 116, 8);
    put(oct(body.length, 12), 124, 12);
    put(oct(mtime, 12), 136, 12);
    put('        ', 148, 8);
    put('0', 156, 1);
    put('ustar\0', 257, 6);
    put('00', 263, 2);
    let sum = 0; for (const b of h) sum += b;
    put(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8);
    blocks.push(h, body, Buffer.alloc((512 - (body.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return Buffer.concat(blocks);
}

// ---------------------------------------------------------------- text files

export const DIAGRAM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="120" viewBox="0 0 320 120">
  <rect x="1" y="1" width="318" height="118" rx="10" fill="#f6f8fa" stroke="#d0d7de"/>
  <rect x="20" y="35" width="80" height="50" rx="6" fill="#ddf4ff" stroke="#54aeff"/>
  <text x="60" y="65" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#0969da">tokens</text>
  <path d="M100 60 H130" stroke="#8c959f" stroke-width="2" marker-end="url(#a)"/>
  <rect x="130" y="35" width="80" height="50" rx="6" fill="#dafbe1" stroke="#4ac26b"/>
  <text x="170" y="65" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#1a7f37">theme</text>
  <path d="M210 60 H240" stroke="#8c959f" stroke-width="2" marker-end="url(#a)"/>
  <rect x="240" y="35" width="60" height="50" rx="6" fill="#fff8c5" stroke="#d4a72c"/>
  <text x="270" y="65" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#9a6700">UI</text>
  <defs><marker id="a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8c959f"/></marker></defs>
</svg>
`;

export function readme({ firstSha = null } = {}) {
  const shaLine = firstSha
    ? `The very first commit was ${firstSha} (short form: ${firstSha.slice(0, 7)}).`
    : 'The very first commit SHA will be referenced here once history exists.';
  return `# Theme Playground

A seeded repository that exercises **every** GitHub-flavored Markdown feature, so a theme can be compared page-by-page.
It is maintained by @alice-dev and @bob-dev (team \`octo-org/core\`). Tracking issue: #1.

<!-- theme-seed: this README is generated by tools/seed/seed.mjs. This HTML comment must not render. -->

## Table of contents

- [Headings](#headings)
- [Text](#text)
- [Lists](#lists)
- [Tables](#tables)
- [Alerts](#alerts)
- [Code](#code)
- [Media](#media)
- [Extras](#extras)

## Headings

# Heading level 1
## Heading level 2
### Heading level 3
#### Heading level 4
##### Heading level 5
###### Heading level 6

Alternate H1
============

Alternate H2
------------

## Text

Plain paragraph with **bold**, *italic*, ***bold italic***, __underscore bold__, _underscore italic_,
~~strikethrough~~, \`inline code\`, <ins>underlined via ins</ins>, <mark>highlighted</mark>, and a
hard line break right here\\
followed by the next line. Subscript H<sub>2</sub>O and superscript E = mc<sup>2</sup>.
Keyboard: press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> to open the command palette, <kbd>⌘</kbd> <kbd>K</kbd> on macOS.

Emoji shortcodes: :tada: :rocket: :art: :bug: :white_check_mark: :warning: :+1: — and unicode emoji 🎨 ✨.

Mentions and references: @alice-dev, @carol-ops, @dave-qa, team @octo-org/core, issue #1, pull request #16,
cross-repo octo-org/grex#1, and a commit reference. ${shaLine}

Links: [inline link](https://gitea.com), [relative link to docs](docs/guide/getting-started.md),
[link with title](https://example.com "Example title"), [reference link][ref], and autolinks
https://example.org/autolinked/path?query=1 and <https://example.net>. Email: <hello@example.com>.

[ref]: https://example.com/reference "Reference-style link"

> A blockquote with **formatting** and \`code\`.
>
> > A nested blockquote.
>
> — someone thoughtful

## Lists

1. First ordered item
2. Second ordered item
   1. Nested ordered item
   2. Another nested item
      - Deeply nested bullet
      - Another deep bullet
3. Third ordered item

- Unordered item
- Unordered item with a paragraph

  This paragraph belongs to the list item above.
  * Nested star bullet
    + Nested plus bullet

Task list:

- [x] Seed users and organizations
- [x] Migrate reference repositories
- [ ] Capture screenshots on both sites
  - [x] Nested completed task
  - [ ] Nested open task
- [ ] Compare pixel diffs

## Tables

| Left aligned | Centered | Right aligned | Code |
| :----------- | :------: | ------------: | ---- |
| apples       |    🍎    |          1.00 | \`fg.default\` |
| bananas      |    🍌    |         12.50 | \`canvas.subtle\` |
| a much longer cell that wraps around when the viewport is narrow | ✓ | 1,234,567.89 | \`border.muted\` |
| **bold** | *italic* | ~~struck~~ | [link](#tables) |

Table without alignment:

Token | Light | Dark
--- | --- | ---
\`canvas.default\` | \`#ffffff\` | \`#0d1117\`
\`fg.muted\` | \`#59636e\` | \`#9198a1\`

## Alerts

> [!NOTE]
> Useful information that users should know, even when skimming content.

> [!TIP]
> Helpful advice for doing things better or more easily.

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.

## Code

Go:

\`\`\`go
package main

import "fmt"

// Greet returns a friendly greeting.
func Greet(name string) string {
	return fmt.Sprintf("Hello, %s!", name)
}
\`\`\`

TypeScript:

\`\`\`ts
export interface Token { name: string; value: string; mode?: 'light' | 'dark' }

export const resolve = (tokens: Token[], name: string): string | undefined =>
  tokens.find((t) => t.name === name)?.value;
\`\`\`

Python:

\`\`\`python
from dataclasses import dataclass

@dataclass
class Palette:
    name: str
    colors: dict[str, str]

    def contrast(self, a: str, b: str) -> float:
        return 4.5  # TODO: compute WCAG contrast
\`\`\`

Diff:

\`\`\`diff
- color: #24292f;
+ color: var(--fgColor-default);
  background: var(--bgColor-default);
\`\`\`

JSON:

\`\`\`json
{
  "name": "theme-playground",
  "private": true,
  "tokens": { "fg": "#1f2328", "bg": "#ffffff" }
}
\`\`\`

Bash:

\`\`\`bash
#!/usr/bin/env bash
set -euo pipefail
for f in web/styles/*.css; do
  echo "linting $f"
done
\`\`\`

Code block without a language:

\`\`\`
plain preformatted text
    keeps   its   spacing
\`\`\`

Indented code block:

    indented code block line 1
    indented code block line 2

## Media

Local PNG image: ![Playground logo](assets/images/logo.png)

Local SVG via HTML with explicit width:

<img src="assets/images/diagram.svg" alt="Tokens flow into the theme and then the UI" width="320">

<p align="center">
  <img src="assets/images/logo.png" alt="Centered logo" width="48" height="48">
</p>

## Extras

<details>
<summary>Click to expand a collapsed section</summary>

Hidden content with a list:

- one
- two

\`\`\`json
{ "collapsed": true }
\`\`\`

</details>

<details open>
<summary><strong>An expanded details block</strong></summary>

This one is open by default.

</details>

Definition-style HTML:

<dl>
  <dt>Design token</dt>
  <dd>A named value (color, spacing, radius) that the theme resolves at runtime.</dd>
  <dt>Primer</dt>
  <dd>GitHub's design system; referenced for comparison only.</dd>
</dl>

Inline math: $E = mc^2$ and $\\sqrt{a^2 + b^2}$.

Display math:

$$
\\int_{0}^{\\infty} e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}
$$

Math code block:

\`\`\`math
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
\`\`\`

Mermaid diagram:

\`\`\`mermaid
flowchart LR
    A[Design tokens] --> B{Mode?}
    B -->|light| C[Light theme]
    B -->|dark| D[Dark theme]
    C --> E[Screenshots]
    D --> E
\`\`\`

Footnotes: here is a statement that needs a citation[^1] and another one[^note].

[^1]: The first footnote.
[^note]: A named footnote with **formatting** and a [link](https://example.com).

A very long line to test wrapping: Loremipsumdolorsitametconsecteturadipiscingelitseddoeiusmodtemporincididuntutlaboreetdoloremagnaaliqua_Utenimadminimveniamquisnostrudexercitationullamcolaborisnisiutaliquipexeacommodoconsequat and then normal words continue so the paragraph keeps flowing across the available width of the markdown container without any manual breaks at all.

Horizontal rules:

---

***

___

Escaped characters: \\*not italic\\*, \\# not a heading, \\\`not code\\\`.

Line with trailing HTML entity: &copy; 2026 octo-org &mdash; &lt;seeded&gt;.
`;
}

export const LICENSE = `MIT License

Copyright (c) 2026 octo-org (seeded test data)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

export const MAIN_GO = `package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"example.com/octo-org/theme-playground/internal/render"
	"example.com/octo-org/theme-playground/internal/theme"
)

// version is overridden at build time via -ldflags.
var version = "dev"

func main() {
	mode := flag.String("mode", "light", "color mode: light or dark")
	input := flag.String("in", "README.md", "markdown file to render")
	showVersion := flag.Bool("version", false, "print version and exit")
	flag.Parse()

	if *showVersion {
		fmt.Println("theme-playground", version)
		return
	}

	data, err := os.ReadFile(*input)
	if err != nil {
		log.Fatalf("read %s: %v", *input, err)
	}

	palette := theme.Lookup(*mode)
	html, err := render.Markdown(data, render.Options{Palette: palette})
	if err != nil {
		log.Fatalf("render: %v", err)
	}
	fmt.Println(string(html))
}
`;

export const RENDER_GO = `package render

import (
	"bytes"
	"errors"
	"strings"

	"example.com/octo-org/theme-playground/internal/theme"
)

// Options control how markdown is rendered.
type Options struct {
	Palette theme.Palette
	// Unsafe allows raw HTML to pass through untouched.
	Unsafe bool
}

// ErrEmpty is returned when the input is empty.
var ErrEmpty = errors.New("render: empty input")

// Markdown converts a (very small) subset of markdown into HTML.
func Markdown(src []byte, opts Options) ([]byte, error) {
	if len(bytes.TrimSpace(src)) == 0 {
		return nil, ErrEmpty
	}
	var out strings.Builder
	out.WriteString("<article style=\\"color:" + opts.Palette.Foreground + "\\">")
	for _, line := range strings.Split(string(src), "\\n") {
		switch {
		case strings.HasPrefix(line, "# "):
			out.WriteString("<h1>" + escape(line[2:]) + "</h1>")
		case strings.HasPrefix(line, "## "):
			out.WriteString("<h2>" + escape(line[3:]) + "</h2>")
		case strings.TrimSpace(line) == "":
			continue
		default:
			out.WriteString("<p>" + escape(line) + "</p>")
		}
	}
	out.WriteString("</article>")
	return []byte(out.String()), nil
}

func escape(s string) string {
	r := strings.NewReplacer("&", "&amp;", "<", "&lt;", ">", "&gt;")
	return r.Replace(s)
}
`;

export const RENDER_TEST_GO = `package render

import (
	"strings"
	"testing"

	"example.com/octo-org/theme-playground/internal/theme"
)

func TestMarkdownHeading(t *testing.T) {
	html, err := Markdown([]byte("# Title"), Options{Palette: theme.Lookup("light")})
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(html), "<h1>Title</h1>") {
		t.Fatalf("unexpected output: %s", html)
	}
}

func TestMarkdownEmpty(t *testing.T) {
	if _, err := Markdown(nil, Options{}); err != ErrEmpty {
		t.Fatalf("want ErrEmpty, got %v", err)
	}
}
`;

export const PALETTE_GO = `package theme

// Palette is a tiny set of named colors.
type Palette struct {
	Name       string
	Foreground string
	Background string
	Accent     string
	Muted      string
}

var palettes = map[string]Palette{
	"light": {Name: "light", Foreground: "#1f2328", Background: "#ffffff", Accent: "#0969da", Muted: "#59636e"},
	"dark":  {Name: "dark", Foreground: "#f0f6fc", Background: "#0d1117", Accent: "#4493f8", Muted: "#9198a1"},
}

// Lookup returns the palette for a mode, falling back to light.
func Lookup(mode string) Palette {
	if p, ok := palettes[mode]; ok {
		return p
	}
	return palettes["light"]
}
`;

export const APP_TS = `import { Button } from './components/Button';

type Mode = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'playground:mode';

export function currentMode(): Mode {
  const stored = localStorage.getItem(STORAGE_KEY) as Mode | null;
  return stored ?? 'auto';
}

export function applyMode(mode: Mode): void {
  const resolved =
    mode === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode;
  document.documentElement.dataset.colorMode = resolved;
  localStorage.setItem(STORAGE_KEY, mode);
}

export function mount(root: HTMLElement): void {
  const toggle = Button({ label: 'Toggle theme', onClick: () => applyMode(currentMode() === 'dark' ? 'light' : 'dark') });
  root.append(toggle);
  applyMode(currentMode());
}
`;

export const BUTTON_TSX = `import type { JSX } from 'react';

export interface ButtonProps {
  label: string;
  variant?: 'default' | 'primary' | 'danger' | 'invisible';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({ label, variant = 'default', size = 'medium', disabled, onClick }: ButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className={\`btn btn-\${variant} btn-\${size}\`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
`;

export const MAIN_CSS = `:root {
  --fg-default: #1f2328;
  --fg-muted: #59636e;
  --bg-default: #ffffff;
  --bg-subtle: #f6f8fa;
  --border-default: #d1d9e0;
  --accent: #0969da;
  --radius: 6px;
}

[data-color-mode='dark'] {
  --fg-default: #f0f6fc;
  --fg-muted: #9198a1;
  --bg-default: #0d1117;
  --bg-subtle: #151b23;
  --border-default: #3d444d;
  --accent: #4493f8;
}

body {
  margin: 0;
  color: var(--fg-default);
  background: var(--bg-default);
  font: 14px/1.5 -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
}

.btn {
  padding: 5px 16px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius);
  background: var(--bg-subtle);
  color: var(--fg-default);
}

.btn-primary {
  background: #1f883d;
  border-color: rgba(31, 35, 40, 0.15);
  color: #fff;
}
`;

export const BUILD_SH = `#!/usr/bin/env bash
# Build the playground binary and web assets.
set -euo pipefail

ROOT="$(cd "$(dirname "\${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="\${VERSION:-$(git -C "$ROOT" describe --tags --always 2>/dev/null || echo dev)}"

echo "==> building theme-playground \${VERSION}"
go build -ldflags "-X main.version=\${VERSION}" -o "$ROOT/dist/playground" "$ROOT/cmd/playground"

if command -v npm >/dev/null; then
  echo "==> building web assets"
  (cd "$ROOT" && npm run build --silent)
fi

echo "==> done"
`;

export const RELEASE_PY = `#!/usr/bin/env python3
"""Create release notes from the CHANGELOG."""

from __future__ import annotations

import re
import sys
from pathlib import Path

CHANGELOG = Path(__file__).resolve().parent.parent / "CHANGELOG.md"
HEADER = re.compile(r"^## \\[(?P<version>[^\\]]+)\\]")


def notes_for(version: str) -> str:
    lines: list[str] = []
    capture = False
    for line in CHANGELOG.read_text(encoding="utf-8").splitlines():
        match = HEADER.match(line)
        if match:
            if capture:
                break
            capture = match.group("version") == version
            continue
        if capture:
            lines.append(line)
    return "\\n".join(lines).strip()


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: release.py <version>", file=sys.stderr)
        return 2
    print(notes_for(argv[1]) or f"No notes for {argv[1]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
`;

export const LIB_RS = `//! Contrast helpers used by the playground's CLI.

/// Relative luminance per WCAG 2.x.
pub fn luminance(rgb: [u8; 3]) -> f64 {
    let channel = |c: u8| {
        let c = c as f64 / 255.0;
        if c <= 0.03928 { c / 12.92 } else { ((c + 0.055) / 1.055).powf(2.4) }
    };
    0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])
}

/// Contrast ratio between two colors, always >= 1.0.
pub fn contrast(a: [u8; 3], b: [u8; 3]) -> f64 {
    let (la, lb) = (luminance(a), luminance(b));
    let (hi, lo) = if la > lb { (la, lb) } else { (lb, la) };
    (hi + 0.05) / (lo + 0.05)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn black_on_white_is_21() {
        let ratio = contrast([0, 0, 0], [255, 255, 255]);
        assert!((ratio - 21.0).abs() < 0.01);
    }
}
`;

export const SCHEMA_SQL = `-- Schema for storing theme snapshots.
CREATE TABLE IF NOT EXISTS snapshots (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    route       TEXT    NOT NULL,
    mode        TEXT    NOT NULL CHECK (mode IN ('light', 'dark')),
    width       INTEGER NOT NULL DEFAULT 1280,
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snapshots_route ON snapshots (route, mode);

SELECT route, COUNT(*) AS captures
FROM snapshots
GROUP BY route
ORDER BY captures DESC;
`;

export const SETTINGS_JSON = `{
  "$schema": "./settings.schema.json",
  "theme": {
    "default": "auto",
    "modes": ["light", "dark"],
    "contrast": "normal"
  },
  "editor": {
    "tabSize": 2,
    "wordWrap": true
  },
  "features": {
    "mermaid": true,
    "math": true
  }
}
`;

export const APP_YAML = `# Application configuration
server:
  host: 0.0.0.0
  port: 8080
  read_timeout: 15s
theme:
  default_mode: auto
  allowed:
    - light
    - dark
    - high-contrast
logging:
  level: info
  format: json
`;

export const PACKAGE_JSON = `{
  "name": "theme-playground",
  "version": "1.0.0",
  "private": true,
  "description": "Seeded playground repository for theme screenshots",
  "type": "module",
  "scripts": {
    "build": "tsc -p .",
    "lint": "eslint web/src"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
`;

export const GO_MOD = `module example.com/octo-org/theme-playground

go 1.23
`;

export const MAKEFILE = `.PHONY: build test lint clean

VERSION ?= $(shell git describe --tags --always 2>/dev/null || echo dev)

build:
\tgo build -ldflags "-X main.version=$(VERSION)" -o dist/playground ./cmd/playground

test:
\tgo test ./...

lint:
\tgofmt -l .

clean:
\trm -rf dist
`;

export const DOCKERFILE = `FROM golang:1.23-alpine AS build
WORKDIR /src
COPY . .
RUN go build -o /out/playground ./cmd/playground

FROM alpine:3.20
COPY --from=build /out/playground /usr/local/bin/playground
ENTRYPOINT ["playground"]
`;

export const GITIGNORE = `dist/
node_modules/
*.log
.DS_Store
`;

export const EDITORCONFIG = `root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true

[*.go]
indent_style = tab

[Makefile]
indent_style = tab
`;

export const GETTING_STARTED_MD = `# Getting started

Welcome to the theme playground. This guide walks you through the basics.

## Requirments

- Go 1.23 or newer
- Node.js 20 or newer (optional, for the web assets)

## Instalation

\`\`\`bash
git clone http://localhost:3000/octo-org/theme-playground.git
cd theme-playground
make build
\`\`\`

## Usage

Run \`./dist/playground -mode dark -in README.md\` to render the README with the dark palette.
`;

export const CONFIGURATION_MD = `# Configuration

Configuration lives in \`config/app.yaml\` and \`config/settings.json\`.

| Key | Type | Default | Description |
| --- | ---- | ------- | ----------- |
| \`theme.default_mode\` | string | \`auto\` | Initial color mode |
| \`server.port\` | int | \`8080\` | HTTP port |
| \`logging.level\` | string | \`info\` | One of debug, info, warn, error |
`;

export const ENDPOINTS_MD = `# API v1 endpoints

## \`GET /api/v1/palettes\`

Returns every palette.

\`\`\`json
[{ "name": "light" }, { "name": "dark" }]
\`\`\`

## \`GET /api/v1/palettes/{name}\`

Returns one palette or \`404\`.
`;

export const CHANGELOG_MD = `# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Added
- Design token refactor (#16)

## [1.0.0] - 2026-09-01

### Added
- Markdown showcase README
- Dark palette

### Fixed
- Typos in the getting started guide (#17)

## [0.9.0] - 2026-08-01

### Added
- Initial project skeleton
`;

export const CI_YML = `name: CI

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:
    inputs:
      reason:
        description: Why are you running this workflow?
        required: false
        default: manual run from the seed script

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Show environment
        run: |
          echo "event:  \${{ github.event_name }}"
          echo "ref:    \${{ github.ref }}"
          echo "sha:    \${{ github.sha }}"
          uname -a
          cat /etc/os-release | head -n 3
      - name: Lint markdown (simulated)
        run: |
          for f in README.md CHANGELOG.md docs/guide/getting-started.md; do
            echo "checking $f ... ok"
          done
          echo "::notice title=Lint::All markdown files look fine"

  test:
    name: Test (node \${{ matrix.node }})
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        node: [18, 20, 22]
    steps:
      - name: Pretend to install node \${{ matrix.node }}
        run: echo "using node \${{ matrix.node }}"
      - name: Run unit tests
        run: |
          echo "::group::go test ./..."
          for pkg in internal/render internal/theme cmd/playground; do
            echo "ok   example.com/octo-org/theme-playground/$pkg  0.0\${RANDOM:0:1}s"
          done
          echo "::endgroup::"
          echo "PASS"

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint]
    steps:
      - name: Prepare
        run: mkdir -p dist && echo "prepared workspace"
      - name: Compile
        run: |
          echo "::group::compiler output"
          for i in $(seq 1 40); do
            echo "[$(printf '%02d' $i)/40] compiling module_$i.go"
          done
          echo "::endgroup::"
      - name: Package
        run: |
          echo "theme-playground build" > dist/artifact.txt
          ls -la dist
          echo "::warning file=Makefile,line=5::VERSION falls back to 'dev' when no tags exist"
      - name: Summary
        run: echo "Build finished at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

  flaky:
    name: Visual regression (fails on purpose)
    runs-on: ubuntu-latest
    steps:
      - name: Compare screenshots
        run: |
          echo "comparing 42 screenshots..."
          echo "::error file=web/styles/main.css,line=24::3 screenshots differ by more than 0.1%"
          exit 1
`;

/** ~800 line generated Go file used for large file view / blame / diff context. */
export function largeGo(variant = 0) {
  const lines = [
    '// Code generated by tools/gen-palette. DO NOT EDIT.',
    '',
    'package palette',
    '',
    '// Swatch is one generated color swatch.',
    'type Swatch struct {',
    '\tName  string',
    '\tHex   string',
    '\tLight bool',
    '}',
    '',
    '// Swatches is the full generated table.',
    'var Swatches = []Swatch{',
  ];
  const hues = ['gray', 'blue', 'green', 'yellow', 'orange', 'red', 'purple', 'pink', 'coral', 'teal'];
  for (let i = 0; i < 780; i++) {
    const hue = hues[i % hues.length];
    const step = String(Math.floor(i / hues.length)).padStart(3, '0');
    let v = (i * 2654435761) >>> 0;
    if (variant && i >= 380 && i < 386) v = (v ^ 0x00ff00) >>> 0; // small hunk in the middle for the big PR
    const hex = '#' + (v & 0xffffff).toString(16).padStart(6, '0');
    const light = ((v >> 16) & 0xff) + ((v >> 8) & 0xff) + (v & 0xff) > 382;
    lines.push(`\t{Name: "${hue}-${step}", Hex: "${hex}", Light: ${light}},`);
  }
  lines.push('}', '');
  lines.push('// Len returns the number of swatches.', 'func Len() int { return len(Swatches) }', '');
  return lines.join('\n');
}

export const WIKI_PAGES = [
  {
    title: 'Home',
    content: `# Theme Playground wiki

Welcome! This wiki is seeded for theme screenshots.

- [[Getting-Started]]
- [[Architecture]]
- [[FAQ]]

> [!TIP]
> Wiki pages support the same markdown as the README.
`,
  },
  {
    title: 'Getting-Started',
    content: `# Getting started

1. Clone the repository
2. Run \`make build\`
3. Open \`dist/playground\`

| Step | Command |
| ---- | ------- |
| Build | \`make build\` |
| Test | \`make test\` |
`,
  },
  {
    title: 'Architecture',
    content: `# Architecture

\`\`\`mermaid
graph TD
  tokens --> theme --> components --> pages
\`\`\`

The renderer lives in \`internal/render\`, palettes in \`internal/theme\`.
`,
  },
  {
    title: 'FAQ',
    content: `# FAQ

<details>
<summary>Why a playground?</summary>

To compare every page of a theme against a reference.

</details>

**Q:** Is this real data?
**A:** No, it is seeded by \`tools/seed/seed.mjs\`.
`,
  },
  {
    title: '_Sidebar',
    content: `**Pages**

- [[Home]]
- [[Getting-Started]]
- [[Architecture]]
- [[FAQ]]
`,
  },
];
