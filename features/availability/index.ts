/**
 * Availability feature - public API.
 * 
 * Exports timeline building functions for availability visualization:
 * - buildTimelineSegments: Builds timeline for a single user
 * - buildSharedTimelineSegments: Builds timeline comparing two users
 */
export {
  buildTimelineSegments,
  buildSharedTimelineSegments,
} from "./services/availability.service";