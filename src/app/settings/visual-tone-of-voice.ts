/** Shared limits and the writing template for the visual tone of voice, used by the form and its server action. */

/**
 * Photoroom states no limit for background.prompt, but the prompt travels in the query string of a GET
 * request. 1,000 characters leaves plenty of room under common URL limits and is enough for the template.
 */
export const VISUAL_TONE_OF_VOICE_MAX_LENGTH = 1000;

// The five headings agreed for BA-148 (mood, light, background, colours, avoid). Shown as the placeholder.
export const VISUAL_TONE_OF_VOICE_TEMPLATE = [
  "Mood: e.g. calm and Scandinavian",
  "Light: e.g. soft morning daylight from the side",
  "Background: e.g. a light wooden table in a bright living room",
  "Colours: e.g. warm whites, sand and pale green",
  "Avoid: e.g. people, text and busy patterns",
].join("\n");
