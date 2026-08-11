const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseTestRecipients(value: string): string[] {
  return Array.from(new Set(
    value
      .split(/[\s,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter((email) => EMAIL.test(email)),
  ));
}

export function validGroupName(value: string): string | null {
  const name = value.trim().replace(/\s+/g, " ");
  return name ? name.slice(0, 80) : null;
}
