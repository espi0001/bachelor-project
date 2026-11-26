/** Settings card that lists the members of the Clerk organization, with a button to manage it in Clerk. */

import Image from "next/image";
import { clerkClient, type OrganizationMembership } from "@clerk/nextjs/server";
import { ADMIN_ROLE } from "@/lib/roles";
import { ErrorMessage } from "@/components/ui/error-message";
import { ManageButton } from "./manage-button";
import { SettingsCard } from "./settings-card";

// Clerk returns 10 members by default; 500 is its maximum, so the card shows every member.
const MEMBER_LIMIT = 500;

// Clerk's default roles. Figma's Owner / Editor / Viewer do not exist in Clerk.
const ROLE_LABELS: Record<string, string> = {
  [ADMIN_ROLE]: "Admin",
  "org:member": "Member",
};

type Member = {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  role: string;
};

/** Custom roles are shown as their key without the `org:` prefix, e.g. `org:editor` becomes "Editor". */
function getRoleLabel(role: string): string {
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  const key = role.replace(/^org:/, "").replace(/_/g, " ");
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function toMember(membership: OrganizationMembership): Member {
  const user = membership.publicUserData;
  const email = user?.identifier ?? "";
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return {
    id: membership.id,
    name: fullName || email || "Unknown member",
    email,
    imageUrl: user?.imageUrl || null,
    role: getRoleLabel(membership.role),
  };
}

async function getMembers(orgId: string): Promise<Member[] | null> {
  try {
    const client = await clerkClient();
    const { data } = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: MEMBER_LIMIT,
    });
    return data.map(toMember);
  } catch (error) {
    console.error("Could not load organization members", error);
    return null;
  }
}

type OrganizationCardProps = {
  /** From `auth()` on the server, never from the browser. */
  orgId: string;
};

export async function OrganizationCard({ orgId }: OrganizationCardProps) {
  const members = await getMembers(orgId);

  return (
    <SettingsCard title="Organization" description="Members of your organization and their roles.">
      {members === null ? (
        <ErrorMessage>Could not load the members. Try reloading the page.</ErrorMessage>
      ) : (
        <ul>
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-3 border-b border-default py-2 dark:border-white/15"
            >
              {member.imageUrl ? (
                // Decorative: the name next to it says who it is.
                <Image
                  src={member.imageUrl}
                  alt=""
                  width={28}
                  height={28}
                  className="size-7 shrink-0 rounded-full object-cover"
                />
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate typography-label-sm text-primary dark:text-zinc-100">{member.name}</span>
                {member.email && member.email !== member.name ? (
                  <span className="truncate typography-body-sm text-secondary dark:text-zinc-400">{member.email}</span>
                ) : null}
              </div>
              <span className="shrink-0 typography-body-sm text-secondary dark:text-zinc-400">{member.role}</span>
            </li>
          ))}
        </ul>
      )}
      {/* Shown to everyone: Clerk itself only lets admins invite, change roles or remove members. */}
      <div className="flex flex-wrap gap-2 pt-1">
        <ManageButton />
      </div>
    </SettingsCard>
  );
}
