import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import { render } from "@react-email/render";
// biome-ignore lint/correctness/noUnusedImports: <Need that for the email to render :P>
import React from "react";
import { FixrHeader } from "../components/fixr-header";

export interface EmailProps {
	displayName: string;
	companyName: string;
	appName: string;
	password: string;
	ctaUrl: string;
}

export const Invite = ({
	displayName,
	appName,
	companyName,
	ctaUrl,
	password,
}: EmailProps) => (
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
				<Container className="mx-auto max-w-[480px]">
					<FixrHeader />

					<Text className="my-0 text-lg tracking-tight">
						Olá, <i className="italic">{displayName}</i>!
					</Text>
					<Heading className="my-0 mb-4 text-left font-semibold text-2xl tracking-tight md:mb-[32px] md:text-3xl">
						A{" "}
						<b className="font-semibold underline decoration-4 decoration-brand underline-offset-4">
							{companyName}
						</b>{" "}
						te adicionou no {appName}.
					</Heading>
					<Section className="gap-0">
						<Text>
							Seu cadastro foi realizado com <b>sucesso</b>. Agora você é um{" "}
							<b>funcionário</b> da <b>{companyName}</b> e pode acessar a
							plataforma para gerenciar ordens de serviço, orçamentos e muito
							mais.
						</Text>

						<Text>
							Para acessar o sistema, <b>clique no botão abaixo</b> e faça login
							com <b>este email</b> e a <b>senha aleatória</b> de acesso.
						</Text>

						<Container>
							<Text className="w-full rounded-md bg-border/25 text-center font-semibold text-2xl tracking-tight md:py-8">
								{password}
							</Text>
							<Container className="flex w-full items-center justify-center text-center" />
							<Button
								className="my-4 box-border w-full rounded-[8px] bg-brand px-[20px] py-[12px] text-center font-semibold text-white"
								href={ctaUrl}
							>
								Acessar
							</Button>
							<Text className="my-0 text-center font-bold">
								Altere a senha padrão no painel de conta após o primeiro acesso.
							</Text>
						</Container>
					</Section>
					<Hr className="my-12" />
					<Text className="text-center text-[#6a737d] text-sm">
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
