/**
 * How long an upload to Shopify may run before it counts as crashed, shared by the approval actions and page.
 */

// A Postgres interval. Vercel stops a function after 300 seconds at most, so an upload that started
// longer ago than this cannot still be running: the server died, and the image may be retried or rejected.
export const UPLOAD_TIMEOUT = "5 minutes";
