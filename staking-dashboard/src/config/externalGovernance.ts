/**
 * External Governance Frontends Configuration
 *
 * This file contains the list of external governance frontends that users
 * can be directed to. Update this list as new frontends become available.
 */

import { GOVERNANCE_URL } from "./links";

export interface ExternalFrontend {
  /** Display name of the frontend */
  name: string;
  /** Organization hosting this frontend */
  hostedBy: string;
  /** URL to the frontend - undefined means "Coming Soon" */
  url?: string;
}

export const EXTERNAL_GOVERNANCE_FRONTENDS: ExternalFrontend[] = [
  {
    name: "Aztec Governance",
    hostedBy: "BlackNodes",
    url: GOVERNANCE_URL,
  },
];
