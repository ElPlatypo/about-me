import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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
import {
  Network,
  NetworkOptions,
  NeuralNetworkUtils,
} from './neural-network-utils';

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

  network = new Network(inject(ChangeDetectorRef));
  neuronPositions: { x: number; y: number }[][] = [];
  lineColors: string[][][] = [];
  circleColors: string[][] = [];

  showWeights = input<boolean>(false);
  playgroundMode = input<boolean>(false);
  trainMode = input<boolean>(false);
  inputDemo = input<boolean>(false);
  expandHeight = input<boolean>(false);

  //network options
  neuronsPerLayer = input<number[]>([1, 1, 1]);
  neuronsActivations = input<string[]>(['relu', 'sigmoid']);
  learningRate = input<number>(0.1);
  epochs = input<number>(50);
  batchSize = input<number>(50);

  baseWidth = 900; // 3 units wide
  baseHeight = 600; // 2 units high
  neuronRadius = 30;
  minNeuronRadius = 15; // Minimum radius for neurons

  loading = signal<boolean>(true);

  form: any = null;

  ngOnInit(): void {
    this.network.updateGraphics.subscribe((v) => {
      if (v) {
        this.updateGraphics();
      }
    });

    this.network.computeColors.subscribe((v) => {
      if (v) {
        this.computeColors();
      }
    });

    //setup network
    const opts: NetworkOptions = {
      neuronsPerLayer: this.neuronsPerLayer(),
      neuronsActivations: this.neuronsActivations(),
      learningRate: this.learningRate(),
      epochs: this.epochs(),
      batchSize: this.batchSize(),
    };
    //this.network.layers = this.layers();
    //this.network.neuronsPerLayer = this.neuronsPerLayer();
    //this.network.batchSize = 999;
    //this.network.epochs = 100;
    //this.network.learningRate = 0.01;
    //this.network.neuronsActivations = ['relu', 'sigmoid'];
    this.network.opts = opts;
    this.network.initializeNeurons();
    this.network.initializeWeights();
    this.network.calculateNeurons();

    this.createForm();
    this.loading.set(false);
  }

  updateGraphics() {
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

  train() {
    const trainData = NeuralNetworkUtils.generate7by7Dataset();
    this.network.trainingData = trainData;
    this.network.trainNetwork(10);
  }

  private createForm() {
    this.form = this.fb.group({
      layer1Neurons: new FormControl(this.neuronsPerLayer()![0]),
      layer2Neurons: new FormControl(this.neuronsPerLayer()![1]),
      layer3Neurons: new FormControl(this.neuronsPerLayer()![2]),
    });
  }

  computeNeuronPositions() {
    const effectiveWidth = this.baseWidth - this.neuronRadius * 2;
    let effectiveHeight = this.baseHeight - this.neuronRadius * 2;

    if (this.expandHeight()) {
      // Dynamically calculate height based on the layer with the most neurons
      this.neuronRadius = Math.min(this.neuronRadius, this.minNeuronRadius);
      const maxNeuronsInLayer = Math.max(
        ...this.network.neurons.map((layer) => layer.length)
      );
      effectiveHeight = this.neuronRadius * 2 * (maxNeuronsInLayer + 1); // Additional space to avoid overlap

      // Update baseHeight if expandHeight mode is active
      this.baseHeight = effectiveHeight + this.neuronRadius * 2;
    }

    const layerCount = this.network.neurons.length;
    this.neuronPositions = [];

    for (let i = 0; i < layerCount; i++) {
      const layer = this.network.neurons[i];
      const layerPositions: { x: number; y: number }[] = [];

      // Adjust x-position to stretch neurons across the entire width
      const x = (effectiveWidth / (layerCount - 1)) * i + this.neuronRadius;

      for (let j = 0; j < layer.length; j++) {
        // Calculate y-position based on the number of neurons in the layer
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

  computeLineColor(
    layerIndex: number,
    neuronIndex: number,
    nextNeuronIndex: number
  ): string {
    const weight =
      this.network.weights[layerIndex][neuronIndex][nextNeuronIndex];

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
}
