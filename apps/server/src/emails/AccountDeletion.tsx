import * as React from "react";

import {
    Body,
    Button,
    Container,
    Head,
    Html,
    Img,
    Link,
    Preview,
    render,
    Section,
    Text,
} from "@react-email/components";

interface EmailProps {
    displayName: string;
    appName: string;
    verificationUrl: string;
}

export const AccountDeletionEmail = ({ displayName, appName, verificationUrl }: EmailProps) => (
    <Html>
        <Head />
        <Preview>{displayName}, confirm your account deletion.</Preview>
        <Body style={main}>
            <Container style={container}>
                <Img src={`/public/logo.png`} width='31' height='25' alt='' />

                <Text style={title}>Account deletion confirmation</Text>

                <Section style={section}>
                    <Text style={text}>
                        Hey <strong>{displayName}</strong>.
                    </Text>
                    <Text style={text}>
                        You requested account deletion on (<Link>{appName}</Link>). By clicking the
                        button below, your account will be <strong>permanently deleted</strong> with
                        all associated data.
                    </Text>

                    <Text style={text}>
                        <strong>This action is irreversible.</strong>
                    </Text>

                    <Button style={button} href={verificationUrl} target='_blank'>
                        Delete account
                    </Button>
                </Section>

                <Text style={footer}>
                    If you haven't requested deletion, please ignore this email.
                </Text>
            </Container>
        </Body>
    </Html>
);

export default AccountDeletionEmail;

const main = {
    backgroundColor: "#ffffff",
    color: "#24292e",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
};

const container = {
    maxWidth: "480px",
    margin: "0 auto",
    padding: "20px 0 48px",
};

const title = {
    fontSize: "24px",
    lineHeight: 1.25,
};

const section = {
    padding: "24px",
    border: "solid 1px #dedede",
    borderRadius: "5px",
    textAlign: "center" as const,
};

const text = {
    margin: "0 0 10px 0",
    textAlign: "left" as const,
};

const button = {
    fontSize: "14px",
    backgroundColor: "#d12a2a",
    color: "#fff",
    lineHeight: 1.5,
    borderRadius: "0.5em",
    padding: "12px 24px",
};

const links = {
    textAlign: "center" as const,
};

const link = {
    color: "#0366d6",
    fontSize: "12px",
};

const footer = {
    color: "#6a737d",
    fontSize: "12px",
    textAlign: "center" as const,
    marginTop: "60px",
};

export function renderEmail({
    verificationUrl,
    displayName,
    appName,
}: {
    verificationUrl: string;
    displayName: string;
    appName: string;
}): string {
    return render(
        <AccountDeletionEmail
            verificationUrl={verificationUrl}
            displayName={displayName}
            appName={appName}
        />
    );
}
