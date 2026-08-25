# Open Finance com a Pluggy

## A regra que decide a arquitetura

**O `clientSecret` nunca pode entrar no app.** Um PWA é código que roda no
aparelho da pessoa: qualquer um abre o DevTools e lê. E com esse par de
credenciais dá para criar itens na sua conta Pluggy — que é cobrada por item.

Por isso a integração tem três camadas:

```
app (celular)  →  Edge Function (Supabase)  →  Pluggy
   sem segredo        guarda o segredo         api.pluggy.ai
```

O app recebe apenas um **connect token**: curto, amarrado a um usuário, e sem
serventia fora do widget.

## O que já está no repositório

| Onde | O quê |
|---|---|
| `supabase/functions/_shared/pluggy.ts` | Autenticação na Pluggy, CORS e checagem do usuário |
| `supabase/functions/pluggy-connect-token/` | Devolve o token que o widget consome |
| `supabase/functions/pluggy-sync/` | Busca contas e extrato de um item |
| `src/services/pluggyTypes.ts` | As formas da Pluggy, recortadas ao que usamos |
| `src/services/pluggyMapping.ts` | Extrato → proposta de Mapa. Testado. |
| `src/lib/pluggy/client.ts` | Chama as functions com o token da sessão |
| `src/routes/conectar.tsx` | A jornada: conectar, revisar, confirmar |

Rotas e formatos foram conferidos contra o pacote oficial `pluggy-sdk` v0.90,
não escritos de memória:

- `POST /auth` com `{ clientId, clientSecret, nonExpiring: false }` → `{ apiKey }`
- `POST /connect_token` com header `X-API-KEY` → `{ accessToken }`
- `GET /accounts?itemId=…`, `GET /transactions?accountId=…&from=…`
- `GET /items/{id}` → status e conector

## Configurar

### 1. Guardar as credenciais no servidor

Use o secret **novo**, depois de rotacionar. O antigo deve ser considerado
comprometido se já passou por qualquer chat, log ou commit.

```bash
supabase login
supabase link --project-ref hmasenjcnpajirpeushg

supabase secrets set \
  PLUGGY_CLIENT_ID=seu-client-id \
  PLUGGY_CLIENT_SECRET=seu-client-secret-novo \
  ALLOWED_ORIGINS=https://danielfrancafatecsplabs.github.io
```

`ALLOWED_ORIGINS` é uma lista separada por vírgula. Sem ela nenhuma origem
passa — de propósito: um curinga deixaria qualquer site chamar a função com o
token de alguém logado.

`SUPABASE_URL` e `SUPABASE_ANON_KEY` já existem no ambiente das Edge Functions.

### 2. Publicar as functions

```bash
supabase functions deploy pluggy-connect-token
supabase functions deploy pluggy-sync
```

### 3. Conferir

```bash
# Sem token: tem que dar 401.
curl -i -X POST https://hmasenjcnpajirpeushg.supabase.co/functions/v1/pluggy-connect-token

# Com um token de sessão de verdade: tem que devolver accessToken.
curl -s -X POST https://hmasenjcnpajirpeushg.supabase.co/functions/v1/pluggy-connect-token \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN_DO_SUPABASE" \
  -H "Content-Type: application/json" -d '{}'
```

No app: **Gastos → Conectar meu banco**. Em sandbox, a Pluggy oferece
conectores de teste (`includeSandbox`), úteis antes de apontar para um banco
real.

## Como o extrato vira Mapa

`proposeFromSnapshot` lê contas e transações e devolve uma **proposta**, nunca
uma alteração. Duas decisões governam o arquivo:

**Proposta, nunca imposição.** Um extrato de dois meses não sabe do aluguel que
subiu ontem. A tela mostra cada número com a origem e a pessoa confirma.

**O que não deu para classificar aparece.** A taxonomia de categorias varia por
conector e por idioma. Adivinhar em silêncio produziria um custo essencial
errado com cara de certo — então o não reconhecido vai para uma lista visível.

O que ele deriva:

| Do extrato | Vira |
|---|---|
| Créditos categorizados como salário | `netIncome` (mediana dos meses, não a soma) e `salaryDay` |
| Saldos de conta `BANK` | `liquidAssets.checking` e `.savings` |
| Contas `CREDIT` | `creditCards` com fatura, limite, comprometido e vencimento |
| Débitos por categoria | `essentialExpenses`, média por mês |
| Mesmo nome + mesmo valor + todo mês | `subscriptions` |

Detalhes que existem por um motivo:

- **Mediana, não média**, para a renda: o mês do 13º não pode virar o salário.
- **O mês corrente é descartado**: está pela metade e puxaria toda média para baixo.
- **Transferência não é gasto**: Pix e TED entre contas próprias inflariam tudo.
- **Reconectar não apaga o que foi digitado à mão**: cartões manuais sobrevivem.

## Categorias

`classify()` casa por palavra, em português e inglês, com uma distinção que
erra sozinha se ficar implícita:

- **prefixo** abre pela esquerda — `salar` pega "salário" e "Salary";
- **exato** fecha dos dois lados — `gas` não pode pegar "gasolina", que é
  transporte, não conta de casa.

Quando a Pluggy mudar a taxonomia, o conserto é acrescentar termos em `RULES`.
Os testes em `pluggyMapping.test.ts` cobrem os formatos documentados e as
variações comuns de bancos brasileiros.

## O que falta e depende de você

Isto foi escrito contra os tipos oficiais, mas **nunca rodou contra a API real**
— não havia credencial válida nem rede para a Pluggy no ambiente de
desenvolvimento. Ao publicar, confira:

1. O `status` do item logo após conectar. A função recusa `UPDATING` e
   `LOGIN_ERROR` com códigos próprios; veja se a mensagem que aparece no app
   corresponde ao que acontece de verdade.
2. Se as descrições de categoria vêm em português ou inglês na sua conta, e se
   alguma categoria comum está caindo em "não consegui classificar". Cada uma
   dessas é uma palavra a acrescentar em `RULES`.
3. O sinal de `amount` no seu conector. O mapeamento usa `type` para a direção
   e valor absoluto para o tamanho, então funciona dos dois jeitos — mas vale
   confirmar que débito está vindo como `DEBIT`.

## Webhooks

Não implementados. Quando quiser que o DeBoa saiba de dados novos sem a pessoa
abrir o app, `ConnectTokenOptions.webhookUrl` aponta para uma terceira Edge
Function que recebe os eventos do item. Aí sim faz sentido guardar o snapshot
no banco em vez de só devolvê-lo.
