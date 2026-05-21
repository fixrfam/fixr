import { Column, Img, Link, Row, Section } from "@react-email/components";
// biome-ignore lint/correctness/noUnusedImports: <Need that for the email to render :P>
import React from "react";
import { whiteLogoUrl } from "../src";

export const FixrHeader = () => {
	return (
		<Section className="my-[40px] rounded-lg bg-brand py-4">
			<Row className="px-6">
				<Column className="w-[80%]">
					<Img alt="React Email logo" src={whiteLogoUrl} width={70} />
				</Column>
				<Column align="right">
					<Row align="right">
						<Column className="px-[8px]">
							<Link className="text-white [text-decoration:none]" href="#">
								Docs
							</Link>
						</Column>
						<Column className="px-[8px]">
							<Link className="text-white [text-decoration:none]" href="#">
								App
							</Link>
						</Column>
					</Row>
				</Column>
			</Row>
		</Section>
	);
};
