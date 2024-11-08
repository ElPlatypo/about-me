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

  layers = input.required<number>();
  neuronsPerLayer = input.required<number[]>();
  showWeights = input.required<boolean>();
  playgroundMode = input<boolean>(false);
  trainMode = input<boolean>(false);
  setFirstLayer = input<number[]>([]);
  trainingData = input<{ [digit: number]: number[][] }[]>([]);
  learningRate = input<number>(0.1);
  epochs = input<number>(10);
  firstLayerBool = computed(() => this.neurons()[0].map((v) => v === 1));

  setResult = effect(
    () => {
      if (this.setFirstLayer().length > 0)
      this.initializeNeuronsWithValues(this.setFirstLayer());
      this.calculateNeurons();
      return true;
    },
    { allowSignalWrites: true }
  );

  baseWidth = 900; // 3 units wide
  baseHeight = 600; // 2 units high
  neuronRadius = 30;

  neurons = signal<number[][]>([]);
  weights = signal<number[][][]>([]);
  loading = signal<boolean>(true);
  _layers = signal<number>(0);
  _neuronsPerLayer = signal<number[]>([]);

  form: any = null;

  ngOnInit(): void {
    this._layers.set(this.layers());
    this._neuronsPerLayer.set(this.neuronsPerLayer());
    this.initializeNeurons();
    this.initializeWeights();
    this.calculateNeurons();
    this.createForm();
    this.loading.set(false);
  }

  private createForm() {
    this.form = this.fb.group({
      layer1Neurons: new FormControl(this._neuronsPerLayer()[0]),
      layer2Neurons: new FormControl(this._neuronsPerLayer()[1]),
      layer3Neurons: new FormControl(this._neuronsPerLayer()[2]),
    });
  }

  changeNeurons(amount: number | undefined, layer: number) {
    if (this._neuronsPerLayer()[layer] === amount) return;
    var old = this._neuronsPerLayer();
    old[layer] = amount ?? 1;
    this._neuronsPerLayer.set(old);
    this.initializeNeurons();
    this.initializeWeights();
    this.calculateNeurons();
  }

  // Initialize neurons for the first layer with random values
  initializeNeurons() {
    this.neurons.set(
      this._neuronsPerLayer().map((neuronsCount, index) => {
        if (index === 0) {
          // First layer: Initialize randomly
          return Array.from({ length: neuronsCount }, () => Math.random());
        } else {
          // Subsequent layers: Empty, to be calculated later
          return Array.from({ length: neuronsCount }, () => 0);
        }
      })
    );
  }

  initializeNeuronsWithValues(firstLayerValues: number[]) {
    this.neurons.set(
      this._neuronsPerLayer().map((neuronsCount, index) => {
        if (index === 0) {
          // First layer: Use provided values or initialize randomly
          return firstLayerValues;
        } else {
          // Subsequent layers: Empty, to be calculated later
          return Array.from({ length: neuronsCount }, () => 0);
        }
      })
    );
  }

  // Initialize weights with random values between -1 and 1
  initializeWeights() {
    var newWeights = [];
    for (let i = 0; i < this.neurons().length - 1; i++) {
      const layerWeights = [];
      for (let j = 0; j < this.neurons()[i].length; j++) {
        const nextLayerWeights = [];
        for (let k = 0; k < this.neurons()[i + 1].length; k++) {
          // Random weights between -1 and 1
          nextLayerWeights.push(Math.random() * 2 - 1);
        }
        layerWeights.push(nextLayerWeights);
      }
      newWeights.push(layerWeights);
    }
    this.weights.set(newWeights);
  }

  calculateNeurons() {
    for (let i = 1; i < this.neurons().length; i++) {
      for (let j = 0; j < this.neurons()[i].length; j++) {
        let sum = 0;
        for (let k = 0; k < this.neurons()[i - 1].length; k++) {
          sum += this.neurons()[i - 1][k] * this.weights()[i - 1][k][j];
        }
        // Apply sigmoid activation
        var currentNeurons = this.neurons();
        currentNeurons[i][j] = this.sigmoid(sum);
        this.neurons.set(currentNeurons);
      }
    }
  }

  randomizeAndRecalculate() {
    // Reinitialize the first layer with new random values
    var curr = this.neurons();
    curr[0] = Array.from({ length: this._neuronsPerLayer()[0] }, () =>
      Math.random()
    );
    this.neurons.set(curr);

    // Recalculate neurons in subsequent layers
    this.calculateNeurons();
  }

  async train(delay: number = 0) {
    for (let epoch = 0; epoch < this.epochs(); epoch++) {
      console.log(`Epoch ${epoch + 1}/${this.epochs()}`);

      // Loop through each item in the trainingData array (for each digit)
      for (const example of this.trainingData()) {
        // Get the digit (key)
        const targetDigit = parseInt(Object.keys(example)[0], 10); // Get the digit as a number

        // Loop through all the examples for this digit (the pixel arrays)
        for (const inputPixels of example[targetDigit]) {
          // Forward pass: Set input layer and calculate outputs
          this.initializeNeuronsWithValues(inputPixels);
          this.pixelCanvas.setPixels();
          this.calculateNeurons();

          // Convert the target digit to a target output array
          const targetOutput = Array(10).fill(0);
          targetOutput[targetDigit] = 1; // Set the correct output for the target digit

          // Backpropagation: Calculate errors and adjust weights
          this.backpropagateError(targetOutput);

          // Add delay between each pass
          if (delay > 0) {
            await this.sleep(delay);
          }
        }
      }
    }
    console.log('Training complete');
  }

  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private backpropagateError(targetOutput: number[]) {
    const neurons = this.neurons();
    const weights = this.weights();
    const learningRate = this.learningRate();

    // Error storage for each layer
    let errors: number[][] = Array(neurons.length)
      .fill([])
      .map(() => []);

    // Calculate errors for the output layer
    for (let j = 0; j < neurons[neurons.length - 1].length; j++) {
      const output = neurons[neurons.length - 1][j];
      const error = (targetOutput[j] - output) * output * (1 - output); // Derivative of sigmoid
      errors[neurons.length - 1][j] = error;
    }

    // Backpropagate errors to hidden layers
    for (let i = neurons.length - 2; i > 0; i--) {
      for (let j = 0; j < neurons[i].length; j++) {
        let sumError = 0;
        for (let k = 0; k < neurons[i + 1].length; k++) {
          sumError += errors[i + 1][k] * weights[i][j][k];
        }
        errors[i][j] = sumError * neurons[i][j] * (1 - neurons[i][j]);
      }
    }

    // Update weights
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights[i].length; j++) {
        for (let k = 0; k < weights[i][j].length; k++) {
          weights[i][j][k] += learningRate * errors[i + 1][k] * neurons[i][j];
        }
      }
    }

    // Update the weights signal with the new weights
    this.weights.set(weights);
  }

  async trainOnButtonPress() {
    this.randomizeAndRecalculate(); // Reset initial weights and neuron values
    this.train(200);
  }

  // Map the weight to a color in the gradient
  getLineColor(
    layerIndex: number,
    neuronIndex: number,
    nextNeuronIndex: number
  ): string {
    const weight = this.weights()[layerIndex][neuronIndex][nextNeuronIndex];

    // Apply the sigmoid function to map the weight (-1 to 1) to a value between 0 and 1
    const sigmoidValue = this.sigmoid(weight, 2); // '1' here controls the steepness of the sigmoid curve

    // Use the sigmoid value to generate red and green color values
    const red = Math.floor(255 * (1 - sigmoidValue)); // Red decreases as sigmoid value increases
    const green = Math.floor(255 * sigmoidValue); // Green increases as sigmoid value increases

    return `rgb(${red}, ${green}, 0)`; // Return the color in rgb format
  }

  getCircleColor(layerIndex: number, neuronIndex: number): string {
    const weight = this.neurons()[layerIndex][neuronIndex];

    const red = Math.floor(255 * (1 - weight)); // Red decreases as sigmoid value increases
    const green = Math.floor(255 * weight); // Green increases as sigmoid value increases

    return `rgb(${red}, ${green}, 0)`; // Return the color in rgb format
  }

  sigmoid(x: number, k: number = 1): number {
    return 1 / (1 + Math.exp(-k * x));
  }

  // Calculate neuron X position with padding based on layer index
  getNeuronX(layerIndex: number): number {
    const effectiveWidth = this.baseWidth - this.neuronRadius * 2;
    return (
      this.neuronRadius +
      (effectiveWidth / (this.neurons().length - 1)) * layerIndex
    );
  }

  // Calculate neuron Y position with padding based on neuron index and layer length
  getNeuronY(neuronIndex: number, layerLength: number): number {
    const effectiveHeight = this.baseHeight - this.neuronRadius * 2;
    const spacing = effectiveHeight / (layerLength + 1);
    return this.neuronRadius + spacing * (neuronIndex + 1);
  }

  // Calculate the midpoint for the weights label
  getMidpointX(
    layerIndex: number,
    neuronIndex: number,
    nextLayerIndex: number,
    nextNeuronIndex: number
  ): number {
    const x1 = this.getNeuronX(layerIndex);
    const y1 = this.getNeuronY(neuronIndex, this.neurons()[layerIndex].length);
    const x2 = this.getNeuronX(nextLayerIndex);
    const y2 = this.getNeuronY(
      nextNeuronIndex,
      this.neurons()[nextLayerIndex].length
    );

    return (x1 + x2) / 2;
  }

  getMidpointY(
    layerIndex: number,
    neuronIndex: number,
    nextLayerIndex: number,
    nextNeuronIndex: number
  ): number {
    const y1 = this.getNeuronY(neuronIndex, this.neurons()[layerIndex].length);
    const y2 = this.getNeuronY(
      nextNeuronIndex,
      this.neurons()[nextLayerIndex].length
    );

    return (y1 + y2) / 2 - 10; // Slightly above the midpoint
  }
}
