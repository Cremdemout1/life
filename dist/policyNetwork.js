import { createWeightMatrix, createBias } from "./random_gen.js";
export class NN {
    constructor(cell, learning_rate = 0.1, iterations = 50) {
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
    }
}
