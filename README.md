# DeBoa: Your Decision Assistant

Crie um aplicativo web mobile-first chamado “DeBoa”, projetado para ser usado principalmente no iPhone.

IMPORTANTE:

Este é um MVP de validação de produto. Não quero um dashboard financeiro tradicional. Não quero gráficos de gastos, categorias, planilhas ou telas complexas.

A tese do produto é:

“O DeBoa é um agente pessoal que ajuda o usuário a tomar decisões melhores, intervindo no momento em que identifica uma decisão relevante.”

O MVP deve simular essa experiência dentro de um web app mobile, especialmente no Safari do iPhone.

==================================================

1. CONCEITO CENTRAL

==================================================

O usuário não deve precisar abrir o DeBoa para “consultar suas finanças”.

A experiência principal deve ser:

USUÁRIO ESTÁ PRESTES A TOMAR UMA DECISÃO

↓

DEBOA IDENTIFICA O MOMENTO

↓

DEBOA INTERVÉM

↓

USUÁRIO ANALISA

↓

DEBOA RECOMENDA

↓

USUÁRIO DECIDE

O MVP deve simular esse comportamento.

O produto deve transmitir a sensação de:

“Eu não precisei lembrar de pedir ajuda. O DeBoa apareceu quando eu precisava.”

==================================================

2. TELA PRINCIPAL

==================================================

Criar uma tela extremamente minimalista.

No topo:

DeBoa

Subheadline:

“Uma decisão melhor começa antes do clique.”

Abaixo, mostrar uma área chamada:

“Momento de decisão”

Criar um exemplo de produto:

Apple AirPods Pro

R$ 1.899,00

Botão:

“Estou prestes a comprar”

Ao clicar, iniciar a experiência de intervenção.

==================================================

3. SIMULAÇÃO DO CONTEXTO

==================================================

Quando o usuário clicar em “Estou prestes a comprar”, mostrar uma animação curta simulando o DeBoa detectando o contexto.

Exemplo:

“DeBoa está analisando…”

Depois:

“Produto identificado”

“Preço identificado”

“Seu contexto financeiro analisado”

Não inventar dados reais do usuário.

Usar dados fictícios claramente identificados como “Perfil de teste”.

==================================================

4. POP-UP / INTERVENÇÃO PRINCIPAL

==================================================

Depois da análise, abrir um modal que pareça uma intervenção contextual.

O modal deve ocupar boa parte da tela, mas não parecer uma página tradicional do aplicativo.

Usar estética premium, minimalista e sofisticada.

Conteúdo:

“Ei. Vale a pena comprar isso mesmo?”

Produto:

Apple AirPods Pro

Preço:

R$ 1.899

Texto:

“Pelo seu momento financeiro atual, essa compra pode comprometer uma parte relevante do dinheiro que você reservou para seus próximos objetivos.”

Adicionar três opções:

[ Quero entender ]

[ Acho que sim ]

[ Deixa pra lá ]

A opção principal deve ser “Quero entender”.

==================================================

5. EXPLICAÇÃO DA RECOMENDAÇÃO

==================================================

Ao clicar em “Quero entender”, mostrar uma tela de análise.

Título:

“Eu pensaria duas vezes.”

Mostrar:

Compra:

R$ 1.899

Impacto estimado:

Alto

Motivos:

• Você está próximo de outros compromissos financeiros.

• Essa compra representa uma parcela relevante do seu dinheiro disponível.

• Você possui um objetivo financeiro ativo.

• Existe uma alternativa: esperar alguns dias antes de decidir.

IMPORTANTE:

Não apresentar esses dados como informações reais.

Usar uma pequena indicação:

“Simulação baseada em um perfil de teste.”

Depois:

“Minha recomendação”

“Eu esperaria 7 dias antes de comprar.”

Botões:

[ Vou esperar ]

[ Quero comprar mesmo assim ]

==================================================

6. AUTONOMIA DO USUÁRIO

==================================================

O DeBoa NUNCA deve parecer controlador.

Se o usuário escolher:

“Quero comprar mesmo assim”

mostrar:

“Tudo bem.”

“Minha função não é decidir por você. É ajudar você a enxergar melhor antes de decidir.”

Depois:

“Compra registrada como decisão do usuário.”

Botão:

“Continuar”

Essa característica é FUNDAMENTAL para a identidade do produto.

O DeBoa aconselha.

O usuário decide.

==================================================

