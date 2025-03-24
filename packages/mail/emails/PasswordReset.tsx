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
    Section,
    Text,
} from "@react-email/components";
import { render } from "@react-email/render";

interface EmailProps {
    displayName: string;
    appName: string;
    verificationUrl: string;
}

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";

export const PasswordReset = ({ displayName, appName, verificationUrl }: EmailProps) => (
    <Html>
        <Head />
        <Preview>Change your password, {displayName}!</Preview>
        <Body style={main}>
            <Container style={container}>
                <Img src={`/public/logo.png`} width='31' height='25' alt='' />

                <Text style={title}>
                    Oops! Forgot your password, <strong>{displayName}</strong>?
                </Text>

                <Section style={section}>
                    <Text style={text}>
                        Hey <strong>{displayName}</strong>!
                    </Text>
                    <Text style={text}>
                        You requested a "forgot my password" credentials reset for an account at{" "}
                        <Link>{appName}</Link>, registered with this email. Click the button below
                        to change your password.
                    </Text>

                    <Button style={button} href={verificationUrl} target='_blank'>
                        Change my password
                    </Button>
                </Section>

                <Text style={footer}>If you haven't requested it, please ignore this email.</Text>
            </Container>
        </Body>
    </Html>
);

PasswordReset.PreviewProps = {
    displayName: "alanturing",
} as EmailProps;

export default PasswordReset;

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
    backgroundColor: "#000000",
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

export async function renderEmail({
    verificationUrl,
    displayName,
    appName,
}: {
    verificationUrl: string;
    displayName: string;
    appName: string;
}): Promise<string> {
    try {
        return await render(
            <PasswordReset
                verificationUrl={verificationUrl}
                displayName={displayName}
                appName={appName}
            />
        );
    } catch (error) {
        console.error("Failed to render email", error);
        throw new Error(`Failed to render email ${error}`);
    }
}
