/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cell.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: yohan <yohan@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/30 21:58:10 by yohan             #+#    #+#             */
/*   Updated: 2025/11/06 19:22:09 by yohan            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
import { getRandInt } from './random_gen.js';
import { UnsupervisedNN } from './unsupervisedNetwork.js';
// Up, Down, Left, Right, None, Eat, Divide, Contract, Expand, Danger, Safe
const conflictMatrix = [
    [false, true, true, true, true, true, false, false, false, false, false], // moveUp
    [true, false, true, true, true, true, false, false, false, false, false], // moveDown
    [true, true, false, true, true, true, false, false, false, false, false], // moveLeft
    [true, true, true, false, true, true, false, false, false, false, false], // moveRight
    [true, true, true, true, false, true, false, false, false, false, false], // moveNone
    [true, true, true, true, true, false, false, false, false, false, false], // eat
    [false, false, false, false, false, false, false, false, false, false, false], // divide
    [false, false, false, false, false, false, false, false, false, false, false], // contract
    [false, false, false, false, false, false, false, false, false, false, false], // expand
    [false, false, false, false, false, false, false, false, false, false, true], // leavePheromoneDanger conflicts with leavePheromoneSafe
    [false, false, false, false, false, false, false, false, false, true, false], // leavePheromoneSafe conflicts with leavePheromoneDanger
];
const rewardsMap = {
    moveUp: { energy: -0.02, survival: 0, reproduction: 0, pheromoneUse: 0, exploration: 0.1 },
    moveDown: { energy: -0.02, survival: 0, reproduction: 0, pheromoneUse: 0, exploration: 0.1 },
    moveLeft: { energy: -0.02, survival: 0, reproduction: 0, pheromoneUse: 0, exploration: 0.1 },
    moveRight: { energy: -0.02, survival: 0, reproduction: 0, pheromoneUse: 0, exploration: 0.1 },
    moveNone: { energy: 0, survival: 0, reproduction: 0, pheromoneUse: 0, exploration: 0 },
    eat: { energy: 0.1, survival: 0.1, reproduction: 0, pheromoneUse: 0, exploration: -0.1 },
    divide: { energy: -0.3, survival: 0, reproduction: 0.5, pheromoneUse: 0, exploration: 0 },
    contract: { energy: 0, survival: 0.1, reproduction: 0, pheromoneUse: 0, exploration: 0 },
    expand: { energy: 0, survival: -0.1, reproduction: 0, pheromoneUse: 0, exploration: 0.05 },
    leavePheromoneDanger: { energy: 0, survival: 0, reproduction: 0, pheromoneUse: 0.2, exploration: 0 },
    leavePheromoneSafe: { energy: 0, survival: 0, reproduction: 0, pheromoneUse: 0.2, exploration: 0 }
};
export class Cell {
    constructor(id, x, y, map, brain = null) {
        this.energy = 10;
        this.timeToEat = 0.2; // seconds it takes to consume 0.5 feed.
        this.lastDivisionTime = 0;
        this.divisionCooldown = 20;
        // Eating state tracking
        this.eatingProgress = 0;
        this.isEating = false;
        this.eatingStartTime = 0;
        this.id = id;
        this.age = 0;
        this.position = [x, y];
        this.heatTolerance = getRandInt(1, 65) / 100;
        this.map = map;
        this.neighbourhood = this.getNeighbourhood();
        this.previousEnergy = 1;
        this.size = 1; //not yet put into works
        this.speed = 1; //not yet put into works
        if (brain !== null)
            this.brain = brain;
        else
            this.brain = new UnsupervisedNN(this);
    }
    getNeighbourhood() {
        const neighbourhood = [];
        let cx = this.position[0];
        let cy = this.position[1];
        let r = 100; //other positions around current position (will make 21 * 21)
        const minX = Math.max(0, Math.floor(cx - r));
        const maxX = Math.min(this.map.width - 1, Math.ceil(cx + r));
        const minY = Math.max(0, Math.floor(cy - r));
        const maxY = Math.min(this.map.height - 1, Math.ceil(cy + r));
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                neighbourhood.push(this.map.grid[y][x]);
            }
        }
        return neighbourhood;
    }
    ;
    // public leavePheromone(type: number) {
    //     let [x, y] = this.position;
    //     this.map.grid[y][x][2] = type;
    //     return { success: true, penalty: 0 };
    // };
    leavePheromone(type) {
        const [x, y] = this.position;
        // Get current tile information
        const heat = this.map.grid[y][x][0];
        const food = this.map.grid[y][x][1];
        // Normalize heat (0 to 1)
        const maxHeat = Math.max(...this.map.heatPoints.map(([_, __, A]) => A));
        const normalizedHeat = Math.min(1, heat / maxHeat);
        // Determine if this location is actually dangerous or safe
        const isHighHeat = normalizedHeat > this.heatTolerance + 0.15; // Significantly above tolerance
        const hasFood = food > 0.2; // Meaningful amount of food
        // Check nearby tiles for food (look ahead in all directions)
        let foodNearby = false;
        const searchRadius = 2;
        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < this.map.width && ny >= 0 && ny < this.map.height) {
                    if (this.map.grid[ny][nx][1] > 0.2) {
                        foodNearby = true;
                        break;
                    }
                }
            }
            if (foodNearby)
                break;
        }
        // Determine the "correct" pheromone for this location
        let correctPheromone;
        if (isHighHeat) {
            correctPheromone = -1; // Should be danger
        }
        else if (hasFood || foodNearby) {
            correctPheromone = 1; // Should be safe
        }
        else {
            // Neutral zone - both pheromones are acceptable but with smaller penalty
            correctPheromone = 0; // Neutral indicator
        }
        // Calculate penalty for mismatched pheromone
        let penalty = 0;
        let reason = '';
        if (correctPheromone === -1 && type === 1) {
            // Marked safe but it's dangerous (high heat)
            penalty = 0.15;
            reason = 'misleading_safe_in_danger';
        }
        else if (correctPheromone === 1 && type === -1) {
            // Marked danger but it's safe (has food or leads to food)
            penalty = 0.10;
            reason = 'misleading_danger_in_safe';
        }
        else if (correctPheromone === 0) {
            // Neutral zone - small penalty for potentially unnecessary pheromone
            penalty = 0.02;
            reason = 'pheromone_in_neutral_zone';
        }
        else {
            // Correct pheromone!
            penalty = 0;
            reason = 'accurate_pheromone';
        }
        // const ctx = this.map.context;
        // if (type === 1)
        //     ctx.fillStyle = "green";
        // else
        //     ctx.fillStyle = "orange";
        // ctx.fillRect(x, y, this.size, this.size);
        // Apply penalty
        this.energy -= penalty;
        // Place the pheromone regardless (the cell is learning)
        this.map.grid[y][x][2] = type;
        return {
            success: penalty === 0,
            penalty,
            reason,
            wasCorrect: penalty === 0 || penalty === 0.02
        };
    }
    removeCell() {
        // Ensure the cell still exists
        this.map.cellNum--;
        const temp = this.map.cellId.get(this.id);
        if (!temp)
            return;
        this.map.deadCells.set(temp.age, temp);
        const [x, y] = this.position;
        // Clear visual footprint by redrawing background tile
        this.map.redrawCellBackground(x, y);
        // Optionally reset grid state (remove any pheromone left there)
        this.map.grid[y][x][2] = 0;
        // Remove the cell from map data
        this.map.cellId.delete(this.id);
        this.map.cellNum = Math.max(0, this.map.cellNum - 1);
        if (this.map.cellNum < 3) {
            const maxAge = Math.max(...this.map.deadCells.keys());
            const oldestCell = this.map.deadCells.get(maxAge);
            const nextId = this.map.cellId.size > 0
                ? Math.max(...this.map.cellId.keys()) + 1
                : 1;
            const [x, y] = this.position;
            this.map.createCell(x, y, nextId, undefined, oldestCell);
        }
        if (this.map.deadCells.size > 1000)
            this.map.deadCells.delete(Math.min(...this.map.deadCells.keys()));
    }
    divide() {
        const minEnergyToDivide = 0.6;
        let reason = '';
        let penalty = 0;
        // Can't divide if too little energy
        if (this.energy < minEnergyToDivide) {
            reason = 'insufficient_energy';
            penalty = 0.08;
        }
        // Cooldown logic
        else if (this.age - this.lastDivisionTime < this.divisionCooldown) {
            reason = 'cooldown_active';
            penalty = 0.03;
        }
        else {
            // Find an empty spot around the parent
            const [x, y] = this.position;
            const neighbors = [
                [x + 1, y], [x - 1, y],
                [x, y + 1], [x, y - 1],
                [x + 1, y + 1], [x - 1, y - 1],
                [x + 1, y - 1], [x - 1, y + 1]
            ];
            let emptySpot = null;
            for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < this.map.width && ny >= 0 && ny < this.map.height) {
                    const occupied = Array.from(this.map.cellId.values())
                        .some(cell => cell.position[0] === nx && cell.position[1] === ny);
                    if (!occupied) {
                        emptySpot = [nx, ny];
                        break;
                    }
                }
            }
            // If no spot is found, penalize and quit
            if (!emptySpot) {
                reason = 'no_space';
                penalty = 0.04;
            }
            else {
                // Try to create the new cell — the map handles population limits internally
                const newId = Math.max(0, ...Array.from(this.map.cellId.keys())) + 1;
                const success = this.map.createCell(emptySpot[0], emptySpot[1], newId, undefined, this);
                if (!success) {
                    reason = 'population_cap_reached';
                    penalty = 0.05;
                }
                else {
                    // Successful division
                    this.energy *= 0.4;
                    this.lastDivisionTime = this.age;
                    return { success: true, penalty: 0, reason: 'divided' };
                }
            }
        }
        // Apply energy penalty if division failed
        this.energy -= penalty;
        return { success: false, penalty, reason };
        // return {succes: true }
    }
    // private move(direction: number) {
    //     const [oldX, oldY] = this.position;
    //     let [x, y] = [oldX, oldY];
    //     // Movement logic
    //     switch (direction) {
    //         case 0: y -= 1; break; // up
    //         case 1: y += 1; break; // down
    //         case 2: x -= 1; break; // left
    //         case 3: x += 1; break; // right
    //         case 4:
    //             return { success: true, penalty: 0, reward: 0, reason: 'stayed' };
    //     }
    //     let movedOutOfBounds = false;
    //     if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height)
    //         movedOutOfBounds = true;
    //     // Clamp position
    //     x = Math.max(0, Math.min(this.map.width - 1, x));
    //     y = Math.max(0, Math.min(this.map.height - 1, y));
    //     // Edge penalty — stronger near the corners
    //     const edgeDistanceX = Math.min(x, this.map.width - 1 - x);
    //     const edgeDistanceY = Math.min(y, this.map.height - 1 - y);
    //     const edgeDistance = Math.min(edgeDistanceX, edgeDistanceY);
    //     const edgePenalty = edgeDistance < 2 ? 0.03 * (2 - edgeDistance) : 0;
    //     // Heat effect
    //     const maxHeat = Math.max(...this.map.heatPoints.map(([_, __, A]) => A));
    //     const heat = this.map.grid[y][x][0];
    //     const normalizedHeat = Math.min(1, heat / maxHeat);
    //     const stress = Math.max(0, normalizedHeat - this.heatTolerance);
    //     const heatDamage = Math.pow(stress, 2.2) * 0.01;
    //     // Pheromone reward logic
    //     const pheromoneHere = this.map.grid[y][x][2] || 0;
    //     const pheromoneBefore = this.map.grid[oldY][oldX][2] || 0;
    //     // Reward if pheromone concentration improves
    //     let pheromoneDelta = pheromoneHere - pheromoneBefore;
    //     // Normalize reward magnitude
    //     const pheromoneReward = Math.tanh(pheromoneDelta * 2.5) * 0.05; 
    //     // → moves up to ±0.05 reward/penalty, depending on gradient direction
    //     // Energy cost
    //     this.energy -= heatDamage + edgePenalty;
    //     // Visual updates
    //     this.map.redrawCellBackground(oldX, oldY);
    //     this.map.drawCell(this.id, x, y);
    //     this.position = [x, y];
    //     // Eating interruption
    //     let eatInterruptPenalty = 0;
    //     if (this.isEating && (oldX !== x || oldY !== y)) {
    //         this.isEating = false;
    //         this.eatingProgress = 0;
    //         eatInterruptPenalty = 0.03;
    //         this.energy -= eatInterruptPenalty;
    //     }
    //     if (movedOutOfBounds) {
    //         const penalty = 0.02;
    //         this.energy -= penalty;
    //         return {
    //             success: false,
    //             penalty: penalty + eatInterruptPenalty + edgePenalty,
    //             reward: pheromoneReward,
    //             reason: 'out_of_bounds'
    //         };
    //     }
    //     return {
    //         success: true,
    //         penalty: eatInterruptPenalty + edgePenalty,
    //         reward: pheromoneReward,
    //         reason:
    //             movedOutOfBounds ? 'out_of_bounds' :
    //             eatInterruptPenalty > 0 ? 'interrupted_eating' :
    //             edgePenalty > 0 ? 'too_close_to_border' :
    //             pheromoneReward > 0 ? 'followed_good_pheromone' :
    //             pheromoneReward < 0 ? 'followed_bad_pheromone' :
    //             'moved'
    //     };
    // }
    move(direction) {
        const [oldX, oldY] = this.position;
        let [x, y] = [oldX, oldY];
        // Movement logic
        switch (direction) {
            case 0:
                y -= 1;
                break; // up
            case 1:
                y += 1;
                break; // down
            case 2:
                x -= 1;
                break; // left
            case 3:
                x += 1;
                break; // right
            case 4:
                return { success: true, penalty: 0, reward: 0, reason: 'stayed' };
        }
        let movedOutOfBounds = false;
        if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height) {
            movedOutOfBounds = true;
        }
        // Clamp position
        x = Math.max(0, Math.min(this.map.width - 1, x));
        y = Math.max(0, Math.min(this.map.height - 1, y));
        // Edge penalty
        const edgeDistanceX = Math.min(x, this.map.width - 1 - x);
        const edgeDistanceY = Math.min(y, this.map.height - 1 - y);
        const edgeDistance = Math.min(edgeDistanceX, edgeDistanceY);
        const edgePenalty = edgeDistance < 3 ? 0.04 * (3 - edgeDistance) : 0;
        // FIXED: Better heat damage calculation
        const maxHeat = Math.max(...this.map.heatPoints.map(([_, __, A]) => A));
        const heat = this.map.grid[y][x][0];
        const normalizedHeat = Math.min(1, heat / maxHeat);
        const stress = Math.max(0, normalizedHeat - this.heatTolerance);
        const heatDamage = Math.pow(stress, 2.2) * 0.02; // Increased damage
        // ADDED: Food gradient reward
        const oldFood = this.map.grid[oldY][oldX][1];
        const newFood = this.map.grid[y][x][1];
        const foodDelta = newFood - oldFood;
        let foodReward = 0;
        if (foodDelta > 0) {
            // Moving toward food - strong positive reward
            foodReward = Math.min(0.2, foodDelta * 5);
        }
        else if (foodDelta < 0) {
            // Moving away from food - mild negative reward
            foodReward = Math.max(-0.05, foodDelta * 2);
        }
        // Big bonus if standing on food
        if (newFood > 0.3) {
            foodReward += 0.15;
        }
        // FIXED: Better heat gradient reward
        const oldHeat = this.map.grid[oldY][oldX][0];
        const oldNormalizedHeat = Math.min(1, oldHeat / maxHeat);
        const oldStress = Math.max(0, oldNormalizedHeat - this.heatTolerance);
        const newStress = stress;
        let heatReward = 0;
        if (oldStress > 0 && newStress < oldStress) {
            // Moving away from danger - positive reward
            heatReward = (oldStress - newStress) * 0.3;
        }
        else if (newStress > oldStress) {
            // Moving into danger - negative reward
            heatReward = (oldStress - newStress) * 0.4; // Will be negative
        }
        // Pheromone reward (your existing logic is good)
        const pheromoneHere = this.map.grid[y][x][2] || 0;
        const pheromoneBefore = this.map.grid[oldY][oldX][2] || 0;
        let pheromoneDelta = pheromoneHere - pheromoneBefore;
        const pheromoneReward = Math.tanh(pheromoneDelta * 2.5) * 0.05;
        // COMBINED REWARD: Food + Heat + Pheromone
        const totalReward = foodReward + heatReward + pheromoneReward;
        // Apply energy costs
        this.energy -= heatDamage + edgePenalty;
        // Visual updates
        this.map.redrawCellBackground(oldX, oldY);
        this.map.drawCell(this.id, x, y);
        this.position = [x, y];
        // Eating interruption
        let eatInterruptPenalty = 0;
        if (this.isEating && (oldX !== x || oldY !== y)) {
            this.isEating = false;
            this.eatingProgress = 0;
            eatInterruptPenalty = 0.05; // Increased penalty
            this.energy -= eatInterruptPenalty;
        }
        if (movedOutOfBounds) {
            const penalty = 0.05;
            this.energy -= penalty;
            return {
                success: false,
                penalty: penalty + eatInterruptPenalty + edgePenalty,
                reward: totalReward,
                reason: 'out_of_bounds'
            };
        }
        // Determine reason for logging
        let reason = 'moved';
        if (eatInterruptPenalty > 0)
            reason = 'interrupted_eating';
        else if (edgePenalty > 0)
            reason = 'too_close_to_border';
        else if (foodReward > 0.1)
            reason = 'moving_toward_food';
        else if (heatReward > 0.1)
            reason = 'escaping_heat';
        else if (heatReward < -0.1)
            reason = 'entering_danger';
        else if (pheromoneReward > 0)
            reason = 'followed_good_pheromone';
        else if (pheromoneReward < 0)
            reason = 'followed_bad_pheromone';
        return {
            success: true,
            penalty: eatInterruptPenalty + edgePenalty,
            reward: totalReward,
            reason: reason
        };
    }
    eat() {
        const [x, y] = this.position;
        const currentFood = this.map.grid[y][x][1]; // Food is at index 1
        // Check if there's food at current position
        if (currentFood <= 0) {
            const penalty = 0.05;
            this.energy -= penalty;
            this.isEating = false;
            this.eatingProgress = 0;
            return { success: false, penalty, reason: 'no_food' };
        }
        if (!this.isEating) {
            // Start eating
            this.isEating = true;
            this.eatingProgress = 0;
            this.eatingStartTime = this.age;
            return { success: true, penalty: 0, reason: 'started_eating' };
        }
        // Continue eating
        this.eatingProgress += 1; // Increment by frame
        // Calculate ticks needed based on timeToEat and size
        // Larger cells eat faster, smaller cells eat slower
        const sizeModifier = this.size / 5; // size ranges 1-10, so this gives 0.2 to 2.0
        const effectiveTimeToEat = this.timeToEat / sizeModifier;
        const ticksNeeded = effectiveTimeToEat * 60; // Assuming 60 ticks per second
        if (this.eatingProgress >= ticksNeeded) {
            // Finished eating
            const foodConsumed = Math.min(0.5, currentFood);
            this.map.grid[y][x][1] -= foodConsumed;
            this.energy = Math.min(1, this.energy + foodConsumed);
            // Reset eating state
            this.isEating = false;
            this.eatingProgress = 0;
            return { success: true, penalty: 0, reason: 'completed_eating', energyGained: foodConsumed };
        }
        return { success: true, penalty: 0, reason: 'eating_in_progress' };
    }
    contract() {
        let penalty = 0;
        let failureReasons = [];
        let success = true;
        if (this.size <= 1) {
            penalty += 0.03;
            failureReasons.push('min_size');
            success = false;
        }
        else {
            this.size -= 1;
        }
        if (this.speed >= 10) {
            penalty += 0.03;
            failureReasons.push('max_speed');
            success = false;
        }
        else {
            this.speed += 1;
        }
        if (this.size > 1 && this.speed < 10) {
            this.heatTolerance = Math.min(1, this.heatTolerance + 0.02);
        }
        if (penalty > 0) {
            this.energy -= penalty;
        }
        return {
            success,
            penalty,
            reason: failureReasons.length > 0 ? failureReasons.join('_and_') : 'contracted'
        };
        // return { success: false, penalty: 0, reason: 'contract_not_implemented' };
    }
    expand() {
        let penalty = 0;
        let failureReasons = [];
        let success = true;
        if (this.size >= 10) {
            penalty += 0.03;
            failureReasons.push('max_size');
            success = false;
        }
        else {
            this.size += 1;
        }
        if (this.speed <= 1) {
            penalty += 0.03;
            failureReasons.push('min_speed');
            success = false;
        }
        else {
            this.speed -= 1;
        }
        if (this.size < 10 && this.speed > 1) {
            this.heatTolerance = Math.max(0, this.heatTolerance - 0.02);
        }
        if (penalty > 0) {
            this.energy -= penalty;
        }
        return {
            success,
            penalty,
            reason: failureReasons.length > 0 ? failureReasons.join('_and_') : 'expanded'
        };
        // return { success: false, penalty: 0, reason: 'contract_not_implemented' };
    }
    computeLossMSE(predictedValues, reward) {
        const target = [
            reward.energy,
            reward.survival,
            reward.reproduction,
            reward.pheromoneUse,
            reward.exploration
        ];
        let loss = 0;
        for (let i = 0; i < target.length; i++) {
            const diff = predictedValues[i] - target[i];
            loss += diff * diff;
        }
        return loss / target.length;
    }
    computeReward(chosenActions, actionResults) {
        const reward = {
            energy: 0,
            survival: 0,
            reproduction: 0,
            pheromoneUse: 0,
            exploration: 0
        };
        // Base rewards from chosen actions
        const actionNames = Object.keys(rewardsMap);
        for (let idx = 0; idx < chosenActions.length; idx++) {
            const i = chosenActions[idx];
            const actionName = actionNames[i];
            const actionReward = rewardsMap[actionName];
            const result = actionResults[idx];
            // Apply base rewards only if action succeeded
            if (result.success) {
                for (const key in actionReward) {
                    reward[key] += actionReward[key];
                }
            }
            // Apply penalties for failed actions
            if (!result.success) {
                reward.energy -= result.penalty * 2; // Double penalty in reward calculation
                reward.survival -= result.penalty;
            }
            // Bonus for successful eating completion
            if (actionName === 'eat' && result.reason === 'completed_eating') {
                reward.energy += 0.3;
                reward.survival += 0.1;
            }
            // Small bonus for maintaining eating focus
            if (actionName === 'eat' && result.reason === 'eating_in_progress') {
                reward.survival += 0.02;
            }
        }
        // --- Energy-based dynamic reward ---
        const energyChange = this.energy - this.previousEnergy;
        if (energyChange > 0)
            reward.energy += energyChange * 10;
        else if (energyChange < 0)
            reward.energy += energyChange * 5;
        // --- Survival ---
        if (this.energy <= 0.1)
            reward.survival -= 2;
        else if (this.energy >= 0.8)
            reward.survival += 0.5;
        // --- Exploration ---
        const currentHeat = this.map.grid[this.position[1]][this.position[0]][0];
        const normalizedHeat = Math.min(1, currentHeat / Math.max(...this.map.heatPoints.map(([_, __, A]) => A)));
        const heatDelta = Math.abs(normalizedHeat - this.heatTolerance);
        reward.exploration += heatDelta * 0.1;
        return reward;
    }
    MSEgradient(input, output) {
        const grad = [];
        const len = input.length;
        for (let i = 0; i < len; i++)
            grad[i] = 2 * (output[i] - input[i]) / len;
        return grad;
    }
    decideAndAct() {
        if (this.energy <= 0)
            this.removeCell();
        this.age++;
        const functionList = [
            () => this.move(0),
            () => this.move(1),
            () => this.move(2),
            () => this.move(3),
            () => this.move(4),
            () => this.eat(),
            () => this.divide(),
            () => this.contract(),
            () => this.expand(),
            () => this.leavePheromone(-1),
            () => this.leavePheromone(1),
        ];
        this.previousEnergy = this.energy;
        let actionProbabilities = this.brain.think();
        // DEFENSIVE CHECK: Validate probabilities
        if (!actionProbabilities || actionProbabilities.length !== 11) {
            console.error(`Cell ${this.id}: Invalid action probabilities`, actionProbabilities);
            actionProbabilities = new Array(11).fill(1 / 11); // Default uniform distribution
        }
        // DEFENSIVE CHECK: Clean NaN and Infinity
        actionProbabilities = actionProbabilities.map((p, idx) => {
            if (!isFinite(p) || isNaN(p)) {
                console.warn(`Cell ${this.id}: Invalid probability at index ${idx}: ${p}`);
                return 0.1; // Default small probability
            }
            return Math.max(0, Math.min(1, p)); // Clamp to [0, 1]
        });
        const threshold = 0.6;
        const candidates = actionProbabilities
            .map((val, idx) => ({ idx, val }))
            .filter(a => a.val >= threshold);
        const chosenActions = [];
        for (const a of candidates.sort((a, b) => b.val - a.val)) {
            if (chosenActions.every(chosen => !conflictMatrix[a.idx][chosen]))
                chosenActions.push(a.idx);
        }
        // If no actions passed threshold, pick the best one
        if (chosenActions.length === 0) {
            const bestIdx = actionProbabilities.indexOf(Math.max(...actionProbabilities));
            chosenActions.push(bestIdx);
        }
        // DEFENSIVE CHECK: Validate indices before execution
        const actionResults = [];
        for (const i of chosenActions) {
            if (i < 0 || i >= functionList.length || typeof functionList[i] !== 'function') {
                console.error(`Cell ${this.id}: Invalid action index ${i}`);
                continue;
            }
            const result = functionList[i]();
            actionResults.push(result);
        }
        // const threshold = 0.6;
        // const candidates = actionProbabilities
        //     .map((val, idx) => ({ idx, val }))
        //     .filter(a => a.val >= threshold);
        // const chosenActions: number[] = [];
        // for (const a of candidates.sort((a, b) => b.val - a.val)) {
        //     if (chosenActions.every(chosen => !conflictMatrix[a.idx][chosen]))
        //         chosenActions.push(a.idx);
        // }
        // // If no actions passed threshold, pick the best one
        // if (chosenActions.length === 0) {
        //     const bestIdx = actionProbabilities.indexOf(Math.max(...actionProbabilities));
        //     chosenActions.push(bestIdx);
        // }
        // // Execute chosen actions and collect results
        // const actionResults: any[] = [];
        // for (const i of chosenActions) {
        //     const result = functionList[i]();
        //     actionResults.push(result);
        // }
        // Base metabolic decay
        const baseMetabolicCost = 0.01;
        const sizeCost = this.size * 0.001;
        this.energy -= (baseMetabolicCost + sizeCost);
        // Additional cost while eating (concentration)
        if (this.isEating) {
            this.energy -= 0.001;
        }
        // console.log("energy level: ", this.energy);
        // Compute reward feedback with action results
        const reward = this.computeReward(chosenActions, actionResults);
        const totalReward = (reward.energy * 0.6 +
            reward.survival * 0.3 +
            reward.reproduction * 0.05 +
            reward.exploration * 0.1);
        // Reward-modulated learning target
        const targetProbabilities = actionProbabilities.map((prob, idx) => {
            if (chosenActions.includes(idx)) {
                // Actions that were chosen
                const actionIdx = chosenActions.indexOf(idx);
                const result = actionResults[actionIdx];
                if (result.success) {
                    // Successful action - reinforce
                    return Math.min(1, prob + totalReward * 0.1);
                }
                else {
                    // Failed action - punish strongly
                    return Math.max(0, prob - Math.abs(totalReward) * 0.2);
                }
            }
            else {
                // Actions that were not chosen
                return Math.max(0, prob * 0.95); // Slight decay
            }
        });
        const MSEgradient = this.MSEgradient(actionProbabilities, targetProbabilities);
        const loss = this.computeLossMSE(actionProbabilities, reward);
        this.brain.policyNetwork.backPropagate(loss, MSEgradient);
        // Ensure the action probabilities match the function list length
    }
}
// when pheromone is caught and helps a cell, send rewards (negative or positive) to cell who put down pheromone by cell_id;
