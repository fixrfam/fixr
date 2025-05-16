import {
    SettingsCard,
    SettingsCardTitle,
    SettingsCardContent,
    SettingsCardFooter,
} from "../settings-card";
import { ChangePassword } from "./change-password";
import { DeleteAccount } from "./delete-account";

export function Settings() {
    return (
        <>
            <SettingsCard className='w-full' id='password_change'>
                <SettingsCardTitle>Alterar Senha</SettingsCardTitle>
                <SettingsCardContent className='space-y-4'>
                    <p className='text-sm'>
                        Atualize a senha da sua conta. Para alterá-la com sucesso, você deve
                        fornecer sua senha atual e uma nova senha.
                    </p>
                </SettingsCardContent>
                <SettingsCardFooter className='py-2'>
                    <p className='text-sm text-muted-foreground'>
                        Certifique-se de escolher uma senha forte e única.
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
