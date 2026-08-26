// AI Storefront Template Generator — NOT YET IMPLEMENTED (stub)
// Flow: merchant describes desired look in NL -> Gemini generates a constrained
// JSON "theme spec" (colors, layout blocks, component choices) -> spec is rendered
// by a fixed set of React template components in a sandboxed iframe preview ->
// merchant gives feedback -> spec is patched and re-rendered (no arbitrary code exec).

export const generateThemeSpec = async (tenantId, prompt) => {
  throw new Error("templateGeneratorService.generateThemeSpec not implemented yet");
};

export const refineThemeSpec = async (tenantId, currentSpec, feedback) => {
  throw new Error("templateGeneratorService.refineThemeSpec not implemented yet");
};