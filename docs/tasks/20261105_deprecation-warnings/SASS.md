# Sass deprecations

## Changes and rationale

- Replace deprecated Sass `@import` with `@use ... as *` for existing variables,
  mixins, and CSS modules. Replace absolute `/src/` imports with relative paths
  to work consistently with the supported Angular builder.
- Use `sass:meta`'s `load-css` at the original import position in global styles
  and the Leaflet stylesheet. Moving those imports above their existing rules
  would change stylesheet ordering. No declarations or selector precedence were
  changed.
- Replace each `darken($color, N%)` with
  `color.adjust($color, $lightness: -N%, $space: hsl)`. This preserves the exact
  legacy lightness adjustment; `color.scale` would produce different colors.
- Sass modules emit shared photo-viewer keyframes once rather than repeating
  identical keyframes for every partial. Each removed copy is identical; the
  animation names, timing, and CSS declarations are unchanged.

Primary references: [Sass import migration](https://sass-lang.com/documentation/breaking-changes/import/),
[color adjustment](https://sass-lang.com/documentation/modules/color/#adjust),
and [CSS module loading](https://sass-lang.com/documentation/modules/meta/#load-css).

## Verification

Compiled all 45 repository SCSS files independently with installed Dart Sass
before and after the migration. Original absolute imports were resolved to the
local source snapshot through a test importer. The original snapshot generated
45 warning callbacks; the migrated files generated zero.

- 42 emitted stylesheets are byte-for-byte identical, including every component
  stylesheet and all three stylesheets containing `darken` calls.
- The global, photo-viewer aggregator, and Leaflet aggregator stylesheets match
  after normalizing whitespace and identical duplicate keyframes. No declaration
  or selector differences remain.
- Local evidence: `.upgrade-artifacts/deprecation-warnings/sass-baseline.json`
  and `sass-comparison.json`; these are optional, ignored local artifacts.
- Integrated Angular builds, UI regression tests, and final logs remain the
  coordinating agent's responsibility and are recorded in `PLAN.md`.

To repeat the comparison on another machine, reconstruct the original SCSS tree
from base commit `abf208623c60219292310d74a84490f13b3ac59b`, then compile it and
the current tree with the same installed `sass.compile` version. Resolve original
`/src/` imports into the reconstructed tree. Compare emitted CSS while allowing
only whitespace and identical duplicate keyframe removal.
