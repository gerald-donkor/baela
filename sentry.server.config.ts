import * as Sentry from "@sentry/nextjs";
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  beforeSendSpan(span) {
    if (
      Object.keys(span.attributes).some(
        (key) => key.startsWith("http.") || key.startsWith("url."),
      )
    ) {
      span.name = "HTTP request";
      span.attributes = {};
    }
    return span;
  },
  beforeSend(event) {
    delete event.request;
    delete event.user;
    return event;
  },
});
