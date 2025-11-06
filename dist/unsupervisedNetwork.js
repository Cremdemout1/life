import { createWeightMatrix, createBias } from "./random_gen.js";
import { NN } from "./policyNetwork.js";
// export class UnsupervisedNN {
//     learning_rate: number = 0.1;
//     epochs: number = 50;
//     input: number[]; //size = 79
//     input_size: number = 79;
//     hidden_layer_size: number = 32;
//     latent_layer_size: number = 8;
//     frameCounter: number = 0;
//     trainingInterval: number = 50;
//     experienceBuffer: number[][] = [];
//     bufferSize: number = 50;
//     W1: number[][]; //32 x 79 used for encoder
//     W2: number[][]; //8 x 32 used for encoder
//     W3: number[][]; //32 x 8 used for decoder
//     W4: number[][]; //79 x 32 uded for decoder
//     b1: number[]; //32 x 1
//     b2: number[]; //8 x 1
//     b3: number[]; //32 x 1
//     b4: number[]; //79 x 1
//     cell: Cell | null;
//     policyNetwork: NN;
//     constructor(cell: Cell | null) {
//         //input: position of cell, radius around cell which willbe array of arrays in which each array has a position, a heat, food and pheromone. pheromone is 1 0 or -1, energy left, heatTolerance, timeToeat
//         this.cell = cell;
//         this.input = this.modelInput();
//         this.W1 = createWeightMatrix(this.hidden_layer_size, this.input_size);
//         this.W2 = createWeightMatrix(this.latent_layer_size, this.hidden_layer_size);
//         this.W3 = createWeightMatrix(this.hidden_layer_size, this.latent_layer_size);
//         this.W4 = createWeightMatrix(this.input_size, this.hidden_layer_size);
//         this.b1 = createBias(this.hidden_layer_size);
//         this.b2 = createBias(this.latent_layer_size);
//         this.b3 = createBias(this.hidden_layer_size);
//         this.b4 = createBias(this.input_size);
//         this.policyNetwork = new NN(this.cell);
//     }
//     clone(newOwner: Cell | null, mutate: boolean = false): UnsupervisedNN {
//         const clone = new UnsupervisedNN(newOwner);
//         if (clone.cell === null)
//             (console.log("Error: cell inactive for brain"), null);
//         else
//             clone.policyNetwork = this.policyNetwork.clone(clone.cell, mutate);
//         if (mutate) {
//             const mutationRate = 0.02; // tweak this
//             const mutationStrength = 0.05; // size of weight noise
//             const mutateValue = (v: number) =>
//                 Math.random() < mutationRate
//                     ? v + (Math.random() * 2 - 1) * mutationStrength
//                     : v;
//             clone.W1 = this.W1.map(row => row.map(mutateValue));
//             clone.W2 = this.W2.map(row => row.map(mutateValue));
//             clone.W3 = this.W3.map(row => row.map(mutateValue));
//             clone.W4 = this.W4.map(row => row.map(mutateValue));
//             clone.b1 = this.b1.map(mutateValue);
//             clone.b2 = this.b2.map(mutateValue);
//             clone.b3 = this.b3.map(mutateValue);
//             clone.b4 = this.b4.map(mutateValue);
//         }
//         else {
//             clone.W1 = this.W1.map(row => [...row]);
//             clone.W2 = this.W2.map(row => [...row]);
//             clone.W3 = this.W3.map(row => [...row]);
//             clone.W4 = this.W4.map(row => [...row]);
//             clone.b1 = [...this.b1];
//             clone.b2 = [...this.b2];
//             clone.b3 = [...this.b3];
//             clone.b4 = [...this.b4];
//         }
//         clone.input = this.modelInput();
//         return clone;
//     }
//     private modelInput(): number[] {
//         const input: Array<any> = [];
//         let heat: Array<number> = [], feed: Array<number> = [], pheromone: Array<number> = [];
//         if (!this.cell)
//             (console.log("Error: cell inactive for brain"), null);
//         else {
//             for (let i = 0; i < this.cell.neighbourhood.length; i++) {
//                 heat[i] = this.cell.neighbourhood[i]?.[0] ?? 0;
//                 feed[i] = this.cell.neighbourhood[i]?.[1] ?? 0;
//                 pheromone[i] = this.cell.neighbourhood[i]?.[2] ?? 0;
//             }
//             input.push(...heat, ...feed, ...pheromone, 
//                 this.cell.age, this.cell.energy, 
//                 this.cell.heatTolerance, this.cell.timeToEat);
//             // console.log(input);
//         }
//         return input;
//     }
//     private ReLU(value: number) { //activation function
//         return (Math.max(0, value));
//     }
//     private forwardPass(input: number[], weights: number[][], bias: number[]): number[] {
//         const newLayer: number[] = [];
//         for (let row = 0; row < weights.length; row++) {
//             let sum = 0;
//             for (let col = 0; col < weights[0].length; col++) {
//                 sum += weights[row][col] * input[col];;
//             }
//             newLayer.push(sum + bias[row]);
//         }
//         const activatedLayer = newLayer.map(v => this.ReLU(v));
//         return activatedLayer;
//     }
//     private MSE(input: number[], output: number[]): number { //mean squared error
//         let loss = 0;
//         for (let i = 0; i < this.input.length; i++) {
//             let diff = input[i] - output[i];
//             loss += diff * diff;
//         }
//         return loss / input.length;
//     }
//     private MSEgradient(input: number[], output: number[]): number[] {
//         const grad: number[] = [];
//         const len = input.length;
//         for (let i = 0; i < len; i++)
//             grad[i] = 2 * (output[i] - input[i]) / len;
//         return grad;
//     }
//     private backwardPass(previousLayer: number[], //back propagation
//                  currentActivatedLayer: number[], 
//                  gradOutputs: number[], 
//                  weights: number[][], 
//                  bias: number[]): number[] {
//         const gradientInput: number[] = new Array(previousLayer.length).fill(0); //init gradientInput
//         for (let i = 0; i < weights.length; i++) {
//             const ReLUDerivative = currentActivatedLayer[i] > 0 ? 1 : 0;
//             for (let j = 0; j < previousLayer.length; j++) {
//                 const grad = gradOutputs[i] * ReLUDerivative * previousLayer[j];
//                 gradientInput[j] += gradOutputs[i] * ReLUDerivative * weights[i][j];
//                 weights[i][j] -= this.learning_rate * grad;
//             }
//             bias[i] -= this.learning_rate * gradOutputs[i] * ReLUDerivative;
//         }
//         return gradientInput;
//     }
//     private trainAutoEncoder(trainingInput: number[]): number {
//         //encode
//         const hiddenLayer = this.forwardPass(trainingInput, this.W1, this.b1);
//         const latentLayer = this.forwardPass(hiddenLayer, this.W2, this.b2);
//         //decode
//         const hiddenLayerPrime = this.forwardPass(latentLayer, this.W3, this.b3);
//         const inputPrime = this.forwardPass(hiddenLayerPrime, this.W4, this.b4);
//         //loss function
//         const loss: number = this.MSE(trainingInput, inputPrime);
//         //back propagation
//         const GradientHiddenLayerPrime = this.backwardPass(hiddenLayerPrime, inputPrime, this.MSEgradient(trainingInput, inputPrime), this.W4, this.b4);
//         const GradientLatentLayer = this.backwardPass(latentLayer, hiddenLayerPrime, GradientHiddenLayerPrime, this.W3, this.b3);
//         const GradientHiddenLayer = this.backwardPass(hiddenLayer, latentLayer, GradientLatentLayer, this.W2, this.b2);
//         this.backwardPass(trainingInput, hiddenLayer, GradientHiddenLayer, this.W1, this.b1);
//         return loss;
//     }
//     private batchTrain() {
//         if (this.experienceBuffer.length === 0) return;
//         let totalLoss = 0;
//         const numSamples = Math.min(5, this.experienceBuffer.length); // Train on 5 random samples
//         // Sample random experiences from buffer
//         for (let i = 0; i < numSamples; i++) {
//             const randomIdx = Math.floor(Math.random() * this.experienceBuffer.length);
//             const experience = this.experienceBuffer[randomIdx];
//             totalLoss += this.trainAutoEncoder(experience);
//         }
//         const avgLoss = totalLoss / numSamples;
//         // Optional: log training progress occasionally
//         if (this.frameCounter % 100 === 0 && this.cell) {
//             console.log(`Cell ${this.cell.id}: Autoencoder loss = ${avgLoss.toFixed(4)}`);
//         }
//     }
//     private AutoEncoder(): number[] {
//         //encode
//         const hiddenLayer = this.forwardPass(this.input, this.W1, this.b1);
//         const latentLayer = this.forwardPass(hiddenLayer, this.W2, this.b2);
//         //decode
//         const hiddenLayerPrime = this.forwardPass(latentLayer, this.W3, this.b3);
//         const inputPrime = this.forwardPass(hiddenLayerPrime, this.W4, this.b4);
//         //loss function
//         const loss: number = this.MSE(this.input, inputPrime);
//         //back propagation
//         const GradientHiddenLayerPrime = this.backwardPass(hiddenLayerPrime, inputPrime, this.MSEgradient(this.input, inputPrime), this.W4, this.b4);
//         const GradientLatentLayer = this.backwardPass(latentLayer, hiddenLayerPrime, GradientHiddenLayerPrime, this.W3, this.b3);
//         const GradientHiddenLayer = this.backwardPass(hiddenLayer, latentLayer, GradientLatentLayer, this.W2, this.b2);
//         this.backwardPass(this.input, hiddenLayer, GradientHiddenLayer, this.W1, this.b1);
//         return latentLayer;
//     }
//     // public think() { //predict
//     //     const instincts = this.AutoEncoder();
//     //     return this.policyNetwork.predict(instincts);
//     // }
//     private storeExperience(input: number[]) {
//         this.experienceBuffer.push([...input]);
//         // Keep buffer at fixed size
//         if (this.experienceBuffer.length > this.bufferSize) {
//             this.experienceBuffer.shift(); // Remove oldest
//         }
//     }
//     private encode(input: number[]): number[] {
//         const hiddenLayer = this.forwardPass(input, this.W1, this.b1);
//         const latentLayer = this.forwardPass(hiddenLayer, this.W2, this.b2);
//         return latentLayer;
//     }
//     public think() { //predict
//         // Update input
//         this.input = this.modelInput();
//         // Store experience for later training
//         this.storeExperience(this.input);
//         // Increment frame counter
//         this.frameCounter++;
//         // Train periodically
//         if (this.frameCounter % this.trainingInterval === 0) {
//             this.batchTrain();
//             this.frameCounter = 0;
//         }
//         // Always do forward pass (no training here!)
//         const instincts = this.encode(this.input);
//         return this.policyNetwork.predict(instincts);
//     }
// }
export class UnsupervisedNN {
    constructor(cell) {
        this.learning_rate = 0.01;
        this.epochs = 50;
        this.input_size = 52;
        this.first_hidden_layer_size = 64;
        this.hidden_layer_size = 32;
        this.latent_layer_size = 8;
        this.frameCounter = 0;
        this.trainingInterval = 10;
        this.experienceBuffer = [];
        this.bufferSize = 100;
        this.cell = cell;
        this.input = this.modelInput();
        this.W1 = createWeightMatrix(this.first_hidden_layer_size, this.input_size);
        this.W2 = createWeightMatrix(this.hidden_layer_size, this.first_hidden_layer_size);
        this.W3 = createWeightMatrix(this.latent_layer_size, this.hidden_layer_size);
        this.W4 = createWeightMatrix(this.hidden_layer_size, this.latent_layer_size);
        this.W5 = createWeightMatrix(this.first_hidden_layer_size, this.hidden_layer_size);
        this.W6 = createWeightMatrix(this.input_size, this.first_hidden_layer_size);
        this.b1 = createBias(this.first_hidden_layer_size);
        this.b2 = createBias(this.hidden_layer_size);
        this.b3 = createBias(this.latent_layer_size);
        this.b4 = createBias(this.hidden_layer_size);
        this.b5 = createBias(this.first_hidden_layer_size);
        this.b6 = createBias(this.input_size);
        this.policyNetwork = new NN(this.cell);
    }
    clone(newOwner, mutate = false) {
        const clone = new UnsupervisedNN(newOwner);
        if (clone.cell === null)
            (console.log("Error: cell inactive for brain"), null);
        else
            clone.policyNetwork = this.policyNetwork.clone(clone.cell, mutate);
        if (mutate) {
            const mutationRate = 0.02; // tweak this
            const mutationStrength = 0.05; // size of weight noise
            const mutateValue = (v) => Math.random() < mutationRate
                ? v + (Math.random() * 2 - 1) * mutationStrength
                : v;
            clone.W1 = this.W1.map(row => row.map(mutateValue));
            clone.W2 = this.W2.map(row => row.map(mutateValue));
            clone.W3 = this.W3.map(row => row.map(mutateValue));
            clone.W4 = this.W4.map(row => row.map(mutateValue));
            clone.W5 = this.W5.map(row => row.map(mutateValue));
            clone.W6 = this.W6.map(row => row.map(mutateValue));
            clone.b1 = this.b1.map(mutateValue);
            clone.b2 = this.b2.map(mutateValue);
            clone.b3 = this.b3.map(mutateValue);
            clone.b4 = this.b4.map(mutateValue);
            clone.b5 = this.b5.map(mutateValue);
            clone.b6 = this.b6.map(mutateValue);
        }
        else {
            clone.W1 = this.W1.map(row => [...row]);
            clone.W2 = this.W2.map(row => [...row]);
            clone.W3 = this.W3.map(row => [...row]);
            clone.W4 = this.W4.map(row => [...row]);
            clone.W5 = this.W5.map(row => [...row]);
            clone.W6 = this.W6.map(row => [...row]);
            clone.b1 = [...this.b1];
            clone.b2 = [...this.b2];
            clone.b3 = [...this.b3];
            clone.b4 = [...this.b4];
            clone.b5 = [...this.b5];
            clone.b6 = [...this.b6];
        }
        clone.input = this.modelInput();
        return clone;
    }
    // private getDirectionalFeatures(): number[] {
    //     if (!this.cell)
    //         return new Array(32).fill(0);
    //     const [cx, cy] = this.cell.position;
    //     const r = 10;
    //     const directions = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
    //     const directionBins: Record<string, {
    //         foodValues: number[];
    //         heatValues: number[];
    //         pheromoneValues: number[];
    //         distances: number[];
    //     }> = {};
    //     for (const dir of directions) {
    //         directionBins[dir] = {
    //             foodValues: [],
    //             heatValues: [],
    //             pheromoneValues: [],
    //             distances: []
    //         };
    //     }
    //     const gridSize = 2 * r + 1;
    //     for (let i = 0; i < this.cell.neighbourhood.length; i++) {
    //         const tile = this.cell.neighbourhood[i];
    //         const localX = i % gridSize;
    //         const localY = Math.floor(i / gridSize);
    //         const tileX = localX + cx - r;
    //         const tileY = localY + cy - r;
    //         const dx = tileX - cx;
    //         const dy = tileY - cy;
    //         if (dx === 0 || dy === 0)
    //             continue;
    //         const angle = Math.atan2(dy, dx);
    //         // Convert to octant (0-7)
    //         // atan2 gives: E=0, S=π/2, W=π, N=-π/2
    //         // We want: E=0, SE=1, S=2, SW=3, W=4, NW=5, N=6, NE=7
    //         let octant = Math.round(4 * angle / Math.PI);
    //         if (octant < 0) octant += 8;
    //         octant = octant % 8;
    //         const dir = directions[octant];
    //         const distance = Math.sqrt(dx * dx + dy * dy);
    //         directionBins[dir].heatValues.push(tile[0]);
    //         directionBins[dir].foodValues.push(tile[1]);
    //         directionBins[dir].pheromoneValues.push(tile[2]);
    //         directionBins[dir].distances.push(distance);
    //     }
    //     const features: number[] = [];
    //     for (const dir of directions) {
    //         const bin = directionBins[dir];
    //         if (bin.foodValues.length === 0) {
    //             features.push(0, 0, 0, 0);
    //             continue ;
    //         }
    //         const maxFood = Math.max(...bin.foodValues);
    //         const avgHeat = bin.heatValues.reduce((a, b) => a + b, 0) / bin.heatValues.length;
    //         const maxHeat = Math.max(...this.cell.map.heatPoints.map(([_, __, A]) => A));
    //         const normalizedHeat = avgHeat / maxHeat;
    //         const pheromoneSum = bin.pheromoneValues.reduce((a, b) => a + b, 0);
    //         const normalizedPheromone = Math.tanh(pheromoneSum / 5);
    //         let weightedFood = 0;
    //         for (let i =0; i < bin.foodValues.length; i++) {
    //             const weight = 1 / (bin.distances[i] / r);
    //             weightedFood += bin.foodValues[i] * weight;
    //         }
    //         weightedFood /= bin.foodValues.length;
    //         features.push(maxFood, normalizedHeat, normalizedPheromone, weightedFood);
    //     }
    //     return features;
    // }
    getDirectionalFeatures() {
        if (!this.cell)
            return new Array(32).fill(0);
        const [cx, cy] = this.cell.position;
        const r = 100;
        const directions = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
        const directionBins = {};
        for (const dir of directions) {
            directionBins[dir] = {
                foodValues: [],
                heatValues: [],
                pheromoneValues: [],
                distances: []
            };
        }
        const gridSize = 2 * r + 1;
        for (let i = 0; i < this.cell.neighbourhood.length; i++) {
            const tile = this.cell.neighbourhood[i];
            // SAFETY CHECK: Validate tile
            if (!tile || tile.length < 3)
                continue;
            const localX = i % gridSize;
            const localY = Math.floor(i / gridSize);
            const tileX = localX + cx - r;
            const tileY = localY + cy - r;
            const dx = tileX - cx;
            const dy = tileY - cy;
            if (dx === 0 && dy === 0)
                continue;
            const angle = Math.atan2(dy, dx);
            let octant = Math.round(4 * angle / Math.PI);
            if (octant < 0)
                octant += 8;
            octant = octant % 8;
            const dir = directions[octant];
            const distance = Math.sqrt(dx * dx + dy * dy);
            // SAFETY CHECK: Validate values before pushing
            directionBins[dir].heatValues.push(isFinite(tile[0]) ? tile[0] : 0);
            directionBins[dir].foodValues.push(isFinite(tile[1]) ? tile[1] : 0);
            directionBins[dir].pheromoneValues.push(isFinite(tile[2]) ? tile[2] : 0);
            directionBins[dir].distances.push(distance);
        }
        const features = [];
        for (const dir of directions) {
            const bin = directionBins[dir];
            if (bin.foodValues.length === 0) {
                features.push(0, 0, 0, 0);
                continue;
            }
            const maxFood = Math.max(0, ...bin.foodValues);
            const avgHeat = bin.heatValues.reduce((a, b) => a + b, 0) / bin.heatValues.length;
            // SAFETY CHECK: Prevent division by zero
            const heatPointAmplitudes = this.cell.map.heatPoints.map(([_, __, A]) => A);
            const maxHeat = Math.max(1, ...heatPointAmplitudes); // Minimum 1 to prevent division by zero
            const normalizedHeat = avgHeat / maxHeat;
            const pheromoneSum = bin.pheromoneValues.reduce((a, b) => a + b, 0);
            const normalizedPheromone = Math.tanh(pheromoneSum / 5);
            let weightedFood = 0;
            for (let i = 0; i < bin.foodValues.length; i++) {
                const distance = bin.distances[i];
                // SAFETY CHECK: Prevent division by zero
                const weight = distance > 0 ? 1 / (distance / r) : 1;
                weightedFood += bin.foodValues[i] * weight;
            }
            weightedFood = bin.foodValues.length > 0 ? weightedFood / bin.foodValues.length : 0;
            // SAFETY CHECK: Validate all features before pushing
            features.push(isFinite(maxFood) ? maxFood : 0, isFinite(normalizedHeat) ? normalizedHeat : 0, isFinite(normalizedPheromone) ? normalizedPheromone : 0, isFinite(weightedFood) ? weightedFood : 0);
        }
        return features;
    }
    // private getRadialFeatures(): number[] {
    //     if (!this.cell)
    //         return new Array(9).fill(0);
    //     const [cx, cy] = this.cell.position;
    //     const r = 10;
    //     const rings = [
    //         {name: 'near', min: 0, max: 3, tiles: [] as Array<[number, number, number]>},
    //         {name: 'medium', min: 4, max: 7, tiles: [] as Array<[number, number, number]>},
    //         {name: 'far', min: 8, max: 10, tiles: [] as Array<[number, number, number]>}
    //     ];
    //     const gridSize = r * 2 + 1;
    //     for (let i = 0; i < this.cell.neighbourhood.length; i++) {
    //         const tile = this.cell.neighbourhood[i];
    //         const localX = i % gridSize;
    //         const localY = Math.floor(i / gridSize);
    //         const tileX = localX + cx - r;
    //         const tileY = localY + cy - r;
    //         const dx = tileX - cx;
    //         const dy = tileY - cy;
    //         const distance = Math.sqrt(dx * dx + dy * dy);
    //         for (const ring of rings) {
    //             if (distance >= ring.min && distance <= ring.max) {
    //                 ring.tiles.push(tile);
    //                 break ;
    //             }
    //         }
    //     }
    //     const features: number[] = [];
    //     for (const ring of rings) {
    //         if (ring.tiles.length === 0)
    //             continue ;
    //         const heats = ring.tiles.map(t => t[0]);
    //         const foods = ring.tiles.map(t => t[1]);
    //         const pheromones = ring.tiles.map(t => t[2]);
    //         const maxFood = Math.max(...foods);
    //         const avgHeat = heats.reduce((a, b) => a + b, 0) / heats.length;
    //         const maxHeat = Math.max(...this.cell.map.heatPoints.map(([_, __, A]) => A));
    //         const normalizedHeat = avgHeat / maxHeat;
    //         const pheromoneCount = pheromones.filter(p => p !== 0).length;
    //         const pheromoneDensity = Math.tanh(pheromoneCount / ring.tiles.length);
    //         features.push(maxFood, normalizedHeat, pheromoneDensity);
    //     }
    //     return features;
    // }
    getRadialFeatures() {
        if (!this.cell)
            return new Array(9).fill(0);
        const [cx, cy] = this.cell.position;
        const r = 100;
        const rings = [
            { name: 'near', min: 0, max: 3, tiles: [] },
            { name: 'medium', min: 4, max: 7, tiles: [] },
            { name: 'far', min: 8, max: 10, tiles: [] }
        ];
        const gridSize = r * 2 + 1;
        for (let i = 0; i < this.cell.neighbourhood.length; i++) {
            const tile = this.cell.neighbourhood[i];
            // SAFETY CHECK
            if (!tile || tile.length < 3)
                continue;
            const localX = i % gridSize;
            const localY = Math.floor(i / gridSize);
            const tileX = localX + cx - r;
            const tileY = localY + cy - r;
            const dx = tileX - cx;
            const dy = tileY - cy;
            const distance = Math.sqrt(dx * dx + dy * dy);
            for (const ring of rings) {
                if (distance >= ring.min && distance <= ring.max) {
                    ring.tiles.push(tile);
                    break;
                }
            }
        }
        const features = [];
        for (const ring of rings) {
            if (ring.tiles.length === 0) {
                features.push(0, 0, 0);
                continue;
            }
            const heats = ring.tiles.map(t => t[0]).filter(isFinite);
            const foods = ring.tiles.map(t => t[1]).filter(isFinite);
            const pheromones = ring.tiles.map(t => t[2]).filter(isFinite);
            // SAFETY CHECK: Handle empty arrays
            const maxFood = foods.length > 0 ? Math.max(0, ...foods) : 0;
            const avgHeat = heats.length > 0
                ? heats.reduce((a, b) => a + b, 0) / heats.length
                : 0;
            const heatPointAmplitudes = this.cell.map.heatPoints.map(([_, __, A]) => A);
            const maxHeat = Math.max(1, ...heatPointAmplitudes);
            const normalizedHeat = avgHeat / maxHeat;
            const pheromoneCount = pheromones.filter(p => p !== 0).length;
            const pheromoneDensity = ring.tiles.length > 0
                ? Math.tanh(pheromoneCount / ring.tiles.length)
                : 0;
            features.push(isFinite(maxFood) ? maxFood : 0, isFinite(normalizedHeat) ? normalizedHeat : 0, isFinite(pheromoneDensity) ? pheromoneDensity : 0);
        }
        return features;
    }
    // private getGlobalContext(): number[] {
    //     if (!this.cell)
    //         return new Array(5).fill(0);
    //     const tiles = this.cell.neighbourhood;
    //     const heats = tiles.map(t => t[0]);
    //     const foods = tiles.map(t => t[1]);
    //     const pheromones = tiles.map(t => t[2]);
    //     const foodTileRadio = foods.filter(f => f > 0.1).length / foods.length;
    //     const maxFood = Math.max(...foods);
    //     const avgHeat = heats.reduce((a, b) => a + b, 0) / heats.length;
    //     const maxHeat = Math.max(...this.cell.map.heatPoints.map(([_, __, A]) => A));
    //     const normalizedAvgHeat = avgHeat / maxHeat;
    //     const positivePheromones = pheromones.filter(p => p > 0).length;
    //     const negativePheromones = pheromones.filter(p => p < 0).length;
    //     const pheromoneBalance = (positivePheromones - negativePheromones) / pheromones.length;
    //     const [x, y] = this.cell.position;
    //     const currentHeat = this.cell.map.grid[y][x][0];
    //     const normalizedCurrentHeat = currentHeat / maxHeat;
    //     const heatStress = Math.max(0, normalizedCurrentHeat - this.cell.heatTolerance);
    //     return [
    //         foodTileRadio,
    //         maxFood,
    //         normalizedAvgHeat,
    //         pheromoneBalance,
    //         heatStress
    //     ];
    // }
    getGlobalContext() {
        if (!this.cell)
            return new Array(5).fill(0);
        const tiles = this.cell.neighbourhood.filter(t => t && t.length >= 3);
        // SAFETY CHECK: Handle empty neighbourhood
        if (tiles.length === 0) {
            return [0, 0, 0, 0, 0];
        }
        const heats = tiles.map(t => t[0]).filter(isFinite);
        const foods = tiles.map(t => t[1]).filter(isFinite);
        const pheromones = tiles.map(t => t[2]).filter(isFinite);
        const foodTileRatio = foods.length > 0
            ? foods.filter(f => f > 0.1).length / foods.length
            : 0;
        const maxFood = foods.length > 0 ? Math.max(0, ...foods) : 0;
        const avgHeat = heats.length > 0
            ? heats.reduce((a, b) => a + b, 0) / heats.length
            : 0;
        const heatPointAmplitudes = this.cell.map.heatPoints.map(([_, __, A]) => A);
        const maxHeat = Math.max(1, ...heatPointAmplitudes);
        const normalizedAvgHeat = avgHeat / maxHeat;
        const positivePheromones = pheromones.filter(p => p > 0).length;
        const negativePheromones = pheromones.filter(p => p < 0).length;
        const pheromoneBalance = pheromones.length > 0
            ? (positivePheromones - negativePheromones) / pheromones.length
            : 0;
        const [x, y] = this.cell.position;
        const currentHeat = this.cell.map.grid[y][x][0];
        const normalizedCurrentHeat = currentHeat / maxHeat;
        const heatStress = Math.max(0, normalizedCurrentHeat - this.cell.heatTolerance);
        return [
            isFinite(foodTileRatio) ? foodTileRatio : 0,
            isFinite(maxFood) ? maxFood : 0,
            isFinite(normalizedAvgHeat) ? normalizedAvgHeat : 0,
            isFinite(pheromoneBalance) ? pheromoneBalance : 0,
            isFinite(heatStress) ? heatStress : 0
        ];
    }
    // private getInternalState(): number[] {
    //     if (!this.cell)
    //         return new Array(6).fill(0);
    //     return [
    //         this.cell.energy,
    //         this.cell.heatTolerance,
    //         this.cell.age / 1000,
    //         this.cell.size / 10,
    //         this.cell.speed / 10,
    //         this.cell.isEating ? 1 : 0
    //     ];
    // }
    getInternalState() {
        if (!this.cell)
            return new Array(6).fill(0);
        return [
            isFinite(this.cell.energy) ? this.cell.energy : 0,
            isFinite(this.cell.heatTolerance) ? this.cell.heatTolerance : 0.5,
            isFinite(this.cell.age) ? this.cell.age / 1000 : 0,
            isFinite(this.cell.size) ? this.cell.size / 10 : 0.1,
            isFinite(this.cell.speed) ? this.cell.speed / 10 : 0.1,
            this.cell.isEating ? 1 : 0
        ];
    }
    modelInput() {
        if (!this.cell) {
            console.log("Error: cell inactive for brain");
            return new Array(52).fill(0);
        }
        const features = [];
        features.push(...this.getDirectionalFeatures());
        features.push(...this.getRadialFeatures());
        features.push(...this.getGlobalContext());
        features.push(...this.getInternalState());
        return features;
    }
    debugInputStructure() {
        if (!this.cell)
            return;
        const input = this.modelInput();
        console.log(`\n=== Cell ${this.cell.id} Input Structure ===`);
        console.log(`Position: (${this.cell.position[0]}, ${this.cell.position[1]})`);
        console.log(`Energy: ${this.cell.energy.toFixed(2)}\n`);
        // Directional features (indices 0-31)
        console.log("Directional Features:");
        const directions = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
        for (let i = 0; i < 8; i++) {
            const base = i * 4;
            const maxFood = input[base];
            const heat = input[base + 1];
            const pheromone = input[base + 2];
            const weightedFood = input[base + 3];
            console.log(`  ${directions[i]}: food=${maxFood.toFixed(2)}, heat=${heat.toFixed(2)}, ` +
                `pheromone=${pheromone.toFixed(2)}, weighted=${weightedFood.toFixed(2)}`);
        }
        // Radial features (indices 32-40)
        console.log("\nRadial Ring Features:");
        const rings = ['Near', 'Medium', 'Far'];
        for (let i = 0; i < 3; i++) {
            const base = 32 + i * 3;
            console.log(`  ${rings[i]}: food=${input[base].toFixed(2)}, ` +
                `heat=${input[base + 1].toFixed(2)}, pheromone_density=${input[base + 2].toFixed(2)}`);
        }
        // Global context (indices 41-45)
        console.log("\nGlobal Context:");
        console.log(`  Food visibility: ${input[41].toFixed(2)}`);
        console.log(`  Max food in sight: ${input[42].toFixed(2)}`);
        console.log(`  Avg heat: ${input[43].toFixed(2)}`);
        console.log(`  Pheromone balance: ${input[44].toFixed(2)}`);
        console.log(`  Heat stress: ${input[45].toFixed(2)}`);
        // Internal state (indices 46-51)
        console.log("\nInternal State:");
        console.log(`  Energy: ${input[46].toFixed(2)}`);
        console.log(`  Heat tolerance: ${input[47].toFixed(2)}`);
        console.log(`  Age: ${input[48].toFixed(2)}`);
        console.log(`  Size: ${input[49].toFixed(2)}`);
        console.log(`  Speed: ${input[50].toFixed(2)}`);
        console.log(`  Is eating: ${input[51]}`);
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
    trainAutoEncoder(trainingInput) {
        //encode
        // const hiddenLayer = this.forwardPass(trainingInput, this.W1, this.b1);
        // const latentLayer = this.forwardPass(hiddenLayer, this.W2, this.b2);
        // //decode
        // const hiddenLayerPrime = this.forwardPass(latentLayer, this.W3, this.b3);
        // const inputPrime = this.forwardPass(hiddenLayerPrime, this.W4, this.b4);
        // //loss function
        // const loss: number = this.MSE(trainingInput, inputPrime);
        // //back propagation
        // const GradientHiddenLayerPrime = this.backwardPass(hiddenLayerPrime, inputPrime, this.MSEgradient(trainingInput, inputPrime), this.W4, this.b4);
        // const GradientLatentLayer = this.backwardPass(latentLayer, hiddenLayerPrime, GradientHiddenLayerPrime, this.W3, this.b3);
        // const GradientHiddenLayer = this.backwardPass(hiddenLayer, latentLayer, GradientLatentLayer, this.W2, this.b2);
        // this.backwardPass(trainingInput, hiddenLayer, GradientHiddenLayer, this.W1, this.b1);
        //encode
        const first_hidden_layer = this.forwardPass(trainingInput, this.W1, this.b1);
        const hidden_layer = this.forwardPass(first_hidden_layer, this.W2, this.b2);
        const latent_layer = this.forwardPass(hidden_layer, this.W3, this.b3);
        //decode
        const prime_hidden_layer = this.forwardPass(latent_layer, this.W4, this.b4);
        const prime_first_hidden_layer = this.forwardPass(prime_hidden_layer, this.W5, this.b5);
        const prime_input = this.forwardPass(prime_first_hidden_layer, this.W6, this.b6);
        const loss = this.MSE(trainingInput, prime_input);
        //back propagation
        const gradient_prime_first_hidden_layer = this.backwardPass(prime_first_hidden_layer, prime_input, this.MSEgradient(trainingInput, prime_input), this.W6, this.b6);
        const gradient_prime_hidden_layer = this.backwardPass(prime_hidden_layer, prime_first_hidden_layer, gradient_prime_first_hidden_layer, this.W5, this.b5);
        const gradient_latent_layer = this.backwardPass(latent_layer, prime_hidden_layer, gradient_prime_hidden_layer, this.W4, this.b4);
        const gradient_hidden_layer = this.backwardPass(hidden_layer, latent_layer, gradient_latent_layer, this.W3, this.b3);
        const gradient_first_hidden_layer = this.backwardPass(first_hidden_layer, hidden_layer, gradient_hidden_layer, this.W2, this.b2);
        this.backwardPass(trainingInput, first_hidden_layer, gradient_first_hidden_layer, this.W1, this.b1);
        return loss;
    }
    batchTrain() {
        if (this.experienceBuffer.length < 10)
            return;
        let totalLoss = 0;
        const numSamples = Math.min(10, this.experienceBuffer.length); // Train on 5 random samples
        // Sample random experiences from buffer
        for (let i = 0; i < numSamples; i++) {
            const randomIdx = Math.floor(Math.random() * this.experienceBuffer.length);
            const experience = this.experienceBuffer[randomIdx];
            totalLoss += this.trainAutoEncoder(experience);
        }
        const avgLoss = totalLoss / numSamples;
        // Optional: log training progress occasionally
        if (this.frameCounter % 100 === 0 && this.cell) {
            console.log(`Cell ${this.cell.id}: Autoencoder loss = ${avgLoss.toFixed(4)}`);
        }
    }
    // private AutoEncoder(): number[] {
    //     //encode
    //     const hiddenLayer = this.forwardPass(this.input, this.W1, this.b1);
    //     const latentLayer = this.forwardPass(hiddenLayer, this.W2, this.b2);
    //     //decode
    //     const hiddenLayerPrime = this.forwardPass(latentLayer, this.W3, this.b3);
    //     const inputPrime = this.forwardPass(hiddenLayerPrime, this.W4, this.b4);
    //     //loss function
    //     const loss: number = this.MSE(this.input, inputPrime);
    //     //back propagation
    //     const GradientHiddenLayerPrime = this.backwardPass(hiddenLayerPrime, inputPrime, this.MSEgradient(this.input, inputPrime), this.W4, this.b4);
    //     const GradientLatentLayer = this.backwardPass(latentLayer, hiddenLayerPrime, GradientHiddenLayerPrime, this.W3, this.b3);
    //     const GradientHiddenLayer = this.backwardPass(hiddenLayer, latentLayer, GradientLatentLayer, this.W2, this.b2);
    //     this.backwardPass(this.input, hiddenLayer, GradientHiddenLayer, this.W1, this.b1);
    //     return latentLayer;
    // }
    // public think() { //predict
    //     const instincts = this.AutoEncoder();
    //     return this.policyNetwork.predict(instincts);
    // }
    storeExperience(input) {
        this.experienceBuffer.push([...input]);
        // Keep buffer at fixed size
        if (this.experienceBuffer.length > this.bufferSize) {
            this.experienceBuffer.shift(); // Remove oldest
        }
    }
    encode(input) {
        if (!input || input.length !== this.input_size) {
            console.error('Invalid input to encode:', input);
            return new Array(this.latent_layer_size).fill(0);
        }
        // Clean input
        const cleanInput = input.map(v => isFinite(v) ? v : 0);
        const first_hidden_layer = this.forwardPass(cleanInput, this.W1, this.b1);
        const hidden_layer = this.forwardPass(first_hidden_layer, this.W2, this.b2);
        const latent_layer = this.forwardPass(hidden_layer, this.W3, this.b3);
        return latent_layer;
    }
    think() {
        // Update input
        this.input = this.modelInput();
        // Store experience for later training
        this.storeExperience(this.input);
        // Increment frame counter
        this.frameCounter++;
        // Train periodically
        if (this.frameCounter % this.trainingInterval === 0) {
            this.batchTrain();
            this.frameCounter = 0;
        }
        // Always do forward pass (no training here!)
        const instincts = this.encode(this.input);
        return this.policyNetwork.predict(instincts);
    }
}
