# Plano: login (credenciais + OAuth) em domínio e application

## Contexto do repositório

- Padrão atual: casos de uso em `src/modules/application/use-cases/`, retorno `Either<Erro, Sucesso>` (ex.: `register-customer.ts`, `get-me.ts`).
- `UsersRepository`: `findByEmail`, `findById`, `findByProviderAndSubject`, `create`, `save`.
- `HashGenerator`: só `hash` — comparação senha/hash é o port `HashComparer`.
- `User`: permite conta incompleta (OAuth) e use case `CompleteUserProfileUseCase`; registros por email/senha continuam com dados completos na entrada do use case.

## 1. Login com email e senha

**Port:** `HashComparer` com `compare(plain: string, hash: string): Promise<boolean>`.

**Caso de uso:** `LoginWithCredentialsUseCase` — entrada `email`, `password`; mesmo erro genérico para usuário inexistente, sem senha local ou senha incorreta; sucesso retorna `{ user }`.

**Erro:** `InvalidCredentialsError`.

## 2. OAuth

O use case recebe identidade **já validada** pela infra (provider, subjectId, email, emailVerified). JWT e chamadas ao Google ficam fora do domínio.

## 3. Conta incompleta + completar cadastro

- `phone` e `address` podem ser `null` até completar perfil.
- `isProfileComplete()` quando ambos estão preenchidos.
- `User.completeProfile({ phone, address })` no domínio.
- Registro clássico (`register-customer`, `register-establishment`) continua exigindo phone e address na entrada.
- OAuth cria `User` mínimo: `hashedPassword: null`, phone/address null, vínculos em `socialAccounts`.

## 4. OAuth no domínio

- VO `OAuthProvider` (ex.: `GOOGLE`).
- `socialAccounts: { provider, subjectId }[]` no `User`; `linkSocialAccount`.
- `UsersRepository.findByProviderAndSubject`.

## 5. Casos de uso

| Use case                       | Função                                         |
| ------------------------------ | ---------------------------------------------- |
| `LoginWithCredentialsUseCase`  | Email + senha                                  |
| `AuthenticateWithOAuthUseCase` | Identidade verificada; cria ou vincula usuário |
| `CompleteUserProfileUseCase`   | Preenche phone + address; erro se já completo  |

## 6. Fora de escopo

- Emissão de JWT/refresh (infra ou use case futuro).
