import { z } from 'zod'

export const cnpj = z
  .string()
  .regex(/([0-9]{2}[\.]?[0-9]{3}[\.]?[0-9]{3}[\/]?[0-9]{4}[-]?[0-9]{2})/, {
    message: 'Formato inválido.',
  })

export const formattedCnpj = z
  .string()
  .regex(/([0-9]{2}[\.]?[0-9]{3}[\.]?[0-9]{3}[\/]?[0-9]{4}[-]?[0-9]{2})/, {
    message: 'Formato inválido.',
  })

export const cpf = z
  .string()
  .regex(/([0-9]{3}[\.]?[0-9]{3}[\.]?[0-9]{3}[-]?[0-9]{2})/, {
    message: 'Formato inválido.',
  })
