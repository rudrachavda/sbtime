import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? "587"),
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USER ?? "",
        pass: process.env.SMTP_PASSWORD ?? "",
      },
    });
  }
  return transporter;
};

/** The site's public address, for links in emails (set SITE_URL when hosted). */
const siteUrl = () =>
  (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Text for an email's HTML: names and class fields come from users. */
const escapeHtml = (value: string | number) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** The class's page on SBTime (the regular session), escaped for an href. */
const classPageUrl = (
  subject: string,
  courseNumber: string,
  number: string,
  semester: string,
  year: number
) =>
  escapeHtml(
    `${siteUrl()}/catalog/${[year, semester, subject, courseNumber, number]
      .map((part) => encodeURIComponent(String(part)))
      .join("/")}/1`
  );

export const sendSubscribeConfirmation = async (
  to: string,
  name: string,
  subject: string,
  courseNumber: string,
  sectionNumber: string,
  semester: string,
  year: number
) => {
  const mailer = getTransporter();
  if (!mailer) return;

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "";
  const classLabel = escapeHtml(
    `${subject} ${courseNumber} Section ${sectionNumber} (${semester} ${year})`
  );

  await mailer.sendMail({
    from,
    to,
    subject: `Subscribed to notifications for ${subject} ${courseNumber}`,
    html: `
      <p>Hi ${escapeHtml(name)},</p>
      <p>You're now subscribed to enrollment drop notifications for <strong>${classLabel}</strong>.</p>
      <p>You'll receive an email when all of the following are true:</p>
      <ul>
        <li>The class is at least 80% full</li>
        <li>Enrollment drops by at least 5%</li>
        <li>At least 3 spots open up</li>
      </ul>
      <p>To unsubscribe, go to the <a href="${classPageUrl(subject, courseNumber, sectionNumber, semester, year)}">class page on SBTime</a> and click the bell icon again.</p>
    `,
  });
};

export const sendUnsubscribeConfirmation = async (
  to: string,
  name: string,
  subject: string,
  courseNumber: string,
  sectionNumber: string,
  semester: string,
  year: number
) => {
  const mailer = getTransporter();
  if (!mailer) return;

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "";
  const classLabel = escapeHtml(
    `${subject} ${courseNumber} Section ${sectionNumber} (${semester} ${year})`
  );

  await mailer.sendMail({
    from,
    to,
    subject: `Unsubscribed from notifications for ${subject} ${courseNumber}`,
    html: `
      <p>Hi ${escapeHtml(name)},</p>
      <p>You've been unsubscribed from enrollment drop notifications for <strong>${classLabel}</strong>.</p>
      <p>You won't receive any further notifications for this class.</p>
      <p>You can re-subscribe anytime from the <a href="${classPageUrl(subject, courseNumber, sectionNumber, semester, year)}">class page on SBTime</a>.</p>
    `,
  });
};
