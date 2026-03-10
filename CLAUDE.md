# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

This is a project workspace for the **Hong Kong International Film Festival (HKIFF) 2026** — the 49th edition. The primary reference data is `HKIFF49-BF.pdf` (the HKIFF 49 brochure/film catalog).

The project is in early setup phase with no source code yet. Tech stack and build commands will be added here once development begins.

## Spec-Driven Development

This project uses **OpenSpec** for change management. The workflow is:

1. **Explore** — `/opsx:explore` to clarify requirements
2. **Propose** — `/opsx:propose` to create a change with proposal, spec, and tasks
3. **Apply** — `/opsx:apply` to implement tasks from a change
4. **Archive** — `/opsx:archive` to finalize and close a change

Changes live in `openspec/changes/`, specs in `openspec/specs/`.
