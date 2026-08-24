# Rodar o DeBoa nativo no iPhone, sem Mac

O app é web + Capacitor, então o build nativo precisa de Xcode — que só existe
no macOS. A saída é compilar num Mac alugado da nuvem: o workflow
`.github/workflows/ios-build.yml` faz isso num runner macOS do GitHub Actions,
**grátis enquanto este repositório for público**.

O que o Actions entrega é um `.ipa` **sem assinatura**. Assinar exige um
certificado da Apple, e um Apple ID gratuito não emite certificado fora do
Xcode. Por isso a assinatura acontece na hora de instalar, no seu PC.

> `eas.json` e `app.json` não servem para isso. São resquício de scaffolding
> Expo: este projeto não tem React Native, e o EAS constrói projetos React
> Native. Ignore os dois.

---

## Gerar o .ipa

1. No GitHub: aba **Actions** → **Build iOS (.ipa)** → **Run workflow**
2. Espere ~10 a 20 minutos
3. Baixe o artefato **DeBoa-ios-unsigned** ao final da execução

---

## Instalar no iPhone

### Opção A — grátis, precisa de um PC Windows

Custo zero, mas **o app expira em 7 dias** (limite do Apple ID gratuito). Para
renovar, é só reinstalar.

1. Instale o [Sideloadly](https://sideloadly.io) no Windows
2. Conecte o iPhone por cabo
3. Arraste o `.ipa` para o Sideloadly, informe seu Apple ID e clique em Start
4. No iPhone: **Ajustes → Geral → VPN e Gerenciamento de Dispositivo** → confie
   no seu certificado

O Apple ID gratuito também limita a 3 apps sideloaded ao mesmo tempo.

O Sideloadly roda em Windows e macOS. **Não há versão Linux** — em Linux o
caminho seria a Opção B.

### Opção B — US$ 99/ano, instala direto pelo iPhone

Com o [Apple Developer Program](https://developer.apple.com/programs/), o
próprio Actions assina e envia para o TestFlight. Aí você instala pelo app
TestFlight no iPhone: sem cabo, sem PC, e a build dura 90 dias.

É também o caminho para distribuir aos primeiros testadores depois — até 100
pessoas, sem publicar na App Store.

Precisa de mudanças no workflow (certificado e perfil de provisionamento como
secrets, e upload via `xcrun altool`). Peça quando quiser configurar.

---

## O que ainda não funciona no build nativo

**Login com Google.** Dentro do WebView do Capacitor, `window.location.origin`
vira `https://localhost`, então o `redirectTo` do OAuth aponta para um endereço
que o Supabase recusa — e o retorno não encontra o app. Resolver exige um
esquema customizado (`com.debboa.app://auth/callback`), o pacote
`@capacitor/app` escutando o deep link, e esse esquema liberado no Supabase.
Login por e-mail e senha funciona normalmente.

**Ícone do app.** O Capacitor vai usar o ícone padrão dele. O `icon` apontado
no `app.json` (`./public/icon.png`) não existe no repositório — e, de todo
modo, aquele campo é do Expo, não do Capacitor.
