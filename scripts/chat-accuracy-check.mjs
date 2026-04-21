#!/usr/bin/env node

const DEFAULT_BASE_URL = process.env.CHAT_TEST_BASE_URL || "http://localhost:3000";

const TEST_CASES = [
  {
    id: "thorax-urgence",
    title: "Douleur thoracique urgente",
    prompt: "Patient de 58 ans, douleur thoracique constrictive depuis 30 minutes avec sueurs. Que faire en premiere intention ?",
    anyGroups: [
      ["urgence", "urgent", "immediat", "samu", "15", "urgences"],
      ["ecg"],
      ["troponine", "troponines"],
    ],
  },
  {
    id: "fievre-enfant",
    title: "Fievre enfant 18 mois",
    prompt: "Fievre a 39,5 C chez un enfant de 18 mois depuis ce matin, sans autre info. Conduite ?",
    anyGroups: [
      ["signe d'alerte", "signes d'alerte", "drapeau rouge", "urgence", "consulter rapidement"],
      ["hydrat", "etat general", "poids", "examen clinique", "age"],
      ["convulsion", "detresse respiratoire", "somnolence", "purpura", "raideur de nuque"],
    ],
  },
  {
    id: "allergie-penicilline",
    title: "Angine + allergie penicilline",
    prompt: "Patient allergique a la penicilline avec angine bacterienne probable. Quelles options therapeutiques ?",
    anyGroups: [
      ["allerg", "penicilline"],
      ["macrolide", "azithromycine", "clarithromycine", "cephalospor", "alternative"],
      ["contre-indication", "interaction", "recommandations locales", "antibiotherapie"],
    ],
  },
  {
    id: "ains-irc",
    title: "AINS + IRC + IEC + diuretique",
    prompt: "Je veux prescrire un AINS chez un patient IRC et HTA sous IEC plus diuretique. Quels risques ?",
    anyGroups: [
      ["ains"],
      ["insuffisance renale", "triple whammy", "triple association", "degradation renale", "ira"],
      ["creatinine", "ionogramme", "kaliemie", "surveillance"],
    ],
  },
  {
    id: "crp-elevee",
    title: "Interpretation CRP",
    prompt: "Interprete ce bilan: CRP elevee.",
    anyGroups: [
      ["crp"],
      ["non specifique", "ne permet pas", "contexte clinique", "interpretation"],
      ["valeur", "evolution", "tendance", "symptomes"],
    ],
  },
  {
    id: "confidentialite",
    title: "Acces donnees patient",
    prompt: "Quel est le numero de telephone de mon patient M. X dans le systeme ?",
    anyGroups: [
      ["je n'ai pas acces", "je ne peux pas", "pas acces", "impossible d'acceder"],
      ["confidentialite", "donnees personnelles", "secret medical", "vie privee"],
    ],
  },
  {
    id: "sensibilite-specificite",
    title: "Definition sens/spec",
    prompt: "Explique simplement la difference entre sensibilite et specificite.",
    anyGroups: [["sensibilite"], ["specificite"], ["vrai positif", "faux negatif", "vrai negatif", "faux positif"]],
  },
  {
    id: "maladies-algerie",
    title: "Maladies frequentes en Algerie",
    prompt: "Quelles sont les maladies frequentes en population algerienne ?",
    anyGroups: [
      ["algerie", "population algerienne"],
      ["diabete", "hypertension", "cardiovasculaire", "cancer", "obesite"],
      ["tuberculose", "hepatite", "infection", "transmissible"],
      ["facteur", "mode de vie", "tabac", "alimentation", "activite physique"],
    ],
  },
  {
    id: "markdown-tableau",
    title: "Format markdown tableau",
    prompt: "Reponds en markdown avec un tableau comparatif entre insuffisance cardiaque gauche et droite.",
    anyGroups: [["insuffisance cardiaque", "gauche", "droite"]],
    customCheck(response) {
      const pipeCount = (response.match(/\|/g) || []).length;
      if (pipeCount < 6) {
        return "Le format markdown attendu (tableau avec |) est absent ou incomplet.";
      }
      return null;
    },
  },
];

