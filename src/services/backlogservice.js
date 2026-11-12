import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { CLASS_11_SYLLABUS } from "./curriculum";

const toChapter = (id, name, branch) => ({
  id,
  name,
  class: "11",
  ...(branch ? { branch } : {}),
});

const class11Chapters = {
  physics: CLASS_11_SYLLABUS.physics.map((name, index) =>
    toChapter(`11-phy-${index + 1}`, name)
  ),
  chemistry: Object.fromEntries(
    Object.entries(CLASS_11_SYLLABUS.chemistry).map(([branchName, chapters]) => [
      branchName.toLowerCase().replace(' ', '-'),
      chapters.map((name, index) => toChapter(
        `11-chem-${branchName.slice(0, 2).toLowerCase()}-${index + 1}`,
        name,
        branchName.toLowerCase().replace(' ', '-')
      )),
    ])
  ),
  mathematics: CLASS_11_SYLLABUS.mathematics.map((name, index) =>
    toChapter(`11-math-${index + 1}`, name)
  ),
};

// ============================================
// JEE CURRICULUM STRUCTURE
// ============================================

export const JEE_CURRICULUM = {
  "11": {
    ...class11Chapters,
  },
  "12": {
    physics: [
      { id: "12-phy-1", name: "Electric Charges & Fields", class: "12" },
      { id: "12-phy-2", name: "Electrostatic Potential & Capacitance", class: "12" },
      { id: "12-phy-3", name: "Current Electricity", class: "12" },
      { id: "12-phy-4", name: "Moving Charges & Magnetism", class: "12" },
      { id: "12-phy-5", name: "Magnetism & Matter", class: "12" },
      { id: "12-phy-6", name: "Electromagnetic Induction", class: "12" },
      { id: "12-phy-7", name: "Alternating Current", class: "12" },
      { id: "12-phy-8", name: "Electromagnetic Waves", class: "12" },
      { id: "12-phy-9", name: "Ray Optics & Optical Instruments", class: "12" },
      { id: "12-phy-10", name: "Wave Optics", class: "12" },
      { id: "12-phy-11", name: "Dual Nature of Radiation & Matter", class: "12" },
      { id: "12-phy-12", name: "Atoms", class: "12" },
      { id: "12-phy-13", name: "Nuclei", class: "12" },
      { id: "12-phy-14", name: "Semiconductor Electronics", class: "12" },
    ],
    chemistry: {
      "physical-chemistry": [
        { id: "12-chem-pc-1", name: "Solutions", class: "12", branch: "physical-chemistry" },
        { id: "12-chem-pc-2", name: "Electrochemistry", class: "12", branch: "physical-chemistry" },
        { id: "12-chem-pc-3", name: "Chemical Kinetics", class: "12", branch: "physical-chemistry" },
        { id: "12-chem-pc-4", name: "Surface Chemistry", class: "12", branch: "physical-chemistry" },
      ],
      "inorganic-chemistry": [
        { id: "12-chem-ic-1", name: "d- and f- Block Elements", class: "12", branch: "inorganic-chemistry" },
        { id: "12-chem-ic-2", name: "Coordination Compounds", class: "12", branch: "inorganic-chemistry" },
        { id: "12-chem-ic-3", name: "General Principles of Metallurgy", class: "12", branch: "inorganic-chemistry" },
        { id: "12-chem-ic-4", name: "Haloalkanes & Haloarenes", class: "12", branch: "inorganic-chemistry" },
      ],
      "organic-chemistry": [
        { id: "12-chem-oc-1", name: "Alcohols, Phenols & Ethers", class: "12", branch: "organic-chemistry" },
        { id: "12-chem-oc-2", name: "Aldehydes, Ketones & Carboxylic Acids", class: "12", branch: "organic-chemistry" },
        { id: "12-chem-oc-3", name: "Amines", class: "12", branch: "organic-chemistry" },
        { id: "12-chem-oc-4", name: "Biomolecules", class: "12", branch: "organic-chemistry" },
        { id: "12-chem-oc-5", name: "Polymers", class: "12", branch: "organic-chemistry" },
        { id: "12-chem-oc-6", name: "Chemistry in Everyday Life", class: "12", branch: "organic-chemistry" },
      ],
    },
    mathematics: [
      { id: "12-math-1", name: "Relations & Functions", class: "12" },
      { id: "12-math-2", name: "Inverse Trigonometric Functions", class: "12" },
      { id: "12-math-3", name: "Matrices", class: "12" },
      { id: "12-math-4", name: "Determinants", class: "12" },
      { id: "12-math-5", name: "Continuity & Differentiability", class: "12" },
      { id: "12-math-6", name: "Applications of Derivatives", class: "12" },
      { id: "12-math-7", name: "Integrals", class: "12" },
      { id: "12-math-8", name: "Applications of Integrals", class: "12" },
      { id: "12-math-9", name: "Differential Equations", class: "12" },
      { id: "12-math-10", name: "Vector Algebra", class: "12" },
      { id: "12-math-11", name: "3D Geometry", class: "12" },
      { id: "12-math-12", name: "Linear Programming", class: "12" },
      { id: "12-math-13", name: "Probability", class: "12" },
    ],
  },
};

