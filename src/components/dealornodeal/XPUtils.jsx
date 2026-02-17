// XP and Level calculation utilities

export const XP_LEVELS = [
    { level: 0, name: "New God Born", xpRequired: 0 },
    { level: 1, name: "Aphrodite", xpRequired: 10001 },
    { level: 2, name: "Dionysus", xpRequired: 20001 },
    { level: 3, name: "Artemis", xpRequired: 30001 },
    { level: 4, name: "Hermes", xpRequired: 50001 },
    { level: 5, name: "Demetra", xpRequired: 70001 },
    { level: 6, name: "Apollon", xpRequired: 101001 },
    { level: 7, name: "Ares", xpRequired: 151001 },
    { level: 8, name: "Hephaestus", xpRequired: 201001 },
    { level: 9, name: "Poseidon", xpRequired: 301001 },
    { level: 10, name: "Athena", xpRequired: 501001 },
    { level: 11, name: "Hera", xpRequired: 751001 },
    { level: 12, name: "Zeus", xpRequired: 1000001 },
    { level: 13, name: "Zeus Complete", xpRequired: 2000001 }
];

export function calculateXP(winnings, bankersRefused, isContinuingAfterLevel9 = false) {
    let xp = 0;
    
    // XP based on winnings
    if (winnings >= 0.01 && winnings <= 50000) {
        xp = 100;
    } else if (winnings >= 50001 && winnings <= 100000) {
        xp = 300;
    } else if (winnings >= 100001 && winnings <= 300000) {
        xp = 500;
    } else if (winnings >= 301000 && winnings <= 500000) {
        xp = 1000;
    } else if (winnings >= 501000 && winnings <= 750000) {
        xp = 2000;
    } else if (winnings >= 750001) {
        xp = 5000;
    }
    
    // Risk bonus: 100 XP per banker offer refused (reduced to 25 XP if continuing after Level 9)
    const xpPerRefusal = isContinuingAfterLevel9 ? 25 : 100;
    xp += bankersRefused * xpPerRefusal;
    
    return xp;
}

export function getLevelFromXP(totalXP) {
    for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
        if (totalXP >= XP_LEVELS[i].xpRequired) {
            return XP_LEVELS[i];
        }
    }
    return XP_LEVELS[0];
}

// Get the COMPLETED level (the highest level you've earned a trophy for)
export function getCompletedLevelFromXP(totalXP) {
    // A level is COMPLETED when you reach the NEXT level's XP requirement
    // For example: you complete level 0 when you reach 10,001 XP (level 1's start)
    for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
        if (i === XP_LEVELS.length - 1) {
            // Max level (12) is completed when you reach it
            if (totalXP >= XP_LEVELS[i].xpRequired) {
                return XP_LEVELS[i];
            }
        } else {
            // Level N is completed when you reach level N+1's requirement
            if (totalXP >= XP_LEVELS[i + 1].xpRequired) {
                return XP_LEVELS[i];
            }
        }
    }
    return XP_LEVELS[0]; // If under 10,001 XP, still on level 0 (not completed level 1 yet)
}

// Get array of level numbers you've COMPLETED (earned trophies for)
export function getCompletedLevelNumbers(totalXP) {
    const completed = [];
    
    // You complete a level when you reach the NEXT level's start XP
    for (let i = 0; i < XP_LEVELS.length - 1; i++) {
        if (totalXP >= XP_LEVELS[i + 1].xpRequired) {
            completed.push(i);
        }
    }
    
    // Special case: max level (12) is completed when you reach its requirement
    if (totalXP >= XP_LEVELS[XP_LEVELS.length - 1].xpRequired) {
        completed.push(XP_LEVELS.length - 1);
    }
    
    return completed;
}

export function getNextLevel(currentLevel) {
    if (!currentLevel || currentLevel.level >= 13) return null;
    return XP_LEVELS[currentLevel.level + 1];
}

export function getXPProgress(totalXP) {
    const currentLevel = getLevelFromXP(totalXP);
    const nextLevel = getNextLevel(currentLevel);
    
    if (!nextLevel) {
        // Max level reached
        return {
            current: currentLevel,
            next: { level: 13, name: "1 BTC Reward", xpRequired: 5000001 },
            progress: Math.min((totalXP / 5000001) * 100, 100),
            xpToNext: Math.max(5000001 - totalXP, 0)
        };
    }
    
    const xpInCurrentLevel = totalXP - currentLevel.xpRequired;
    const xpNeededForNext = nextLevel.xpRequired - currentLevel.xpRequired;
    const progress = (xpInCurrentLevel / xpNeededForNext) * 100;
    
    return {
        current: currentLevel,
        next: nextLevel,
        progress: Math.min(progress, 100),
        xpToNext: nextLevel.xpRequired - totalXP
    };
}