7. RESULTADO DA DECISÃO

==================================================

Depois da decisão, mostrar uma tela chamada:

“Momento DeBoa”

Exemplo:

“Você acabou de tomar uma decisão com mais contexto.”

Mostrar:

Decisão:

Comprar AirPods Pro

Recomendação do DeBoa:

Esperar 7 dias

Decisão final:

Usuário decidiu comprar / esperar

Adicionar uma pequena pergunta:

“Essa intervenção foi útil?”

[ 👍 Sim ]

[ 👎 Não ]

Isso deve gerar um evento local para que possamos testar posteriormente métricas de produto.

==================================================

8. SEGUNDO EXEMPLO

==================================================

Criar uma segunda simulação:

Produto:

Tênis

R$ 399

Nesse caso, o DeBoa deve responder de maneira diferente:

“Pode fazer sentido.”

Mostrar:

“Essa decisão parece compatível com o seu contexto de teste.”

Isso é importante.

O DeBoa NÃO deve sempre dizer NÃO.

Queremos provar que ele sabe quando:

• intervir

• recomendar cautela

• recomendar seguir em frente

• simplesmente não interferir

==================================================

9. TELA “COMO O DEBOA PENSA”

==================================================

Criar uma tela simples acessível pelo menu.

Título:

“Como o DeBoa pensa”

Texto:

“O DeBoa considera o contexto da decisão, não apenas o preço.”

Mostrar cinco fatores:

Contexto financeiro

Objetivos

Compromissos

Comportamento

Impacto da decisão

Frase final:

“O DeBoa não decide por você.

Ele ajuda você a decidir melhor.”

==================================================

10. PERFIL DE TESTE

==================================================

Criar uma tela simples:

“Seu contexto”

Usar dados fictícios:

Renda mensal:

R$ 5.000

Dinheiro disponível:

R$ 2.800

Objetivo:

Guardar R$ 1.500

Compromissos próximos:

R$ 1.400

IMPORTANTE:

Deixar esses valores editáveis.

Criar campos para:

Renda

Saldo disponível

Objetivo mensal

Compromissos próximos

Ao alterar os valores, a recomendação do DeBoa deve mudar de forma simulada.

==================================================

11. SIMULADOR DE DECISÃO

==================================================

Criar uma tela chamada:

“Teste o DeBoa”

Campos:

O que você está pensando em comprar?

[ campo de texto ]

Preço:

[ R$ ]

Categoria:

[ selecionar ]

Opções:

• Tecnologia

• Moda

• Alimentação

• Viagem

• Entretenimento

• Casa

• Outro

Botão:

“DeBoa, analise isso”

Ao clicar, o agente deve produzir uma recomendação baseada nos dados de teste.

Não precisa usar uma API de IA inicialmente.

Criar uma lógica determinística simples.

Exemplo:

Se preço > 30% do dinheiro disponível:

“Eu pensaria duas vezes.”

Se preço entre 10% e 30%:

“Vale analisar o impacto.”

Se preço < 10%:

“Essa decisão parece compatível com seu contexto.”

Mas estruturar o código para que posteriormente possamos substituir essa lógica por um LLM/API.

==================================================

12. PERSONALIDADE DO AGENTE

==================================================

O DeBoa deve ter personalidade.

Ele é:

• direto

• inteligente

• amigável

• não julgador

• transparente

• levemente provocativo

• nunca paternalista

Ele pode dizer:

“Eu não faria isso agora.”

“Eu esperaria um pouco.”

“Essa compra parece tranquila.”

“Você consegue comprar. A pergunta é: deveria?”

“Posso te mostrar o impacto dessa decisão.”

Nunca usar linguagem como:

“Você está sendo irresponsável.”

“Você não pode comprar.”

“Você está gastando demais.”

Nunca tratar o usuário como criança.

==================================================

13. DESIGN

==================================================

Quero um design extremamente premium.

Referências conceituais:

• Apple

• Linear

• Arc

• Raycast

• fintech premium

• AI-native products

Fundo claro, predominantemente branco/off-white.

Tipografia moderna.

Muito espaço em branco.

Cards com bordas arredondadas.

Sombras muito sutis.

Animações suaves.

Nada de aparência de banco tradicional.

Nada de excesso de verde.

O DeBoa deve parecer uma empresa de tecnologia/IA, não um aplicativo de contabilidade.

Usar uma cor de destaque única e sofisticada.

==================================================

