# FinTrack — Controle Financeiro Pessoal

Stack: **Next.js 14** · **Supabase** · **Recharts** · **Tailwind CSS**

---

## 1. Pré-requisitos

- Node.js 18+ instalado
- Conta gratuita no [Supabase](https://supabase.com)

---

## 2. Configurar o Supabase

1. Crie um projeto em https://supabase.com
2. Vá em **SQL Editor** e rode o seguinte SQL para criar as tabelas:

```sql
-- Tabela de lançamentos
create table lancamentos (
  id          bigserial primary key,
  descricao   text        not null,
  valor       numeric     not null,
  categoria   text        not null,
  tipo        text        not null check (tipo in ('gasto', 'ganho')),
  data        date        not null,
  created_at  timestamptz default now()
);

-- Tabela de limite semanal (sempre 1 linha, id=1)
create table limite_semanal (
  id          int primary key default 1,
  valor       numeric     not null default 500,
  updated_at  timestamptz default now()
);

-- Insere a config inicial
insert into limite_semanal (id, valor) values (1, 500);

-- Tabela de gastos fixos mensais
create table gastos_fixos (
  id              bigserial primary key,
  descricao       text    not null,
  valor           numeric not null,
  categoria       text    not null,
  dia_vencimento  int     not null check (dia_vencimento between 1 and 28),
  ativo           boolean not null default true
);
```

3. Vá em **Settings → API** e copie:
   - **Project URL**
   - **anon public key**

---

## 3. Instalar e rodar localmente

```bash
# Clone ou descompacte o projeto
cd fintrack

# Instale as dependências
npm install

# Copie o arquivo de variáveis de ambiente
cp .env.local.example .env.local
```

Abra `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

```bash
# Rode em modo desenvolvimento
npm run dev
```

Acesse http://localhost:3000

---

## 4. Deploy na Vercel (gratuito)

1. Crie conta em https://vercel.com
2. Instale a CLI: `npm i -g vercel`
3. Na pasta do projeto: `vercel`
4. Siga o wizard (Next.js é detectado automaticamente)
5. Adicione as variáveis de ambiente no painel da Vercel:
   - Settings → Environment Variables → adicione as 2 variáveis do `.env.local` (Supabase URL e Anon Key)
6. Faça redeploy: `vercel --prod`

Pronto! O app estará acessível de qualquer dispositivo pelo link da Vercel.

---

## 5. Instalar como PWA no iOS

1. Abra o link da Vercel no Safari
2. Toque no botão de compartilhar (caixa com seta para cima)
3. Selecione **"Adicionar à Tela de Início"**
4. Confirme — o FinTrack aparecerá como app nativo

---

## Estrutura do projeto

```
fintrack/
├── app/
│   ├── (app)/              # Páginas com sidebar
│   │   ├── page.tsx         # Dashboard
│   │   ├── lancamentos/     # Formulário de lançamentos
│   │   ├── categorias/      # Gastos por categoria
│   │   ├── limites/         # Configuração de limite semanal
│   │   └── fixos/           # Gerenciar gastos fixos mensais
│   ├── api/
│   │   ├── lancamentos/     # GET e POST de lançamentos
│   │   ├── limite/          # GET e POST do limite semanal
│   │   └── fixos/           # GET, POST, PATCH, DELETE de gastos fixos
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── Sidebar.tsx
│   ├── AlertaBanner.tsx     # Alerta verde/amarelo/vermelho
│   └── DashboardCharts.tsx  # Gráficos Recharts
├── lib/
│   └── supabase.ts          # Cliente, tipos, helpers, cores
├── public/
│   └── manifest.json        # PWA
├── .env.local.example
└── README.md
```

---

## Funcionalidades

| Módulo | Descrição |
|---|---|
| Dashboard | Saldo, ganhos, gastos, gráfico pizza por categoria, barras mensais, recentes |
| Lançar | Formulário para gastos e ganhos com categoria e data |
| Categorias | Breakdown visual por categoria com barra de progresso |
| Limite semanal | Configuração + status em tempo real com barra colorida |
| Fixos mensais | Cadastro de gastos recorrentes com dia de vencimento e toggle ativo/inativo |
