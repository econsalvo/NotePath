# Agent Skills Guide

This document provides guidance for AI coding agents (Claude Code, Cursor, Copilot, etc.) working with skills in this repository.

## Repository Structure

```
.claude/
├── AGENTS.md          # This file
├── CLAUDE.md          # Project-specific instructions
├── settings.local.json
└── skills/
    ├── code-review/
    │   └── SKILL.md
    ├── convex/
    │   ├── SKILL.md
    │   └── rules/          # Individual rule files
    ├── react-best-practices/
    │   ├── SKILL.md
    │   ├── rules/          # Individual rule files
    │   └── references/     # Reference documentation
    ├── react-native/
    │   └── SKILL.md
    └── web-design-guidelines/
        └── SKILL.md
```

## Creating a New Skill

### Directory Structure

Each skill must have:
- Directory name in `kebab-case`
- `SKILL.md` file (uppercase, required)
- Optional `scripts/` folder for bash scripts
- Optional `references/` folder for documentation
- Optional `rules/` folder for individual rule files

### SKILL.md Format

```yaml
---
name: skill-name
description: Brief description of when to use this skill. Be specific to help agents activate it appropriately.
allowed-tools: Read, Edit, Grep, Glob  # Tools the skill can use
model: sonnet  # Optional: specify model
---

# Skill Title

Main skill instructions go here.

## How It Works
[Explain the skill's process]

## When to Use
[List scenarios when this skill applies]

## Output Format
[Describe expected output format]
```

### Rule File Format (for rules/ folders)

```yaml
---
title: Rule Title
impact: CRITICAL|HIGH|MEDIUM|LOW
impactDescription: Brief impact description
tags: comma, separated, tags
---

## Rule Title

Brief explanation of the rule.

**Incorrect:**
[Code example showing the problem]

**Correct:**
[Code example showing the solution]
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Skill directories | kebab-case | `react-best-practices` |
| SKILL.md | UPPERCASE | `SKILL.md` |
| Scripts | kebab-case.sh | `run-tests.sh` |
| Rule files | prefix-description.md | `async-parallel.md` |

## Best Practices

1. **Keep SKILL.md under 500 lines** for context efficiency
2. **Use specific descriptions** to help agents activate skills appropriately
3. **Scripts should:**
   - Use bash shebang (`#!/bin/bash`)
   - Include `set -e` for error handling
   - Output JSON to stdout
   - Send status messages to stderr
4. **Rule files should:**
   - Have clear frontmatter with impact level
   - Include both incorrect and correct code examples
   - Be focused on a single optimization

## Available Skills

### code-review
Review code for bugs, security issues, performance problems, and best practices.

### convex
Convex backend development guidelines (15+ rules for functions, queries, mutations, actions, schema).

### react-best-practices
Apply React performance optimization guidelines (45+ rules across 8 categories).

### react-native
React Native and Expo development assistance.

### web-design-guidelines
Review UI code for Web Interface Guidelines compliance (100+ rules).

## Using Skills

Skills can be invoked by:
1. Asking the agent to perform a task matching the skill description
2. Using slash commands: `/code-review`, `/react-best-practices`, etc.
3. Referencing specific rule files for targeted guidance
