/**
 * Required Google Maps Platform usage-attribution ID.
 * https://developers.google.com/maps/documentation/javascript/reference/map?utm_campaign=gmp_git_agentskills_v1
 */
const MAPS_ATTRIBUTION_ID = "gmp_git_agentskills_v1";

/**
 * The Maps JavaScript API reads `internalUsageAttributionIds` at runtime, but
 * the installed @types/google.maps (3.58.1) does not declare the field yet, so
 * append it through an intersection type rather than an `any` cast.
 */
export function withMapsAttribution(
  options: google.maps.MapOptions
): google.maps.MapOptions {
  const attributed: google.maps.MapOptions & {
    internalUsageAttributionIds?: string[];
  } = {
    ...options,
    internalUsageAttributionIds: [MAPS_ATTRIBUTION_ID],
  };
  return attributed;
}
