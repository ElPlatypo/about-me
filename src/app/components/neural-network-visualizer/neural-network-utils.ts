import { output, signal } from "@angular/core";
import { Subject } from "rxjs";

export class NeuralNetworkUtils {
  // 3x5 digit representations (flattened)
  zero = [1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1];
  one = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
  two = [1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1];
  three = [1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1];
  four = [1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1];
  five = [1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1];
  six = [1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1];
  seven = [1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
  eight = [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1];
  nine = [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1];

  // All digits for easy access
  digits = [
    this.zero,
    this.one,
    this.two,
    this.three,
    this.four,
    this.five,
    this.six,
    this.seven,
    this.eight,
    this.nine,
  ];

  // Method to generate the dataset
  generateDataset(samplesPerDigit: number): {
    data: number[][];
    labels: number[];
  } {
    const augmentedData: number[][] = [];
    const labels: number[] = [];

    for (let label = 0; label < this.digits.length; label++) {
      const digit = this.digits[label];

      for (let i = 0; i < samplesPerDigit; i++) {
        const shiftedDigit = this.embedAndShift(digit, 7, 7);
        augmentedData.push(shiftedDigit);
        labels.push(label);
      }
    }

    return { data: augmentedData, labels: labels };
  }

  // Method to embed and shift a 3x5 digit within a 7x7 frame and return as 1x49 array
  embedAndShift(digit: number[], rows: number, cols: number): number[] {
    const embedded = Array(rows * cols).fill(0); // Create a 1x49 (7x7) array filled with zeros

    // Randomly choose a top-left position within the 7x7 frame
    const maxRowShift = rows - 5;
    const maxColShift = cols - 3;
    const rowShift = Math.floor(Math.random() * (maxRowShift + 1));
    const colShift = Math.floor(Math.random() * (maxColShift + 1));

    // Place the 3x5 digit in the 7x7 frame at the random position
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        const sourceIndex = row * 3 + col;
        const targetIndex = (row + rowShift) * cols + (col + colShift);
        embedded[targetIndex] = digit[sourceIndex];
      }
    }

    return embedded; // Returns the flattened 1x49 array
  }

  static sigmoid(x: number, k: number = 1): number {
    return 1 / (1 + Math.exp(-k * x));
  }
}

export class Network {
  layers: number;
  neuronsPerLayer: number[];
  trainingData: { [digit: number]: number[][] }[] = [];
  learningRate: number = 0.1;
  epochs: number = 10;

  //core values
  neurons: number[][] = [];
  weights: number[][][] = [];

  updateGraphics = new Subject<boolean>();

  constructor();
  constructor(layers?: number, neuronsPerLayer?: number[]);
  constructor(
    layers?: number,
    neuronsPerLayer?: number[],
    weights?: number[][][]
  ) {
    this.layers = layers ?? 3;
    this.neuronsPerLayer = neuronsPerLayer ?? [3, 3, 3];
    this.weights = weights ?? [];
  }

  evaluate(input: number[]) {
    this.neurons[0] = input;
    this.calculateNeurons();
  }

  changeNeuronsForLayer(amount: number | undefined, layer: number) {
    if (this.neuronsPerLayer[layer] === amount) return;
    this.neuronsPerLayer[layer] = amount ?? 1;
    this.initializeNeurons();
    this.initializeWeights();
    this.calculateNeurons();
    this.updateGraphics.next(true);
  }

  // Initialize neurons for the first layer with random values
  initializeNeurons() {
    this.neurons = this.neuronsPerLayer.map((neuronsCount, index) => {
      if (index === 0) {
        // First layer: Initialize randomly
        return Array.from({ length: neuronsCount }, () => Math.random());
      } else {
        return Array.from({ length: neuronsCount }, () => 0);
      }
    });
  }

  initializeNeuronsWithValues(firstLayerValues: number[]) {
    this.neurons = this.neuronsPerLayer.map((neuronsCount, index) => {
      if (index === 0) {
        // First layer: Use provided values or initialize randomly
        return firstLayerValues;
      } else {
        // Subsequent layers: Empty, to be calculated later
        return Array.from({ length: neuronsCount }, () => 0);
      }
    });
  }

  // Initialize weights with random values between -1 and 1
  initializeWeights() {
    var newWeights = [];
    for (let i = 0; i < this.neurons.length - 1; i++) {
      const layerWeights = [];
      for (let j = 0; j < this.neurons[i].length; j++) {
        const nextLayerWeights = [];
        for (let k = 0; k < this.neurons[i + 1].length; k++) {
          // Random weights between -1 and 1
          nextLayerWeights.push(Math.random() * 2 - 1);
        }
        layerWeights.push(nextLayerWeights);
      }
      newWeights.push(layerWeights);
    }
    this.weights = newWeights;
  }

  calculateNeurons() {
    for (let i = 1; i < this.neurons.length; i++) {
      for (let j = 0; j < this.neurons[i].length; j++) {
        let sum = 0;
        for (let k = 0; k < this.neurons[i - 1].length; k++) {
          sum += this.neurons[i - 1][k] * this.weights[i - 1][k][j];
        }
        // Apply sigmoid activation
        this.neurons[i][j] = NeuralNetworkUtils.sigmoid(sum);
      }
    }
  }

  randomizeAndRecalculate() {
    // Reinitialize the first layer with new random values
    this.neurons[0] = Array.from({ length: this.neuronsPerLayer[0] }, () =>
      Math.random()
    );

    // Recalculate neurons in subsequent layers
    this.calculateNeurons();
  }

  // Map the weight to a color in the gradient
  getLineColor(
    layerIndex: number,
    neuronIndex: number,
    nextNeuronIndex: number
  ): string {
    const weight = this.weights[layerIndex][neuronIndex][nextNeuronIndex];

    // Apply the sigmoid function to map the weight (-1 to 1) to a value between 0 and 1
    const sigmoidValue = NeuralNetworkUtils.sigmoid(weight, 2); // '1' here controls the steepness of the sigmoid curve

    // Use the sigmoid value to generate red and green color values
    const red = Math.floor(255 * (1 - sigmoidValue)); // Red decreases as sigmoid value increases
    const green = Math.floor(255 * sigmoidValue); // Green increases as sigmoid value increases

    return `rgb(${red}, ${green}, 0)`; // Return the color in rgb format
  }

  getCircleColor(layerIndex: number, neuronIndex: number): string {
    const weight = this.neurons[layerIndex][neuronIndex];

    const red = Math.floor(255 * (1 - weight)); // Red decreases as sigmoid value increases
    const green = Math.floor(255 * weight); // Green increases as sigmoid value increases

    return `rgb(${red}, ${green}, 0)`; // Return the color in rgb format
  }
}
