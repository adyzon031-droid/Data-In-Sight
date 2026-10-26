import type { Category, Decision } from "../../../src/application";

export interface MessageCase {
  id: string;
  text: string;
  categories: Category[];
  decision: Decision;
}
// Synthetic only. example.com is reserved for examples; identifier plausibility does not imply registration.
export const sensitive: MessageCase[] = [
  {
    id: "s01",
    text: "Correo: alumno@example.com",
    categories: ["email"],
    decision: "WARN",
  },
  {
    id: "s02",
    text: "Escribe a ana.perez+curso@example.org.",
    categories: ["email"],
    decision: "WARN",
  },
  {
    id: "s03",
    text: "CORREO: EQUIPO@EXAMPLE.COM",
    categories: ["email"],
    decision: "WARN",
  },
  {
    id: "s04",
    text: "Teléfono: 55 1234 5678",
    categories: ["phone"],
    decision: "WARN",
  },
  {
    id: "s05",
    text: "Contacto: +52 55 1234 5678",
    categories: ["phone"],
    decision: "WARN",
  },
  {
    id: "s06",
    text: "WhatsApp: 771 123 4567",
    categories: ["phone"],
    decision: "WARN",
  },
  {
    id: "s07",
    text: "CURP: GODE900101HDFRRN09",
    categories: ["curp"],
    decision: "WARN",
  },
  {
    id: "s08",
    text: "CURP: gade040229mnerlbA1",
    categories: ["curp"],
    decision: "WARN",
  },
  {
    id: "s09",
    text: "RFC: GODE900101AB1",
    categories: ["rfc"],
    decision: "WARN",
  },
  {
    id: "s10",
    text: "Empresa: ABC200229A12",
    categories: ["rfc"],
    decision: "WARN",
  },
  {
    id: "s11",
    text: "Mi contraseña es casa123",
    categories: ["password"],
    decision: "BLOCK",
  },
  {
    id: "s12",
    text: "password=123",
    categories: ["password"],
    decision: "BLOCK",
  },
  {
    id: "s13",
    text: 'DB_PASSWORD="frase de prueba"',
    categories: ["password"],
    decision: "BLOCK",
  },
  {
    id: "s14",
    text: "API_KEY=synthetic-example-key-123",
    categories: ["api-key"],
    decision: "BLOCK",
  },
  {
    id: "s15",
    text: "access_token: synthetic-example-token",
    categories: ["token"],
    decision: "BLOCK",
  },
  {
    id: "s16",
    text: "Authorization: Bearer synthetic-token-123456",
    categories: ["token"],
    decision: "BLOCK",
  },
  {
    id: "s17",
    text: `ghp_${"a".repeat(36)}`,
    categories: ["token"],
    decision: "BLOCK",
  },
  {
    id: "s18",
    text: "AKIAABCDEFGHIJKLMNOP",
    categories: ["api-key"],
    decision: "BLOCK",
  },
  {
    id: "s19",
    text: `sk-proj-${"x".repeat(40)}`,
    categories: ["api-key"],
    decision: "BLOCK",
  },
  {
    id: "s20",
    text: "alumno@example.com\npassword: synthetic-only",
    categories: ["email", "password"],
    decision: "BLOCK",
  },
];

export const benign: MessageCase[] = [
  "Explícame cómo funciona DHCP.",
  "¿Cómo mejorar mis hábitos de estudio?",
  "Escribe una función que ordene una lista.",
  "La contraseña debe cambiarse regularmente.",
  "¿Qué es una API key?",
  "No compartas tokens de acceso.",
  "Esta es una cadena aleatoria: aZ9qR7pX2nV8mT6k.",
  "El pedido es 5512345678.",
  "La versión es 1.2.3 y cuesta 100 pesos.",
  "El correo tiene formato usuario@dominio.",
  "Usa nombre@ para explicar el concepto.",
  "CURP: ABCD123",
  "RFC: ABC",
  "Telefono: 12345",
  "Enlace: https://example.com/docs",
  "const passwordResetEnabled = true;",
  "El tokenizador divide palabras.",
  "🔒 Protege tu información.",
  "Fecha de entrega: 2026-10-19.",
  "",
].map((text, index) => ({
  id: `b${index + 1}`,
  text,
  categories: [],
  decision: "ALLOW",
}));

export const difficult: MessageCase[] = [
  {
    id: "d01",
    text: "🙂 alumno@example.com",
    categories: ["email"],
    decision: "WARN",
  },
  {
    id: "d02",
    text: "alumno@example.com\nalumno@example.com",
    categories: ["email"],
    decision: "WARN",
  },
  {
    id: "d03",
    text: "Correo <alumno@example.com>",
    categories: ["email"],
    decision: "WARN",
  },
  { id: "d04", text: "a..b@example.com", categories: [], decision: "ALLOW" },
  { id: "d05", text: "a@-example.com", categories: [], decision: "ALLOW" },
  { id: "d06", text: "a@example..com", categories: [], decision: "ALLOW" },
  {
    id: "d07",
    text: "CURP: GODE900231HDFRRN09",
    categories: [],
    decision: "ALLOW",
  },
  {
    id: "d08",
    text: "CURP: GODE900101HZZRRN09",
    categories: [],
    decision: "ALLOW",
  },
  { id: "d09", text: "RFC: GODE901301AB1", categories: [], decision: "ALLOW" },
  { id: "d10", text: "RFC: ABC230229A12", categories: [], decision: "ALLOW" },
  {
    id: "d11",
    text: "Teléfono:\n55 1234 5678",
    categories: ["phone"],
    decision: "WARN",
  },
  {
    id: "d12",
    text: "Referencia: 7711234567",
    categories: [],
    decision: "ALLOW",
  },
  {
    id: "d13",
    text: 'password="alumno@example.com"',
    categories: ["password"],
    decision: "BLOCK",
  },
  {
    id: "d14",
    text: 'password="+52 55 1234 5678"',
    categories: ["password"],
    decision: "BLOCK",
  },
  {
    id: "d15",
    text: '{"api_key":"synthetic-value-only"}',
    categories: ["api-key"],
    decision: "BLOCK",
  },
  {
    id: "d16",
    text: "contraseña: 'una frase con espacios'",
    categories: ["password"],
    decision: "BLOCK",
  },
  {
    id: "d17",
    text: "password=[CREDENCIAL_1]",
    categories: [],
    decision: "ALLOW",
  },
  { id: "d18", text: "password=[CORREO_2]", categories: [], decision: "ALLOW" },
  {
    id: "d19",
    text: "alumno@example.com; RFC: ABC200229A12; teléfono: +52 55 1234 5678",
    categories: ["email", "rfc", "phone"],
    decision: "WARN",
  },
  {
    id: "d20",
    text: "contraseña: x",
    categories: ["password"],
    decision: "BLOCK",
  },
];

export const messages = [...sensitive, ...benign, ...difficult];
