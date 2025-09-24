// calculator.js
const weights = {
    possession: 0.1,
    shots_on_target: 1.2,
    dangerous_attacks: 0.4,
    attacks: 0.2,
    corners: 0.2,
    time_pressure: 0.05,
    interaction_shot_danger: 0.05
};

const scaler = {
    mean: [52.4, 3.2, 12.1, 28.6, 4.1],
    std: [12.7, 2.1, 8.3, 10.4, 2.8]
};

function parseStats(stats) {
    const [shotsOnTargetA, shotsOnTargetB] = stats["Удары в створ"]?.split("-")?.map(Number) || [0, 0];
    const [possessionA, possessionB] = stats["Владение мячом"]?.split("%-")?.map(s => Number(s.replace('%', ''))) || [0, 0];
    const [cornersA, cornersB] = stats["Угловые"]?.split("-")?.map(Number) || [0, 0];
    const [dangerousAttacksA, dangerousAttacksB] = stats["Dangerous Attacks"]?.split("-")?.map(Number) || [0, 0];
    const [attacksA, attacksB] = stats["Атака"]?.split("-")?.map(Number) || [0, 0];
    const minute = parseInt(stats["Время"]) || 0;

    return {
        teamA: { 
            shots_on_target: shotsOnTargetA || 0,
            possession: possessionA || 0, 
            corners: cornersA || 0, 
            dangerous_attacks: dangerousAttacksA || 0,
            attacks: attacksA || 0 
        },
        teamB: { 
            shots_on_target: shotsOnTargetB || 0,
            possession: possessionB || 0, 
            corners: cornersB || 0, 
            dangerous_attacks: dangerousAttacksB || 0,
            attacks: attacksB || 0 
        },
        minute
    };
}

function calculateGoalProbability(stats) {
    const { teamA, teamB, minute } = parseStats(stats);

    const calculateSingleTeam = (teamStats, currentMinute) => {
        if (currentMinute > 45) return 0;

        const features = [
            teamStats.possession || 0,
            teamStats.shots_on_target || 0,
            teamStats.dangerous_attacks || 0,
            teamStats.attacks || 0,
            teamStats.corners || 0
        ];
        
        const scaledFeatures = features.map((val, idx) => 
            (val - scaler.mean[idx]) / scaler.std[idx]
        );

        const timePressure = Math.max(0, currentMinute - 30) * weights.time_pressure;
        const interaction = scaledFeatures[1] * scaledFeatures[2] * weights.interaction_shot_danger;

        const linearCombination = 
            weights.possession * scaledFeatures[0] +
            weights.shots_on_target * scaledFeatures[1] +
            weights.dangerous_attacks * scaledFeatures[2] +
            weights.attacks * scaledFeatures[3] +
            weights.corners * scaledFeatures[4] +
            timePressure +
            interaction;

        const probability = 1 / (1 + Math.exp(-linearCombination));
        return Math.round(probability * 10000) / 100;
    };

    const probA = calculateSingleTeam(teamA, minute);
    const probB = calculateSingleTeam(teamB, minute);

    return {
        probA: probA,
        probB: probB
    };
}

module.exports = { weights, parseStats, calculateGoalProbability };