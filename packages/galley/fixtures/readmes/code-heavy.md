# code-heavy

Multiple fenced blocks with long lines across languages. Code scrolls inside its
own block; it never widens the page.

```ts
export function build(register: Register, options: { measure: number; density: "compact" | "comfortable" | "spacious" }): string { return emitCss(register, ":root") + "/* a trailing comment that runs the line well past the right edge of a normal reading column */"; }
```

```bash
docker run --rm -it -v "$(pwd)":/workspace -e SOME_VERY_LONG_ENVIRONMENT_VARIABLE_NAME=some_equally_long_value ghcr.io/example/image:latest --flag-one --flag-two --flag-three
```

```json
{ "aLongKey": "aLongValue", "nested": { "deeper": { "deeperStill": "and a string value that keeps going past where the column ends" } } }
```
