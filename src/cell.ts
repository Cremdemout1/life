/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   cell.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: yohan <yohan@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/30 21:58:10 by yohan             #+#    #+#             */
/*   Updated: 2025/10/02 14:59:53 by yohan            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { getRandInt, createWeightMatrix, createBias } from './random_gen.js'
import { mapClass } from './map.js';

class Cell {
    energy: number = 1; //energy will be percentage form 0 to 1
    id: number;
    age: number;
    heatTolerance: number; //will be between 0 and 1 for efficiency
    timeToEat: number = 0.2; // seconds it takes to consume 0.5 feed.
    map: mapClass;
    
    position: [number, number];
    neighbourhood: Array<[number, number, number]>; //get radius around cell

    brain: UnsupervisedNN;
    
    constructor(id: number, x: number, y: number, map: mapClass) {
        this.id = id;
        this.position = [x, y];
        this.heatTolerance = getRandInt(1, 65) / 100;
        this.neighbourhood = this.getNeighbourhood();// make function to get small env
        this.brain = new UnsupervisedNN(this);
        this.age = 0;
        this.map = map;
    }

    private getNeighbourhood(): Array<[number, number, number]> {
        const neighbourhood: Array<[number, number, number]> = [];
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
    };

    public leavePheremone(){}; //should leave trail of -1 if dangerous or 1 if good for survival and 0 for asking help (wants feed from other)

    private divide(){}; //creates similar cell with slight weight adjustment(adds variety to evolution)

    private move(){};// moves cost energy (0.01?)

    private eat(){}// eats when in feeder area

    // collectFeed(){}; //collect extra feed

    // giveFeed(){}; //give feed to nearby cell

    // receiveFeed(){}; //receive feed from nearby cell

    private contract(){}; // heat affects less, moves faster

    private expand(){}; //heat affects more but can eat faster and/or could eat smaller cells?, moves slower
}

//////////////////////////////////////////////////////////////////////////////////////
//                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////

class UnsupervisedNN {
    
    learning_rate: number = 0.1;
    epochs: number = 50;
    
    input: number[]; //size = 79
    input_size: number = 79;
    hidden_layer_size: number = 32;
    latent_layer_size: number = 8;
    
    W1: number[][]; //32 x 79 used for encoder
    W2: number[][]; //8 x 32 used for encoder
    W3: number[][]; //32 x 8 used for decoder
    W4: number[][]; //79 x 32 uded for decoder

    b1: number[]; //32 x 1
    b2: number[]; //8 x 1
    b3: number[]; //32 x 1
    b4: number[]; //79 x 1
    
    cell: Cell;
    policyNetwork: NN;
    
    constructor(cell: Cell) {
        //input: position of cell, radius around cell which willbe array of arrays in which each array has a position, a heat, food and pheremone. pheremone is 1 0 or -1, energy left, heatTolerance, timeToeat
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

    private modelInput(): number[] {
        const input: Array<any> = [];
        let heat: Array<number> = [], feed: Array<number> = [], pheremone: Array<number> = [];
        for (let i = 0; i < this.cell.neighbourhood.length; i++) {
            heat[i] = this.cell.neighbourhood[i][0];
            feed[i] = this.cell.neighbourhood[i][1];
            pheremone[i] = this.cell.neighbourhood[i][2];
        }
        input.push(...heat, ...feed, ...pheremone, 
            this.cell.age, this.cell.energy, 
            this.cell.heatTolerance, this.cell.timeToEat);
        console.log(input);
        return input;
    }

    private ReLU(value: number) { //activation function
        return (Math.max(0, value));
    }

    private forwardPass(input: number[], weights: number[][], bias: number[]): number[] {
        const newLayer: number[] = [];
        
        for (let row = 0; row < weights.length; row++) {
            let sum = 0;
            for (let col = 0; col < weights[0].length; col++) {
                sum += weights[row][col] * input[col];;
            }
            newLayer.push(sum + bias[row]);
        }
        const activatedLayer = newLayer.map(v => this.ReLU(v));
        return activatedLayer;
    }

    private MSE(input: number[], output: number[]): number { //mean squared error
        let loss = 0;
        for (let i = 0; i < this.input.length; i++) {
            let diff = input[i] - output[i];
            loss += diff * diff;
        }
        return loss / input.length;
    }

    private MSEgradient(input: number[], output: number[]): number[] {
        const grad: number[] = [];
        const len = input.length;
        for (let i = 0; i < len; i++)
            grad[i] = 2 * (output[i] - input[i]) / len;
        return grad;
    }

    private backwardPass(previousLayer: number[], //back propagation
                 currentActivatedLayer: number[], 
                 gradOutputs: number[], 
                 weights: number[][], 
                 bias: number[]): number[] {
        
        const gradientInput: number[] = new Array(previousLayer.length).fill(0); //init gradientInput
        
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

    private AutoEncoder(): number[] {
        //encode
        const hiddenLayer = this.forwardPass(this.input, this.W1, this.b1);
        const latentLayer = this.forwardPass(hiddenLayer, this.W2, this.b2);

        //decode
        const hiddenLayerPrime = this.forwardPass(latentLayer, this.W3, this.b3);
        const inputPrime = this.forwardPass(hiddenLayerPrime, this.W4, this.b4);

        //loss function
        const loss: number = this.MSE(this.input, inputPrime);

        //back propagation
        const GradientHiddenLayerPrime = this.backwardPass(hiddenLayerPrime, inputPrime, this.MSEgradient(this.input, inputPrime), this.W4, this.b4);
        const GradientLatentLayer = this.backwardPass(latentLayer, hiddenLayerPrime, GradientHiddenLayerPrime, this.W3, this.b3);
        const GradientHiddenLayer = this.backwardPass(hiddenLayer, latentLayer, GradientLatentLayer, this.W2, this.b2);
        this.backwardPass(this.input, hiddenLayer, GradientHiddenLayer, this.W1, this.b1);
        return latentLayer;
    }

    public think() { //predict
        const instincts = this.AutoEncoder();
        this.policyNetwork.predict(instincts);
    }
}

//////////////////////////////////////////////////////////////////////////////////////
//                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////

class  NN{
    learning_rate: number;
    epoch: number;
    cell: Cell;

    input_size: number = 8;
    hidden_layer_size: number = 16;
    output_size: number = 12;
    
    W1: number[][];
    W2: number[][];

    b1: number[];
    b2: number[];

    constructor(cell: Cell, learning_rate: number = 0.01, iterations: number = 50) {
        this.learning_rate = learning_rate;
        this.epoch = iterations;
        this.cell = cell;

        this.W1 = [];
        this.W2 = [];
        this.W1 = createWeightMatrix(this.hidden_layer_size, this.input_size);
        this.W2 = createWeightMatrix(this.output_size, this.hidden_layer_size);
        this.b1 = createBias(this.hidden_layer_size);
        this.b2 = createBias(this.output_size);
    }

    private sigmoid(x: number): number {
        return 1 / (1 + Math.exp(-x));
    }

    private vectMatrixMult(vector: number[], matrix: number[][]): number[] {
        const result: number[] = [];
        for (let row = 0; row < matrix.length; row++) {
            let sum = 0;
            for (let col = 0; col < matrix[0].length; col++) {
                sum += matrix[row][col] * vector[col];;
            }
            result.push(sum);
        }
        return result;
    }
    
    public predict(input: number[]): number[] {
        const static_hidden_layer: number[] = this.vectMatrixMult(input, this.W1);
        const activated_hidden_layer = static_hidden_layer.map((x, i) => this.sigmoid(x + this.b1[i]));
        
        const static_output:number[] = this.vectMatrixMult(activated_hidden_layer, this.W2);
        const plausibilities: number[] = static_output.map((x, i) => this.sigmoid(x + this.b2[i]));

        return plausibilities;
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