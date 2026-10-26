"use client";

/**
 * File picking and drag and drop state, adapted from ReUI's `use-file-upload`
 * (https://reui.io/components/file-upload).
 *
 * Changed from upstream: validation reports error codes instead of English
 * messages, so callers render them through `@fixr/i18n`.
 */

import {
	type ChangeEvent,
	type DragEvent,
	type InputHTMLAttributes,
	type Ref,
	useCallback,
	useRef,
	useState,
} from "react";

export interface FileMetadata {
	name: string;
	size: number;
	type: string;
	url: string;
	id: string;
}

export interface FileWithPreview {
	file: File | FileMetadata;
	id: string;
	preview?: string;
}

export type FileUploadErrorCode = "tooLarge" | "invalidType" | "tooMany";

export interface FileUploadError {
	code: FileUploadErrorCode;
	fileName?: string;
}

export interface FileUploadOptions {
	/** Only used when `multiple` is true. */
	maxFiles?: number;
	/** In bytes. */
	maxSize?: number;
	accept?: string;
	multiple?: boolean;
	initialFiles?: FileMetadata[];
	onFilesChange?: (files: FileWithPreview[]) => void;
	onFilesAdded?: (addedFiles: FileWithPreview[]) => void;
	onError?: (errors: FileUploadError[]) => void;
}

export interface FileUploadState {
	files: FileWithPreview[];
	isDragging: boolean;
	errors: FileUploadError[];
}

export interface FileUploadActions {
	addFiles: (files: FileList | File[]) => void;
	removeFile: (id: string) => void;
	clearFiles: () => void;
	clearErrors: () => void;
	handleDragEnter: (e: DragEvent<HTMLElement>) => void;
	handleDragLeave: (e: DragEvent<HTMLElement>) => void;
	handleDragOver: (e: DragEvent<HTMLElement>) => void;
	handleDrop: (e: DragEvent<HTMLElement>) => void;
	handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
	openFileDialog: () => void;
	getInputProps: (
		props?: InputHTMLAttributes<HTMLInputElement>
	) => InputHTMLAttributes<HTMLInputElement> & {
		ref: Ref<HTMLInputElement>;
	};
}

function isAcceptedType(file: File | FileMetadata, accept: string) {
	if (accept === "*") {
		return true;
	}
	const extension = `.${file.name.split(".").pop() ?? ""}`.toLowerCase();

	return accept
		.split(",")
		.map((type) => type.trim())
		.some((type) => {
			if (type.startsWith(".")) {
				return extension === type.toLowerCase();
			}
			if (type.endsWith("/*")) {
				return file.type.startsWith(`${type.split("/")[0]}/`);
			}
			return file.type === type;
		});
}

function revokePreview(file: FileWithPreview) {
	if (
		file.preview &&
		file.file instanceof File &&
		file.file.type.startsWith("image/")
	) {
		URL.revokeObjectURL(file.preview);
	}
}

/** Split incoming files into accepted previews and validation errors. */
function collectFiles(
	incoming: File[],
	existing: FileWithPreview[],
	multiple: boolean,
	validateFile: (file: File) => FileUploadError | null
) {
	const validFiles: FileWithPreview[] = [];
	const errors: FileUploadError[] = [];

	for (const file of incoming) {
		const isDuplicate =
			multiple &&
			existing.some(
				(item) => item.file.name === file.name && item.file.size === file.size
			);
		if (isDuplicate) {
			continue;
		}

		const error = validateFile(file);
		if (error) {
			errors.push(error);
			continue;
		}

		validFiles.push({
			file,
			id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
			preview: URL.createObjectURL(file),
		});
	}

	return { validFiles, errors };
}

