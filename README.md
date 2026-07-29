# tinker-office

Offline Office document editor for [TINKER](https://github.com/liriliri/tinker), powered by OnlyOffice WebAssembly.

## Features

- Create Word (`.docx`), Excel (`.xlsx`), and PowerPoint (`.pptx`) documents
- Open common Office formats (docx, xlsx, pptx, pdf, odt, …)
- Save via native file dialogs
- Light / dark theme follows TINKER

## Development

OnlyOffice static assets live under `public/`:

- `public/v9.3.0.24-1/` — web-apps / sdkjs / fonts
- `public/x2t/` — x2t WASM converter

```bash
npm install
npm run build
npm link
tinker quit && tinker open office
```

Dev loop: `npm run dev` + `tinker restart office`.
