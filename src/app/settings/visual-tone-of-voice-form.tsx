'use client';
/** Form on the Settings page where the store writes its visual tone of voice for lifestyle images. */

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { saveVisualToneOfVoice, type SaveVisualToneOfVoiceState } from "./actions";
import { VISUAL_TONE_OF_VOICE_MAX_LENGTH, VISUAL_TONE_OF_VOICE_TEMPLATE } from "./visual-tone-of-voice";

type VisualToneOfVoiceFormProps = {
  /** The saved text, or `null` when the store has none yet. */
  initialText: string | null;
};

export function VisualToneOfVoiceForm({ initialText }: VisualToneOfVoiceFormProps) {
  const [state, formAction, isPending] = useActionState<SaveVisualToneOfVoiceState, FormData>(
    saveVisualToneOfVoice,
    {},
  );
  // Controlled on purpose: React resets an uncontrolled form after its action runs, which would put the
  // old saved text back in the field. Also drives the character count.
  const [text, setText] = useState(initialText ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="visual-tone-of-voice" className="typography-label text-primary dark:text-zinc-100">
          Visual tone of voice
        </label>
        <p id="visual-tone-of-voice-hint" className="typography-body-sm text-secondary dark:text-zinc-400">
          Describe the mood, light, background and colours of your lifestyle images. Packshots are not affected.
        </p>
        <textarea
          id="visual-tone-of-voice"
          name="visualToneOfVoice"
          rows={6}
          maxLength={VISUAL_TONE_OF_VOICE_MAX_LENGTH}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={VISUAL_TONE_OF_VOICE_TEMPLATE}
          aria-describedby="visual-tone-of-voice-hint visual-tone-of-voice-count"
          className="w-full resize-y rounded-lg border border-default bg-surface px-3 py-2 typography-body-sm text-primary placeholder:text-muted focus-ring dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        <p id="visual-tone-of-voice-count" className="self-end typography-caption text-muted dark:text-zinc-500">
          {text.length} / {VISUAL_TONE_OF_VOICE_MAX_LENGTH}
        </p>
      </div>

      {/* Always in the DOM, so screen readers announce the message when it changes. */}
      <div aria-live="polite">
        {state.error ? (
          <ErrorMessage>{state.error}</ErrorMessage>
        ) : state.saved && !isPending ? (
          <p className="typography-body-sm text-success dark:text-green-400">Saved.</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
        <p className="typography-body-sm text-secondary dark:text-zinc-400">
          Saved with your store. Disconnecting the store deletes it.
        </p>
      </div>
    </form>
  );
}
