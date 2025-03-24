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
    Markdown,
    Preview,
    Section,
    Tailwind,
    Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import { FixrHeader } from "../components/FixrHeader";

export interface EmailProps {
    displayName: string;
    companyName: string;
    appName: string;
    password: string;
    ctaUrl: string;
}

export const Invite = ({ displayName, appName, companyName, ctaUrl, password }: EmailProps) => (
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
            <Preview>
                {displayName}, seu acesso ao {appName}!
            </Preview>
            <Body style={main}>
                <Container className='max-w-[480px] mx-auto '>
                    <FixrHeader />

                    <Text className='my-0 text-lg tracking-tight'>
                        Olá, <i className='italic'>{displayName}</i>!
                    </Text>
                    <Heading className='text-left my-0 text-2xl md:text-3xl font-semibold tracking-tight mb-4 md:mb-[32px]'>
                        A{" "}
                        <b className='font-semibold underline underline-offset-4 decoration-brand decoration-4'>
                            {companyName}
                        </b>{" "}
                        te adicionou no {appName}.
                    </Heading>
                    <Section className='gap-0'>
                        <Text>
                            Seu cadastro foi realizado com <b>sucesso</b>. Agora você é um{" "}
                            <b>funcionário</b> da <b>{companyName}</b> e pode acessar a plataforma
                            para gerenciar ordens de serviço, orçamentos e muito mais.
                        </Text>

                        <Text>
                            Para acessar o sistema, <b>clique no botão abaixo</b> e faça login com{" "}
                            <b>este email</b> e a <b>senha aleatória</b> de acesso.
                        </Text>

                        <Container>
                            <Text className='text-2xl font-semibold tracking-tight text-center bg-border/25 w-full md:py-8 rounded-md'>
                                {password}
                            </Text>
                            <Container className='w-full flex items-center justify-center  text-center'></Container>
                            <Button
                                className='box-border w-full rounded-[8px] bg-brand px-[20px] py-[12px] text-center font-semibold text-white my-4'
                                href={ctaUrl}
                            >
                                Acessar
                            </Button>
                            <Text className='font-bold my-0 text-center'>
                                Altere a senha padrão no painel de conta após o primeiro acesso.
                            </Text>
                        </Container>
                    </Section>
                    <Hr className='my-12'></Hr>
                    <Text className='text-[#6a737d] text-sm text-center'>
                        Se você não reconhece essa empresa, por favor, ignore este email.
                    </Text>
                </Container>
            </Body>
        </Html>
    </Tailwind>
);

Invite.PreviewProps = {
    displayName: "Ricardo",
    companyName: "Empresa",
    appName: "Fixr",
    ctaUrl: "https://localhost:3000/auth/login",
    password: "#}sPhzIvUj",
} as EmailProps;

export default Invite;

const main = {
    backgroundColor: "#ffffff",
    color: "#24292e",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
};

export async function renderEmail({ ...props }: EmailProps): Promise<string> {
    try {
        return await render(<Invite {...props} />);
    } catch (error) {
        console.error("Failed to render email", error);
        throw new Error(`Failed to render email ${error}`);
    }
}
