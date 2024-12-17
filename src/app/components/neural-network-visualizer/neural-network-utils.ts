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

    return this.ShuffleData(dataset);
  }

  static ShuffleData(dataset: { input: number[]; label: number[] }[]) {
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

export class NetworkGraphicOptions {
  baseWidth: number = 900; // 3 units wide
  baseHeight: number = 600; // 2 units high
  neuronRadius: number = 30;
  minNeuronRadius: number = 15;
  expanded: boolean = false;
}

export class Network {
  cdRef: ChangeDetectorRef;
  opts: NetworkOptions = new NetworkOptions();
  gOpts: NetworkGraphicOptions = new NetworkGraphicOptions();
  trainingData: { input: number[]; label: number[] }[] = [];

  //core values
  neurons: number[][] = [];
  weights: number[][][] = [];

  //graphics
  neuronPositions: { x: number; y: number }[][] = [];
  lineColors: string[][][] = [];
  circleColors: string[][] = [];

  firstLayerBool: boolean[] = [];
  trainLoss = new Subject<number[]>();

  constructor(cdRef: ChangeDetectorRef) {
    this.cdRef = cdRef;
  }

  evaluate(input: number[]) {
    this.neurons[0] = input;
    this.firstLayerBool = this.neurons[0].map((v) => (v === 1 ? true : false));
    this.calculateNeurons();
  }

  computeNeuronPositions() {
    const effectiveWidth = this.gOpts.baseWidth - this.gOpts.neuronRadius * 2;
    let effectiveHeight = this.gOpts.baseHeight - this.gOpts.neuronRadius * 2;

    if (this.gOpts.expanded) {
      // Dynamically calculate height based on the layer with the most neurons
      this.gOpts.neuronRadius = Math.min(
        this.gOpts.neuronRadius,
        this.gOpts.minNeuronRadius
      );
      const maxNeuronsInLayer = Math.max(
        ...this.neurons.map((layer) => layer.length)
      );
      effectiveHeight = this.gOpts.neuronRadius * 2 * (maxNeuronsInLayer + 1); // Additional space to avoid overlap

      // Update baseHeight if expandHeight mode is active
      this.gOpts.baseHeight = effectiveHeight + this.gOpts.neuronRadius * 2;
    }

    const layerCount = this.neurons.length;
    this.neuronPositions = [];

    for (let i = 0; i < layerCount; i++) {
      const layer = this.neurons[i];
      const layerPositions: { x: number; y: number }[] = [];

      // Adjust x-position to stretch neurons across the entire width
      const x =
        (effectiveWidth / (layerCount - 1)) * i + this.gOpts.neuronRadius;

      for (let j = 0; j < layer.length; j++) {
        // Calculate y-position based on the number of neurons in the layer
        const y =
          this.gOpts.neuronRadius +
          (effectiveHeight / (layer.length + 1)) * (j + 1);
        layerPositions.push({ x, y });
      }
      this.neuronPositions.push(layerPositions);
    }
  }

  // Compute colors for lines and circles only once
  computeColors() {
    const layers = this.neurons;

    this.lineColors = [];
    this.circleColors = [];

    // Precompute line colors based on weights
    for (let i = 0; i < layers.length - 1; i++) {
      const layerColors: string[][] = [];
      for (let j = 0; j < layers[i].length; j++) {
        const neuronColors: string[] = [];
        for (let k = 0; k < layers[i + 1].length; k++) {
          // Directly call getLineColor to compute color based on weights
          neuronColors.push(this.computeLineColor(i, j, k));
        }
        layerColors.push(neuronColors);
      }
      this.lineColors.push(layerColors);
    }

    // Precompute circle colors based on neuron values
    for (let i = 0; i < layers.length; i++) {
      const neuronColors: string[] = [];
      for (let j = 0; j < layers[i].length; j++) {
        // Directly call getCircleColor to compute color based on neuron values
        neuronColors.push(this.computeCircleColor(i, j));
      }
      this.circleColors.push(neuronColors);
    }
  }

  computeLineColor(
    layerIndex: number,
    neuronIndex: number,
    nextNeuronIndex: number
  ): string {
    const weight = this.weights[layerIndex][neuronIndex][nextNeuronIndex];

    // Normalize the weight to the range [-1, 1]
    const normalizedWeight = Math.tanh(weight);

    // Determine color components
    const red = normalizedWeight < 0 ? Math.floor(255 * -normalizedWeight) : 0; // Red for negative weights
    const green = normalizedWeight > 0 ? Math.floor(255 * normalizedWeight) : 0; // Green for positive weights

    // Set alpha based on the absolute value of the normalized weight
    const alpha = Math.abs(normalizedWeight); // Range [0, 1], closer to zero is more transparent

    return `rgba(${red}, ${green}, 0, ${alpha})`;
  }

  // Compute the color for a circle based on the neuron value
  computeCircleColor(layerIndex: number, neuronIndex: number): string {
    const weight = this.neurons[layerIndex][neuronIndex];
    const red = Math.floor(255 * (1 - weight));
    const green = Math.floor(255 * weight);
    return `rgb(${red}, ${green}, 0)`;
  }

  changeNeuronsForLayer(amount: number | undefined, layer: number) {
    if (this.opts.neuronsPerLayer[layer] === amount) return;
    this.opts.neuronsPerLayer[layer] = amount ?? 1;
    this.initializeNeurons();
    this.initializeWeights();
    this.calculateNeurons();
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
  }

  async trainNetwork(delay: number = 0) {
    var trainLoss = [];
    for (let epoch = 0; epoch < this.opts.epochs; epoch++) {
      console.log('Started epoch: ' + (epoch + 1) + '/' + this.opts.epochs);
      let batch = 0;
      let totalEpochLoss = 0;

      //shuffle data
      let data = NeuralNetworkUtils.ShuffleData(this.trainingData);

      for (let sample of data) {
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
          this.computeColors();
          this.cdRef.detectChanges();
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
      trainLoss.push(totalEpochLoss);
      this.trainLoss.next(trainLoss);
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
            this.opts.learningRate *
            deltas[layer + 1][k] *
            this.neurons[layer][j];
        }
      }
    }
  }
}
