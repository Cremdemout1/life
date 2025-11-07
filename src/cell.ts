/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cell.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: yohan <yohan@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/30 21:58:10 by yohan             #+#    #+#             */
/*   Updated: 2025/11/07 13:52:29 by yohan            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { getRandInt, createWeightMatrix, createBias } from './random_gen.js'
import { mapClass } from './map.js';
import { UnsupervisedNN } from './unsupervisedNetwork.js';

interface rewardVector {
    energy: number;
    survival: number;
    reproduction: number;
    pheromoneUse: number;
    exploration: number;
}

// Up, Down, Left, Right, None, Eat, Divide, Contract, Expand, Danger, Safe
// const conflictMatrix = [
//     [false, true,  true,  true,  true,  true,  false, false, false, false, false], // moveUp
//     [true,  false, true,  true,  true,  true,  false, false, false, false, false], // moveDown
//     [true,  true,  false, true,  true,  true,  false, false, false, false, false], // moveLeft
//     [true,  true,  true,  false, true,  true,  false, false, false, false, false], // moveRight
//     [true,  true,  true,  true,  false, true,  false, false, false, false, false], // moveNone
//     [true,  true,  true,  true,  true,  false, false, false, false, false, false], // eat
//     [false, false, false, false, false, false, false, false, false, false, false], // divide
//     [false, false, false, false, false, false, false, false, false, false, false], // contract
//     [false, false, false, false, false, false, false, false, false, false, false], // expand
//     [false, false, false, false, false, false, false, false, false, false, true ],  // leavePheromoneDanger conflicts with leavePheromoneSafe
//     [false, false, false, false, false, false, false, false, false, true,  false], // leavePheromoneSafe conflicts with leavePheromoneDanger
// ];

const conflictMatrix = [ // eating and moving not mutually exclusive
    [false, true,  true,  true,  false, false, false, false, false, false, false], // moveUp
    [true,  false, true,  true,  false, false, false, false, false, false, false], // moveDown
    [true,  true,  false, true,  false, false, false, false, false, false, false], // moveLeft
    [true,  true,  true,  false, false, false, false, false, false, false, false], // moveRight
    [false, false, false, false, false, false, false, false, false, false, false], // moveNone
    [false, false, false, false, false, false, false, false, false, false, false], // eat — no longer blocks movement
    [false, false, false, false, false, false, false, false, false, false, false], // divide
    [false, false, false, false, false, false, false, false, false, false, false], // contract
    [false, false, false, false, false, false, false, false, false, false, false], // expand
    [false, false, false, false, false, false, false, false, false, false, true ], // leavePheromoneDanger conflicts with leavePheromoneSafe
    [false, false, false, false, false, false, false, false, false, true,  false], // leavePheromoneSafe conflicts with leavePheromoneDanger
];


interface RewardVector {
    energy: number;       // +ve for eating, -ve for moving
    survival: number;     // +ve for staying in safe zones, -ve for heat damage
    reproduction: number; // +ve for divide
    pheromoneUse: number;  // +ve for leaving helpful pheromones
    exploration: number;   // +ve for discovering new cells
}

const rewardsMap: Record<string, RewardVector> = {
    moveUp:       { energy: -0.02, survival: 0, reproduction: 0, pheromoneUse: 0, exploration: 0.1 },
    moveDown:     { energy: -0.02, survival: 0, reproduction: 0, pheromoneUse: 0, exploration: 0.1 },
    moveLeft:     { energy: -0.02, survival: 0, reproduction: 0, pheromoneUse: 0, exploration: 0.1 },
    moveRight:    { energy: -0.02, survival: 0, reproduction: 0, pheromoneUse: 0, exploration: 0.1 },
    moveNone:     { energy: 0, survival: 0, reproduction: 0, pheromoneUse: 0, exploration: 0 },
    eat:          { energy: 0.1, survival: 0.1, reproduction: 0, pheromoneUse: 0, exploration: -0.1 },
    divide:       { energy: -0.3, survival: 0, reproduction: 0.5, pheromoneUse: 0, exploration: 0 },
    contract:     { energy: 0, survival: 0.1, reproduction: 0, pheromoneUse: 0, exploration: 0 },
    expand:       { energy: 0, survival: -0.1, reproduction: 0, pheromoneUse: 0, exploration: 0.05 },
    leavePheromoneDanger: { energy: 0, survival: 0, reproduction: 0, pheromoneUse: 0.2, exploration: 0 },
    leavePheromoneSafe:   { energy: 0, survival: 0, reproduction: 0, pheromoneUse: 0.2, exploration: 0 }
};  

export class Cell {
    energy:         number = 1;
    id:             number;
    age:            number;
    heatTolerance:  number; //will be between 0 and 1 for efficiency
    map:            mapClass;
    size:           number;
    speed:          number;
    
    position: [number, number];
    neighbourhood: Array<[number, number, number]>; //get radius around cell

    brain: UnsupervisedNN;

    previousEnergy: number;
    lastDivisionTime: number = 0;
    divisionCooldown: number = 100;
    divisionAttempts: number = 0;
    
    constructor(id: number, x: number, y: number, map: mapClass, brain: UnsupervisedNN | null = null) {
        this.id = id;
        this.age = 0;
        this.position = [x, y];
        this.heatTolerance = getRandInt(1, 65) / 100;
        this.map = map;
        this.neighbourhood = this.getNeighbourhood();
        this.previousEnergy = 1;
        this.size = 1;  //not yet put into works
        this.speed = 1; //not yet put into works
        if (brain !== null)
            this.brain = brain;
        else
            this.brain = new UnsupervisedNN(this);
    }

    private getNeighbourhood(): Array<[number, number, number]> {
        const neighbourhood: Array<[number, number, number]> = [];
        let cx = this.position[0];
        let cy = this.position[1];
        let r = 20; //other positions around current position (will make 21 * 21)
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
    };

    // public leavePheromone(type: number) {
    //     let [x, y] = this.position;
    //     this.map.grid[y][x][2] = type;
    //     return { success: true, penalty: 0 };
    // };
    public leavePheromone(type: number) {
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
            if (foodNearby) break;
        }
        
        // Determine the "correct" pheromone for this location
        let correctPheromone: number;
        if (isHighHeat) {
            correctPheromone = -1; // Should be danger
        } else if (hasFood || foodNearby) {
            correctPheromone = 1; // Should be safe
        } else {
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
        } else if (correctPheromone === 1 && type === -1) {
            // Marked danger but it's safe (has food or leads to food)
            penalty = 0.10;
            reason = 'misleading_danger_in_safe';
        } else if (correctPheromone === 0) {
            // Neutral zone - small penalty for potentially unnecessary pheromone
            penalty = 0.02;
            reason = 'pheromone_in_neutral_zone';
        } else {
            // Correct pheromone!
            penalty = 0;
            reason = 'accurate_pheromone';
        }
        const ctx = this.map.context;
        if (type === 1)
            ctx.fillStyle = "green";
        else
            ctx.fillStyle = "orange";
        ctx.fillRect(x, y, this.size, this.size);
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

    private removeCell() {
        // Ensure the cell still exists
        this.map.cellNum--;
        const temp: Cell | undefined = this.map.cellId.get(this.id);
        if (!temp) return;
        this.map.deadCells.set(temp.age, temp);
        const [x, y] = this.position;
        // Clear visual footprint by redrawing background tile
        this.map.redrawCellBackground(x, y, this.size);
    
        // Optionally reset grid state (remove any pheromone left there)
        this.map.grid[y][x][2] = 0;
        
        // Remove the cell from map data
        this.map.cellId.delete(this.id);
        this.map.cellNum = this.map.cellId.size;
    
        if (this.map.cellNum < 10) {
            const maxAge = Math.max(...this.map.deadCells.keys());
            const oldestCell = this.map.deadCells.get(maxAge);
            const nextId = this.map.cellId.size > 0 
            ? Math.max(...this.map.cellId.keys()) + 1 
            : 1;
            const [x, y] = this.position;
            this.map.createCell(x, y, nextId, undefined, oldestCell);
        }
        if (this.map.deadCells.size > 100)
            this.map.deadCells.delete(Math.min(...this.map.deadCells.keys()));        
    }
    
    private divide() {
        
        const minEnergyToDivide = 5;
        let reason = '';
        let penalty = 0;
    
        if (this.map.cellNum > 50) {
            reason = 'too_many_cells';
            penalty = 0.2;
        }
        // Can't divide if too little energy
        else if (this.energy < minEnergyToDivide) {
            reason = 'insufficient_energy';
            penalty = 0.15;
        }
        // Cooldown logic
        else if (this.age - this.lastDivisionTime < this.divisionCooldown) {
            reason = 'cooldown_active';
            penalty = 0.1;
            this.divisionAttempts++;
            if (this.divisionAttempts > 3) {
                penalty = 0.2 * this.divisionAttempts;
            }
        }
        else {
            // Find an empty spot around the parent
            this.divisionAttempts = 0;
            const [x, y] = this.position;
            const neighbors: [number, number][] = [
                [x + 1, y], [x - 1, y],
                [x, y + 1], [x, y - 1],
                [x + 1, y + 1], [x - 1, y - 1],
                [x + 1, y - 1], [x - 1, y + 1]
            ];
    
            let emptySpot: [number, number] | null = null;
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
                penalty = 0.08;
            } else {
                // Try to create the new cell — the map handles population limits internally
                const newId = Math.max(0, ...Array.from(this.map.cellId.keys())) + 1;
                const success = this.map.createCell(emptySpot[0], emptySpot[1], newId, undefined, this);
    
                if (!success) {
                    reason = 'population_cap_reached';
                    penalty = 0.1;
                } else {
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
    
    private eat() {
        const [x, y] = this.position;
        const currentFood = this.map.grid[y][x][1];
        
        // No food at current position
        if (currentFood <= 0) {
            const penalty = 0.05;
            this.energy -= penalty;
            return { success: false, penalty, reason: 'no_food' };
        }
        
        // Immediate eating with size-based consumption
        const sizeModifier = this.size / 5; // Larger cells eat more
        const foodConsumed = Math.min(0.5 * sizeModifier, currentFood);
        
        this.map.grid[y][x][1] -= foodConsumed;
        this.energy = Math.min(1, this.energy + foodConsumed);
        
        return { 
            success: true, 
            penalty: 0, 
            reason: 'ate', 
            energyGained: foodConsumed 
        };
    }
    
    private move(direction: number) {
        const [oldX, oldY] = this.position;
        let [x, y] = [oldX, oldY];
        
        // Movement logic
        switch (direction) {
            case 0: y -= 1; break; // up
            case 1: y += 1; break; // down
            case 2: x -= 1; break; // left
            case 3: x += 1; break; // right
            case 4:
                return { success: true, penalty: 0.001, reward: 0, reason: 'stayed' };
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
        const edgePenalty = edgeDistance < 3 ? 0.1 * (3 - edgeDistance) : 0;
    
        // Heat damage calculation
        const maxHeat = Math.max(...this.map.heatPoints.map(([_, __, A]) => A));
        const heat = this.map.grid[y][x][0];
        const normalizedHeat = Math.min(1, heat / maxHeat);
        const stress = Math.max(0, normalizedHeat - this.heatTolerance);
        const heatDamage = Math.pow(stress, 2.2) * 0.02;
    
        // Food gradient reward
        const oldFood = this.map.grid[oldY][oldX][1];
        const newFood = this.map.grid[y][x][1];
        const foodDelta = newFood - oldFood;
        let foodReward = 0;
        
        if (foodDelta > 0) {
            foodReward = Math.min(0.4, foodDelta * 5);
        } else if (foodDelta < 0) {
            foodReward = Math.max(-0.05, foodDelta * 2);
        }
        
        if (newFood > 0.3) {
            foodReward += 0.15;
        }
    
        // Heat gradient reward
        const oldHeat = this.map.grid[oldY][oldX][0];
        const oldNormalizedHeat = Math.min(1, oldHeat / maxHeat);
        const oldStress = Math.max(0, oldNormalizedHeat - this.heatTolerance);
        const newStress = stress;
        
        let heatReward = 0;
        if (oldStress > 0 && newStress < oldStress) {
            heatReward = (oldStress - newStress) * 0.3;
        } else if (newStress > oldStress) {
            heatReward = (oldStress - newStress) * 0.4;
        }
    
        // Pheromone reward
        const pheromoneHere = this.map.grid[y][x][2] || 0;
        const pheromoneBefore = this.map.grid[oldY][oldX][2] || 0;
        const pheromoneDelta = pheromoneHere - pheromoneBefore;
        const pheromoneReward = Math.tanh(pheromoneDelta * 2.5) * 0.05;
    
        // Combined reward
        const totalReward = foodReward + heatReward + pheromoneReward;
    
        // Apply energy costs
        this.energy -= heatDamage + edgePenalty;
    
        // Visual updates
        this.map.redrawCellBackground(oldX, oldY, this.size);
        this.map.drawCell(this.id, x, y);
        this.position = [x, y];
    
        if (movedOutOfBounds) {
            const penalty = 0.05;
            this.energy -= penalty;
            return {
                success: false,
                penalty: penalty + edgePenalty,
                reward: totalReward,
                reason: 'out_of_bounds'
            };
        }
    
        // Determine reason
        let reason = 'moved';
        if (edgePenalty > 0) reason = 'too_close_to_border';
        else if (foodReward > 0.1) reason = 'moving_toward_food';
        else if (heatReward > 0.1) reason = 'escaping_heat';
        else if (heatReward < -0.1) reason = 'entering_danger';
        else if (pheromoneReward > 0) reason = 'followed_good_pheromone';
        else if (pheromoneReward < 0) reason = 'followed_bad_pheromone';
    
        return {
            success: true,
            penalty: edgePenalty,
            reward: totalReward,
            reason: reason
        };
    }

    private contract() {
        let penalty = 0;
        let failureReasons: string[] = [];
        let success = true;
        
        if (this.size <= 1) {
            penalty += 0.03;
            failureReasons.push('min_size');
            success = false;
        } else {
            this.size -= 1;
        }
        
        if (this.speed >= 10) {
            penalty += 0.03;
            failureReasons.push('max_speed');
            success = false;
        } else {
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

    private expand() {
        let penalty = 0;
        let failureReasons: string[] = [];
        let success = true;
        
        if (this.size >= 10) {
            penalty += 0.03;
            failureReasons.push('max_size');
            success = false;
        } else {
            this.size += 1;
        }
        
        if (this.speed <= 1) {
            penalty += 0.03;
            failureReasons.push('min_speed');
            success = false;
        } else {
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

    private computeLossMSE(predictedValues: number[], reward: RewardVector): number {
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

    private computeReward(chosenActions: number[], actionResults: any[]): rewardVector {
        const reward: rewardVector = {
            energy: 0,
            survival: 0,
            reproduction: 0,
            pheromoneUse: 0,
            exploration: 0
        };
    
        const actionNames = Object.keys(rewardsMap);
        for (let idx = 0; idx < chosenActions.length; idx++) {
            const i = chosenActions[idx];
            const actionName = actionNames[i];
            const actionReward = rewardsMap[actionName];
            const result = actionResults[idx];
            
            if (result.success) {
                for (const key in actionReward) {
                    reward[key as keyof rewardVector] += actionReward[key as keyof rewardVector];
                }
                
                // Bonus for successful eating
                if (actionName === 'eat' && result.energyGained) {
                    reward.energy += result.energyGained * 3; // Amplify eating reward
                    reward.survival += 0.3;
                }

                if (actionName === 'divide') {
                    reward.reproduction = 0.2;
                }
            }
            
            if (!result.success) {
                reward.energy -= result.penalty * 3;
                reward.survival -= result.penalty * 2;
            }
        }
        const energyChange = this.energy - this.previousEnergy;
        if (energyChange > 0)
            reward.energy += energyChange * 20; // Increased from 10
        else if (energyChange < 0)
            reward.energy += energyChange * 10; // Increased from 5
    
        // STRONGER survival signals
        if (this.energy <= 0.1)
            reward.survival -= 5; // Increased from 2
        else if (this.energy >= 0.8)
            reward.survival += 1; // Increased from 0.5
    
        // Heat avoidance reward
        const currentHeat = this.map.grid[this.position[1]][this.position[0]][0];
        const normalizedHeat = Math.min(1, currentHeat / Math.max(...this.map.heatPoints.map(([_, __, A]) => A)));
        
        if (normalizedHeat > this.heatTolerance) {
            // Punish being in dangerous heat
            reward.survival -= (normalizedHeat - this.heatTolerance) * 5;
        } else {
            // Reward being in safe zones
            reward.survival += 0.1;
        }
    
        const heatDelta = Math.abs(normalizedHeat - this.heatTolerance);
        reward.exploration += heatDelta * 0.1;
    
        return reward;
    }

    private MSEgradient(input: number[], output: number[]): number[] {
        const grad: number[] = [];
        const len = input.length;
        for (let i = 0; i < len; i++)
            grad[i] = 2 * (output[i] - input[i]) / len;
        return grad;
    }

    public decideAndAct() {
        if (this.energy <= 0) {
            this.removeCell();
            return;
        }
        
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

        if (!actionProbabilities || actionProbabilities.length !== 11) {
            console.error(`Cell ${this.id}: Invalid action probabilities`);
            actionProbabilities = new Array(11).fill(1/11);
        }
        
        actionProbabilities = actionProbabilities.map((p, idx) => {
            if (!isFinite(p) || isNaN(p)) {
                return 0.09; // Slightly lower default
            }
            return Math.max(0, Math.min(1, p));
        });

        // ADJUSTED threshold - not too high
        const threshold = 0.5; // Reduced from 0.6
        const candidates = actionProbabilities
            .map((val, idx) => ({ idx, val }))
            .filter(a => a.val >= threshold);

        const chosenActions: number[] = [];
        for (const a of candidates.sort((a, b) => b.val - a.val)) {
            if (chosenActions.every(chosen => !conflictMatrix[a.idx][chosen]))
                chosenActions.push(a.idx);
        }
        
        if (chosenActions.length === 0) {
            const bestIdx = actionProbabilities.indexOf(Math.max(...actionProbabilities));
            chosenActions.push(bestIdx);
        }
        
        const actionResults: any[] = [];
        for (const i of chosenActions) {
            if (i < 0 || i >= functionList.length) {
                console.error(`Cell ${this.id}: Invalid action index ${i}`);
                continue;
            }
            const result = functionList[i]();
            actionResults.push(result);
        }

        const baseMetabolicCost = 0.005; // Reduced from 0.01
        const sizeCost = this.size * 0.0005; // Reduced from 0.001
        this.energy -= (baseMetabolicCost + sizeCost);
        
        const reward = this.computeReward(chosenActions, actionResults);
        
        // ADJUSTED reward weights
        const totalReward = (
            reward.energy * 0.5 +        // Slightly reduced
            reward.survival * 0.4 +      // Increased
            reward.reproduction * 0.02 + // Reduced significantly
            reward.exploration * 0.08    // Slightly reduced
        );
        
        // IMPROVED learning targets
        const targetProbabilities = actionProbabilities.map((prob, idx) => {
            if (chosenActions.includes(idx)) {
                const actionIdx = chosenActions.indexOf(idx);
                const result = actionResults[actionIdx];
                
                if (result.success) {
                    // AMPLIFIED reinforcement
                    return Math.min(0.95, prob + totalReward * 0.2);
                } else {
                    // AMPLIFIED punishment
                    return Math.max(0.05, prob - Math.abs(totalReward) * 0.3);
                }
            } else {
                // Slower decay for unchosen actions
                return Math.max(0.05, prob * 0.98);
            }
        });
        
        const MSEgradient = this.MSEgradient(actionProbabilities, targetProbabilities);
        const loss = this.computeLossMSE(actionProbabilities, reward);
        this.brain.policyNetwork.backPropagate(loss, MSEgradient);
    }
}


// when pheromone is caught and helps a cell, send rewards (negative or positive) to cell who put down pheromone by cell_id;