14. EXPERIÊNCIA MOBILE

==================================================

O projeto deve ser mobile-first.

Prioridade absoluta:

iPhone Safari.

Interface com:

• touch targets grandes

• navegação inferior simples

• modais responsivos

• animações suaves

• safe areas do iPhone

• nenhuma necessidade de zoom

• excelente experiência em telas pequenas

Criar também suporte básico para desktop, mas o foco é mobile.

==================================================

15. NAVEGAÇÃO

==================================================

Criar quatro áreas:

1. Momento

2. Decidir

3. Histórico

4. Perfil

Momento:

Experiência principal de intervenção.

Decidir:

Simulador de decisão.

Histórico:

Lista das decisões analisadas pelo DeBoa.

Perfil:

Contexto financeiro de teste.

==================================================

16. HISTÓRICO

==================================================

Criar exemplos:

“AirPods Pro”

R$ 1.899

Recomendação: Esperar

Status: Usuário decidiu esperar

“Tênis”

R$ 399

Recomendação: Pode fazer sentido

Status: Comprado

Cada item deve mostrar:

• decisão

• preço

• recomendação

• decisão final

• se a intervenção foi útil

==================================================

17. EVENTOS DE PRODUTO

==================================================

Estruturar o app para registrar localmente eventos como:

decision_started

context_analyzed

intervention_shown

analysis_opened

recommendation_shown

user_followed_recommendation

user_ignored_recommendation

intervention_helpful

intervention_not_helpful

Não precisa implementar analytics externo ainda.

Usar localStorage para persistência do MVP.

==================================================

18. ARQUITETURA

==================================================

Organizar o código de forma modular.

Criar:

/components

/pages

/services

/hooks

/utils

/data

Criar um serviço:

decisionEngine.ts

Esse serviço deverá receber:

userContext

decisionContext

productContext

E retornar:

recommendation

confidence

reasons

interventionLevel

Exemplo:

{

  recommendation: "WAIT",

  confidence: 0.82,

  interventionLevel: "HIGH",

  reasons: [

    "...",

    "...",

    "..."

  ]

}

No futuro esse serviço será substituído por um agente de IA real.

==================================================

19. IMPORTANTE: NÃO FAZER

==================================================

Não criar:

• dashboard cheio de gráficos

• orçamento tradicional

• planilhas

• dezenas de categorias

• tela de investimentos

• tela de cartão

• banco digital

• feed de conteúdo

• gamificação exagerada

• mascote infantil

• chatbot genérico

O produto NÃO deve parecer:

“mais um app de finanças”.

O produto deve parecer:

“um agente inteligente que aparece quando uma decisão importante está acontecendo.”

==================================================

20. OBJETIVO DO MVP

==================================================

O objetivo deste MVP NÃO é provar a tecnologia final.

O objetivo é validar três hipóteses:

H1:

“As pessoas aceitam que um agente intervenha antes de uma decisão financeira.”

H2:

“As pessoas consideram a intervenção útil.”

H3:

“Uma recomendação contextual pode mudar uma decisão.”

Por isso, priorizar a experiência de intervenção sobre qualquer outra funcionalidade.

Na primeira abertura do app, levar o usuário rapidamente para:

“Simule uma decisão.”

Não criar onboarding longo.

==================================================

21. FRASE PRINCIPAL DO PRODUTO

==================================================

Usar como tagline:

“Você decide. O DeBoa pensa com você.”

E como CTA:

“Antes de decidir, pergunte ao DeBoa.”

==================================================

22. ENTREGA

==================================================

Entregar um web app completo e navegável.

Garantir:

• funcionamento no Safari do iPhone

• navegação sem erros

• estado persistente

• simulador funcional

• intervenção visual convincente

• histórico funcionando

• perfil editável

• Decision Engine separado

• código limpo e modular

Antes de finalizar, teste todos os fluxos:

1. Abrir app

2. Simular compra

3. DeBoa detectar decisão

4. Mostrar intervenção

5. Abrir análise

6. Receber recomendação

7. Aceitar recomendação

8. Ignorar recomendação

9. Registrar resultado

10. Ver histórico

11. Alterar contexto financeiro

12. Fazer nova decisão e verificar que a recomendação muda

O resultado deve parecer um MVP real de uma startup de IA, não um protótipo acadêmico.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://debboa-think-ahead.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/612e4206-2abe-49c4-9d18-863cee5a9979).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
