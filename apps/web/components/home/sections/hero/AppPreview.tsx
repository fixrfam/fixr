"use client";

import Image from "next/image";
import Grid from "../../Grid";
import { motion } from "framer-motion";
import HomeLight from "@/public/home_light.webp";
import HomeDark from "@/public/home_dark.webp";

export const AppPreview = () => {
    return (
        <motion.div
            initial={{ y: 10, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className='p-1 lg:p-2 rounded-2xl lg:rounded-4xl border-accent border-2 relative bg-background'
        >
            <div
                id='appimage'
                className='border-border border rounded-xl lg:rounded-3xl overflow-hidden shadow-[0_0_1rem_0_#ffffff26] relative z-2'
            >
                <Image className='hidden dark:block' src={HomeDark} alt='' />
                <Image className='dark:hidden block' src={HomeLight} alt='' />
            </div>
            <div
                id='blueglow'
                className='z-1 absolute w-4/5 h-1/4 bg-primary top-[30px] left-1/2 -translate-x-1/2 rounded-[100%] blur-[110px]'
            ></div>
            <div
                id='grid'
                className='absolute z-1 w-full h-1/4 top-[30px] left-1/2 -translate-x-1/2 -translate-y-full'
                style={{
                    maskImage:
                        "radial-gradient(ellipse 60% 100% at 50% 100%, black 20%, transparent 80%)",
                    WebkitMaskImage:
                        "radial-gradient(ellipse 100% 100% at 50% 50%, black 20%, transparent 80%)",
                }}
            >
                <Grid stroke={"var(--primary)"} className='stroke-red-300 opacity-10' />
            </div>
        </motion.div>
    );
};
