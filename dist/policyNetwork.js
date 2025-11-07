import { createWeightMatrix, createBias } from "./random_gen.js";
export class NN {
    constructor(cell, learning_rate = 0.05, iterations = 50) {
        this.input_size = 8;
        this.hidden_layer_size = 16;
        this.output_size = 11;
        this.epsilon = 1e-7;
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
    clone(newCell, mutate = true) {
        const clone = new NN(newCell, this.learning_rate, this.epoch);
        if (mutate) {
            const mutationRate = 0.02; // tweak this
            const mutationStrength = 0.05; // size of weight noise
            const mutateValue = (v) => Math.random() < mutationRate
                ? v + (Math.random() * 2 - 1) * mutationStrength
                : v;
            clone.W1 = this.W1.map(row => row.map(mutateValue));
            clone.W2 = this.W2.map(row => row.map(mutateValue));
            clone.b1 = this.b1.map(mutateValue);
            clone.b2 = this.b2.map(mutateValue);
        }
        else {
            clone.W1 = this.W1.map(row => [...row]);
            clone.W2 = this.W2.map(row => [...row]);
            clone.b1 = [...this.b1];
            clone.b2 = [...this.b2];
        }
        return clone;
    }
    sigmoid(x) {
        // return 1 / (1 + Math.exp(-x));
        const clampedX = Math.max(-20, Math.min(20, x));
        return 1 / (1 + Math.exp(-clampedX));
    }
    clipWeight(w, min = -10, max = 10) {
        return Math.max(min, Math.min(max, w));
    }
    // private vectMatrixMult(vector: number[], matrix: number[][]): number[] {
    //     const result: number[] = [];
    //     for (let row = 0; row < matrix.length; row++) {
    //         let sum = 0;
    //         for (let col = 0; col < matrix[0].length; col++) {
    //             sum += matrix[row][col] * vector[col];;
    //         }
    //         result.push(sum);
    //     }
    //     return result;
    // }
    vectMatrixMult(vector, matrix) {
        const result = [];
        for (let row = 0; row < matrix.length; row++) {
            let sum = 0;
            for (let col = 0; col < matrix[0].length; col++) {
                const v = vector[col];
                const w = matrix[row][col];
                if (!isFinite(v) || !isFinite(w)) {
                    console.warn(`Invalid value in matrix mult: v=${v}, w=${w}`);
                    continue;
                }
                sum += w * v;
            }
            // Less aggressive clamping
            sum = Math.max(-50, Math.min(50, sum));
            result.push(sum);
        }
        return result;
    }
    // private backwardPass(previousLayer: number[], //back propagation
    //              currentActivatedLayer: number[], 
    //              gradOutputs: number[], 
    //              weights: number[][], 
    //              bias: number[]): number[] {
    //     const gradientInput: number[] = new Array(previousLayer.length).fill(0); //init gradientInput
    //     for (let i = 0; i < weights.length; i++) {
    //         const sigmoidDerivative = currentActivatedLayer[i] * (1 - currentActivatedLayer[i]);
    //         for (let j = 0; j < previousLayer.length; j++) {
    //             const grad = gradOutputs[i] * sigmoidDerivative * previousLayer[j];
    //             gradientInput[j] += gradOutputs[i] * sigmoidDerivative * weights[i][j];
    //             weights[i][j] -= this.learning_rate * grad;
    //         }
    //         bias[i] -= this.learning_rate * gradOutputs[i] * sigmoidDerivative;
    //     }
    //     return gradientInput;
    // }
    backwardPass(previousLayer, currentActivatedLayer, gradOutputs, weights, bias) {
        const gradientInput = new Array(previousLayer.length).fill(0);
        for (let i = 0; i < weights.length; i++) {
            const activation = currentActivatedLayer[i];
            if (!isFinite(activation))
                continue;
            const sigmoidDerivative = activation * (1 - activation);
            let gradOut = gradOutputs[i];
            if (!isFinite(gradOut)) {
                gradOut = 0;
            }
            // LESS aggressive gradient clipping - allow larger gradients
            gradOut = Math.max(-5, Math.min(5, gradOut));
            for (let j = 0; j < previousLayer.length; j++) {
                const prevValue = previousLayer[j];
                if (!isFinite(prevValue))
                    continue;
                const grad = gradOut * sigmoidDerivative * prevValue;
                // INCREASED clipping threshold to allow more learning
                const clippedGrad = Math.max(-1.0, Math.min(1.0, grad));
                gradientInput[j] += gradOut * sigmoidDerivative * weights[i][j];
                weights[i][j] -= this.learning_rate * clippedGrad;
                // Less aggressive weight clipping
                weights[i][j] = this.clipWeight(weights[i][j]);
            }
            const biasGrad = gradOut * sigmoidDerivative;
            const clippedBiasGrad = Math.max(-1.0, Math.min(1.0, biasGrad));
            bias[i] -= this.learning_rate * clippedBiasGrad;
            bias[i] = this.clipWeight(bias[i], -10, 10);
        }
        return gradientInput;
    }
    backPropagate(loss, MSEgradient) {
        const newMSE = this.backwardPass(this.activated_hidden_layer, this.plausibilities, MSEgradient, this.W2, this.b2);
        this.backwardPass(this.input, this.activated_hidden_layer, newMSE, this.W1, this.b1);
    }
    predict(input) {
        if (!input || input.length !== this.input_size) {
            console.error('Invalid input size to predict');
            return new Array(this.output_size).fill(1 / this.output_size);
        }
        const cleanInput = input.map(v => {
            if (!isFinite(v))
                return 0;
            return Math.max(-10, Math.min(10, v));
        });
        this.input = cleanInput;
        const static_hidden_layer = this.vectMatrixMult(cleanInput, this.W1);
        this.activated_hidden_layer = static_hidden_layer.map((x, i) => {
            const biased = x + this.b1[i];
            return this.sigmoid(biased);
        });
        const static_output = this.vectMatrixMult(this.activated_hidden_layer, this.W2);
        this.plausibilities = static_output.map((x, i) => {
            const biased = x + this.b2[i];
            return this.sigmoid(biased);
        });
        const safeProbs = this.plausibilities.map(p => {
            if (!isFinite(p))
                return 1 / this.output_size;
            return Math.max(0.01, Math.min(0.99, p));
        });
        return safeProbs;
    }
}
