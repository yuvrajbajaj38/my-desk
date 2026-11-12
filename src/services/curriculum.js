export const CLASS_11_SYLLABUS = {
  physics: [
    "Mathematical Tools / Basic Math",
    "Motion in a Straight Line",
    "Motion in a Plane",
    "Laws of Motion",
    "Work, Energy and Power",
    "System of Particles and Center of Mass",
    "Rotational Motion",
    "Gravitation",
    "Mechanical Properties of Solids",
    "Mechanical Properties of Fluids",
    "Thermal Properties of Matter",
    "Thermodynamics",
    "Kinetic Theory",
    "Oscillations / Simple Harmonic Motion",
    "Waves",
  ],
  chemistry: {
    "Physical Chemistry": [
      "Some Basic Concepts of Chemistry",
      "Structure of Atom",
      "States of Matter",
      "Thermodynamics",
      "Chemical Equilibrium",
      "Ionic Equilibrium",
      "Redox Reactions",
    ],
    "Inorganic Chemistry": [
      "Classification of Elements and Periodicity in Properties",
      "Chemical Bonding and Molecular Structure",
    ],
    "Organic Chemistry": [
      "IUPAC Naming",
      "General Organic Chemistry (GOC)",
      "Isomerism",
      "Purification and Analysis of Organic Compounds",
      "Hydrocarbons",
      "Environmental Chemistry",
    ],
  },
  mathematics: [
    "Basic Math",
    "Sets",
    "Relations and Functions",
    "Trigonometric Functions",
    "Trigonometric Equations",
    "Principle of Mathematical Induction",
    "Complex Numbers",
    "Quadratic Equations",
    "Permutations and Combinations",
    "Binomial Theorem",
    "Sequences and Series",
    "Straight Lines",
    "Circle (Conic Sections)",
    "Parabola (Conic Sections)",
    "Ellipse (Conic Sections)",
    "Hyperbola (Conic Sections)",
    "Statistics",
    "Probability",
  ],
};

export const CLASS_12_SYLLABUS = {
  physics: [
    "Electric Charges and Fields",
    "Electrostatic Potential and Capacitance",
    "Current Electricity",
    "Moving Charges and Magnetism",
    "Magnetism and Matter",
    "Electromagnetic Induction",
    "Alternating Current",
    "Electromagnetic Waves",
    "Ray Optics",
    "Wave Optics",
    "Dual Nature of Radiation and Matter",
    "Atoms",
    "Nuclei",
    "Semiconductor Electronics",
  ],
  chemistry: {
    "Physical Chemistry": [
      "Solutions",
      "Electrochemistry",
      "Chemical Kinetics",
      "Surface Chemistry",
    ],
    "Inorganic Chemistry": [
      "General Principles and Processes of Isolation of Elements",
      "The p-Block Elements",
      "The d- and f-Block Elements",
      "Coordination Compounds",
    ],
    "Organic Chemistry": [
      "Haloalkanes and Haloarenes",
      "Alcohols, Phenols and Ethers",
      "Aldehydes, Ketones and Carboxylic Acids",
      "Amines",
      "Biomolecules",
      "Polymers",
      "Chemistry in Everyday Life",
    ],
  },
  mathematics: [
    "Relations and Functions",
    "Inverse Trigonometric Functions",
    "Matrices",
    "Determinants",
    "Continuity and Differentiability",
    "Applications of Derivatives",
    "Integrals",
    "Applications of Integrals",
    "Differential Equations",
    "Vector Algebra",
    "Three Dimensional Geometry",
    "Linear Programming",
    "Probability",
  ],
  biology: [
    "Reproduction in Organisms",
    "Sexual Reproduction in Flowering Plants",
    "Human Reproduction",
    "Reproductive Health",
    "Principles of Inheritance and Variation",
    "Molecular Basis of Inheritance",
    "Evolution",
    "Human Health and Disease",
    "Strategies for Enhancement in Food Production",
    "Microbes in Human Welfare",
    "Biotechnology: Principles and Processes",
    "Biotechnology and Its Applications",
    "Organisms and Populations",
    "Ecosystem",
    "Biodiversity and Conservation",
    "Environmental Issues",
  ],
};