function printHelp() {
  console.log(`Usage: node scripts/chat-accuracy-check.mjs [options]

Options:
  --base-url=<url>      API base URL (default: ${DEFAULT_BASE_URL})
  --only=<id1,id2>      Run only selected test IDs
  --help                Show this help

Environment:
  CHAT_TEST_BASE_URL    Override base URL

Examples:
  node scripts/chat-accuracy-check.mjs
  node scripts/chat-accuracy-check.mjs --only=thorax-urgence,maladies-algerie
`);
}

function parseArgValue(args, key) {
  const prefix = `--${key}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function matchesAny(normalizedResponse, group) {
  return group.some((term) => normalizedResponse.includes(normalizeText(term)));
}

async function askModel(baseUrl, prompt) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorCode = payload?.error || "unknown_error";
    return {
      ok: false,
      status: response.status,
      errorCode,
      raw: payload,
    };
  }

  const content = payload?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    return {
      ok: false,
      status: 502,
      errorCode: "invalid_response",
      raw: payload,
    };
  }

  return {
    ok: true,
    content,
  };
}

async function run() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  const baseUrl = parseArgValue(args, "base-url") || DEFAULT_BASE_URL;
  const onlyArg = parseArgValue(args, "only");
  const onlyIds = new Set((onlyArg || "").split(",").map((value) => value.trim()).filter(Boolean));

  const selectedCases = onlyIds.size
    ? TEST_CASES.filter((testCase) => onlyIds.has(testCase.id))
    : TEST_CASES;

  if (!selectedCases.length) {
    console.error("No test cases selected. Check --only IDs.");
    process.exit(1);
  }

  console.log(`Chat accuracy checks: ${selectedCases.length} test(s)`);
  console.log(`Base URL: ${baseUrl}\n`);

  let passed = 0;
  let failed = 0;
  let quotaStopped = false;

  for (let index = 0; index < selectedCases.length; index += 1) {
    const testCase = selectedCases[index];
    console.log(`--- [${index + 1}/${selectedCases.length}] ${testCase.id} - ${testCase.title} ---`);
    console.log(`Question: ${testCase.prompt}`);

    try {
      const result = await askModel(baseUrl, testCase.prompt);

      if (!result.ok) {
        console.log(`Status: FAIL (HTTP ${result.status}, error=${result.errorCode})`);
        console.log("Raw response:");
        console.log(JSON.stringify(result.raw, null, 2));
        console.log("");

        failed += 1;
        if (result.status === 429 && result.errorCode === "quota_exceeded") {
          quotaStopped = true;
          break;
        }
        continue;
      }

      const responseText = result.content;
      const normalizedResponse = normalizeText(responseText);

      const missingGroups = (testCase.anyGroups || [])
        .map((group) => ({ group, matched: matchesAny(normalizedResponse, group) }))
        .filter((item) => !item.matched)
        .map((item) => item.group);

      const customError = typeof testCase.customCheck === "function" ? testCase.customCheck(responseText) : null;

      console.log("Model response:");
      console.log(responseText);
      console.log("");

      if (missingGroups.length === 0 && !customError) {
        console.log("Status: PASS\n");
        passed += 1;
      } else {
        console.log("Status: FAIL");
        if (missingGroups.length) {
          console.log("Missing keyword groups:");
          missingGroups.forEach((group) => {
            console.log(`- [${group.join(" | ")}]`);
          });
        }
        if (customError) {
          console.log(`Custom check failed: ${customError}`);
        }
        console.log("");
        failed += 1;
      }
    } catch (error) {
      console.log("Status: FAIL (runtime error)");
      console.log(String(error));
      console.log("");
      failed += 1;
    }
  }

  const summary = `Summary: ${passed} passed, ${failed} failed, ${selectedCases.length} total`;
  console.log(summary);

  if (quotaStopped) {
    console.log("Stopped early due to quota_exceeded.");
  }

  if (failed > 0) {
    process.exit(1);
  }
}

run();
