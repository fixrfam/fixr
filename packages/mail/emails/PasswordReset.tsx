import * as React from "react";

import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Tailwind,
    Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import { FixrHeader } from "../components/FixrHeader";

interface EmailProps {
    displayName: string;
    appName: string;
    verificationUrl: string;
}

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";

export const PasswordReset = ({ displayName, appName, verificationUrl }: EmailProps) => (
    <Tailwind
        config={{
            theme: {
                extend: {
                    colors: {
                        brand: "#1F65FE",
                        border: "#dedede",
                    },
                },
            },
        }}
    >
        <Html>
            <Head />
            <Preview>Redefinição de senha</Preview>
            <Body style={main}>
                <Container className='max-w-[480px] mx-auto '>
                    <FixrHeader />

                    <Text className='my-0 text-lg tracking-tight'>
                        Olá, <i className='italic'>{displayName}</i>!
                    </Text>
                    <Heading className='text-left my-0 text-2xl md:text-3xl font-semibold tracking-tight mb-4'>
                        Esqueceu sua senha? 🔒
                    </Heading>
                    <Section className='gap-0'>
                        <Text>
                            Recebemos uma solicitação para alterar a senha da sua conta no Fixr.
                            <br />
                            Se foi você, pode definir uma nova senha clicando no botão abaixo:
                        </Text>

                        <Container>
                            <Container className='w-full flex items-center justify-center  text-center'></Container>
                            <Button
                                className='box-border w-full rounded-[8px] bg-brand px-[20px] py-[12px] text-center font-semibold text-white my-4'
                                href={verificationUrl}
                            >
                                Redefinir minha senha
                            </Button>
                        </Container>
                        <Text className='font-bold my-0 text-center'>
                            Para manter sua conta segura, não encaminhe este e-mail a ninguém.
                        </Text>
                    </Section>
                    <Hr className='my-12'></Hr>
                    <Text className='text-[#6a737d] text-sm text-center'>
                        Se você não solicitou essa alteração, basta ignorar e excluir esta mensagem.
                    </Text>
                </Container>
            </Body>
        </Html>
    </Tailwind>
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
