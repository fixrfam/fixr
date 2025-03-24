import { Section, Row, Column, Img, Link, Container } from "@react-email/components";
import { whiteLogoUrl } from "../src";

import React from "react";

export const FixrHeader = () => {
    return (
        <Section className='my-[40px] py-4 bg-brand rounded-lg'>
            <Row className='px-6'>
                <Column className='w-[80%]'>
                    <Img alt='React Email logo' width={70} src={whiteLogoUrl} />
                </Column>
                <Column align='right'>
                    <Row align='right'>
                        <Column className='px-[8px]'>
                            <Link className='text-white [text-decoration:none]' href='#'>
                                Docs
                            </Link>
                        </Column>
                        <Column className='px-[8px]'>
                            <Link className='text-white [text-decoration:none]' href='#'>
                                App
                            </Link>
                        </Column>
                    </Row>
                </Column>
            </Row>
        </Section>
    );
};
