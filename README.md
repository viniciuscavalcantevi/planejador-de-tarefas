# Planejador de Tarefas

Aplicativo de gerenciamento de tarefas em português (pt-BR), inspirado na visualização de
lista do Microsoft Planner / To Do. React + TypeScript + Vite + Tailwind CSS, com
autenticação, banco de dados e armazenamento de anexos via Supabase — e um modo
demonstração completo que funciona sem nenhuma credencial.

Inclui times (workspaces) com um responsável por time, colaboradores convidados por email,
até 3 responsáveis por tarefa, e uma página de relatório com visão geral simples das
tarefas do time atual. A criação de novos times é restrita a Administradores do sistema
(uma marcação separada do "responsável" de cada time — veja a seção 3 abaixo).

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Radix UI (diálogos, menus, seletores, painel lateral, toasts)
- React Hook Form + Zod (formulário de detalhes da tarefa)
- Tiptap (descrição em rich text)
- Supabase (auth, Postgres, storage) — opcional, com fallback para modo demonstração
- Vitest (testes de regras de negócio)

## 1. Instalar dependências

```bash
npm install
```

## 2. Rodar localmente

```bash
npm run dev
```

Abra `http://localhost:5173`. Sem um arquivo `.env` configurado, o app inicia
automaticamente em **modo demonstração**.

## 3. Modo demonstração

É o modo padrão quando `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` não estão definidos.

- Os dados (12 tarefas de exemplo, comentários, membros fictícios, 1 time de exemplo)
  ficam salvos no `localStorage` do navegador — nada é enviado a um servidor.
- Todas as ações funcionam de verdade: criar, editar, concluir, duplicar, excluir,
  filtrar, comentar, anexar arquivos (anexos ficam apenas na memória da aba atual e
  são identificados como locais/temporários — se recarregar a página eles desaparecem).
- Times: o seletor de time no topo da barra lateral lista os times do usuário. Só
  **Administradores** veem e usam a opção "+ Criar novo time" (no modo demonstração,
  "Você (Demonstração)" já começa marcado como administrador). Quem cria um time vira
  automaticamente seu responsável (dono) — essa é uma permissão por time, diferente e
  independente de ser Administrador do sistema.
- Administradores: o item "Administradores" na barra lateral (visível só para quem já é
  administrador) lista todos os perfis conhecidos e permite conceder ou revogar essa
  permissão com um interruptor. Ninguém pode remover a própria permissão de administrador,
  para o sistema nunca ficar sem nenhum.
- Em "Administrar time" o responsável de cada time adiciona colaboradores por email (a
  pessoa precisa já existir entre os perfis do time atual ou de outro time no mesmo
  navegador) e remove colaboradores; colaboradores comuns só visualizam essa tela.
- Tarefas podem ter até 3 responsáveis simultâneos, selecionados no campo
  "Responsáveis (até 3)" da tabela ou do painel de detalhes.
- A página "Relatório" mostra uma visão geral simples (sem bibliotecas de gráficos) das
  tarefas do time atualmente selecionado: totais por status/prioridade e tarefas por
  responsável.
- O aviso roxo no topo identifica o modo e tem um botão "Restaurar dados de exemplo"
  para voltar ao estado inicial a qualquer momento.
- Não simula autenticação real nem sincronização com servidor.

## 4. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.
3. Copie `.env.example` para `.env` e preencha:

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-key
   ```

4. Reinicie `npm run dev`. Com as variáveis presentes, o app passa a usar o
   `SupabaseRepository` (`src/services/supabaseRepository.ts`) em vez do modo demonstração.

## 5. Executar as migrations

As migrations estão em `supabase/migrations/`, em ordem:

- `0001_schema.sql` — tabelas, tipos enum, constraints, índices e triggers de integridade
  (ex.: `completed_date` sempre coerente com `status`; tabela `task_assignees` com no
  máximo 3 linhas por tarefa, cada responsável precisando pertencer ao workspace da
  tarefa).
- `0002_functions.sql` — `ensure_initial_workspace` (cria o workspace inicial no primeiro
  acesso), `add_workspace_member_by_email` (convite seguro por email exato, sem expor lista
  de usuários), `set_user_admin` (concede/revoga Administrador — só quem já é admin pode
  chamar, e ninguém remove a própria permissão) e os triggers que geram o histórico
  (`task_activity`) automaticamente no banco — a interface nunca escreve nessa tabela
  diretamente.
- `0003_rls.sql` — Row Level Security em todas as tabelas, isolando dados por workspace e
  aplicando as regras de permissão (proprietário vs. membro, autor vs. não autor; só
  Administradores podem criar workspaces — `profiles.is_admin` — e a coluna `is_admin` só
  muda através de `set_user_admin`, nunca por um update direto do usuário).
- `0004_storage.sql` — bucket privado `task-attachments` e políticas de storage.

**Importante:** um projeto Supabase novo começa sem nenhum Administrador. Depois da
primeira pessoa se cadastrar, promova-a manualmente uma única vez pelo SQL Editor:

```sql
update profiles set is_admin = true where id = '<uuid do primeiro usuário>';
```

A partir daí, essa pessoa usa a tela "Administradores" no app para promover as demais.

Aplique com a [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref SEU-PROJETO
supabase db push
```

Ou cole o conteúdo de cada arquivo, na ordem, no **SQL Editor** do painel do Supabase.