const mergeChapterLists = (first = [], second = []) => {
  const seen = new Set();
  return [...first, ...second].filter((chapter) => {
    const key = chapter.id || chapter.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const getCurriculumForClass = (selectedClass) => {
  if (selectedClass === "11+12") {
    const eleven = JEE_CURRICULUM["11"];
    const twelve = JEE_CURRICULUM["12"];
    return {
      physics: mergeChapterLists(eleven.physics, twelve.physics),
      mathematics: mergeChapterLists(eleven.mathematics, twelve.mathematics),
      chemistry: {
        "physical-chemistry": mergeChapterLists(
          eleven.chemistry["physical-chemistry"],
          twelve.chemistry["physical-chemistry"]
        ),
        "inorganic-chemistry": mergeChapterLists(
          eleven.chemistry["inorganic-chemistry"],
          twelve.chemistry["inorganic-chemistry"]
        ),
        "organic-chemistry": mergeChapterLists(
          eleven.chemistry["organic-chemistry"],
          twelve.chemistry["organic-chemistry"]
        ),
      },
    };
  }

  return JEE_CURRICULUM[selectedClass] || JEE_CURRICULUM["11"];
};

// ============================================
// BACKLOG CALCULATION ENGINE
// ============================================

export const calculateBacklogPlan = (backlogData) => {
  const {
    chapters = [],
    dailyStudyHours = 4,
    targetDays = 30,
  } = backlogData;

  // Validate inputs
  if (!chapters || chapters.length === 0) {
    return { error: "No chapters selected" };
  }

  if (!dailyStudyHours || dailyStudyHours <= 0) {
    return { error: "Invalid daily study hours" };
  }

  if (!targetDays || targetDays <= 0) {
    return { error: "Invalid target days" };
  }

  // Calculate total hours required
  let totalHoursRequired = 0;
  chapters.forEach((chapter) => {
    const lectureCount = chapter.pendingLectures || 0;
    const lectureDuration = (chapter.lectureDuration || 60) / 60; // convert to hours
    totalHoursRequired += lectureCount * lectureDuration;
  });

  // Check if plan is realistic
  const totalAvailableHours = dailyStudyHours * targetDays;
  const isRealistic = totalAvailableHours >= totalHoursRequired;

  if (!isRealistic) {
    const requiredDailyHours = Math.ceil((totalHoursRequired / targetDays) * 10) / 10;
    const requiredDays = Math.ceil((totalHoursRequired / dailyStudyHours) * 10) / 10;
    const dailyPlan = generateDailyPlan(chapters, dailyStudyHours, Math.ceil(requiredDays));

    return {
      error: null,
      warning: true,
      message: `Your target may be challenging. You need ${requiredDailyHours} hours/day for ${targetDays} days OR ${dailyStudyHours} hours/day for ${requiredDays} days.`,
      totalHoursRequired,
      totalAvailableHours,
      dailyPlan,
      recommendation: {
        dailyHours: requiredDailyHours,
        days: requiredDays,
      },
    };
  }

  // Generate daily plan
  const dailyPlan = generateDailyPlan(
    chapters,
    dailyStudyHours,
    targetDays
  );

  return {
    error: null,
    warning: false,
    totalHoursRequired,
    totalAvailableHours,
    dailyPlan,
    startDate: new Date(),
    targetCompletionDate: new Date(Date.now() + targetDays * 24 * 60 * 60 * 1000),
  };
};

const generateDailyPlan = (chapters, dailyHours, targetDays) => {
  const plan = [];
  const dailyMinutes = dailyHours * 60;
  let remainingLectures = [];

  // Flatten and prepare remaining lectures
  chapters.forEach((chapter) => {
    for (let i = 0; i < (chapter.pendingLectures || 0); i++) {
      remainingLectures.push({
        chapterId: chapter.id,
        chapterName: chapter.name,
        subject: chapter.subject,
        lectureDuration: chapter.lectureDuration || 60,
        lectureIndex: i + 1,
        status: "pending",
      });
    }
  });

  // Shuffle for variety
  remainingLectures = remainingLectures.sort(() => Math.random() - 0.5);

  let currentDay = 1;
  let timeRemaining = dailyMinutes;
  let lecturesToday = [];

  remainingLectures.forEach((lecture) => {
    if (timeRemaining >= lecture.lectureDuration) {
      lecturesToday.push({
        ...lecture,
        scheduledDay: currentDay,
        status: "pending",
      });
      timeRemaining -= lecture.lectureDuration;
    } else {
      // Move to next day
      if (lecturesToday.length > 0) {
        plan.push({
          day: currentDay,
          date: new Date(Date.now() + (currentDay - 1) * 24 * 60 * 60 * 1000),
          lectures: lecturesToday,
          totalMinutes: dailyMinutes - timeRemaining,
          status: "pending",
        });
      }

      currentDay++;
      timeRemaining = dailyMinutes;
      lecturesToday = [];

      if (currentDay <= targetDays && timeRemaining >= lecture.lectureDuration) {
        lecturesToday.push({
          ...lecture,
          scheduledDay: currentDay,
          status: "pending",
        });
        timeRemaining -= lecture.lectureDuration;
      }
    }
  });

  // Add last day if has lectures
  if (lecturesToday.length > 0) {
    plan.push({
      day: currentDay,
      date: new Date(Date.now() + (currentDay - 1) * 24 * 60 * 60 * 1000),
      lectures: lecturesToday,
      totalMinutes: dailyMinutes - timeRemaining,
      status: "pending",
    });
  }

  return plan;
};

// ============================================
// FIREBASE OPERATIONS
// ============================================

export const saveBacklogPlan = async (userId, backlogData) => {
  try {
    const backlogRef = doc(db, "users", userId, "backlogs", backlogData.id || "current");

    const docToSave = {
      ...backlogData,
      updatedAt: serverTimestamp(),
      createdAt: backlogData.createdAt || serverTimestamp(),
    };

    await setDoc(backlogRef, docToSave, { merge: true });
    return { success: true, message: "Backlog plan saved" };
  } catch (error) {
    console.error("Error saving backlog:", error);
    return { success: false, error: error.message };
  }
};

export const getBacklogPlan = async (userId) => {
  try {
    const backlogRef = doc(db, "users", userId, "backlogs", "current");
    const snapshot = await getDoc(backlogRef);

    if (snapshot.exists()) {
      return { success: true, data: snapshot.data() };
    }

    return { success: false, data: null };
  } catch (error) {
    console.error("Error fetching backlog:", error);
    return { success: false, error: error.message };
  }
};

export const updateBacklogProgress = async (userId, dayNumber, lectureId, status) => {
  try {
    const backlogRef = doc(db, "users", userId, "backlogs", "current");

    const updateData = {
      [`dailyPlan.${dayNumber - 1}.lectures`]: (await (async () => {
        const docSnap = await getDoc(backlogRef);
        if (docSnap.exists()) {
          const day = docSnap.data().dailyPlan?.[dayNumber - 1];
          if (day) {
            return day.lectures.map((lec) =>
              lec.id === lectureId ? { ...lec, status } : lec
            );
          }
        }
        return [];
      })()),
      updatedAt: serverTimestamp(),
    };

    await updateDoc(backlogRef, updateData);
    return { success: true };
  } catch (error) {
    console.error("Error updating progress:", error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PROGRESS TRACKING
// ============================================

export const calculateProgress = (dailyPlan) => {
  if (!dailyPlan || dailyPlan.length === 0) {
    return { completedPercent: 0, completedLectures: 0, totalLectures: 0 };
  }

  let completedLectures = 0;
  let totalLectures = 0;

  dailyPlan.forEach((day) => {
    day.lectures?.forEach((lecture) => {
      totalLectures++;
      if (lecture.status === "completed") {
        completedLectures++;
      }
    });
  });

  const completedPercent = totalLectures > 0 
    ? Math.round((completedLectures / totalLectures) * 100)
    : 0;

  return { completedPercent, completedLectures, totalLectures };
};

// ============================================
// RESCHEDULING LOGIC
// ============================================

export const recalculateAfterMissedDays = (originalPlan, missedDays, dailyStudyHours) => {
  const remainingDays = originalPlan.length - missedDays;

  if (remainingDays <= 0) {
    return {
      error: "Not enough days remaining. Please extend deadline.",
      originalPlan,
    };
  }

  // Get remaining unfinished lectures
  let remainingLectures = [];
  originalPlan.forEach((day) => {
    day.lectures?.forEach((lecture) => {
      if (lecture.status !== "completed") {
        remainingLectures.push(lecture);
      }
    });
  });

  if (remainingLectures.length === 0) {
    return { success: true, message: "All planned lectures completed!", originalPlan };
  }

  // Regenerate plan
  const newPlan = generateDailyPlan(
    remainingLectures.reduce((acc, lec) => {
      const existing = acc.find((c) => c.id === lec.chapterId);
      if (existing) {
        existing.pendingLectures++;
      } else {
        acc.push({
          id: lec.chapterId,
          name: lec.chapterName,
          subject: lec.subject,
          pendingLectures: 1,
          lectureDuration: lec.lectureDuration,
        });
      }
      return acc;
    }, []),
    dailyStudyHours,
    remainingDays
  );

  return {
    success: true,
    originalPlan,
    newPlan,
    missedDays,
    message: `Plan recalculated after ${missedDays} missed days.`,
  };
};

// ============================================
// AI INSIGHTS
// ============================================

export const generateAIInsights = (backlogData, progress) => {
  const insights = [];

  // Find the largest backlog subject
  const subjectTotals = {};
  backlogData.chapters?.forEach((ch) => {
    if (!subjectTotals[ch.subject]) {
      subjectTotals[ch.subject] = { total: 0, name: ch.subject };
    }
    subjectTotals[ch.subject].total +=
      (ch.pendingLectures || 0) * ((ch.lectureDuration || 60) / 60);
  });

  const largestSubject = Object.values(subjectTotals).sort(
    (a, b) => b.total - a.total
  )[0];

  if (largestSubject && largestSubject.total > 0) {
    insights.push(
      `Your ${largestSubject.name} backlog is the largest (${largestSubject.total.toFixed(1)} hours).`
    );
  }

  // Completion rate insight
  if (progress.completedPercent > 0) {
    insights.push(`You've completed ${progress.completedPercent}% of your backlog. Keep up the momentum!`);
  }

  // Schedule warning
  if (progress.completedPercent < 20 && backlogData.dailyPlan?.length > 0) {
    const daysPassed = Math.ceil(progress.completedLectures / 2); // rough estimate
    if (daysPassed > 0) {
      insights.push("You're slightly behind. Consider increasing daily study time by 30 minutes.");
    }
  }

  return insights;
};
