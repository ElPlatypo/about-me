import { ChangeDetectorRef, computed, output, signal } from '@angular/core';
import { Subject } from 'rxjs';

export class NeuralNetworkUtils {
  // 3x5 digit representations (flattened)
  static zero = [1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1];
  static one = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
  static two = [1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1];
  static three = [1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1];
  static four = [1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1];
  static five = [1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1];
  static six = [1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1];
  static seven = [1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
  static eight = [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1];
  static nine = [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1];

  // All digits for easy access
  static digits = [
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
  static generate7by7Dataset(): { input: number[]; label: number[] }[] {
    const dataset: { input: number[]; label: number[] }[] = [];

    for (let k = 0; k < 100; k++) {
      for (let label = 0; label < this.digits.length; label++) {
        const digit = this.digits[label];

        const shiftedDigit = this.embedAndShift(digit, 7, 7);

        // Create a one-hot encoded target array
        const target = Array(this.digits.length).fill(0);
        target[label] = 1;

        // Push the { input, target } object to the dataset
        dataset.push({ input: shiftedDigit, label: target });
      }
    }

    // Shuffle the dataset using Fisher-Yates algorithm
    for (let i = dataset.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      // Swap elements i and j
      [dataset[i], dataset[j]] = [dataset[j], dataset[i]];
    }

    return dataset;
  }

  // Method to embed and shift a 3x5 digit within a 7x7 frame and return as 1x49 array
  static embedAndShift(digit: number[], rows: number, cols: number): number[] {
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

  static sigmoidDerivative(x: number) {
    return this.sigmoid(x) * (1 - this.sigmoid(x));
  }

  static relu(x: number): number {
    return Math.max(0, x);
  }

  static reluDerivative(value: number) {
    return value > 0 ? 1 : 0;
  }
}

export class NetworkOptions {
  neuronsPerLayer: number[] = [];
  neuronsActivations: string[] = [];
  learningRate: number = 0;
  epochs: number = 0;
  batchSize: number = 0;
}

export class Network {
  cdRef: ChangeDetectorRef;
  opts: NetworkOptions = new NetworkOptions();
  trainingData: { input: number[]; label: number[] }[] = [];

  //core values
  neurons: number[][] = [];
  weights: number[][][] = [];

  updateGraphics = new Subject<boolean>();
  computeColors = new Subject<boolean>();
  firstLayerBool: boolean[] = [];
  trainLoss: number[] = [];

  constructor(cdRef: ChangeDetectorRef) {
    this.cdRef = cdRef;
  }

  evaluate(input: number[]) {
    this.neurons[0] = input;
    this.firstLayerBool = this.neurons[0].map((v) => (v === 1 ? true : false));
    this.calculateNeurons();
  }

  changeNeuronsForLayer(amount: number | undefined, layer: number) {
    if (this.opts.neuronsPerLayer[layer] === amount) return;
    this.opts.neuronsPerLayer[layer] = amount ?? 1;
    this.initializeNeurons();
    this.initializeWeights();
    this.calculateNeurons();
    this.updateGraphics.next(true);
  }

  // Initialize neurons for the first layer with random values
  initializeNeurons() {
    this.neurons = this.opts.neuronsPerLayer.map((neuronsCount, index) => {
      if (index === 0) {
        // First layer: Initialize randomly
        return Array.from({ length: neuronsCount }, () => Math.random());
      } else {
        return Array.from({ length: neuronsCount }, () => 0);
      }
    });
    this.updateGraphics.next(true);
  }

  initializeNeuronsWithValues(firstLayerValues: number[]) {
    this.neurons = this.opts.neuronsPerLayer.map((neuronsCount, index) => {
      if (index === 0) {
        // First layer: Use provided values or initialize randomly
        return firstLayerValues;
      } else {
        // Subsequent layers: Empty, to be calculated later
        return Array.from({ length: neuronsCount }, () => 0);
      }
    });
    this.updateGraphics.next(true);
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
    this.computeColors.next(true);
  }

  calculateNeurons() {
    for (let i = 1; i < this.neurons.length; i++) {
      for (let j = 0; j < this.neurons[i].length; j++) {
        let sum = 0;
        for (let k = 0; k < this.neurons[i - 1].length; k++) {
          sum += this.neurons[i - 1][k] * this.weights[i - 1][k][j];
        }
        // Apply activation
        switch (this.opts.neuronsActivations[i - 1]) {
          case 'relu':
            this.neurons[i][j] = NeuralNetworkUtils.relu(sum);
            break;
          case 'sigmoid':
            this.neurons[i][j] = NeuralNetworkUtils.sigmoid(sum);
            break;
        }
      }
    }
    this.computeColors.next(true);
  }

  randomizeAndRecalculate() {
    // Reinitialize the first layer with new random values
    this.neurons[0] = Array.from({ length: this.opts.neuronsPerLayer[0] }, () =>
      Math.random()
    );

    // Recalculate neurons in subsequent layers
    this.calculateNeurons();
  }

  async trainNetwork(delay: number = 0) {
    this.trainLoss = [];
    for (let epoch = 0; epoch < this.opts.epochs; epoch++) {
      console.log('Started epoch: ' + (epoch + 1) + '/' + this.opts.epochs);
      let batch = 0;
      let totalEpochLoss = 0;
      for (let sample of this.trainingData) {
        // Forward pass
        this.evaluate(sample.input);

        // Calculate error for output layer
        let outputError = this.neurons[this.neurons.length - 1].map(
          (output, idx) => sample.label[idx] - output
        );

        // Calculate the loss for this sample (Mean Squared Error)
        const sampleLoss =
          outputError.reduce((acc, error) => acc + error * error, 0) /
          outputError.length;
        totalEpochLoss += sampleLoss; // Add to the total loss for this epoch

        // Backpropagation
        this.backpropagate(outputError);

        batch++;
        if (delay > 0 && batch % this.opts.batchSize === 0) {
          this.cdRef.detectChanges();
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
      this.trainLoss.push(totalEpochLoss);
      console.log('Loss: ' + totalEpochLoss);
    }
    console.log('Training done');
  }

  backpropagate(outputError: number[]) {
    // Initialize deltas array, starting with the output layer deltas
    let deltas: number[][] = [];
    const outputLayerIndex = this.neurons.length - 1;

    // Compute delta for the output layer
    const sigmoidDerivativeValues = this.neurons[outputLayerIndex].map(
      (neuronValue, idx) => {
        switch (this.opts.neuronsActivations[outputLayerIndex - 1]) {
          case 'relu':
            return (
              outputError[idx] * NeuralNetworkUtils.reluDerivative(neuronValue)
            );
          case 'sigmoid':
            return (
              outputError[idx] *
              NeuralNetworkUtils.sigmoidDerivative(neuronValue)
            );
          default:
            return (
              outputError[idx] *
              NeuralNetworkUtils.sigmoidDerivative(neuronValue)
            );
        }
      }
    );

    deltas[outputLayerIndex] = sigmoidDerivativeValues;

    // Backpropagate error through hidden layers
    for (let layer = this.weights.length - 1; layer >= 0; layer--) {
      const currentLayerDeltas = new Array(this.neurons[layer].length).fill(0);
      for (let j = 0; j < this.neurons[layer].length; j++) {
        let error = 0;
        for (let k = 0; k < this.weights[layer][j].length; k++) {
          error += deltas[layer + 1][k] * this.weights[layer][j][k];
        }

        switch (this.opts.neuronsActivations[layer - 1]) {
          case 'relu':
            currentLayerDeltas[j] =
              error * NeuralNetworkUtils.reluDerivative(this.neurons[layer][j]);
            break;
          case 'sigmoid':
            currentLayerDeltas[j] =
              error *
              NeuralNetworkUtils.sigmoidDerivative(this.neurons[layer][j]);
            break;
        }
        deltas[layer] = currentLayerDeltas;

        // Update weights for the layer
        for (let k = 0; k < this.weights[layer][j].length; k++) {
          this.weights[layer][j][k] +=
            this.opts.learningRate * deltas[layer + 1][k] * this.neurons[layer][j];
        }
      }
    }
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
