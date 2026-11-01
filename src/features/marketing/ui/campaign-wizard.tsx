"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Mail, MessageCircle, Moon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";
import { apiGet, apiPost } from "@/shared/http/api";
import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import { DeskNotice } from "@/features/dashboard/ui/desk-notice";
import {
  MARKETING_QUIET_HOURS,
  WHATSAPP_MARKETING_DAILY_CAP,
  type MarketingChannel,
} from "@/features/marketing/lib/marketing.constants";
import { useMarketingDesk } from "@/features/marketing/hooks/use-marketing-desk";
import { useMarketingOperator } from "@/features/marketing/hooks/use-marketing-operator";
import { utcToZonedWallTime, zonedWallTimeToUtc } from "@/features/marketing/lib/zoned-time";
import { MarketingPreviewResult } from "@/features/marketing/ui/marketing-preview-result";
import type {
  SegmentCountView,
  TemplatePreviewView,
} from "@/features/marketing/ui/marketing-ui.types";
import { formatCampaignDate } from "@/features/marketing/ui/campaign-format";

const STEPS = ["audience", "message", "schedule", "review"] as const;
type Step = (typeof STEPS)[number];
export const LARGE_SEND_THRESHOLD = 500;
const CONFIRM_WORD = "SEND";

export function estimateSendDays(recipients: number, channel: MarketingChannel) {
  if (channel !== "whatsapp" || recipients <= 0) return recipients > 0 ? 1 : 0;
  return Math.ceil(recipients / WHATSAPP_MARKETING_DAILY_CAP);
}

function hourLabel(hour: number, locale: string) {
  const d = new Date(2000, 0, 1, hour, 0);
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(d);
}

