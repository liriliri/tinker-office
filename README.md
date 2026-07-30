# tinker-office

Office document editor plugin for [TINKER](https://tinker.liriliri.io/), based on the local OnlyOffice stack from [onlyoffice-web-local](https://github.com/sweetwisdom/onlyoffice-web-local).

## Features

- Create / open / edit Word (`.docx`), Excel (`.xlsx`), and PowerPoint (`.pptx`)
- Local conversion via x2t WASM (no document server)
- MCP tools: `open_file`, `new_document`

## Develop

```bash
npm install
npm run build
npm link
```

Restart Tinker after `npm link`, then:

```bash
tinker open office
```
