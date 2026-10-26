/** Local first-name vocabulary is a heuristic, never an identity registry or general NER model. */
const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const givenNames = new Set(
  `aaron abel abigail abraham adan adela adelaida adolfo adrian adriana agustin aida alana alan alberto alejandro alejandra alex alexander alexa alfonso alfredo alicia alma alonso alvaro amalia amanda ana anabel andrea andres angel angela angelica antonio antonia ariel armando arturo ashley aurora beatriz benjamin bernardo blanca brenda brian bruno camila camilo carla carlos carmen carolina catalina cecilia cesar christian cristian christina cristina claudia claudio clara clark dalia damian daniel daniela dario david debora diana diego dolores dominic eduardo edgar edith elena elias elisa elizabeth emilia emiliano emilio emma enrique eric erika ernesto esteban estefania estela esther eugenia eugenio eva evelyn fabian fabiola fatima federico felipe fernanda fernando francisca francisco gabriel gabriela gerardo german gloria gonzalo graciela guadalupe gustavo hector helena henry hugo ignacio ines ingrid irene iris isaac isabel isabella isaias israel ivan ivana jacob jaime james javier jazmin jean jennifer jeronimo jesus jimena joan joaquin joel john jorge jose josefina joshua josue juan juana julia julian julio julieta karen karina kevin laura leonardo leonor leslie leticia lia liliana lina liz lorenzo lorena lucas lucia luciana luciano luis luisa luz manuel manuela marcela marcelo marcos margarita maria mariana mariano maribel marisol mario marta martha martin martina mateo matias mauricio maximo melanie melissa mercedes mia micaela michael michelle miguel miriam monica natalia nathan nicolas noelia noemi norma octavio olga omar oscar pablo pamela paola patricia patricio paul paula pedro pilar rafael ramiro ramon raquel rebecca rebeca regina renata renato ricardo roberto rocio rodrigo rosa rosalia rosario ruben ruth salvador samuel sandra santiago sara sarah saul sebastian sergio silvia simon sofia sonia susana tamara teresa thomas tomas valentina valeria vanesa vanessa veronica vicente victor victoria vincent virginia viviana walter william ximena yael yolanda yuri zoe`.split(
    /\s+/u,
  ),
);
const ambiguous = new Set([
  "alma",
  "aurora",
  "blanca",
  "clara",
  "dolores",
  "gloria",
  "iris",
  "luz",
  "margarita",
  "mercedes",
  "norma",
  "pilar",
  "rosa",
  "rosario",
  "salvador",
  "victoria",
]);
const stopWords = new Set(
  `a al algo antes archivo archivos ayuda ayudame banco bonita buenos buenas calle casa clave codigo como con consulta contacto correo correos cual cuando cuenta cuentas de del debe desde dia dice direccion documento el ella en entre error es esa escribe ejemplo esta este estos etiqueta fecha folio formato gracias hola hoy identificador informacion la las le lo los me mi mis muy necesita necesito no nos nombre numero para pedido pero por porque prueba puede puedes que quiero quien referencia reporte revisar resumen se sin sistema sobre soy su sus telefono tiene tengo trabaja trabajo estudia estudio programa explica responde redacta nacio nacido naci padece sufre vive vivo texto titular tu un una uno uno usuario va variable version vive vivo y ya yo`.split(
    /\s+/u,
  ),
);
const surnames = new Set(
  `garcia garza gomez gonzalez lopez hernandez martinez martin perez rodriguez sanchez ramirez reyes flores torres rivera vazquez vasquez ortiz cruz morales castro ruiz diaz mendoza aguilar navarro ramos romero medina ortega vega silva soto castillo jimenez alvarez moreno cornejo pena rios guerrero mendez guzman estrada espinoza salazar leon vargas acosta campos cabrera valdez velazquez dominguez santiago montoya avila pacheco serrano franco miranda robles salinas paredes solis trejo cortes ibarra valencia molina luna saucedo fuentes carrillo gallegos arenas esquivel segura nunez huerta smith johnson brown jones miller davis wilson taylor clark walker hall young king wright scott green adams nelson baker carter`.split(
    /\s+/u,
  ),
);
export const isGivenName = (value: string, free = false) =>
  givenNames.has(normalize(value)) &&
  (!free || !ambiguous.has(normalize(value)));
export const isNameStopWord = (value: string) =>
  stopWords.has(normalize(value));

/** Returns a bounded person-like prefix, preserving original spelling and offsets. */
export function personNamePrefix(
  text: string,
  explicit: boolean,
): string | null {
  const tokens = [
    ...text.slice(0, 180).matchAll(/[\p{L}\p{M}]+(?:[-'’][\p{L}\p{M}]+)*/gu),
  ];
  if (!tokens.length || tokens[0]!.index !== 0 || isNameStopWord(tokens[0]![0]))
    return null;
  if (!explicit && !isGivenName(tokens[0]![0], true)) return null;
  let end = 0,
    validEnd = 0,
    words = 0,
    surnamesSeen = 0;
  for (const token of tokens.slice(0, 8)) {
    const gap = text.slice(end, token.index);
    if (end && !/^[\t ]+$/u.test(gap)) break;
    const word = token[0],
      folded = normalize(word);
    if (["de", "del", "la", "las", "los"].includes(folded)) {
      if (!words) break;
      end = token.index + word.length;
      continue;
    }
    if (isNameStopWord(word) || words >= 5) break;
    if (!explicit && words) {
      if (surnamesSeen && !surnames.has(folded) && !/^\p{Lu}/u.test(word))
        break;
      if (!isGivenName(word) || surnamesSeen) surnamesSeen++;
      if (surnamesSeen > 2) break;
    }
    words++;
    end = token.index + word.length;
    validEnd = end;
  }
  return words >= 2 ? text.slice(0, validEnd) : null;
}
