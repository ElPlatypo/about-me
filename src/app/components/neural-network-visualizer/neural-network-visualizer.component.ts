import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
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
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-neural-network-visualizer',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    SliderModule,
    ReactiveFormsModule,
    PixelCanvasComponent,
    ProgressBarModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './neural-network-visualizer.component.html',
  styleUrl: './neural-network-visualizer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NeuralNetworkVisualizerComponent implements OnInit {
  private fb = inject(FormBuilder);
  cdRef = inject(ChangeDetectorRef);

  network = new Network(this.cdRef);

  //general options
  showWeights = input<boolean>(false);
  playgroundMode = input<boolean>(false);
  trainMode = input<boolean>(false);
  inputDemo = input<boolean>(false);
  expandHeight = input<boolean>(false);
  loading = signal<boolean>(true);

  //network options
  neuronsPerLayer = input<number[]>([1, 1, 1]);
  neuronsActivations = input<string[]>(['relu', 'sigmoid']);
  learningRate = input<number>(0.1);
  epochs = input<number>(50);
  batchSize = input<number>(50);

  lossForFraph = signal<any>({
    datasets: [
      {
        label: 'Loss Value',
        data: [],
      },
    ],
  });
  trainprogress = signal<number>(0);

  form: any = null;

  ngOnInit(): void {
    this.network.trainLoss.subscribe((loss) => {
      let labels: string[] = [];
      for (var i = 0; i < loss.length; i++) {
        labels.push('Epoch ' + i);
      }
      let data = {
        labels: labels,
        datasets: [
          {
            label: 'Loss Value',
            data: loss,
            fill: false,
          },
        ],
      };
      this.lossForFraph.set(data);
      this.trainprogress.set(
        Math.round((loss.length / this.network.opts.epochs) * 100)
      );
    });

    //setup network
    const opts: NetworkOptions = {
      neuronsPerLayer: this.neuronsPerLayer(),
      neuronsActivations: this.neuronsActivations(),
      learningRate: this.learningRate(),
      epochs: this.epochs(),
      batchSize: this.batchSize(),
    };

    this.network.opts = opts;
    this.network.initializeNeurons();
    this.network.initializeWeights();
    this.network.calculateNeurons();

    this.updateGraphics();

    this.createForm();
    this.loading.set(false);
  }

  updateGraphics() {
    this.network.computeNeuronPositions();
    this.network.computeColors();
  }

  changeNeuronsForLayer(amount: number | undefined, layer: number) {
    this.network.changeNeuronsForLayer(amount, layer);
    this.updateGraphics();
  }

  evaluate(input: number[]) {
    this.network.evaluate(input);
    this.network.computeColors();
    this.cdRef.detectChanges();
  }

  randomizeInputs() {
    this.network.initializeNeurons();
    this.network.calculateNeurons();
    this.network.computeColors();
  }

  randomizeWeights() {
    this.network.initializeWeights();
    this.network.calculateNeurons();
    this.network.computeColors();
  }

  train() {
    const trainData = NeuralNetworkUtils.generate7by7Dataset();
    this.network.trainingData = trainData;
    this.network.trainNetwork(200);
    this.trainprogress.set(1);
  }

  private createForm() {
    this.form = this.fb.group({
      layer1Neurons: new FormControl(this.neuronsPerLayer()![0]),
      layer2Neurons: new FormControl(this.neuronsPerLayer()![1]),
      layer3Neurons: new FormControl(this.neuronsPerLayer()![2]),
    });
  }

  getNeuronX(layerIndex: number, neuronIndex: number): number {
    return this.network.neuronPositions[layerIndex][neuronIndex].x;
  }

  getNeuronY(layerIndex: number, neuronIndex: number): number {
    return this.network.neuronPositions[layerIndex][neuronIndex].y;
  }

  // Access precomputed line color
  getLineColor(
    layerIndex: number,
    neuronIndex: number,
    nextNeuronIndex: number
  ): string {
    return this.network.lineColors[layerIndex][neuronIndex][nextNeuronIndex];
  }

  // Access precomputed circle color
  getCircleColor(layerIndex: number, neuronIndex: number): string {
    return this.network.circleColors[layerIndex][neuronIndex];
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
