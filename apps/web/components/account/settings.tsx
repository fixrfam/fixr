"use client";

import { useTranslation } from "@fixr/i18n/react";
import {
	SettingsCard,
	SettingsCardContent,
	SettingsCardFooter,
	SettingsCardTitle,
} from "../settings-card";
import { ChangePassword } from "./change-password";

export function Settings() {
	const { t } = useTranslation();

	return (
		<>
			<SettingsCard className="w-full" id="password_change">
				<SettingsCardTitle>
					{t("account.settings.passwordTitle")}
				</SettingsCardTitle>
				<SettingsCardContent className="space-y-4">
					<p className="text-sm">{t("account.settings.passwordDescription")}</p>
				</SettingsCardContent>
				<SettingsCardFooter className="py-2">
					<p className="text-muted-foreground text-sm">
						{t("account.settings.passwordHint")}
					</p>
					<ChangePassword />
				</SettingsCardFooter>
			</SettingsCard>
			{/* <SettingsCard className='w-full' id='delete_account' destructive>
                <SettingsCardTitle>Excluir Conta</SettingsCardTitle>
                <SettingsCardContent className='space-y-4'>
                    <p className='text-sm'>
                        Excluir sua conta é permanente e não pode ser desfeito. Esta ação irá apagar{" "}
                        <b>todos os seus dados</b> e <b>dados relacionados a você</b>.
                    </p>
                </SettingsCardContent>
                <SettingsCardFooter className='py-2' destructive>
                    <p className='text-sm'>
                        Por favor, certifique-se de que realmente deseja prosseguir antes de
                        confirmar.
                    </p>
                    <DeleteAccount />
                </SettingsCardFooter>
            </SettingsCard> */}
		</>
	);
}
