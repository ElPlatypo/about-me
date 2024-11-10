import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SliderModule } from 'primeng/slider';
import { PixelCanvasComponent } from '../pixel-canvas/pixel-canvas.component';
import { Network, NeuralNetworkUtils } from './neural-network-utils';

@Component({
  selector: 'app-neural-network-visualizer',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    SliderModule,
    ReactiveFormsModule,
    PixelCanvasComponent,
  ],
  templateUrl: './neural-network-visualizer.component.html',
  styleUrl: './neural-network-visualizer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NeuralNetworkVisualizerComponent implements OnInit {
  private fb = inject(FormBuilder);
  @ViewChild(PixelCanvasComponent) pixelCanvas!: PixelCanvasComponent;

  network = new Network();
  neuronPositions: { x: number; y: number }[][] = [];
  lineColors: string[][][] = [];
  circleColors: string[][] = [];

  layers = input.required<number>();
  neuronsPerLayer = input.required<number[]>();
  showWeights = input.required<boolean>();
  playgroundMode = input<boolean>(false);
  trainMode = input<boolean>(false);

  baseWidth = 900; // 3 units wide
  baseHeight = 600; // 2 units high
  neuronRadius = 30;

  loading = signal<boolean>(true);

  form: any = null;

  ngOnInit(): void {
    //setup network
    this.network.layers = this.layers();
    this.network.neuronsPerLayer = this.neuronsPerLayer();
    this.network.initializeNeurons();
    this.network.initializeWeights();
    this.network.calculateNeurons();

    //calculate graphics
    this.updateGraphics();

    this.network.updateGraphics.subscribe((v) => {
      if (v) {
        this.updateGraphics();
      }
    });

    this.createForm();
    this.loading.set(false);
  }

  updateGraphics(){
    this.computeNeuronPositions();
    this.computeColors();
  }

  evaluate(input: number[]) {
    this.network.evaluate(input);
    this.computeColors();
  }

  randomizeInputs() {
    this.network.randomizeAndRecalculate();
    this.computeColors();
  }

  randomizeWeights() {
    this.network.initializeWeights();
    this.network.calculateNeurons();
    this.computeColors();
  }

  private createForm() {
    this.form = this.fb.group({
      layer1Neurons: new FormControl(this.neuronsPerLayer()[0]),
      layer2Neurons: new FormControl(this.neuronsPerLayer()[1]),
      layer3Neurons: new FormControl(this.neuronsPerLayer()[2]),
    });
  }

  computeNeuronPositions() {
    const effectiveWidth = this.baseWidth - this.neuronRadius * 2;
    const effectiveHeight = this.baseHeight - this.neuronRadius * 2;
    const layerCount = this.network.neurons.length;

    this.neuronPositions = [];

    for (let i = 0; i < layerCount; i++) {
      const layer = this.network.neurons[i];
      const layerPositions: { x: number; y: number }[] = [];
      for (let j = 0; j < layer.length; j++) {
        const x = this.neuronRadius + (effectiveWidth / (layerCount - 1)) * i;
        const y =
          this.neuronRadius + (effectiveHeight / (layer.length + 1)) * (j + 1);
        layerPositions.push({ x, y });
      }
      this.neuronPositions.push(layerPositions);
    }
  }

  getNeuronX(layerIndex: number, neuronIndex: number): number {
    return this.neuronPositions[layerIndex][neuronIndex].x;
  }

  getNeuronY(layerIndex: number, neuronIndex: number): number {
    return this.neuronPositions[layerIndex][neuronIndex].y;
  }

  // Compute colors for lines and circles only once
  computeColors() {
    const layers = this.network.neurons;

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

  // Compute the color for a line based on the weight
  computeLineColor(
    layerIndex: number,
    neuronIndex: number,
    nextNeuronIndex: number
  ): string {
    const weight =
      this.network.weights[layerIndex][neuronIndex][nextNeuronIndex];
    const sigmoidValue = NeuralNetworkUtils.sigmoid(weight, 2);
    const red = Math.floor(255 * (1 - sigmoidValue));
    const green = Math.floor(255 * sigmoidValue);
    return `rgb(${red}, ${green}, 0)`;
  }

  // Compute the color for a circle based on the neuron value
  computeCircleColor(layerIndex: number, neuronIndex: number): string {
    const weight = this.network.neurons[layerIndex][neuronIndex];
    const red = Math.floor(255 * (1 - weight));
    const green = Math.floor(255 * weight);
    return `rgb(${red}, ${green}, 0)`;
  }

  // Access precomputed line color
  getLineColor(
    layerIndex: number,
    neuronIndex: number,
    nextNeuronIndex: number
  ): string {
    return this.lineColors[layerIndex][neuronIndex][nextNeuronIndex];
  }

  // Access precomputed circle color
  getCircleColor(layerIndex: number, neuronIndex: number): string {
    return this.circleColors[layerIndex][neuronIndex];
  }

  // Calculate the midpoint for the weights label
  getMidpointX(
    layerIndex: number,
    neuronIndex: number,
    nextLayerIndex: number,
    nextNeuronIndex: number
  ): number {
    const x1 = this.getNeuronX(layerIndex, neuronIndex);
    const x2 = this.getNeuronX(nextLayerIndex, nextNeuronIndex);

    return (x1 + x2) / 2;
  }

  getMidpointY(
    layerIndex: number,
    neuronIndex: number,
    nextLayerIndex: number,
    nextNeuronIndex: number
  ): number {
    const y1 = this.getNeuronY(layerIndex, neuronIndex);
    const y2 = this.getNeuronY(nextLayerIndex, nextNeuronIndex);

    return (y1 + y2) / 2 - 10; // Slightly above the midpoint
  }

  //// Shuffle function to randomly reorder the training data
  //flattenAndShuffleTrainingData() {
  //  const flattenedData = [];
  //
  //  // Flatten trainingData into a single array of examples
  //  for (const example of this.trainingData()) {
  //    const targetDigit = parseInt(Object.keys(example)[0], 10); // Get the digit as a number
  //    for (const inputPixels of example[targetDigit]) {
  //      // Each item now includes both the input pixels and the target digit
  //      flattenedData.push({ targetDigit, inputPixels });
  //    }
  //  }
  //
  //  // Shuffle the flattened array
  //  for (let i = flattenedData.length - 1; i > 0; i--) {
  //    const j = Math.floor(Math.random() * (i + 1));
  //    [flattenedData[i], flattenedData[j]] = [
  //      flattenedData[j],
  //      flattenedData[i],
  //    ];
  //  }
  //
  //  return flattenedData;
  //}
  //
  //async train(delay: number = 0) {
  //  // Prepare and shuffle the training data before training
  //  const shuffledData = this.flattenAndShuffleTrainingData();
  //
  //  for (let epoch = 0; epoch < this.epochs(); epoch++) {
  //    console.log(`Epoch ${epoch + 1}/${this.epochs()}`);
  //
  //    // Loop through each shuffled example
  //    for (const example of shuffledData) {
  //      const { targetDigit, inputPixels } = example;
  //
  //      // Forward pass: Set input layer and calculate outputs
  //      this.initializeNeuronsWithValues(inputPixels);
  //      this.pixelCanvas.setPixels();
  //      this.calculateNeurons();
  //
  //      // Convert the target digit to a target output array
  //      const targetOutput = Array(10).fill(0);
  //      targetOutput[targetDigit] = 1; // Set the correct output for the target digit
  //
  //      // Backpropagation: Calculate errors and adjust weights
  //      this.backpropagateError(targetOutput);
  //
  //      // Add delay between each pass
  //      if (delay > 0) {
  //        await this.sleep(delay);
  //      }
  //    }
  //  }
  //  console.log('Training complete');
  //}
  //
  //sleep(ms: number) {
  //  return new Promise((resolve) => setTimeout(resolve, ms));
  //}
  //
  //private backpropagateError(targetOutput: number[]) {
  //  const neurons = this.neurons();
  //  const weights = this.weights();
  //  const learningRate = this.learningRate();
  //
  //  // Initialize the error storage correctly
  //  let errors: number[][] = Array.from({ length: neurons.length }, () => []);
  //
  //  // Calculate errors for the output layer
  //  for (let j = 0; j < neurons[neurons.length - 1].length; j++) {
  //    const output = neurons[neurons.length - 1][j];
  //    const error = (targetOutput[j] - output) * output * (1 - output); // Derivative of sigmoid
  //    errors[neurons.length - 1][j] = error;
  //  }
  //
  //  // Backpropagate errors to hidden layers
  //  for (let i = neurons.length - 2; i > 0; i--) {
  //    for (let j = 0; j < neurons[i].length; j++) {
  //      let sumError = 0;
  //      for (let k = 0; k < neurons[i + 1].length; k++) {
  //        sumError += errors[i + 1][k] * weights[i][j][k];
  //      }
  //      errors[i][j] = sumError * neurons[i][j] * (1 - neurons[i][j]);
  //    }
  //  }
  //
  //  // Update weights based on errors
  //  for (let i = 0; i < weights.length; i++) {
  //    for (let j = 0; j < weights[i].length; j++) {
  //      for (let k = 0; k < weights[i][j].length; k++) {
  //        weights[i][j][k] += learningRate * errors[i + 1][k] * neurons[i][j];
  //      }
  //    }
  //  }
  //
  //  // Ensure weights update
  //  this.weights.set([...weights]);
  //}
  //
  //async trainOnButtonPress() {
  //  this.randomizeAndRecalculate(); // Reset initial weights and neuron values
  //  this.train(100);
  //}

  //processTrainDemoOutput(array: boolean[]) {
  //  this.initializeNeuronsWithValues(array.map((v) => (v === true ? 1 : 0)));
  //  this.calculateNeurons();
  //}
}
