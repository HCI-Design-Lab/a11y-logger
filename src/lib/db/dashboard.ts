/**
 * Barrel module for the dashboard data access layer.
 * Re-exports all functions and types from the three dashboard sub-modules:
 * - dashboard-assessments: overall stats and actionable stats
 * - dashboard-activity: recent activity feed and time-series data
 * - dashboard-issues: severity breakdown, POUR totals, repeat offenders, environment, and tag frequency
 */
export * from './dashboard-assessments';
export * from './dashboard-activity';
export * from './dashboard-issues';
