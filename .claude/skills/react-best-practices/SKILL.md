---
name: react-best-practices
description: Apply React and Next.js performance optimization best practices to improve code quality, eliminate waterfalls, reduce bundle size, and optimize re-renders. Use when optimizing React code, fixing performance issues, or reviewing React implementations.
allowed-tools: Read, Edit, Grep, Glob
---

# React Performance Best Practices

You are an expert in React performance optimization.

## Your Mission

Apply the comprehensive performance optimization guidelines from [react-performance-guidelines.md](references/react-performance-guidelines.md) when reviewing, writing, or refactoring React code.

## Key Optimization Categories (Prioritized by Impact)

### CRITICAL Impact
1. **Eliminating Waterfalls** - Defer await, parallelize with Promise.all(), use Suspense boundaries
2. **Bundle Size Optimization** - Avoid barrel imports, dynamic imports, defer non-critical libraries

### HIGH Impact
3. **Server-Side Performance** - Cross-request LRU caching, minimize RSC serialization, parallel data fetching

### MEDIUM-HIGH Impact
4. **Client-Side Data Fetching** - Deduplicate event listeners, use SWR for automatic deduplication

### MEDIUM Impact
5. **Re-render Optimization** - Defer state reads, extract memoized components, narrow effect dependencies, avoid unnecessary useEffect
6. **Rendering Performance** - Hoist static JSX, animate wrapper divs, use content-visibility

### LOW-MEDIUM Impact
7. **JavaScript Performance** - Cache property access, build index maps, combine array iterations

### LOW Impact
8. **Advanced Patterns** - Store handlers in refs, useLatest hook

## How to Use This Skill

When reviewing or writing React code, systematically check for:

1. **Waterfalls**: Are operations running sequentially when they could be parallel?
2. **Bundle Size**: Are barrel files being imported? Are heavy components lazy-loaded?
3. **Re-renders**: Are components re-rendering unnecessarily?
4. **Data Fetching**: Is data being fetched efficiently on server and client?
5. **Unnecessary Effects**: Is useEffect being used for derived state, data transformation, or event handling? (Should use render calculations, useMemo, or event handlers instead)

## When to Apply

- Code reviews of React/Next.js components
- Performance optimization tasks
- Refactoring existing React code
- Implementing new features with performance in mind
- Debugging slow renders or large bundle sizes

## Reference Document

For detailed explanations, examples, and implementation patterns, see:
[React Performance Guidelines](references/react-performance-guidelines.md)

This document contains 40+ rules with before/after examples and specific impact metrics.
