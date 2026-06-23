import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";

export function useRefreshOnWindowFocus(refetch: () => unknown) {
  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;

    getCurrentWindow()
      .onFocusChanged(({ payload: focused }) => {
        if (focused) {
          void refetch();
        }
      })
      .then((nextUnlisten) => {
        if (disposed) {
          nextUnlisten();
          return;
        }

        unlisten = nextUnlisten;
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [refetch]);
}
