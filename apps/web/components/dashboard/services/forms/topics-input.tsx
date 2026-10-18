"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopicsInputProps {
	value: string[];
	onChange: (value: string[]) => void;
	placeholder?: string;
}

/**
 * Edits a list of short text topics: type one, press Enter (or "Adicionar")
 * and it joins the bulleted list below.
 */
export function TopicsInput({
	value,
	onChange,
	placeholder,
}: TopicsInputProps) {
	const [draft, setDraft] = useState("");

	function addTopic() {
		const topic = draft.trim();
		if (!topic || value.includes(topic)) return;
		onChange([...value, topic]);
		setDraft("");
	}

	return (
		<div className="space-y-2">
			<div className="flex gap-2">
				<Input
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							addTopic();
						}
					}}
					placeholder={placeholder}
					value={draft}
				/>
				<Button
					className="shrink-0"
					disabled={!draft.trim()}
					onClick={addTopic}
					type="button"
					variant="outline"
				>
					Adicionar <Plus className="size-3.5" />
				</Button>
			</div>
			{value.length > 0 && (
				<ul className="list-disc space-y-1 pl-5 text-sm marker:text-muted-foreground">
					{value.map((topic) => (
						<li key={topic}>
							<div className="flex items-start justify-between gap-2">
								<span>{topic}</span>
								<button
									aria-label={`Remover ${topic}`}
									className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
									onClick={() => onChange(value.filter((v) => v !== topic))}
									type="button"
								>
									<X className="size-3.5" />
								</button>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