export function CampaignWizard() {
  const t = useTranslations("MarketingCampaigns");
  const locale = useLocale();
  const router = useRouter();
  const desk = useMarketingDesk();

  const [step, setStep] = useState<Step>("audience");
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<MarketingChannel>("email");
  const [segmentId, setSegmentId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [timing, setTiming] = useState<"now" | "later">("now");
  const [sendAt, setSendAt] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const [count, setCount] = useState<SegmentCountView | null>(null);
  const [countState, setCountState] = useState<"idle" | "loading" | "error">("idle");
  const [preview, setPreview] = useState<TemplatePreviewView | null>(null);
  const [previewState, setPreviewState] = useState<"idle" | "loading" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const { operator } = useMarketingOperator();
  const timeZone = operator?.timeZone ?? "UTC";
  const deviceTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    [],
  );
  const minSendAt = useMemo(() => utcToZonedWallTime(new Date(), timeZone), [timeZone]);

  const templates = useMemo(
    () => desk.templates.filter((tpl) => tpl.channel === channel),
    [desk.templates, channel],
  );

  useEffect(() => {
    if (templateId && !templates.some((tpl) => tpl.id === templateId)) {
      setTemplateId("");
    }
  }, [templates, templateId]);

  useEffect(() => {
    if (!segmentId) {
      setCount(null);
      setCountState("idle");
      return;
    }
    let cancelled = false;
    setCountState("loading");
    apiGet<{ success: true; count: SegmentCountView }>(
      `/api/admin/marketing/segments/${segmentId}/count?channel=${channel}`,
    )
      .then((data) => {
        if (cancelled) return;
        setCount(data.count);
        setCountState("idle");
      })
      .catch(() => {
        if (!cancelled) setCountState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [segmentId, channel]);

  useEffect(() => {
    if (!templateId || !segmentId) {
      setPreview(null);
      setPreviewState("idle");
      return;
    }
    let cancelled = false;
    setPreviewState("loading");
    apiPost<{ success: true; preview: TemplatePreviewView }>(
      `/api/admin/marketing/templates/${templateId}/preview`,
      { segmentId },
    )
      .then((data) => {
        if (cancelled) return;
        setPreview(data.preview);
        setPreviewState("idle");
      })
      .catch(() => {
        if (!cancelled) {
          setPreview(null);
          setPreviewState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [templateId, segmentId]);

  const recipients = count?.eligible ?? 0;
  const needsConfirm = recipients > LARGE_SEND_THRESHOLD;
  const scheduledDate =
    timing === "later" && sendAt ? zonedWallTimeToUtc(sendAt, timeZone) : null;
  const scheduleValid =
    timing === "now" ||
    (scheduledDate !== null &&
      !Number.isNaN(scheduledDate.getTime()) &&
      scheduledDate.getTime() > Date.now() - 60_000);

  const stepIndex = STEPS.indexOf(step);
  const canNext =
    step === "audience"
      ? name.trim().length > 0 && Boolean(segmentId) && countState !== "loading"
      : step === "message"
        ? Boolean(templateId)
        : step === "schedule"
          ? scheduleValid
          : false;
  const canSubmit =
    recipients > 0 &&
    !submitting &&
    (!needsConfirm || confirmText.trim().toUpperCase() === CONFIRM_WORD);

  const segment = desk.segments.find((s) => s.id === segmentId);
  const template = desk.templates.find((tpl) => tpl.id === templateId);

  async function submit() {
    if (!canSubmit || !template) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      const created = await apiPost<{ success: true; campaign: { id: string } }>(
        "/api/admin/marketing/campaigns",
        {
          name: name.trim(),
          channel,
          segmentId,
          templateId,
          templateVersion: template.version,
        },
      );
      const id = created.campaign.id;
      await apiPost(`/api/admin/marketing/campaigns/${id}/schedule`, {
        scheduledAt: (scheduledDate ?? new Date()).toISOString(),
        confirmationText: needsConfirm ? CONFIRM_WORD : undefined,
      });
      router.push(`/${locale}/dashboard/marketing/campaigns/${id}`);
    } catch {
      setSubmitError(true);
      setSubmitting(false);
    }
  }

  const listHref = `/${locale}/dashboard/marketing/campaigns`;

  return (
    <div className="flex flex-col gap-5">
      <DeskPageMeta title={t("new-title")} description={t("new-description")} />

      <div>
        <Button asChild variant="ghost" size="sm" className="min-h-11 -ms-2">
          <Link href={listHref}>
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            {t("back-to-list")}
          </Link>
        </Button>
      </div>

      <ol className="grid grid-cols-4 gap-2" aria-label={t("steps-label")}>
        {STEPS.map((key, index) => {
          const done = index < stepIndex;
          const current = index === stepIndex;
          return (
            <li
              key={key}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex min-w-0 flex-col gap-1.5 border-t-2 pt-2 text-xs sm:text-sm",
                current
                  ? "border-primary text-foreground"
                  : done
                    ? "border-primary/50 text-muted-foreground"
                    : "border-border text-muted-foreground",
              )}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]",
                    current || done ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {done ? <Check className="size-3" aria-hidden="true" /> : index + 1}
                </span>
                <span className="truncate">{t(`step-${key}`)}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {desk.error ? (
        <DeskNotice variant="error" onRetry={() => void desk.reload()} retryLabel={t("retry")}>
          {t("load-failed")}
        </DeskNotice>
      ) : desk.isLoading ? (
        <div className="flex flex-col gap-3 rounded border border-border/60 bg-card p-4" aria-busy="true">
          <span className="sr-only">{t("loading")}</span>
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <section className="flex flex-col gap-5 rounded border border-border/60 bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">{t(`step-${step}-title`)}</h2>

          {step === "audience" ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="campaign-name">{t("field-name")}</Label>
                <Input
                  id="campaign-name"
                  value={name}
                  maxLength={200}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("field-name-placeholder")}
                  className="h-11"
                />
              </div>

              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-medium">{t("field-channel")}</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(["email", "whatsapp"] as const).map((value) => {
                    const Icon = value === "email" ? Mail : MessageCircle;
                    const active = channel === value;
                    return (
                      <label
                        key={value}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-start gap-3 rounded border p-3 transition-colors",
                          active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
                        )}
                      >
                        <input
                          type="radio"
                          name="channel"
                          value={value}
                          checked={active}
                          onChange={() => setChannel(value)}
                          className="mt-1 size-4 accent-primary"
                        />
                        <Icon className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
                        <span className="flex flex-col">
                          <span className="font-medium">{t(`channel-${value}`)}</span>
                          <span className="text-sm text-muted-foreground">
                            {t(`channel-${value}-hint`)}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex flex-col gap-2">
                <Label htmlFor="campaign-segment">{t("field-segment")}</Label>
                {desk.segments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("no-segments")}{" "}
                    <Link href={`/${locale}/dashboard/marketing`} className="underline underline-offset-4">
                      {t("open-desk")}
                    </Link>
                  </p>
                ) : (
                  <Select value={segmentId} onValueChange={setSegmentId}>
                    <SelectTrigger id="campaign-segment" className="h-11 w-full">
                      <SelectValue placeholder={t("choose-segment")} />
                    </SelectTrigger>
                    <SelectContent>
                      {desk.segments.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {segmentId ? (
                <div aria-live="polite" data-testid="audience-count">
                  {countState === "loading" ? (
                    <Skeleton className="h-16 w-full" />
                  ) : countState === "error" ? (
                    <p role="alert" className="text-sm text-destructive">{t("count-failed")}</p>
                  ) : count ? (
                    <dl className="grid grid-cols-3 gap-2">
                      {([
                        ["eligible", count.eligible],
                        ["excluded", count.excluded],
                        ["total", count.total],
                      ] as const).map(([key, value]) => (
                        <div key={key} className="rounded bg-muted/40 px-3 py-2">
                          <dt className="text-xs text-muted-foreground">{t(`count-${key}`)}</dt>
                          <dd className="text-lg font-semibold tabular-nums">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">{t("consent-note")}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === "message" ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="campaign-template">{t("field-template")}</Label>
                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("no-templates")}{" "}
                    <Link href={`/${locale}/dashboard/marketing`} className="underline underline-offset-4">
                      {t("open-desk")}
                    </Link>
                  </p>
                ) : (
                  <Select value={templateId} onValueChange={setTemplateId}>
                    <SelectTrigger id="campaign-template" className="h-11 w-full">
                      <SelectValue placeholder={t("choose-template")} />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((tpl) => (
                        <SelectItem key={tpl.id} value={tpl.id}>
                          {tpl.name} · v{tpl.version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="min-w-0 rounded border border-border/60 p-3" aria-live="polite">
                <p className="mb-3 text-sm font-medium">{t("preview-title")}</p>
                {previewState === "loading" ? (
                  <Skeleton className="h-48 w-full" />
                ) : previewState === "error" ? (
                  <p role="alert" className="text-sm text-destructive">{t("preview-failed")}</p>
                ) : preview ? (
                  <MarketingPreviewResult preview={preview} />
                ) : (
                  <p className="text-sm text-muted-foreground">{t("preview-empty")}</p>
                )}
              </div>
            </div>
          ) : null}

          {step === "schedule" ? (
            <div className="flex flex-col gap-4">
              <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <legend className="sr-only">{t("step-schedule")}</legend>
                {(["now", "later"] as const).map((value) => (
                  <label
                    key={value}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-start gap-3 rounded border p-3",
                      timing === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
                    )}
                  >
                    <input
                      type="radio"
                      name="timing"
                      checked={timing === value}
                      onChange={() => setTiming(value)}
                      className="mt-1 size-4 accent-primary"
                    />
                    <span className="flex flex-col">
                      <span className="font-medium">{t(`timing-${value}`)}</span>
                      <span className="text-sm text-muted-foreground">{t(`timing-${value}-hint`)}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              {timing === "later" ? (
                <div className="flex max-w-sm flex-col gap-2">
                  <Label htmlFor="campaign-send-at">{t("field-send-at")}</Label>
                  <Input
                    id="campaign-send-at"
                    type="datetime-local"
                    value={sendAt}
                    onChange={(e) => setSendAt(e.target.value)}
                    min={minSendAt}
                    className="h-11"
                    aria-describedby="campaign-tz"
                  />
                  <p id="campaign-tz" className="text-xs text-muted-foreground" data-testid="operator-tz">
                    {t("timezone-note", { tz: timeZone })}
                  </p>
                  {scheduledDate && scheduleValid && deviceTimeZone !== timeZone ? (
                    <p className="text-xs text-muted-foreground">
                      {t("send-at-local", {
                        time: formatCampaignDate(scheduledDate.toISOString(), locale),
                      })}
                    </p>
                  ) : null}
                  {sendAt && !scheduleValid ? (
                    <p role="alert" className="text-sm text-destructive">{t("send-at-past")}</p>
                  ) : null}
                </div>
              ) : null}
              {channel === "whatsapp" ? (
                <div className="flex items-start gap-3 rounded border border-border/60 bg-muted/30 p-3 text-sm">
                  <Moon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <p>
                    {t("quiet-hours-note", {
                      start: hourLabel(MARKETING_QUIET_HOURS.startHour, locale),
                      end: hourLabel(MARKETING_QUIET_HOURS.endHour, locale),
                    })}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === "review" ? (
            <div className="flex flex-col gap-4">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {([
                  ["field-name", name.trim()],
                  ["field-channel", t(`channel-${channel}`)],
                  ["field-segment", segment?.name ?? "—"],
                  ["field-template", template ? `${template.name} · v${template.version}` : "—"],
                  [
                    "field-send-at",
                    timing === "now"
                      ? t("timing-now")
                      : `${formatCampaignDate(scheduledDate?.toISOString(), locale, timeZone)} (${timeZone})`,
                  ],
                ] as const).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-0.5 border-b border-border/60 pb-2">
                    <dt className="text-muted-foreground">{t(key)}</dt>
                    <dd className="break-words font-medium">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="rounded border border-primary/30 bg-primary/5 p-4" data-testid="review-recipients">
                <p className="text-sm text-muted-foreground">{t("review-recipients")}</p>
                <p className="text-2xl font-semibold tabular-nums">{recipients}</p>
                {channel === "whatsapp" && recipients > 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("review-whatsapp-cap", {
                      cap: WHATSAPP_MARKETING_DAILY_CAP,
                      days: estimateSendDays(recipients, channel),
                    })}
                  </p>
                ) : null}
              </div>

              {recipients === 0 ? (
                <p role="alert" className="text-sm text-destructive">{t("review-no-recipients")}</p>
              ) : null}

              {needsConfirm ? (
                <div className="flex max-w-sm flex-col gap-2">
                  <Label htmlFor="campaign-confirm">
                    {t("confirm-label", { word: CONFIRM_WORD, count: recipients })}
                  </Label>
                  <Input
                    id="campaign-confirm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    autoComplete="off"
                    className="h-11"
                  />
                </div>
              ) : null}

              {submitError ? (
                <DeskNotice variant="error">{t("submit-failed")}</DeskNotice>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-4 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={stepIndex === 0 || submitting}
              onClick={() => setStep(STEPS[stepIndex - 1])}
            >
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
              {t("back")}
            </Button>
            {step === "review" ? (
              <Button
                type="button"
                className="min-h-11"
                disabled={!canSubmit}
                onClick={() => void submit()}
                data-testid="campaign-submit"
              >
                {submitting
                  ? t("submitting")
                  : timing === "now"
                    ? t("submit-now")
                    : t("submit-schedule")}
              </Button>
            ) : (
              <Button
                type="button"
                className="min-h-11"
                disabled={!canNext}
                onClick={() => setStep(STEPS[stepIndex + 1])}
                data-testid="wizard-next"
              >
                {t("next")}
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
