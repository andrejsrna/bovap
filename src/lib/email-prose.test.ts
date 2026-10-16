import assert from "node:assert/strict";
import { EMAIL_FONT_STACK, EMAIL_PROSE, EMAIL_PROSE_CLASS, EMAIL_SPACING, emailProseStyle } from "./email-prose";
import { renderCampaignHtml } from "./campaign-content";

const html = renderCampaignHtml({ title: "T", bodyText: "<p>Úvod</p><ul><li>Bod</li></ul>", cards: [{ title: "K", description: "<p>Popis</p>", url: "" }], unsubscribeUrl: "https://bovap.sk/odhlasenie" });
const { body, card } = EMAIL_PROSE;
// Email používa presne tie isté hodnoty ako admin editor.
assert.ok(html.includes(`font-family:${EMAIL_FONT_STACK}`));
assert.ok(html.includes(`font-size:${body.fontSize}px;line-height:${body.lineHeight}`));
assert.ok(html.includes(`font-size:${card.fontSize}px;line-height:${card.lineHeight}`));
assert.ok(html.includes(`<p style="margin:0 0 ${EMAIL_SPACING.paragraph}px">`));
assert.ok(html.includes(`<ul style="margin:0 0 ${EMAIL_SPACING.list}px;padding-left:${EMAIL_SPACING.listIndent}px">`));
assert.ok(html.includes(`<li style="margin:0 0 ${EMAIL_SPACING.listItem}px">`));
// Admin editor/detail: rovnaké písmo, veľkosť, riadkovanie a okraje.
assert.deepEqual(emailProseStyle("body"), { fontFamily: EMAIL_FONT_STACK, fontSize: "16px", lineHeight: 1.4, color: body.color, textAlign: "justify", textAlignLast: "left", overflowWrap: "anywhere", maxWidth: "536px" });
for (const cls of [`[&_p]:mb-[${EMAIL_SPACING.paragraph}px]`, `[&_ul]:pl-[${EMAIL_SPACING.listIndent}px]`, `[&_li]:mb-[${EMAIL_SPACING.listItem}px]`]) assert.ok(EMAIL_PROSE_CLASS.includes(cls), cls);
console.log("email-prose: OK");