Depois, crie o bucket de anexos (a migration `0004` já faz isso via SQL, mas confirme em
**Storage** que `task-attachments` existe e está marcado como privado).

## 6. Configurar URLs de autenticação

Em **Authentication → URL Configuration** no painel do Supabase:

- **Site URL**: a URL de produção (ex.: `https://seu-app.vercel.app`).
- **Redirect URLs**: adicione a mesma URL de produção e `http://localhost:5173` para
  desenvolvimento. O fluxo de redefinição de senha usa `<origem>/redefinir-senha`.
- Confirme se "Confirm email" está habilitado conforme sua política desejada — o cadastro
  (`signUp`) já lida com o retorno assíncrono da confirmação.

## 7. Publicar pela integração do GitHub com a Vercel

1. Suba este repositório para o GitHub.
2. Na Vercel, **Add New → Project** e importe o repositório.
3. Framework preset: **Vite** (detectado automaticamente).
4. Configure as variáveis de ambiente (próximo passo) antes do primeiro deploy.
5. `vercel.json` já inclui o rewrite de SPA necessário para rotas client-side.

## 8. Configurar variáveis de ambiente na Vercel

Em **Project Settings → Environment Variables**, adicione para os ambientes de
Production/Preview/Development:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 9. Executar o build

```bash
npm run build
```

Gera os arquivos estáticos em `dist/`. Para pré-visualizar o build localmente:

```bash
npm run preview
```

## Testes automatizados

```bash
npm run test
```

Cobrem as regras de negócio centrais (`src/lib/taskRules.ts`):
sincronização entre checkbox/status/data fim, detecção de atraso (tarefas concluídas
nunca aparecem como atrasadas), validação de datas (prevista/fim não podem ser
anteriores ao início), validação do limite de 3 responsáveis por tarefa, e a lógica
combinada de filtros/busca/visualizações da barra lateral (Todas, Minhas, Importantes,
Planejadas, Concluídas) já considerando múltiplos responsáveis.

## O que foi validado nesta entrega e o que depende de configuração externa

**Validado nesta sessão de desenvolvimento:**

- Testes automatizados de regras de negócio (22/22 passando).
- `tsc -b` sem erros de tipo em todo o projeto.
- `npm run build` gera o bundle de produção com sucesso.
- Fluxo completo testado manualmente no navegador em **modo demonstração**: criar,
  editar, concluir/reabrir (com desfazer via toast), duplicar, excluir tarefa; edição
  inline de origem/prioridade/status/responsável/vencimento na tabela; abertura do
  painel de detalhes; edição de campos com salvar/cancelar e aviso de alterações não
  salvas ao fechar; detecção de tarefa atrasada; layout responsivo (tabela no
  desktop, cartões no mobile, navegação lateral recolhível).
- Times: criar um novo time, alternar entre times com isolamento correto dos dados,
  virar responsável automaticamente ao criar um time, adicionar colaborador por email
  em "Administrar time".
- Múltiplos responsáveis: selecionar até 3 responsáveis por tarefa, bloqueio da
  seleção de um 4º responsável na interface, exibição dos avatares empilhados na
  tabela e nos cartões.
- Página "Relatório": números batendo com os dados do time selecionado.
- Administradores: só o admin vê "+ Criar novo time"; conceder e revogar a permissão
  pela tela "Administradores"; bloqueio de remover a própria permissão.

**Não validado (depende de credenciais que não foram fornecidas nesta sessão):**

- O `SupabaseRepository`, as migrations SQL, as políticas de RLS e de Storage **não
  foram executadas contra um projeto Supabase real**. O código foi escrito seguindo o
  mesmo contrato (`TaskRepository`) usado e testado no modo demonstração, mas só
  será confirmado quando você conectar um projeto Supabase e rodar as migrations.
- O deploy na Vercel não foi realizado — as instruções acima descrevem o processo,
  mas a publicação em si depende da sua conta Vercel/GitHub.
- Fluxos de autenticação real (cadastro, confirmação de email, redefinição de senha)
  não foram exercitados, pois exigem um projeto Supabase configurado.

Ao configurar o Supabase, recomenda-se testar manualmente, nesta ordem: cadastro →
confirmação de email → criação automática do workspace inicial → criar um segundo time
→ convite de um segundo usuário por email a cada time → isolamento de dados entre times
→ atribuir até 3 responsáveis a uma tarefa e confirmar que o 4º é rejeitado pelo banco
(trigger `enforce_task_assignee_limits`) → upload/download/exclusão de anexos →
permissões de exclusão (autor vs. proprietário) → remoção de colaborador de um time.

## Estrutura do código

```
src/
  components/       # Componentes de interface (apresentação)
  lib/              # Regras de negócio puras e utilitários (taskRules, taskLabels, utils)
  services/         # Camada de repositório: contrato comum + implementações demo/Supabase
  store/            # Contextos de estado (tarefas, toasts)
  test/             # Setup do Vitest
supabase/
  migrations/       # Schema, funções, RLS e políticas de storage
```

A interface nunca fala diretamente com `localStorage` ou com o cliente Supabase — tudo
passa pela interface `TaskRepository` (`src/services/repository.ts`), implementada por
`DemoRepository` e `SupabaseRepository`. Isso mantém as regras de negócio e os tipos
compartilhados entre os dois modos.
