import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, BellOff, Check, ClipboardPaste, Copy, Share2, Smartphone } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Action, Card, Pill } from "@/components/ui-kit";
import { askForNotifications, notificationState, notify } from "@/lib/notifications";
import type { NotificationState } from "@/lib/notifications";

export const Route = createFileRoute("/ativar")({
  head: () => ({
    meta: [
      { title: "Ativar a interceptação — DeBoa" },
      {
        name: "description",
        content:
          "Deixe o DeBoa a um toque de distância em qualquer loja: compartilhe o produto e ele analisa antes de você comprar.",
      },
    ],
  }),
  component: ActivatePage,
});

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  // iPadOS 13+ reports itself as a Mac; touch points give it away.
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

function installed(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari predates display-mode and uses its own flag.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function appOrigin(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${import.meta.env.BASE_URL}`;
}

/* -------------------------------- Pedaços --------------------------------- */

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[12px] font-semibold text-accent-foreground">
        {n}
      </span>
      <span className="text-[14px] leading-relaxed">{children}</span>
    </li>
  );
}

function CopyBox({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3">
      <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 rounded-2xl border border-border bg-muted/50 p-3">
        <code className="block break-all text-[12px] leading-relaxed text-muted-foreground">
          {value}
        </code>
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
        className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

/* --------------------------------- Tela ----------------------------------- */

function ActivatePage() {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [isInstalled, setIsInstalled] = useState(false);
  const [perm, setPerm] = useState<NotificationState>("default");
  const [pasteError, setPasteError] = useState<string | null>(null);

  // Tudo isto só existe no navegador; ler durante a renderização quebraria o
  // build do servidor.
  useEffect(() => {
    setPlatform(detectPlatform());
    setIsInstalled(installed());
    setPerm(notificationState());
  }, []);

  const base = appOrigin();
  const shortcutUrl = `${base}interceptar?url=`;
  const bookmarklet =
    "javascript:(function(){var t=document.title,u=location.href," +
    "p=(document.body.innerText.match(/R\\$\\s*[\\d.]+,\\d{2}/)||[])[0]||'';" +
    `window.open('${base}interceptar?title='+encodeURIComponent(t)+` +
    "'&url='+encodeURIComponent(u)+'&text='+encodeURIComponent(p),'_blank')})()";

  async function pasteLink() {
    setPasteError(null);
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setPasteError("Não achei nada copiado. Copie o link do produto e tente de novo.");
        return;
      }
      window.location.href = `${base}interceptar?text=${encodeURIComponent(text)}`;
    } catch {
      setPasteError(
        "Seu navegador não deixou eu ler a área de transferência. Use o compartilhamento.",
      );
    }
  }

  return (
    <AppShell>
      <header className="animate-rise pt-8 pb-6">
        <Pill className="border-accent/25 bg-accent/10 text-accent">Interceptação</Pill>
        <h1 className="mt-4 text-[27px] font-semibold leading-tight tracking-[-0.03em]">
          Me deixe a um toque de distância.
        </h1>
        <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
          Achou algo numa loja? Toque em <strong>Compartilhar</strong> e escolha o DeBoa. Eu abro
          com o produto já preenchido e digo o que essa compra faz com o seu mês.
        </p>
      </header>

      {/* O ponto que precisa ficar claro antes de qualquer instrução. */}
      <Card className="border-accent/25 bg-accent/6">
        <p className="text-[14px] leading-relaxed">
          <strong>Eu não vigio sua navegação.</strong> Nenhum app consegue ver o que você faz em
          outros sites — o navegador proíbe, e ainda bem. Quem me chama é você, no momento em que
          quiser uma segunda opinião.
        </p>
      </Card>

      {/* ------------------------------ Passo 1 ------------------------------ */}
      <section className="mt-7">
        <h2 className="px-1 text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          1. Instale o DeBoa na tela de início
        </h2>
        <Card className="mt-3">
          {isInstalled ? (
            <p className="flex items-center gap-2 text-[14px]">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              Já está instalado. É daqui que o compartilhamento funciona.
            </p>
          ) : (
            <>
              <p className="text-[14px] leading-relaxed text-muted-foreground">
                Sem isso o compartilhamento não aparece — e no iPhone as notificações também não
                existem fora do app instalado.
              </p>
              <ul className="mt-4 space-y-3">
                {platform === "ios" ? (
                  <>
                    <Step n={1}>
                      No Safari, toque no botão <strong>Compartilhar</strong> (o quadrado com a
                      seta para cima).
                    </Step>
                    <Step n={2}>
                      Escolha <strong>Adicionar à Tela de Início</strong>.
                    </Step>
                    <Step n={3}>Abra o DeBoa pelo ícone novo, não pelo Safari.</Step>
                  </>
                ) : (
                  <>
                    <Step n={1}>
                      No Chrome, abra o menu <strong>⋮</strong>.
                    </Step>
                    <Step n={2}>
                      Escolha <strong>Instalar app</strong> ou{" "}
                      <strong>Adicionar à tela inicial</strong>.
                    </Step>
                    <Step n={3}>Abra o DeBoa pelo ícone novo.</Step>
                  </>
                )}
              </ul>
            </>
          )}
        </Card>
      </section>

      {/* ------------------------------ Passo 2 ------------------------------ */}
      <section className="mt-7">
        <h2 className="px-1 text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          2. Coloque o DeBoa no compartilhar
        </h2>

        {platform === "android" ? (
          <Card className="mt-3">
            <div className="flex items-start gap-3">
              <Share2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-[15px] font-medium tracking-tight">Já está pronto.</p>
                <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                  Com o app instalado, o DeBoa aparece sozinho na lista de compartilhamento do
                  Android. Abra qualquer loja, toque em Compartilhar e escolha o DeBoa.
                </p>
              </div>
            </div>
          </Card>
        ) : platform === "ios" ? (
          <Card className="mt-3">
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              O iPhone não deixa um app da web entrar sozinho na folha de compartilhamento. O
              caminho é um atalho — leva um minuto e vale para sempre.
            </p>
            <ul className="mt-4 space-y-3">
              <Step n={1}>
                Abra o app <strong>Atalhos</strong> e crie um atalho novo. Chame de{" "}
                <strong>DeBoa</strong>.
              </Step>
              <Step n={2}>
                Nos ajustes do atalho (ícone <strong>ⓘ</strong>), ligue{" "}
                <strong>Mostrar na Folha de Compartilhamento</strong>.
              </Step>
              <Step n={3}>
                Adicione a ação <strong>Codificar URL</strong> e aponte para{" "}
                <strong>Entrada do Atalho</strong>.
              </Step>
              <Step n={4}>
                Adicione a ação <strong>Texto</strong> com o endereço abaixo e, logo depois, a
                ação <strong>Abrir URLs</strong>.
              </Step>
            </ul>
            <CopyBox label="Endereço para o atalho" value={shortcutUrl} />
            <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
              No campo Texto, cole o endereço e adicione o resultado de <em>Codificar URL</em>{" "}
              logo em seguida, sem espaço.
            </p>
          </Card>
        ) : (
          <Card className="mt-3">
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              No computador, o caminho é um favorito. Crie um favorito novo, deixe o nome{" "}
              <strong>DeBoa</strong> e cole isto no lugar do endereço. Depois, em qualquer página
              de produto, é só clicar nele.
            </p>
            <CopyBox label="Endereço do favorito" value={bookmarklet} />
          </Card>
        )}
      </section>

      {/* -------------------------- Sempre disponível ------------------------ */}
      <section className="mt-7">
        <h2 className="px-1 text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Funciona em qualquer aparelho
        </h2>
        <Card className="mt-3">
          <div className="flex items-start gap-3">
            <ClipboardPaste className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium tracking-tight">Colar o link da compra</p>
              <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                Copiou o endereço do produto? Cole aqui e eu analiso — sem instalar nada.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Action variant="outline" onClick={pasteLink}>
              Colar e analisar
            </Action>
          </div>
          {pasteError ? (
            <p className="mt-2 text-[13px] leading-relaxed text-destructive">{pasteError}</p>
          ) : null}
        </Card>
      </section>

      {/* ------------------------------ Passo 3 ------------------------------ */}
      <section className="mt-7">
        <h2 className="px-1 text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          3. Deixe eu te avisar
        </h2>
        <Card className="mt-3">
          <div className="flex items-start gap-3">
            {perm === "granted" ? (
              <Bell className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            ) : (
              <BellOff className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium tracking-tight">
                {perm === "granted"
                  ? "Notificações ligadas"
                  : perm === "denied"
                    ? "Notificações bloqueadas"
                    : "Notificações desligadas"}
              </p>
              <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                {perm === "unsupported"
                  ? "Este navegador não tem notificações. No iPhone elas só existem com o app instalado na tela de início."
                  : perm === "denied"
                    ? "Você recusou antes. Dá para liberar de novo nos ajustes do aparelho, na parte de notificações do DeBoa."
                    : "Se você compartilhar uma compra e trocar de app, eu te chamo de volta antes de você concluir."}
              </p>
            </div>
          </div>

          {perm !== "granted" && perm !== "denied" && perm !== "unsupported" ? (
            <div className="mt-4">
              <Action
                variant="accent"
                onClick={async () => {
                  const next = await askForNotifications();
                  setPerm(next);
                  if (next === "granted") {
                    await notify("Pronto. É assim que eu chamo.", {
                      body: "Quando uma compra importante aparecer, você vê isto antes de decidir.",
                      tag: "deboa-teste",
                    });
                  }
                }}
              >
                Ligar notificações
              </Action>
            </div>
          ) : null}

          {perm === "granted" ? (
            <div className="mt-4">
              <Action
                variant="outline"
                onClick={() =>
                  void notify("É assim que eu chamo.", {
                    body: "Uma compra importante apareceu. Toque para ver o que ela faz com o seu mês.",
                    tag: "deboa-teste",
                  })
                }
              >
                Ver como aparece
              </Action>
            </div>
          ) : null}
        </Card>
      </section>

      <section className="mt-7">
        <Card>
          <div className="flex items-start gap-3">
            <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[15px] font-medium tracking-tight">Quer testar agora?</p>
              <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                Digite uma compra na mão e veja exatamente o que aparece quando a interceptação
                dispara.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/decidir" className="block">
              <Action variant="ghost">Simular uma compra</Action>
            </Link>
          </div>
        </Card>
      </section>

      <p className="mt-7 px-1 text-[12px] leading-relaxed text-muted-foreground">
        Nada do que você compartilha comigo sai do seu aparelho nesta fase.
      </p>
    </AppShell>
  );
}
