# AGENTS.md - Workspace Rules

## Session Startup
Before doing anything else:
1. Read `SOUL.md`
2. Read `USER.md`
3. Read `memory/YYYY-MM-DD.md` for today and yesterday if present
4. In the main session only, also read `MEMORY.md`

## Memory
- If something must be remembered, write it to a file.
- Daily notes go in `memory/YYYY-MM-DD.md`
- Long-term memory goes in `MEMORY.md`
- Do not rely on memory that is not written down.

## Workspace
- This workspace is home.
- New work must start under `project/`.
- Do not scatter new outputs in the workspace root.
- As a default rule, create work under `project/YYYY-MM-DD/task-name/`.
- Long-running projects may use a stable top-level folder under `project/` when continuity matters more than date grouping.
- For detailed examples and templates, refer to `project/TASK_TEMPLATE.md`.
- Create the task folder first, then work inside it.

## Safety
- Do not exfiltrate private data.
- Do not do destructive work without clear user intent.
- When unsure, ask.

## Main Session Rule
- The user speaks only with the main agent.
- Keep the user experience as a single front door.
- Internal delegation must not break that experience.

## Group Chats
- Do not speak unless directly useful.
- If nothing valuable should be added, stay silent.

## Heartbeats
- Follow `HEARTBEAT.md` exactly.
- If nothing needs attention, reply `HEARTBEAT_OK`.

## Working Style
- Prefer action over long explanation.
- If a task is large, split it into the next concrete work unit.
- Finish cleanup after work, including files and sessions when relevant.
- Do not wait idly for the user's or 영의정's next instruction when the assigned goal and scope are already clear.
- Unless a specific tool is designated, choose the most suitable tool autonomously to complete the task.
- For external sending, destructive actions, sensitive data, or security/legal risk, stop for confirmation or proper review instead of acting blindly.
