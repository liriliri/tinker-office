# AGENTS.md

Guidelines for developing a TINKER plugin.

## Project layout

```
src/
  common/          # Shared types and utilities
  preload/         # Node APIs (index.ts entry)
  renderer/
    main.tsx       # React entry
    store.ts       # MobX state
    mcp.ts         # MCP tool handlers (optional)
    components/    # UI components
    i18n/          # Locale strings
index.html
vite.config.ts     # Renderer build
vite.preload.ts    # Preload build
package.json
icon.png
```

## Coding style

- React + TypeScript + Tailwind.
- Small, focused components.
- Avoid unnecessary comments.

## TINKER configuration

Declare `tinker` in `package.json`:

```
"tinker": {
  "name": "Template",
  "description": "Short description shown in the plugin list",
  "main": "dist/renderer/index.html",
  "icon": "icon.png",
  "preload": "dist/preload/index.mjs",
  "locales": {
    "zh-CN": {
      "name": "模板",
      "description": "插件列表中显示的中文描述"
    }
  }
}
```

Field roles by stage:

- **Publish** — `package.json` `"name"` should use the `tinker-xxx` prefix; `"files"` should include `dist/` and `icon.png` so only build artifacts are packaged.
- **Listing** — `name`, `description`, and `icon` are shown when browsing or searching plugins in Tinker; `locales` overrides `name` and `description` for the matching user language.
- **Runtime** — `main` is the renderer entry loaded when the plugin window opens; `preload` runs first to expose Node-only APIs to the renderer (omit if not needed).
- **MCP** — optional `mcp.tools` declares schemas for `tinker call` / `tinker mcp` (tagged `[mcp]` in `tinker list`).

## MCP

Optional. Schema in `package.json` `tinker.mcp.tools`; handlers in `src/renderer/mcp.ts` via `tinker.registerMcp({ callTool })`; wire from store with `readonly mcp = createMcpApi(() => this)`.

- Tool names use snake_case (`get_settings`, not `getSettings`).
- Only expose what the UI exposes — skip internal-only fields or actions.
- Constraints live in `inputSchema` (Tinker validates before call) — type args directly in handlers.
- Drive existing store/UI methods from `mcp.ts`; return plain state (host serializes); `throw` on failure.
- Omit when nothing useful to automate.

## Tinker API

Global `tinker` is available in both **preload** and **renderer** — call it directly in either layer without going through `contextBridge`. Refer to `node_modules/tinker-api-types/tinker.d.ts` for signatures and types.

Covers theme/locale, file dialogs and I/O, system UI, media/disk utilities, AI calls, and events such as `changeTheme` / `changeLanguage`.

## Preload

Only needed when the plugin uses Node-only modules or logic that cannot run in the renderer. `tinker` is already available in renderer — do not wrap or re-expose it through preload.

- Keep Node-only code in `preload/`.
- Expose minimal APIs via `contextBridge.exposeInMainWorld()`.

```ts
import { contextBridge } from 'electron'
import { query } from './nodeOnlyModule'

contextBridge.exposeInMainWorld('api', {
  query: (input: string) => query(input),
})
```

## Debugging

### Local development

```bash
npm link
```

Restart Tinker after `npm link` to load the global plugin.

### Tinker skill

Lets agents control the running Tinker app from the CLI — open and restart plugins, inspect running state, and debug the plugin UI. Install the [tinker skill](https://github.com/liriliri/agent-skills):

```bash
npx skills add liriliri/agent-skills --skill tinker
```

The `tinker` CLI is installed from the Tinker app tray menu. Detailed workflows live in bundled skills — load them via `tinker skills list` and `tinker skills path <name>` (e.g. `core`, `debug`, `mcp`).