export function useFileUpload(
	options: FileUploadOptions = {}
): [FileUploadState, FileUploadActions] {
	const {
		maxFiles = Number.POSITIVE_INFINITY,
		maxSize = Number.POSITIVE_INFINITY,
		accept = "*",
		multiple = false,
		initialFiles = [],
		onFilesChange,
		onFilesAdded,
		onError,
	} = options;

	const [state, setState] = useState<FileUploadState>({
		files: initialFiles.map((file) => ({
			file,
			id: file.id,
			preview: file.url,
		})),
		isDragging: false,
		errors: [],
	});

	const inputRef = useRef<HTMLInputElement>(null);

	const validateFile = useCallback(
		(file: File | FileMetadata): FileUploadError | null => {
			if (file.size > maxSize) {
				return { code: "tooLarge", fileName: file.name };
			}
			if (!isAcceptedType(file, accept)) {
				return { code: "invalidType", fileName: file.name };
			}
			return null;
		},
		[accept, maxSize]
	);

	const clearFiles = useCallback(() => {
		setState((prev) => {
			for (const file of prev.files) {
				revokePreview(file);
			}
			if (inputRef.current) {
				inputRef.current.value = "";
			}
			onFilesChange?.([]);
			return { ...prev, files: [], errors: [] };
		});
	}, [onFilesChange]);

	const addFiles = useCallback(
		(newFiles: FileList | File[]) => {
			if (!newFiles || newFiles.length === 0) {
				return;
			}

			const incoming = Array.from(newFiles);

			setState((prev) => ({ ...prev, errors: [] }));

			if (!multiple) {
				clearFiles();
			}

			if (
				multiple &&
				maxFiles !== Number.POSITIVE_INFINITY &&
				state.files.length + incoming.length > maxFiles
			) {
				const errors: FileUploadError[] = [{ code: "tooMany" }];
				onError?.(errors);
				setState((prev) => ({ ...prev, errors }));
				return;
			}

			const { validFiles, errors } = collectFiles(
				incoming,
				state.files,
				multiple,
				validateFile
			);

			if (validFiles.length > 0) {
				onFilesAdded?.(validFiles);
				setState((prev) => {
					const files = multiple ? [...prev.files, ...validFiles] : validFiles;
					onFilesChange?.(files);
					return { ...prev, files, errors };
				});
			} else if (errors.length > 0) {
				onError?.(errors);
				setState((prev) => ({ ...prev, errors }));
			}

			if (inputRef.current) {
				inputRef.current.value = "";
			}
		},
		[
			state.files,
			maxFiles,
			multiple,
			validateFile,
			clearFiles,
			onFilesChange,
			onFilesAdded,
			onError,
		]
	);

	const removeFile = useCallback(
		(id: string) => {
			setState((prev) => {
				const toRemove = prev.files.find((file) => file.id === id);
				if (toRemove) {
					revokePreview(toRemove);
				}
				const files = prev.files.filter((file) => file.id !== id);
				onFilesChange?.(files);
				return { ...prev, files, errors: [] };
			});
		},
		[onFilesChange]
	);

	const clearErrors = useCallback(() => {
		setState((prev) => ({ ...prev, errors: [] }));
	}, []);

	const handleDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setState((prev) => ({ ...prev, isDragging: true }));
	}, []);

	const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.currentTarget.contains(e.relatedTarget as Node)) {
			return;
		}
		setState((prev) => ({ ...prev, isDragging: false }));
	}, []);

	const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		(e: DragEvent<HTMLElement>) => {
			e.preventDefault();
			e.stopPropagation();
			setState((prev) => ({ ...prev, isDragging: false }));

			if (inputRef.current?.disabled) {
				return;
			}
			const dropped = e.dataTransfer.files;
			if (dropped && dropped.length > 0) {
				addFiles(multiple ? dropped : [dropped[0] as File]);
			}
		},
		[addFiles, multiple]
	);

	const handleFileChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			if (e.target.files && e.target.files.length > 0) {
				addFiles(e.target.files);
			}
		},
		[addFiles]
	);

	const openFileDialog = useCallback(() => {
		inputRef.current?.click();
	}, []);

	const getInputProps = useCallback(
		(props: InputHTMLAttributes<HTMLInputElement> = {}) => ({
			...props,
			type: "file" as const,
			onChange: handleFileChange,
			accept: props.accept || accept,
			multiple: props.multiple ?? multiple,
			ref: inputRef,
		}),
		[accept, multiple, handleFileChange]
	);

	return [
		state,
		{
			addFiles,
			removeFile,
			clearFiles,
			clearErrors,
			handleDragEnter,
			handleDragLeave,
			handleDragOver,
			handleDrop,
			handleFileChange,
			openFileDialog,
			getInputProps,
		},
	];
}
