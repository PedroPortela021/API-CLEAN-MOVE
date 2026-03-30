# Clean-move API

API da plataforma de agendamento para lava-rápido (**Clean-move**), projetada para conectar clientes e estabelecimentos com foco em regras de negócio claras, domínio forte e evolução incremental por casos de uso.

Este repositório contém o **backend** da solução, responsável pela modelagem de domínio, casos de uso da aplicação e base para exposição futura de endpoints HTTP.

---

## Ideia do projeto

O Clean-move permite que:

- **Donos de lava-rápido**:
  - Cadastrem seu estabelecimento.
  - Gerenciem catálogo de serviços e disponibilidade.
  - Acompanhem agendamentos e histórico do negócio.
- **Consumidores**:
  - Criem conta e autentiquem no sistema.
  - Descubram estabelecimentos e serviços.
  - Favoritem estabelecimentos e gerenciem preferências.
  - Agendem e acompanhem atendimentos.

No backend, a prioridade é garantir consistência das regras de negócio antes da camada HTTP completa.

---

## Arquitetura e abordagem

- **Arquitetura em camadas** com separação entre domínio, aplicação, infraestrutura e testes.
- **Modelagem orientada a domínio**, com entidades e value objects para proteger invariantes.
- **Use cases explícitos**, concentrando regras de negócio da aplicação.
- **Repositorios por contrato**, facilitando troca de implementação (in-memory, banco real etc.).
- **Testes unitários** cobrindo comportamento esperado e cenários de erro.

Estrutura resumida:

- `src/modules/accounts`: domínio de usuários e value objects (email, cpf, telefone, endereço, papel do usuário).
- `src/modules/customer`: domínio e casos de uso de cliente.
- `src/modules/establishments`: domínio de estabelecimentos e value objects (cnpj, slug, horário de funcionamento).
- `src/modules/catalog`: domínio de serviços (nome, categoria, duração estimada, preço).
- `src/modules/application`: casos de uso e contratos de repositório.
- `src/modules/infra`: bootstrap do NestJS.
- `src/shared`: abstrações comuns (entidades base, erros, tipos, eventos e utilitários).
- `src/tests`: dublês de repositório e fábricas para testes.

---

## Tecnologias principais

- **Node.js 22**
- **TypeScript 5**
- **NestJS 11**
- **Vitest** para testes
- **ESLint + Prettier**

---

## Como executar localmente

### 1) Pré-requisitos

- Node.js `>=22 <23`
- npm

### 2) Instalação

```bash
npm install
```

### 3) Rodar em desenvolvimento

```bash
npx ts-node src/modules/infra/main.ts
```

### 4) Build e execução em produção

```bash
npm run build
node dist/modules/infra/main.js
```

> Dica: os scripts `start` e `start:dev` do `package.json` ainda podem ser ajustados para esses caminhos.

---

## Scripts úteis

- `npm run start:dev`: script existente no projeto (atualmente precisa de ajuste de caminho).
- `npm run build`: compila TypeScript para `dist`.
- `npm run start`: script existente no projeto (atualmente precisa de ajuste de caminho).
- `npm run test`: executa suíte de testes.
- `npm run test:unit`: executa testes de unidade em `src`.
- `npm run lint`: valida padrões de código.
- `npm run format`: formata o projeto.
- `npm run typecheck`: valida tipos TypeScript.
- `npm run check:all`: pipeline local completa (build, lint, format, typecheck e testes).

---

## Estado atual do backend

Atualmente a API já possui:

- Base de domínio com entidades e value objects centrais.
- Casos de uso de cadastro e atualização para usuários, cliente, estabelecimento e catálogo de serviços.
- Contratos de repositório e implementações in-memory para testes.
- Testes unitários cobrindo fluxo feliz e principais regras de validação.
- Estrutura NestJS inicial pronta para evolução da camada HTTP.

> Observação: a camada de controllers/endpoints ainda está em evolução incremental. O foco atual está na consistência das regras de negócio.

---

## Integração com o frontend

Este backend faz parte do ecossistema Clean-move. Para referência de visão de produto e arquitetura da interface, veja o repositório frontend:

- [FRONTEND-CLEAN-MOVE](https://github.com/PedroPortela021/FRONTEND-CLEAN-MOVE?tab=readme-ov-file#clean-move)

---

## Próximos passos sugeridos

- Expor endpoints HTTP para os casos de uso já implementados.
- Adicionar camada de persistência real (ex.: banco de dados relacional).
- Implementar autenticação/autorização para fluxos protegidos.
- Expandir testes de integração e contratos de API.
- Evoluir observabilidade (logs estruturados, métricas e health checks).

---

## Licença

Projeto disponível sob licença `ISC`.
