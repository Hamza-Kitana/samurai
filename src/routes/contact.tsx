import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { PageLayout, pageGutter, navPull, navOffset } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setName("");
      setEmail("");
      setMessage("");
      toast.success(t("contact_success"));
    }, 600);
  };

  return (
    <PageLayout fullWidth>
      <div className="animate-rise pb-16">
        <section
          className={cn(
            "relative w-full overflow-hidden border-b border-white/8",
            navPull,
            navOffset,
          )}
        >
          <div className="absolute inset-0">
            <img
              src="/images/hero-bg.png"
              alt=""
              className="h-full w-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/80 to-background" />
            <div className="absolute inset-y-0 end-0 w-1/3 bg-gradient-to-s from-primary/10 to-transparent" />
          </div>

          <div
            className={cn(
              "relative flex min-h-[16rem] flex-col justify-end py-12 sm:min-h-[18rem] sm:py-14",
              pageGutter,
            )}
          >
            <p className="mb-3 font-display text-[11px] tracking-[0.45em] text-primary uppercase">
              KATARO
            </p>
            <h1 className="max-w-3xl font-display text-4xl font-semibold tracking-wide sm:text-5xl lg:text-6xl">
              {t("contact_title")}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("contact_sub")}
            </p>
          </div>
        </section>

        <section className={cn("py-12 sm:py-16", pageGutter)}>
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <aside className="space-y-6">
              <div className="border border-white/10 bg-[#12100e] p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center border border-primary/30 bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                  {t("email")}
                </p>
                <p className="mt-2 font-display text-lg tracking-wide text-gold-gradient">
                  support@kataro.store
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t("contact_email_note")}
                </p>
              </div>

              <div className="border border-white/10 bg-[#12100e] p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center border border-primary/30 bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                  Discord
                </p>
                <p className="mt-2 font-display text-lg tracking-wide">discord.gg/kataro</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t("contact_discord_note")}
                </p>
              </div>
            </aside>

            <form
              onSubmit={handleSubmit}
              className="border border-white/10 bg-[#12100e] p-6 sm:p-8"
            >
              <p className="text-[11px] tracking-[0.28em] text-primary uppercase">
                {t("contact_form_kicker")}
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-wide">
                {t("contact_form_title")}
              </h2>

              <div className="mt-8 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">{t("name")}</Label>
                    <Input
                      id="contact-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="border-white/12 bg-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">{t("email")}</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-white/12 bg-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-message">{t("contact_message")}</Label>
                  <Textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
                    className="resize-none border-white/12 bg-transparent"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full gap-2 font-semibold tracking-wide sm:w-auto"
                  disabled={sending}
                >
                  <Send className="h-4 w-4" />
                  {sending ? t("loading") : t("contact_send")}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
