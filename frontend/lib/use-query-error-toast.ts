"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/** Fire a toast once when `isError` becomes true (TanStack Query v5 has no useQuery onError). */
export function useQueryErrorToast(isError: boolean, message: string) {
  const shown = useRef(false);
  useEffect(() => {
    if (isError) {
      if (!shown.current) {
        shown.current = true;
        toast.error(message);
      }
    } else {
      shown.current = false;
    }
  }, [isError, message]);
}
