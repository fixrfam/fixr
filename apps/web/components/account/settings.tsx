import {
    SettingsCard,
    SettingsCardTitle,
    SettingsCardContent,
    SettingsCardFooter,
} from "../settings-card";
import { ChangePassword } from "./change-password";
import { DeleteAccount } from "./delete-account";
import { EditDisplayName } from "./edit-display-name";

export function Settings({ displayName }: { displayName: string }) {
    return (
        <>
            <SettingsCard className='w-full' id='name_change'>
                <SettingsCardTitle>Display name</SettingsCardTitle>
                <SettingsCardContent className='space-y-4'>
                    <p className='text-sm'>
                        This is your public display name that will be shown to others through the
                        app.
                    </p>
                    <EditDisplayName displayName={displayName} />
                </SettingsCardContent>
                <SettingsCardFooter>
                    <p className='text-sm text-muted-foreground'>
                        Please note that this can be changed at any time.
                    </p>
                </SettingsCardFooter>
            </SettingsCard>
            <SettingsCard className='w-full' id='password_change'>
                <SettingsCardTitle>Change Password</SettingsCardTitle>
                <SettingsCardContent className='space-y-4'>
                    <p className='text-sm'>
                        Update your account password. To successfully change it, you must provide
                        your current password and a new password.
                    </p>
                </SettingsCardContent>
                <SettingsCardFooter className='py-2'>
                    <p className='text-sm text-muted-foreground'>
                        Make sure to choose a strong and unique one.
                    </p>
                    <ChangePassword />
                </SettingsCardFooter>
            </SettingsCard>
            <SettingsCard className='w-full' id='delete_account' destructive>
                <SettingsCardTitle>Delete account</SettingsCardTitle>
                <SettingsCardContent className='space-y-4'>
                    <p className='text-sm'>
                        Deleting your account is permanent and cannot be undone. This action will
                        erase <b>all your data</b> and <b>data related to you</b>.
                    </p>
                </SettingsCardContent>
                <SettingsCardFooter className='py-2' destructive>
                    <p className='text-sm'>
                        Please make sure you really want to proceed before confirming.
                    </p>
                    <DeleteAccount />
                </SettingsCardFooter>
            </SettingsCard>
        </>
    );
}
