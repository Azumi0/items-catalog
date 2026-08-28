'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';

/**
 * Shape every Server Action in src/app/actions returns: either an `error`
 * message to surface, or a success flag.
 */
export type ActionResult = { error?: string; success?: boolean } | null | undefined | void;

export interface RunOptions {
  action: () => Promise<ActionResult>;
  /** Notification title when the action reports an error. */
  errorTitle: string;
  /** Notification title when the action succeeds. */
  successTitle: string;
  /** Notification body when the action succeeds. */
  successMessage: string;
  /** Runs only on success, before the route is refreshed — close modals, reset fields. */
  onSuccess?: () => void;
}

/**
 * The CRUD call/notify/refresh cycle shared by every management screen.
 *
 * CategoriesManager and UsersManager repeated this same six times: flip a
 * pending flag, await the action, show a red notification and bail on error,
 * otherwise show a teal one, close the modal and refresh the route.
 *
 * Call it once per concurrently-pending operation — the create, edit and
 * delete flows each need their own flag to disable their own button.
 */
export function useActionRunner() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async ({
      action,
      errorTitle,
      successTitle,
      successMessage,
      onSuccess,
    }: RunOptions): Promise<boolean> => {
      setPending(true);
      let result: ActionResult;
      try {
        result = await action();
      } catch (err) {
        setPending(false);
        notifications.show({
          color: 'red',
          title: errorTitle,
          message: err instanceof Error ? err.message : 'Nieoczekiwany błąd.',
        });
        return false;
      }
      setPending(false);

      if (result?.error) {
        notifications.show({
          color: 'red',
          title: errorTitle,
          message: result.error,
        });
        return false;
      }

      notifications.show({
        color: 'teal',
        title: successTitle,
        message: successMessage,
        icon: <IconCheck size={16} />,
      });

      onSuccess?.();
      router.refresh();
      return true;
    },
    [router]
  );

  return { run, pending };
}
