# jesseconis Vimium C fork

Upstream: <https://github.com/gdh1995/vimium-c>
Fork: <https://github.com/jesseconis/vimium-c>

This is a minimal clipboard compatibility fork, initially based on upstream
`318852694` (2.12.4). Keep upstream history and merge upstream updates rather
than copying packaged/minified extension files into this repository.

## Clipboard fix

On Helium 156.0.8078.47, `navigator.permissions.query({name: "clipboard-read"})`
returns `denied` inside the MV3 service worker even when `clipboardRead` is
actually granted and pasting in the offscreen extension document succeeds.
Upstream's preliminary check consequently rejects `p`/clipboard commands.

`background/frame_commands.ts` instead checks
`chrome.permissions.contains({permissions: ["clipboardRead"]})` through the
existing browser API wrapper. Missing permissions and API rejections still
fail closed. The document's real clipboard operation remains subject to browser
security checks. Other tasks, MV2 and non-Chromium paths are unchanged.

## Build and test

Use Node 22 with npm 10 (the upstream shrinkwrap format is not supported by
npm 12). With a newer system npm, substitute `npx --yes npm@10 ci` for `npm ci`.

```sh
cd ~/gh/jesseconis/vimium-c
npm ci
npm run test:clipboard
npm run build:fork
```

Load **`dist/`**, not the repository root. The build uses upstream's Chromium
MV3 release pipeline, then applies `scripts/fork-manifest.cjs`:

- distinct name and stable extension ID: `igpefbhlndpdhagfejdgchajjfajfcma`;
- the committed public key is an identity, not a secret/signing credential;
- no Web Store update URL, so upstream updates cannot replace this patch;
- generated builds and dependencies remain ignored by Git.

The regression tests execute the actual TypeScript preflight with mocked browser
APIs: granted permission, denied permission, API rejection, paste length encoding,
and unaffected execution paths. `npm run all` runs upstream's TypeScript build.
The existing full `npm run lint` currently fails with upstream ESLint project
configuration errors (files not included in `parserOptions.project`); it is not
used as this fork's CI gate. CI tests and builds the fork and uploads `dist/`.

## Install / migrate

1. Export the original extension's settings and keep a private backup outside
   this repository. Do not commit settings, marks, clipboard data or profile files.
2. Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**,
   and select `~/gh/jesseconis/vimium-c/dist`.
3. Import settings into the fork's options page. Review optional permissions
   (bookmarks, downloads, content settings, internal browser URLs), since extension
   permissions are separate from settings and do not transfer to the new ID.
4. Match **Allow in Incognito** and file access if needed. Disable the original
   Web Store extension; do not run both simultaneously.
5. Reload existing web pages before testing `p` with a harmless copied URL.

The initial local installation was loaded through Helium's CDP API. Both local
and sync storage were privately backed up and migrated (including marks), cached
CSS/internal URLs were regenerated, and references to the original extension ID
were rewritten to the fork ID. Both storage areas must be migrated together when
sync is enabled, or an initially empty fork sync store can reset local settings.
The original extension remains installed but disabled for rollback.

## Maintain

```sh
cd ~/gh/jesseconis/vimium-c
git remote -v
# origin: git@github.com:jesseconis/vimium-c.git
# upstream: https://github.com/gdh1995/vimium-c.git
git fetch upstream
git merge upstream/master
npm ci
npm run all
npm run build:fork
git push origin master
```

Resolve any upstream conflicts, keep the regression tests, and make signed
commits. After rebuilding, press **Reload** on the fork in `chrome://extensions`,
then refresh pages. Rebuilding does not automatically reload an installed build.
Keep this checkout and its `dist/` directory in place while using it.

To roll back, disable the fork and re-enable the original in `chrome://extensions`,
then refresh pages. Original settings/storage were not removed. Once upstream
fixes the worker preflight, test it, export any newer fork settings, and migrate
back before removing the fork.
