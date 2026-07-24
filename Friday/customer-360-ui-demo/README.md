# Customer 360 Attribute Advisor

A local web application backed by the `customer-360-attribute-advisor` Codex Skill and its bundled Attribute Dictionary.

## Prerequisites

- Node.js 22.13 or later
- Codex Desktop or Codex CLI, signed in

## Folder layout

Download and unzip both folders into the same parent directory:

```text
customer-360/
├── customer-360-ui-demo/
└── customer-360-attribute-advisor/
```

The Agent finds the sibling Skill folder automatically. The Skill does not need to be copied into `~/.codex/skills`.

## First-time setup

Open Terminal, enter the UI folder, and install its dependencies:

```bash
cd "/path/to/customer-360/customer-360-ui-demo"
npm install
```

## Run locally

Open two Terminal windows in `customer-360-ui-demo`.

Terminal 1 — start the real Customer 360 Agent:

```bash
npm run agent
```

Terminal 2 — start the UI:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Keep both Terminal windows open while using the application. Press `Control+C` in each window to stop it.

The Agent listens only on the local computer at `127.0.0.1:8787`. Each question is answered from the Skill instructions and its complete bundled CSV; the browser contains no hardcoded business answers.

## Verify

```bash
npm run build
```

Optional environment variables:

- `CODEX_BIN`: alternate Codex CLI path
- `CUSTOMER360_SKILL_DIR`: alternate Skill directory
- `CUSTOMER360_AGENT_PORT`: alternate local Agent port (the frontend currently expects `8787`)

## Troubleshooting

- `npm: command not found`: install Node.js 22.13 or later, reopen Terminal, and retry.
- `Customer 360 Skill not found`: ensure both extracted folders share the same parent directory.
- `spawn codex ENOENT`: install/sign in to Codex Desktop or Codex CLI, or set `CODEX_BIN`.
- `EADDRINUSE`: the service is already running in another Terminal window. Use that process or stop it with `Control+C`.
- If the UI starts on a port other than `3000`, open the exact Local URL printed in Terminal.