export const CLASS_11_BIOLOGY = [
  "The Living World",
  "Biological Classification",
  "Plant Kingdom",
  "Animal Kingdom",
  "Morphology of Flowering Plants",
  "Anatomy of Flowering Plants",
  "Structural Organisation in Animals",
  "Cell: The Unit of Life",
  "Biomolecules",
  "Cell Cycle and Cell Division",
  "Photosynthesis in Higher Plants",
  "Respiration in Plants",
  "Plant Growth and Development",
  "Breathing and Exchange of Gases",
  "Body Fluids and Circulation",
  "Excretory Products and their Elimination",
  "Locomotion and Movement",
  "Neural Control and Coordination",
  "Chemical Coordination and Integration",
];

export const CLASS_11_CHEMISTRY_BRANCHES = Object.keys(CLASS_11_SYLLABUS.chemistry);

const flattenSubject = (syllabus, subjectKey) => {
  const chapters = syllabus?.[subjectKey];
  if (!chapters) return [];
  return Array.isArray(chapters) ? chapters : Object.values(chapters).flat();
};

export const getClass11ChapterList = (subject) => flattenSubject(CLASS_11_SYLLABUS, subject);

export const getClass12ChapterList = (subject) => flattenSubject(CLASS_12_SYLLABUS, subject);

export const getSubjectList = (examPattern) => {
  if (examPattern === "neet") return ["Physics", "Chemistry", "Biology"];
  return ["Physics", "Chemistry", "Mathematics"];
};

const subjectKey = (subject) => String(subject || "").toLowerCase();

export const getChapterList = (examPattern, classLevel, subject) => {
  if (!classLevel || !subject) return [];
  const key = subjectKey(subject);

  if (key === "biology") {
    if (classLevel === "class-11") return [...CLASS_11_BIOLOGY];
    if (classLevel === "class-12") return [...CLASS_12_SYLLABUS.biology];
    return [...CLASS_11_BIOLOGY, ...CLASS_12_SYLLABUS.biology];
  }

  if (classLevel === "class-11") {
    return getClass11ChapterList(key);
  }

  if (classLevel === "class-12") {
    return getClass12ChapterList(key);
  }

  if (classLevel === "class-11+12") {
    return [...getClass11ChapterList(key), ...getClass12ChapterList(key)];
  }

  return getClass11ChapterList(key);
};

export const getGroupedChapterList = (examPattern, classLevel, subject) => {
  if (classLevel === "class-11" && subject === "Chemistry") {
    return { ...CLASS_11_SYLLABUS.chemistry };
  }

  if (classLevel === "class-12" && subject === "Chemistry") {
    return { ...CLASS_12_SYLLABUS.chemistry };
  }

  if (classLevel === "class-11" && subject === "Mathematics") {
    const chapters = getChapterList(examPattern, classLevel, subject);
    const conicSections = chapters.filter((chapter) => chapter.includes("Conic Sections"));
    return {
      "Class 11": chapters.filter((chapter) => !chapter.includes("Conic Sections")),
      "Conic Sections": conicSections,
    };
  }

  if (classLevel === "class-11+12") {
    return {
      "Class 11": getChapterList(examPattern, "class-11", subject),
      "Class 12": getChapterList(examPattern, "class-12", subject),
    };
  }

  const label = classLevel === "class-12" ? "Class 12" : "Class 11";
  return { [label]: getChapterList(examPattern, classLevel, subject) };
};

export const isCanonicalChapter = (examPattern, classLevel, subject, chapter) => {
  return getChapterList(examPattern, classLevel, subject).includes(chapter);
};
