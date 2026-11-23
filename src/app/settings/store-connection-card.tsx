/** Settings card that shows which Shopify store the organization is connected to, with a button to disconnect it. */

import { Badge } from "@/components/ui/badge";
import { DisconnectStoreButton } from "./disconnect-store-button";
import { SettingsCard } from "./settings-card";

// Vercel runs in UTC, so the time zone is set here to show the time the shop sees.
const LAST_SYNCED_FORMAT = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Copenhagen",
});

type StoreConnectionCardProps = {
  shopDomain: string;
  lastSyncedAt: Date | null;
};

export function StoreConnectionCard({ shopDomain, lastSyncedAt }: StoreConnectionCardProps) {
  const rows = [
    { label: "Store", value: shopDomain },
    { label: "Platform", value: "Shopify" },
    { label: "Last synced", value: lastSyncedAt ? LAST_SYNCED_FORMAT.format(lastSyncedAt) : "Never" },
  ];

  return (
    <SettingsCard
      title="Store connection"
      description="The shop that products and images are fetched from."
      status={<Badge variant="success">Connected</Badge>}
    >
      <dl>
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 border-b border-default py-2.5 typography-body-sm dark:border-white/15"
          >
            <dt className="text-secondary dark:text-zinc-400">{label}</dt>
            <dd className="min-w-0 break-all text-right text-primary dark:text-zinc-100">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-2 pt-1">
        <DisconnectStoreButton shopDomain={shopDomain} />
      </div>
    </SettingsCard>
  );
}
