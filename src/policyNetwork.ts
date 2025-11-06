import { createWeightMatrix, createBias } from "./random_gen.js";
import { Cell } from "./cell.js";

export class  NN{
    learning_rate: number;
    epoch: number;
    cell: Cell | null;

    input_size: number = 8;
    hidden_layer_size: number = 16;
    output_size: number = 11;

    input: number[];
    activated_hidden_layer: number[];
    plausibilities: number[];
    
    W1: number[][];
    W2: number[][];

    b1: number[];
    b2: number[];

    constructor(cell: Cell | null, learning_rate: number = 0.1, iterations: number = 50) {
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

    clone(newCell: Cell, mutate = true): NN {
        const clone = new NN(newCell, this.learning_rate, this.epoch);
        if (mutate) {
            const mutationRate = 0.02; // tweak this
            const mutationStrength = 0.05; // size of weight noise
    
            const mutateValue = (v: number) =>
                Math.random() < mutationRate
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

    private backwardPass(previousLayer: number[], //back propagation
                 currentActivatedLayer: number[], 
                 gradOutputs: number[], 
                 weights: number[][], 
                 bias: number[]): number[] {
        
        const gradientInput: number[] = new Array(previousLayer.length).fill(0); //init gradientInput
        
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

    public backPropagate(loss: number, MSEgradient: number[]) {
        const newMSE = this.backwardPass(this.activated_hidden_layer, this.plausibilities, MSEgradient, this.W2, this.b2);
        this.backwardPass(this.input, this.activated_hidden_layer, newMSE, this.W1, this.b1);
    }
    
    public predict(input: number[]): number[] {
        const static_hidden_layer: number[] = this.vectMatrixMult(input, this.W1);
        this.activated_hidden_layer = static_hidden_layer.map((x, i) => this.sigmoid(x + this.b1[i]));
        
        const static_output = this.vectMatrixMult(this.activated_hidden_layer, this.W2);
        this.plausibilities = static_output.map((x, i) => this.sigmoid(x + this.b2[i]));

        return this.plausibilities;
    }
}