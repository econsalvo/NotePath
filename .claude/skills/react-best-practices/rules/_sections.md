# Performance Optimization Sections

This document outlines the eight categories of performance optimization, ranked by impact.

## Category Overview

| Priority | Category | Impact | Prefix | Rule Count |
|----------|----------|--------|--------|------------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` | 5 |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` | 5 |
| 3 | Server-Side Performance | HIGH | `server-` | 5 |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` | 2 |
| 5 | Re-render Optimization | MEDIUM | `rerender-` | 8 |
| 6 | Rendering Performance | MEDIUM | `rendering-` | 7 |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` | 12 |
| 8 | Advanced Patterns | LOW | `advanced-` | 2 |

## Section Descriptions

### 1. Eliminating Waterfalls (CRITICAL)
Waterfalls are the #1 performance killer. Each sequential await adds full network latency. Eliminating them yields the largest gains.

### 2. Bundle Size Optimization (CRITICAL)
Reducing initial bundle size improves Time to Interactive and Largest Contentful Paint.

### 3. Server-Side Performance (HIGH)
Optimizing server-side rendering and data fetching eliminates server-side waterfalls and reduces response times.

### 4. Client-Side Data Fetching (MEDIUM-HIGH)
Automatic deduplication and efficient data fetching patterns reduce redundant network requests.

### 5. Re-render Optimization (MEDIUM)
Reducing unnecessary re-renders minimizes wasted computation and improves UI responsiveness.

### 6. Rendering Performance (MEDIUM)
Optimizing the rendering process reduces the work the browser needs to do.

### 7. JavaScript Performance (LOW-MEDIUM)
Micro-optimizations for hot paths can add up to meaningful improvements.

### 8. Advanced Patterns (LOW)
Advanced patterns for specific cases that require careful implementation.
