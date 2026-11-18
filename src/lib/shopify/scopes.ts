/**
 * Shopify access scopes the app asks for. Shared by the setup guide (shown to the user) and the OAuth flow.
 */

// Least privilege: we only read and change products and their images.
export const SHOPIFY_SCOPES = ['read_products', 'write_products'] as const;
