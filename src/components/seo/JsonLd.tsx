/**
 * Renders a structured-data block as `<script type="application/ld+json">`.
 *
 * `JSON.stringify` escapes for JSON, not for HTML, so its output can close the
 * surrounding script element: a value containing `</script>` ends the block and
 * everything after it is parsed as markup. Escaping `<` as `<` is valid
 * inside a JSON string, decodes back to the same character, and makes that
 * impossible.
 *
 * Every schema in this app is currently built from static literals, so there is
 * no live injection path. This exists so that stays true by construction rather
 * than by remembering — the moment a page title or a route param reaches a
 * schema, twelve hand-written copies of the raw pattern would each have been a
 * hole.
 */
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: the only way to emit
      // a JSON-LD script body in React; the payload is escaped on the line below.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
