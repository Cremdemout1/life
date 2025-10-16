/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cell.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: yohan <yohan@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/30 21:58:10 by yohan             #+#    #+#             */
/*   Updated: 2025/10/16 11:47:23 by yohan            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
import { getRandInt, createWeightMatrix, createBias } from './random_gen.js';
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
    constructor(id, x, y, map) {
        this.energy = 1; //energy will be percentage form 0 to 1
        this.timeToEat = 0.2; // seconds it takes to consume 0.5 feed.
        this.id = id;
        this.age = 0;
        this.position = [x, y];
        this.heatTolerance = getRandInt(1, 65) / 100;
        this.map = map;
        this.neighbourhood = this.getNeighbourhood(); // make function to get small env
        this.brain = new UnsupervisedNN(this);
        this.previousEnergy = 1;
    }
    getNeighbourhood() {
        const neighbourhood = [];
        let cx = this.position[0];
        let cy = this.position[1];
        let r = 2; //other positions around current position (will make 5x5)
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
    leavePheromone(type) {
        let [x, y] = this.position;
        this.map.grid[y][x][2] = type;
        //optionally color the trail
    }
    ;
    divide() { }
    ; //creates similar cell with slight weight adjustment(adds variety to evolution)
    move(direction) {
        let [x, y] = this.position;
        switch (direction) {
            case 0:
                this.position[1] -= 1;
                break; // up
            case 1:
                this.position[1] += 1;
                break; // down
            case 2:
                this.position[0] -= 1;
                break; // left
            case 3:
                this.position[0] += 1;
                break; // right
            case 4: break; // none
        }
        // Optionally clamp to map bounds:
        this.position[0] = Math.max(0, Math.min(this.map.width - 1, this.position[0]));
        this.position[1] = Math.max(0, Math.min(this.map.height - 1, this.position[1]));
        const maxHeat = Math.max(...this.map.heatPoints.map(([_, __, A]) => A));
        const heat = this.map.grid[this.position[1]][this.position[0]][0];
        const normalizedHeat = Math.min(1, heat / maxHeat);
        const stress = Math.max(0, normalizedHeat - this.heatTolerance);
        const stressIntensity = Math.pow(stress, 2.2);
        const heatDamage = stressIntensity * 0.01;
        this.energy -= heatDamage;
        this.map.redrawCellBackground(x, y);
        this.map.drawCell(this.position[0], this.position[1]);
    }
    ;
    eat() { }
    ; // eats when in feeder area
    // collectFeed(){}; //collect extra feed
    // giveFeed(){}; //give feed to nearby cell
    // receiveFeed(){}; //receive feed from nearby cell
    contract() { }
    ; // heat affects less, moves faster
    expand() { }
    ; //heat affects more but can eat faster and/or could eat smaller cells?, moves slower
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
    computeReward(chosenActions) {
        const reward = {
            energy: 0,
            survival: 0,
            reproduction: 0,
            pheromoneUse: 0,
            exploration: 0
        };
        // Base rewards from chosen actions
        const actionNames = Object.keys(rewardsMap);
        for (const i of chosenActions) {
            const actionName = actionNames[i];
            const actionReward = rewardsMap[actionName];
            for (const key in actionReward)
                reward[key] += actionReward[key];
        }
        // --- Energy-based dynamic reward ---
        const energyChange = this.energy - this.previousEnergy;
        if (energyChange > 0)
            reward.energy += energyChange * 10; // Gaining energy is good
        else if (energyChange < 0)
            reward.energy += energyChange * 5; // Losing energy is bad (less punishing than death)
        // --- Survival ---
        if (this.energy <= 0.1)
            reward.survival -= 2; // near death penalty
        else if (this.energy >= 0.8)
            reward.survival += 0.5; // stable energy = good survival
        // --- Exploration ---
        // Encourage movement into slightly different areas (e.g., heat changes)
        const currentHeat = this.map.grid[this.position[1]][this.position[0]][0];
        const normalizedHeat = Math.min(1, currentHeat / Math.max(...this.map.heatPoints.map(([_, __, A]) => A)));
        // Reward exploring regions with new heat profiles
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
    //     public decideAndAct() {
    //         const functionList = [
    //             () => this.move(0),
    //             () => this.move(1),
    //             () => this.move(2),
    //             () => this.move(3),
    //             () => this.move(4),
    //             () => this.eat(),
    //             () => this.divide(),
    //             () => this.contract(),
    //             () => this.expand(),
    //             () => this.leavePheromone(-1), //danger
    //             () => this.leavePheromone(1), //safe
    //         ];
    //         const baseMetabolicCost = 0.002; // lose 0.2% energy per frame
    //         this.energy -= baseMetabolicCost;
    //         this.previousEnergy = this.energy;
    //         console.log("energy level: ", this.energy);
    //         const actionProbabilities = this.brain.think();
    //         console.log(actionProbabilities);
    //         const threshold = 0.6;
    //         const candidates = actionProbabilities
    //         .map((val, idx) => ({ idx, val }))
    //         .filter(a => a.val >= threshold);
    //         const chosenActions: number[] = [];
    //         for (const a of candidates.sort((a, b) => b.val - a.val)) {
    //             if (chosenActions.every(chosen => !conflictMatrix[a.idx][chosen]))
    //                 chosenActions.push(a.idx);
    //         }
    //         for (const i of chosenActions) // do actions
    //             functionList[i]();
    //         const reward = this.computeReward(chosenActions);
    //         const totalReward = (
    //             reward.energy * 0.4 +
    //             reward.survival * 0.3 +
    //             reward.reproduction * 0.2 +
    //             reward.exploration * 0.1
    //         );
    //         // The target probability distribution now depends on the reward
    //         const targetProbabilities = actionProbabilities.map((_, idx) => {
    //             // Encourage chosen actions proportionally to how good the reward was
    //             if (chosenActions.includes(idx))
    //                 return Math.min(1, totalReward); // strong reward → stronger target
    //             else
    //                 return Math.max(0, 1 - totalReward); // discourage others
    //         });
    //         const MSEgradient = this.MSEgradient(targetProbabilities, actionProbabilities);
    //         const loss = this.computeLossMSE(actionProbabilities, reward);
    //         this.brain.policyNetwork.backPropagate(loss, MSEgradient);       
    //     }
    // }
    decideAndAct() {
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
            () => this.leavePheromone(-1), // danger
            () => this.leavePheromone(1), // safe
        ];
        this.previousEnergy = this.energy;
        const actionProbabilities = this.brain.think();
        const threshold = 0.6;
        const candidates = actionProbabilities
            .map((val, idx) => ({ idx, val }))
            .filter(a => a.val >= threshold);
        const chosenActions = [];
        for (const a of candidates.sort((a, b) => b.val - a.val)) {
            if (chosenActions.every(chosen => !conflictMatrix[a.idx][chosen]))
                chosenActions.push(a.idx);
        }
        // Execute chosen actions
        for (const i of chosenActions)
            functionList[i]();
        // 🌡️ Base metabolic decay (always)
        const baseMetabolicCost = 0.002;
        this.energy -= baseMetabolicCost;
        console.log("energy level: ", this.energy);
        // 🧾 Compute reward feedback
        const reward = this.computeReward(chosenActions);
        const totalReward = (reward.energy * 0.4 +
            reward.survival * 0.3 +
            reward.reproduction * 0.2 +
            reward.exploration * 0.1);
        // 🎯 Reward-modulated learning target
        const targetProbabilities = actionProbabilities.map((_, idx) => {
            if (chosenActions.includes(idx))
                return Math.min(1, totalReward);
            else
                return Math.max(0, 1 - totalReward);
        });
        const MSEgradient = this.MSEgradient(targetProbabilities, actionProbabilities);
        const loss = this.computeLossMSE(actionProbabilities, reward);
        this.brain.policyNetwork.backPropagate(loss, MSEgradient);
        // // 💀 Check for death
        // if (this.energy <= 0) {
        //     this.dieAndRespawn();
    }
}
//////////////////////////////////////////////////////////////////////////////////////
//                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////
class UnsupervisedNN {
    constructor(cell) {
        this.learning_rate = 0.1;
        this.epochs = 50;
        this.input_size = 79;
        this.hidden_layer_size = 32;
        this.latent_layer_size = 8;
        //input: position of cell, radius around cell which willbe array of arrays in which each array has a position, a heat, food and pheromone. pheromone is 1 0 or -1, energy left, heatTolerance, timeToeat
        this.cell = cell;
        this.input = this.modelInput();
        this.W1 = createWeightMatrix(this.hidden_layer_size, this.input_size);
        this.W2 = createWeightMatrix(this.latent_layer_size, this.hidden_layer_size);
        this.W3 = createWeightMatrix(this.hidden_layer_size, this.latent_layer_size);
        this.W4 = createWeightMatrix(this.input_size, this.hidden_layer_size);
        this.b1 = createBias(this.hidden_layer_size);
        this.b2 = createBias(this.latent_layer_size);
        this.b3 = createBias(this.hidden_layer_size);
        this.b4 = createBias(this.input_size);
        this.policyNetwork = new NN(this.cell);
    }
    modelInput() {
        var _a, _b, _c, _d, _e, _f;
        const input = [];
        let heat = [], feed = [], pheromone = [];
        for (let i = 0; i < this.cell.neighbourhood.length; i++) {
            heat[i] = (_b = (_a = this.cell.neighbourhood[i]) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : 0;
            feed[i] = (_d = (_c = this.cell.neighbourhood[i]) === null || _c === void 0 ? void 0 : _c[1]) !== null && _d !== void 0 ? _d : 0;
            pheromone[i] = (_f = (_e = this.cell.neighbourhood[i]) === null || _e === void 0 ? void 0 : _e[2]) !== null && _f !== void 0 ? _f : 0;
        }
        input.push(...heat, ...feed, ...pheromone, this.cell.age, this.cell.energy, this.cell.heatTolerance, this.cell.timeToEat);
        console.log(input);
        return input;
    }
    ReLU(value) {
        return (Math.max(0, value));
    }
    forwardPass(input, weights, bias) {
        const newLayer = [];
        for (let row = 0; row < weights.length; row++) {
            let sum = 0;
            for (let col = 0; col < weights[0].length; col++) {
                sum += weights[row][col] * input[col];
                ;
            }
            newLayer.push(sum + bias[row]);
        }
        const activatedLayer = newLayer.map(v => this.ReLU(v));
        return activatedLayer;
    }
    MSE(input, output) {
        let loss = 0;
        for (let i = 0; i < this.input.length; i++) {
            let diff = input[i] - output[i];
            loss += diff * diff;
        }
        return loss / input.length;
    }
    MSEgradient(input, output) {
        const grad = [];
        const len = input.length;
        for (let i = 0; i < len; i++)
            grad[i] = 2 * (output[i] - input[i]) / len;
        return grad;
    }
    backwardPass(previousLayer, //back propagation
    currentActivatedLayer, gradOutputs, weights, bias) {
        const gradientInput = new Array(previousLayer.length).fill(0); //init gradientInput
        for (let i = 0; i < weights.length; i++) {
            const ReLUDerivative = currentActivatedLayer[i] > 0 ? 1 : 0;
            for (let j = 0; j < previousLayer.length; j++) {
                const grad = gradOutputs[i] * ReLUDerivative * previousLayer[j];
                gradientInput[j] += gradOutputs[i] * ReLUDerivative * weights[i][j];
                weights[i][j] -= this.learning_rate * grad;
            }
            bias[i] -= this.learning_rate * gradOutputs[i] * ReLUDerivative;
        }
        return gradientInput;
    }
    AutoEncoder() {
        //encode
        const hiddenLayer = this.forwardPass(this.input, this.W1, this.b1);
        const latentLayer = this.forwardPass(hiddenLayer, this.W2, this.b2);
        //decode
        const hiddenLayerPrime = this.forwardPass(latentLayer, this.W3, this.b3);
        const inputPrime = this.forwardPass(hiddenLayerPrime, this.W4, this.b4);
        //loss function
        const loss = this.MSE(this.input, inputPrime);
        //back propagation
        const GradientHiddenLayerPrime = this.backwardPass(hiddenLayerPrime, inputPrime, this.MSEgradient(this.input, inputPrime), this.W4, this.b4);
        const GradientLatentLayer = this.backwardPass(latentLayer, hiddenLayerPrime, GradientHiddenLayerPrime, this.W3, this.b3);
        const GradientHiddenLayer = this.backwardPass(hiddenLayer, latentLayer, GradientLatentLayer, this.W2, this.b2);
        this.backwardPass(this.input, hiddenLayer, GradientHiddenLayer, this.W1, this.b1);
        return latentLayer;
    }
    think() {
        const instincts = this.AutoEncoder();
        return this.policyNetwork.predict(instincts);
    }
}
//////////////////////////////////////////////////////////////////////////////////////
//                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////
class NN {
    constructor(cell, learning_rate = 0.01, iterations = 50) {
        this.input_size = 8;
        this.hidden_layer_size = 16;
        this.output_size = 11;
        this.learning_rate = learning_rate;
        this.epoch = iterations;
        this.cell = cell;
        this.input = [];
        this.activated_hidden_layer = [];
        this.plausibilities = [];
        this.W1 = [];
        this.W2 = [];
        this.W1 = createWeightMatrix(this.hidden_layer_size, this.input_size);
        this.W2 = createWeightMatrix(this.output_size, this.hidden_layer_size);
        this.b1 = createBias(this.hidden_layer_size);
        this.b2 = createBias(this.output_size);
    }
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }
    vectMatrixMult(vector, matrix) {
        const result = [];
        for (let row = 0; row < matrix.length; row++) {
            let sum = 0;
            for (let col = 0; col < matrix[0].length; col++) {
                sum += matrix[row][col] * vector[col];
                ;
            }
            result.push(sum);
        }
        return result;
    }
    backwardPass(previousLayer, //back propagation
    currentActivatedLayer, gradOutputs, weights, bias) {
        const gradientInput = new Array(previousLayer.length).fill(0); //init gradientInput
        for (let i = 0; i < weights.length; i++) {
            const sigmoidDerivative = currentActivatedLayer[i] * (1 - currentActivatedLayer[i]);
            for (let j = 0; j < previousLayer.length; j++) {
                const grad = gradOutputs[i] * sigmoidDerivative * previousLayer[j];
                gradientInput[j] += gradOutputs[i] * sigmoidDerivative * weights[i][j];
                weights[i][j] -= this.learning_rate * grad;
            }
            bias[i] -= this.learning_rate * gradOutputs[i] * sigmoidDerivative;
        }
        return gradientInput;
    }
    backPropagate(loss, MSEgradient) {
        const newMSE = this.backwardPass(this.activated_hidden_layer, this.plausibilities, MSEgradient, this.W2, this.b2);
        this.backwardPass(this.input, this.activated_hidden_layer, newMSE, this.W1, this.b1);
    }
    predict(input) {
        const static_hidden_layer = this.vectMatrixMult(input, this.W1);
        this.activated_hidden_layer = static_hidden_layer.map((x, i) => this.sigmoid(x + this.b1[i]));
        const static_output = this.vectMatrixMult(this.activated_hidden_layer, this.W2);
        this.plausibilities = static_output.map((x, i) => this.sigmoid(x + this.b2[i]));
        return this.plausibilities;
        //continue with reinforcement learning. not supervised learning
        //make function that receives a reward (loss) and back propagates from this.
        // the function will be called from Cell class after doing an action
        //add an array of function to pointers in the cell tht will activate in accordance to the prediction output
        // reward must be a vector to allow MORL (multiple objectives i.e. survival, energy efficiency and reproduction)
        /*1. Define Objectives Clearly

        Decide the reward dimensions (your reward vector).
        Examples:

        energy (food intake, conserving energy)

        survival (avoiding heat, staying alive)

        cooperation (pheromone use, sharing food)

        exploration (discovering new cells on the map)

        Write down what counts as positive vs negative for each.

        2. Map Cell Actions to Reward Vectors

        For each action (move, eat, leavePheromone, expand, contract, etc.), design a reward contribution vector.
        Example:

        eat() → [+0.5 energy, +0.1 survival, -0.1 exploration]

        move() → [-0.01 energy, 0.0 survival, +0.1 exploration]

        Normalize reward values so no single dimension dominates accidentally.

        3. Extend Neural Network for MORL

        Change reward signal from scalar → vector.

        Pick a method to process multi-objectives:

        Shared encoder, multiple heads (one head per objective).

        Or single head but reward aggregation strategy (weighted sum with dynamic weights).

        Add ability to store past state, action, reward vectors for training.

        4. Learning Strategy

        Implement Pareto-based update (don’t collapse objectives too early):

        Each gradient step tries to improve without worsening others.

        OR implement dynamic scalarization:

        Combine reward vector → scalar with context-dependent weights (if low energy → weight energy high).

        Decide if you want evolutionary variety (different cells learn different objective balances).

        5. Backpropagation Adaptation

        Update NN so that loss is vector-based:

        Either compute loss per objective and backprop separately.

        Or scalarize on the fly and backprop one scalar loss.

        Ensure gradients from each objective are combined (weighted or multi-head).

        6. Action Selection (Policy)

        Define how a cell chooses an action given predicted outputs:

        Highest utility according to current scalarized reward.

        Or random sample weighted by plausibilities (encourages exploration).

        If multiple objectives are equally valid, keep nondominated actions in play.

        7. Simulation Integration

        After each timestep:

        Cell performs action chosen by NN.

        Environment updates state (energy, heat, pheromone, etc.).

        Reward vector is computed.

        Cell’s NN receives reward vector → update step.

        Make sure death is handled (e.g., survival reward penalty if energy ≤ 0).

        8. Experiment with Trade-Offs

        Run simulations with fixed weights → see specialized behaviors.

        Run with dynamic weights → see adaptive strategies.

        Track different cell populations to check for emergent roles (explorer, feeder, survivor, helper).

        9. Debugging / Analysis

        Log each cell’s reward vector history.

        Visualize how objectives trade off (Pareto front).

        Verify no single objective always dominates.*/
    }
}
// when pheromone is caught and helps a cell, send rewards (negative or positive) to cell who put down pheromone by cell_id;
