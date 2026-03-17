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

interface EmailProps {
	displayName: string;
	appName: string;
	verificationUrl: string;
}

const _baseUrl = process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}`
	: "";

export const PasswordReset = ({ displayName, verificationUrl }: EmailProps) => (
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
				<Container className="mx-auto max-w-[480px]">
					<FixrHeader />

					<Text className="my-0 text-lg tracking-tight">
						Olá, <i className="italic">{displayName}</i>!
					</Text>
					<Heading className="my-0 mb-4 text-left font-semibold text-2xl tracking-tight md:text-3xl">
						Esqueceu sua senha? 🔒
					</Heading>
					<Section className="gap-0">
						<Text>
							Recebemos uma solicitação para alterar a senha da sua conta no
							Fixr.
							<br />
							Se foi você, pode definir uma nova senha clicando no botão abaixo:
						</Text>

						<Container>
							<Container className="flex w-full items-center justify-center text-center" />
							<Button
								className="my-4 box-border w-full rounded-[8px] bg-brand px-[20px] py-[12px] text-center font-semibold text-white"
								href={verificationUrl}
							>
								Redefinir minha senha
							</Button>
						</Container>
						<Text className="my-0 text-center font-bold">
							Para manter sua conta segura, não encaminhe este e-mail a ninguém.
						</Text>
					</Section>
					<Hr className="my-12" />
					<Text className="text-center text-[#6a737d] text-sm">
						Se você não solicitou essa alteração, basta ignorar e excluir esta
						mensagem.
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

const _container = {
	maxWidth: "480px",
	margin: "0 auto",
	padding: "20px 0 48px",
};

const _title = {
	fontSize: "24px",
	lineHeight: 1.25,
};

const _section = {
	padding: "24px",
	border: "solid 1px #dedede",
	borderRadius: "5px",
	textAlign: "center" as const,
};

const _text = {
	margin: "0 0 10px 0",
	textAlign: "left" as const,
};

const _button = {
	fontSize: "14px",
	backgroundColor: "#000000",
	color: "#fff",
	lineHeight: 1.5,
	borderRadius: "0.5em",
	padding: "12px 24px",
};

const _links = {
	textAlign: "center" as const,
};

const _link = {
	color: "#0366d6",
	fontSize: "12px",
};

const _footer = {
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
				appName={appName}
				displayName={displayName}
				verificationUrl={verificationUrl}
			/>
		);
	} catch (error) {
		console.error("Failed to render email", error);
		throw new Error(`Failed to render email ${error}`);
	}
}
