/** The success shape every Server Action in src/app/actions returns. */
export type ActionResult = { error?: string; success?: boolean };

/** Resolves as a successful action having changed nothing. */
export async function noop(): Promise<ActionResult> {
  return { success: true };
}
