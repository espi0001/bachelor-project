'use client';
/** The tab bar on the Settings page (Figma "Tabs", 351:1980): switches which section is shown, without changing the URL. */

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type SettingsTab = {
  id: string;
  label: string;
  /** Rendered on the server and passed in, so each panel can fetch its own data. */
  content: ReactNode;
};

// Figma has no hover state. Hover uses the Active text colour, so it is clear the tab can be clicked.
const STATE_CLASSES = {
  default:
    "border-transparent text-secondary hover:text-primary dark:text-zinc-400 dark:hover:text-zinc-100",
  active: "border-instant-blue text-primary dark:border-blue-400 dark:text-zinc-100",
} as const;

export function SettingsTabs({ tabs }: { tabs: SettingsTab[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Every tab is in the Tab order, because users expect Tab to reach the next tab (the WAI-ARIA pattern
  // with only the active tab tabbable skipped straight to the panel). Arrow keys, Home and End also work.
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = tabs.length - 1;
    const nextIndex = {
      ArrowRight: index === lastIndex ? 0 : index + 1,
      ArrowLeft: index === 0 ? lastIndex : index - 1,
      Home: 0,
      End: lastIndex,
    }[event.key];
    if (nextIndex === undefined) return;

    event.preventDefault();
    setActiveId(tabs[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Phones: the bar scrolls sideways (Figma 361:2073 cuts off the last tab) instead of widening the page.
          The 4px padding, cancelled by the negative margin, stops the scroll box from clipping the focus outline.
          Desktop: everything fits, so no scrolling at all. */}
      <div className="-m-1 overflow-x-auto overflow-y-hidden p-1 [scrollbar-width:none] md:m-0 md:overflow-visible md:p-0">
        <div
          role="tablist"
          aria-label="Settings"
          // w-max + min-w-full: the grey line runs under all tabs while scrolling, and across the full width otherwise.
          className="flex w-max min-w-full gap-5 border-b border-default md:gap-6 dark:border-white/15"
        >
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`settings-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`settings-panel-${tab.id}`}
                onClick={() => setActiveId(tab.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                // The tab sits on top of the grey line, as in Figma: overlapping it (-mb-px) made the bar
                // 1px taller than its scroll box and caused vertical scrolling.
                className={`shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-0.5 pb-3 pt-1 typography-label focus-ring ${STATE_CLASSES[isActive ? "active" : "default"]}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* All panels stay mounted, so switching back does not fetch again. `hidden` removes the others. */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`settings-panel-${tab.id}`}
          aria-labelledby={`settings-tab-${tab.id}`}
          hidden={tab.id !== activeId}
          // One column of cards, 720px wide as in Figma.
          className="flex w-full max-w-180 flex-col gap-4"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
