import {
  Component,
  ViewChild
} from '@angular/core';
import { NeuralNetworkVisualizerComponent } from '../../../../components/neural-network-visualizer/neural-network-visualizer.component';

@Component({
  selector: 'app-creating-digital-neurons',
  templateUrl: './creating-digital-neurons.component.html',
  styleUrl: './creating-digital-neurons.component.css',
})
export class CreatingDigitalNeuronsComponent {
  @ViewChild('trainDemoNetwork') network!: NeuralNetworkVisualizerComponent;

  canvasInits = [
    [
      false,
      true,
      true,
      true,
      false,
      false,
      true,
      false,
      true,
      false,
      false,
      true,
      false,
      true,
      false,
      false,
      true,
      false,
      true,
      false,
      false,
      true,
      true,
      true,
      false,
    ],
    [
      false,
      true,
      false,
      true,
      false,
      false,
      true,
      false,
      true,
      false,
      false,
      true,
      true,
      true,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      true,
      false,
    ],
    [
      false,
      true,
      true,
      true,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      true,
      false,
    ],
  ];

  lossChartOpts = {
    maintainAspectRatio: false,
    aspectRatio: 0.4,
    animation: {
      duration: 0,
    },
    plugins: {
      legend: {
        labels: {
          color: 'white',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#ffffff',
        },
        grid: {
          color: '#ffffff',
          drawBorder: false,
        },
      },
      y: {
        ticks: {
          color: '#ffffff',
        },
        grid: {
          color: '#ffffff',
          drawBorder: false,
        },
      },
    },
  };
}
