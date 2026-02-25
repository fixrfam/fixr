"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { forwardRef, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PasswordInput = forwardRef<
	HTMLInputElement,
	React.ComponentPropsWithoutRef<"input">
>((props, ref) => {
	const id = useId();
	const [isVisible, setIsVisible] = useState<boolean>(false);

	const toggleVisibility = () => setIsVisible((prevState) => !prevState);

	return (
		<div className={cn("relative", props.className)}>
			<Input
				className={cn("pe-9", props.className)}
				id={id}
				placeholder="Password"
				ref={ref}
				type={isVisible ? "text" : "password"}
				{...props}
			/>
			<button
				aria-controls="password"
				aria-label={isVisible ? "Hide password" : "Show password"}
				aria-pressed={isVisible}
				className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 outline-hidden transition-[color,box-shadow] hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
				onClick={toggleVisibility}
				type="button"
			>
				{isVisible ? (
					<EyeOffIcon aria-hidden="true" size={16} />
				) : (
					<EyeIcon aria-hidden="true" size={16} />
				)}
			</button>
		</div>
	);
});

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
