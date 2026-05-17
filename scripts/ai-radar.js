#!/usr/bin/env node
/**
 * Compatibility entrypoint for the Daily AI Maintenance workflow.
 * The real implementation lives in daily-ai-maintenance.mjs so the portfolio
 * keeps one safe AI radar pipeline and one JSON schema for the Live AI Radar card.
 */
import('./daily-ai-maintenance.mjs').catch((error) => {
  console.error(error);
  process.exit(1);
});
