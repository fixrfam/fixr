import type { Translated } from "../../types";
import type { account as source } from "../en/account";

export const account: Translated<typeof source> = {
	settings: {
		passwordTitle: "Alterar Senha",
		passwordDescription:
			"Atualize a senha da sua conta. Para alterá-la com sucesso, você deve fornecer sua senha atual e uma nova senha.",
		passwordHint: "Certifique-se de escolher uma senha forte e única.",
		deleteTitle: "Excluir Conta",
		deleteDescription:
			"Excluir sua conta é permanente e não pode ser desfeito. Esta ação irá apagar todos os seus dados e dados relacionados a você.",
		deleteHint:
			"Por favor, certifique-se de que realmente deseja prosseguir antes de confirmar.",
	},
	changePassword: {
		trigger: "Mudar",
		title: "Alterar senha",
		description: "Insira sua senha atual e a nova senha que você deseja usar.",
		current: "Atual",
		new: "Nova",
		confirm: "Confirmar",
		confirmDescription:
			"Confirme sua senha para garantir que não haja erros de digitação, mantendo sua conta segura.",
	},
	deleteAccount: {
		trigger: "Solicitar exclusão",
		title: "Você tem certeza absoluta?",
		description:
			"Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e removerá seus dados dos nossos servidores.",
		phraseLabel: 'Por favor, digite "delete my account" para continuar',
		phrasePlaceholder: "Digite aqui",
		phraseInvalid: "Frase inválida.",
		submit: "Excluir",
	},
	profile: {
		noDisplayName: "Sem nome de exibição",
		info: "Info",
	},
	avatar: {
		userPhoto: "Foto do usuário",
		change: "Alterar foto do perfil",
		remove: "Remover foto do perfil",
		alt: "Foto do perfil",
		uploadTitle: "Alterar Foto do Perfil",
		stepSelect: "Escolha uma foto para seu perfil.",
		stepCrop: "Ajuste o enquadramento da sua foto.",
		stepUploading: "Salvando...",
		saving: "Salvando sua foto...",
		dropzoneTitle: "Arraste sua foto aqui ou clique para selecionar",
		dropzoneHint: "PNG, JPG ou WebP. Máximo de 5MB.",
		updateSuccess: "Foto de perfil atualizada com sucesso!",
		updateError: "Erro ao atualizar foto de perfil",
		removeTitle: "Remover foto do perfil",
		removeDescription:
			"Tem certeza que deseja remover sua foto de perfil? Essa ação não pode ser desfeita.",
		removing: "Removendo...",
		removeSuccess: "Foto de perfil removida com sucesso.",
		removeError: "Erro ao remover foto de perfil.",
	},
} as const;
