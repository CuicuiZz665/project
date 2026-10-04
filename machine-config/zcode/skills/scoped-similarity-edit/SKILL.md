---
name: scoped-similarity-edit
description: Use when the user names a specific file or folder and describes code or prose to find or change; locate the highest-similarity relevant fragment inside that scope instead of doing broad full-repo retrieval.
metadata:
  short-description: Scoped similarity-based fragment search/editing
---

# Scoped Similarity Edit

Use this skill when the user points to a file, filename, path, or folder and asks Codex to find, explain, modify, or implement specific content described in natural language. The key behavior is scoped, similarity-first retrieval: identify the most relevant code or prose fragment inside the requested scope, rather than scanning or summarizing everything.

## Core Behavior

- Treat the user-specified file or folder as the primary boundary. Do not expand to unrelated project areas unless the named scope cannot be resolved or the chosen fragment clearly depends on a nearby definition.
- If the user gives only a filename, resolve likely matches by exact basename, extension, path hints, and project conventions. When several plausible files exist, inspect cheap metadata first and choose the best match; ask only if ambiguity would make the edit risky.
- If the user gives a folder, search only inside that folder at first. Use repository structure and filenames to narrow candidates before opening large files.
- Convert the user's description into a few discriminating search terms: identifiers, UI labels, route names, function names, domain nouns, error messages, Chinese/English phrasing variants, or nearby concepts.
- Prefer `rg`, symbol search, AST-aware tooling, language server output, or structured parsers where available. Avoid broad full-repo dumps and avoid reading entire large files unless the relevant region cannot be isolated.
- Rank candidate fragments by semantic fit to the user's requested change, not just exact keyword overlap. Favor snippets that share purpose, data flow, nearby labels, call sites, or domain vocabulary.
- Open enough surrounding context to edit safely: imports, local helpers, type definitions, tests, neighboring prose, and direct call sites. Keep the context window proportional to the change.

## Workflow

1. Resolve the requested scope.
2. Generate targeted query terms from the user's description.
3. Search within the scope and collect a small set of likely fragments.
4. Inspect the highest-similarity fragment and its immediate context.
5. Implement or answer using that fragment as the anchor.
6. If editing, verify with the narrowest meaningful test, typecheck, render, or diff inspection available.

## When Search Results Are Weak

- Try alternate wording, translations, casing, abbreviations, and likely identifiers from nearby filenames.
- Use structural clues such as exported symbols, headings, route tables, component names, test names, or config keys.
- If the specified file/folder appears wrong, state the mismatch briefly and name the closest candidate before continuing or asking for clarification.

## Editing Constraints

- Keep edits within the requested file or folder unless the change cannot work without a directly related supporting edit.
- Do not rewrite unrelated sections discovered during search.
- Preserve existing style, naming, formatting, and language of the surrounding code or prose.
- In the final response, mention the scoped anchor used, such as the file and function/section changed, so the user can see that the requested target was followed.
