# Distributed test vendors

The identical `three-0.186.0.min.js` files in the `three-boundary` and
`three-boundary-deferred` fixture `src/vendor` directories are IIFE builds of the
official `three@0.186.0` package. The build applies
`three-0.186.0-crypto-uuid.patch` before bundling so UUIDs use
`crypto.getRandomValues()` rather than `Math.random()`.

Rebuild from a clean temporary directory:

```powershell
npm pack three@0.186.0
tar -xf three-0.186.0.tgz
git apply --unidiff-zero <path-to-repo>/packages/producer/tests/distributed/_vendor/three-0.186.0-crypto-uuid.patch
bun x esbuild package/build/three.module.js --bundle --format=iife --global-name=THREE --minify --legal-comments=inline --outfile=<path-to-repo>/packages/producer/tests/distributed/three-boundary/src/vendor/three-0.186.0.min.js
node <path-to-repo>/packages/producer/tests/distributed/_vendor/normalize-three-vendor.mjs <path-to-repo>/packages/producer/tests/distributed/three-boundary/src/vendor/three-0.186.0.min.js
Copy-Item <path-to-repo>/packages/producer/tests/distributed/three-boundary/src/vendor/three-0.186.0.min.js <path-to-repo>/packages/producer/tests/distributed/three-boundary-deferred/src/vendor/three-0.186.0.min.js
```

Three.js is distributed under the MIT license; the generated bundle retains
the upstream license headers.
