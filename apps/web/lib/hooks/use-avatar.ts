import { useTranslation } from "@fixr/i18n/react";
import { toast } from "@pheralb/toast";
import { useCallback, useState } from "react";
import { axios } from "@/lib/auth/axios";
import { useSession } from "@/lib/hooks/use-session";

/**
 * Manages avatar URL state, upload, and removal.
 *
 * Provides `avatarUrl`, `setAvatarUrl`, a `handleRemove` callback
 * (calls `DELETE /account/avatar` and refreshes the session), and
 * an `isRemoving` flag for loading states.
 */
export function useAvatar(initialUrl: string | null) {
	const { t } = useTranslation();
	const { refreshSession } = useSession();
	const [avatarUrl, setAvatarUrl] = useState<string | null>(initialUrl);
	const [isRemoving, setIsRemoving] = useState(false);

	const handleRemove = useCallback(async () => {
		try {
			setIsRemoving(true);
			await axios.delete("/account/avatar");
			await refreshSession();
			setAvatarUrl(null);
			toast.success({ text: t("account.avatar.removeSuccess") });
		} catch {
			toast.error({ text: t("account.avatar.removeError") });
		} finally {
			setIsRemoving(false);
		}
	}, [refreshSession, t]);

	return { avatarUrl, setAvatarUrl, handleRemove, isRemoving } as const;
}
