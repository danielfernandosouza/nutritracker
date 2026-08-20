export type MetricKey = "calories" | "protein" | "fat" | "carbs" | "sodium" | "sugar" | "water" | "sleep";

export type MetricStatusCopy = { consequence: string; howToFix: string };

export type Source = { label: string; url: string };

export type MetricInfo = {
  title: string;
  unit: string;
  /** true = a meta é um teto (sódio, açúcar) — só ficar "acima" é um problema, abaixo é normal. */
  capped: boolean;
  whatItIs: string;
  whyThisTarget: string;
  tooLow: MetricStatusCopy;
  tooHigh: MetricStatusCopy;
  sources: Source[];
};

export type MetricStatus = { kind: "low" | "high" | "good" };

/** Sódio/açúcar são tetos (só "alto" é problema); as demais têm faixa (baixo e alto importam). */
export function computeMetricStatus(metric: MetricKey, value: number, target: number): MetricStatus {
  const info = METRIC_INFO[metric];
  if (info.capped) return { kind: value > target ? "high" : "good" };
  if (value < target * 0.85) return { kind: "low" };
  if (value > target * 1.15) return { kind: "high" };
  return { kind: "good" };
}

export const METRIC_INFO: Record<MetricKey, MetricInfo> = {
  calories: {
    title: "Calorias",
    unit: "kcal",
    capped: false,
    whatItIs: "A energia total que você consome no dia, vinda de proteína, gordura e carboidrato.",
    whyThisTarget:
      "Calculamos sua taxa metabólica basal (energia gasta em repouso) e multiplicamos pelo seu nível de atividade pra achar seu gasto total estimado. A partir daí, ajustamos pra cima ou pra baixo conforme seu objetivo — um déficit ou superávit moderado, não um corte ou aumento drástico.",
    tooLow: {
      consequence:
        "Um déficit muito agressivo ativa a chamada 'adaptação metabólica': seu corpo reduz gasto energético (menos disposição pra se mexer no dia a dia, queda de hormônios como leptina e T3) e aumenta a fome — isso trava o emagrecimento e aumenta a chance de compensar comendo demais depois.",
      howToFix:
        "Prefira um déficit moderado e sustentável (nossa meta já é calculada assim) em vez de cortar ainda mais. Se bateu muito abaixo num dia específico, não precisa 'compensar' comendo menos no dia seguinte — só volte ao normal.",
    },
    tooHigh: {
      consequence: "Comer consistentemente acima da meta significa superávit calórico — o excesso que não é usado como energia é armazenado como gordura.",
      howToFix:
        "Um dia acima não desfaz o progresso. O que importa é a média da semana — se foi só um dia, siga normal; se está sendo frequente, vale rever as porções ou a frequência de alimentos calóricos.",
    },
    sources: [
      { label: "Metabolic adaptation and weight loss — NCBI", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2634841/" },
      { label: "Tissue loss and RMR reduction — NCBI", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9151388/" },
    ],
  },
  protein: {
    title: "Proteína",
    unit: "g",
    capped: false,
    whatItIs: "O nutriente usado pra construir e manter músculo, pele, enzimas e hormônios.",
    whyThisTarget:
      "Usamos 2,2g por kg de peso corporal — dentro da faixa (1,6-2,2g/kg) que estudos mostram ser necessária pra preservar massa magra durante um déficit calórico, prioridade máxima do app.",
    tooLow: {
      consequence:
        "Quando a proteína não é suficiente — especialmente em déficit calórico — o corpo aumenta a quebra de proteína muscular pra suprir aminoácidos. Ou seja: comendo pouca proteína, parte do que você perde não é só gordura, é músculo também.",
      howToFix:
        "Priorize fontes de proteína magra em cada refeição (frango, peixe, ovos, iogurte grego, leguminosas). Se ficou abaixo num dia, é só se atentar mais a incluir proteína na próxima refeição — não precisa de nada drástico.",
    },
    tooHigh: {
      consequence: "Comer bem acima da meta raramente é prejudicial pra quem tem rins saudáveis — o excesso é usado como energia ou eliminado.",
      howToFix: "Não é necessário corrigir. Só vale de olho no total de calorias do dia, já que proteína também tem calorias.",
    },
    sources: [
      { label: "Exercise Preserves Lean Mass during Energy Deficit — NCBI", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5522839/" },
      { label: "Minimum Protein for Muscle Retention — Legion Athletics", url: "https://legionathletics.com/minimum-protein-per-day/" },
    ],
  },
  fat: {
    title: "Gordura",
    unit: "g",
    capped: false,
    whatItIs: "Fonte concentrada de energia, essencial pra absorver vitaminas A, D, E e K e produzir hormônios.",
    whyThisTarget: "Calculamos como ~25% das suas calorias diárias — dentro da faixa de 20-35% recomendada pra adultos.",
    tooLow: {
      consequence:
        "Gordura de menos prejudica a absorção das vitaminas lipossolúveis (A, D, E, K) e pode afetar a produção de hormônios e a saúde da pele e do intestino.",
      howToFix: "Inclua fontes de gordura boa — azeite, abacate, castanhas, peixes gordurosos — nas refeições principais.",
    },
    tooHigh: {
      consequence:
        "Diferente do sódio, não existe 'lavar' o excesso de gordura com água — o que passa da meta vira gordura corporal, e em excesso constante pode sobrecarregar o fígado (esteatose hepática) e o sistema digestivo.",
      howToFix:
        "A correção é ao longo dos próximos dias, não pontual: reduza frituras e ultraprocessados, prefira preparos grelhados/assados, e ajuste as porções de gordura adicionada (óleo, manteiga, molhos).",
    },
    sources: [
      { label: "Fats, Cholesterol, and Chronic Diseases — NCBI Bookshelf", url: "https://www.ncbi.nlm.nih.gov/books/NBK235018/" },
    ],
  },
  carbs: {
    title: "Carboidrato",
    unit: "g",
    capped: false,
    whatItIs: "A principal fonte de energia rápida do corpo e do cérebro, e o combustível preferido pra treinos intensos.",
    whyThisTarget: "É o que sobra do seu total calórico depois de reservar proteína e gordura — não tem um mínimo fixo, varia com sua meta de calorias.",
    tooLow: {
      consequence:
        "Cortar carboidrato demais causa fadiga nos primeiros dias (o famoso 'keto flu' — cansaço, dor de cabeça, falta de concentração) enquanto o corpo se adapta a usar gordura como combustível principal.",
      howToFix: "Se sentir essa fadiga, inclua fontes de carboidrato de qualidade (frutas, grãos integrais, tubérculos) principalmente perto dos treinos.",
    },
    tooHigh: {
      consequence:
        "Muito carboidrato de uma vez (principalmente açúcares simples) causa picos de glicose no sangue seguidos de quedas — o que dá aquela sensação de cansaço depois de comer.",
      howToFix: "Prefira carboidratos complexos (integrais, com fibra) em vez de simples, e distribua ao longo do dia em vez de concentrar tudo numa refeição.",
    },
    sources: [{ label: "Low-carb diet — Mayo Clinic", url: "https://www.mayoclinic.org/healthy-lifestyle/weight-loss/in-depth/low-carb-diet/art-20045831" }],
  },
  sodium: {
    title: "Sódio",
    unit: "mg",
    capped: true,
    whatItIs: "Mineral essencial em pequenas quantidades, mas presente em excesso na maioria dos alimentos processados e temperos prontos.",
    whyThisTarget: "Usamos 2300mg como referência — o teto geral recomendado pra adultos saudáveis.",
    tooLow: {
      consequence: "Ficar abaixo do teto de sódio não é um problema — é justamente o esperado num dia de alimentação equilibrada.",
      howToFix: "Nada a corrigir.",
    },
    tooHigh: {
      consequence:
        "Sódio em excesso retém água no corpo, aumenta o volume sanguíneo e a pressão arterial, e sobrecarrega os rins ao longo do tempo.",
      howToFix:
        "Beber mais água ajuda o rim a excretar mais sódio (existe uma relação direta entre ingestão de água e excreção de sódio pela urina) — mas isso é um empurrãozinho, não a solução. A correção de verdade é reduzir o sal na próxima refeição: menos processados, molhos prontos e temperos industrializados.",
    },
    sources: [
      { label: "Salt and Water Relationship — AJKD", url: "https://www.ajkd.org/article/S0272-6386(17)30851-X/fulltext" },
      { label: "How High Sodium Damages Kidneys", url: "https://nephdocs.com/blog/sodium-kidney-health/" },
    ],
  },
  sugar: {
    title: "Açúcar",
    unit: "g",
    capped: true,
    whatItIs: "Açúcares adicionados aos alimentos (não conta o açúcar natural de frutas inteiras) — a forma mais fácil de estourar calorias sem nutrientes.",
    whyThisTarget: "Usamos 50g como referência geral, alinhado ao teto de 10% das calorias em açúcares livres recomendado pela OMS.",
    tooLow: {
      consequence: "Ficar abaixo do teto de açúcar é o esperado — não é uma meta mínima a ser batida.",
      howToFix: "Nada a corrigir.",
    },
    tooHigh: {
      consequence: "Excesso de açúcar frequente está ligado a ganho de peso, resistência à insulina e maior risco cardiovascular.",
      howToFix: "Reduza bebidas açucaradas, doces e industrializados nos próximos dias — é a fonte mais fácil de cortar sem sacrificar nutrição.",
    },
    sources: [
      { label: "WHO Sugar Recommendation — SugarScience UCSF", url: "https://sugarscience.ucsf.edu/taking-the-lead-worldwide-who.html" },
      { label: "Get the Facts: Added Sugars — CDC", url: "https://www.cdc.gov/nutrition/php/data-research/added-sugars.html" },
    ],
  },
  water: {
    title: "Água",
    unit: "ml",
    capped: false,
    whatItIs: "Fundamental pra regular temperatura, transportar nutrientes e ajudar os rins a eliminar toxinas e excesso de sódio.",
    whyThisTarget: "Estimamos ~35ml por kg de peso, com um acréscimo pra quem tem nível de atividade mais alto (referência geral, não prescrição médica).",
    tooLow: {
      consequence: "Desidratação leve já causa fadiga, dor de cabeça, tontura e dificuldade de concentração.",
      howToFix: "Beba um copo d'água ao acordar e mantenha uma garrafa por perto — pequenos goles ao longo do dia rendem mais que tentar recuperar tudo de uma vez à noite.",
    },
    tooHigh: {
      consequence:
        "Beber água muito além da meta raramente é um problema pra maioria das pessoas — o excesso extremo (mais comum em atletas de endurance) pode diluir o sódio do sangue (hiponatremia), mas é raro no dia a dia.",
      howToFix: "Não é necessário corrigir — distribua a ingestão ao longo do dia em vez de concentrar tudo de uma vez.",
    },
    sources: [
      { label: "Water: how much should you drink — Mayo Clinic", url: "https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/water/art-20044256" },
      { label: "Water Intoxication — Cleveland Clinic", url: "https://my.clevelandclinic.org/health/diseases/water-intoxication" },
    ],
  },
  sleep: {
    title: "Sono",
    unit: "h",
    capped: false,
    whatItIs: "O período em que o corpo recupera energia, consolida memória e repara tecido muscular — inclusive o estímulo do treino.",
    whyThisTarget:
      "Usamos a faixa geral recomendada pra adultos (7-9h, ou 7-8h acima dos 65 anos), com meia hora a mais quando você treinou no dia anterior, pra dar espaço extra de recuperação.",
    tooLow: {
      consequence:
        "Privação de sono prejudica concentração e humor no curto prazo, e no longo prazo está ligada a maior risco de pressão alta, depressão e problemas cardiovasculares — além de atrapalhar a recuperação muscular do treino.",
      howToFix: "Tente manter um horário consistente de dormir/acordar, mesmo nos fins de semana — é a mudança com mais impacto real.",
    },
    tooHigh: {
      consequence:
        "Dormir regularmente mais de 9h também é associado a letargia, dor de cabeça e, às vezes, sinaliza outro problema de saúde ou sono de má qualidade (muitos despertares).",
      howToFix: "Se está dormindo demais e ainda cansado, vale olhar a qualidade do sono (horário de deitar, telas antes de dormir) mais do que só a duração.",
    },
    sources: [
      { label: "Sleep Deprivation — Sleep Foundation", url: "https://www.sleepfoundation.org/sleep-deprivation" },
      { label: "Oversleeping — Sleep Foundation", url: "https://www.sleepfoundation.org/how-sleep-works/oversleeping" },
    ],
  },
};
