# Interceptação de compras

Como o DeBoa aparece no momento em que alguém está prestes a comprar, o que o
navegador permite, e o que ficou de fora.

## O limite que define tudo

**Nenhuma página consegue observar outra.** Não existe API que deixe o DeBoa
saber que você abriu o checkout da Amazon, e isso não é uma limitação de PWA:
um app nativo na App Store também não consegue. O sandbox de origem é a
fundação da segurança da web — se ele vazasse, qualquer aba conseguiria ler o
seu internet banking.

Então a interceptação não é vigilância. É a pessoa entregando a compra ao
agente com um toque, no momento em que quer uma segunda opinião. Todo o
desenho parte disso, e a interface diz isso em voz alta em `/ativar`.

## Os caminhos de entrada

Todos terminam em `/interceptar`, que aceita `title`, `text`, `url` e `preco`.

| Caminho | Onde funciona | Como |
|---|---|---|
| **Web Share Target** | Android, Chrome, app instalado | `share_target` no `manifest.json`. O DeBoa aparece sozinho na folha de compartilhamento do sistema. |
| **Atalho** | iPhone e iPad | O iOS não deixa um app da web entrar na folha de compartilhamento. O usuário monta um atalho uma vez (`/ativar` dá a receita) que abre `/interceptar?url=…`. |
| **Favorito com script** | Computador | Um bookmarklet lê `document.title`, a URL e o primeiro `R$ …` visível na página. |
| **Colar link** | Qualquer lugar | `navigator.clipboard.readText()` num toque. É o plano B quando nada acima está montado. |

`share_target` usa `method: "GET"`, então não precisa de código no service
worker: o navegador simplesmente navega para a rota com os parâmetros.

## O que chega, e o que fazemos com isso

Pouca coisa: o app que compartilha decide o que manda. Na prática vem o título
da página, às vezes um trecho de texto e a URL. O preço só aparece quando a
loja o coloca no título.

`services/purchaseParser.ts` extrai daí nome, preço, loja e categoria. A regra
que governa o arquivo:

> **Preço errado é pior que preço ausente.**

Um número solto num título quase sempre é modelo, tamanho ou capacidade —
"Galaxy S24 256GB" não tem preço nenhum. Por isso só conta como valor o que
está marcado como dinheiro (`R$ …`, `por 199,90`). Sem certeza, a tela pergunta
em vez de inventar. Entre a parcela e o total, vence o total: é o que a pessoa
está prestes a gastar.

Os casos estão em `purchaseParser.test.ts` — `bun test`.

## Notificações

`lib/notifications.ts`. O que existe hoje:

- Pedir permissão a partir de um toque, e mostrar uma notificação **agora**.
- Quando um compartilhamento abre o app atrás de outra coisa, uma notificação
  traz a pessoa de volta antes de ela concluir a compra.

No iPhone isso só existe com o app instalado na tela de início (iOS 16.4+). No
Safari em aba, não há notificação nenhuma.

## O que ainda não dá, e o que falta para dar

**Notificação agendada ou enviada pelo servidor.** "Te lembro daqui a 7 dias",
ou "seu salário caiu ontem, bom momento para separar a reserva". O navegador
não guarda alarme: a Notification Triggers API nunca saiu de experimento, e
`periodicSync` só existe no Chrome/Android.

O caminho é Web Push de verdade, e ele precisa de três peças que não estão
aqui:

1. **Chaves VAPID** (par pública/privada). A pública vai no cliente; a privada
   nunca sai do servidor.
2. **Assinatura**: `registration.pushManager.subscribe({ userVisibleOnly: true,
   applicationServerKey })`, e guardar o endpoint retornado por usuário.
3. **Um disparador**: uma Supabase Edge Function agendada que lê os perfis,
   decide quem está num momento de risco (véspera de fatura, fim de ciclo,
   meta perto de furar) e envia para os endpoints assinados.

Mais um `push` listener no `public/sw.js`, que hoje não existe.

Isso é a diferença entre o agente responder quando chamado e o agente aparecer
por conta própria — vale construir, mas é trabalho de servidor, não de cliente.

## Testando sem celular

```bash
bun run cap:build
npx serve -s dist-capacitor -l 4321
```

Depois abra à mão o que o compartilhamento produziria:

```
/interceptar?title=T%C3%AAnis%20Nike%20-%20R%24%20899,90%20%7C%20Mercado%20Livre&url=https://www.mercadolivre.com.br/x
/interceptar?title=Echo%20Dot%20%7C%20Amazon.com.br&url=https://www.amazon.com.br/dp/X
```

O primeiro abre a intervenção sozinho. O segundo pede o preço, porque a Amazon
não o manda no título.
