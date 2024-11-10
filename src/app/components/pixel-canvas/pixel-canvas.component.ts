import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  OnInit,
  output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ToggleButtonModule } from 'primeng/togglebutton';

@Component({
  selector: 'app-pixel-canvas',
  standalone: true,
  imports: [CommonModule, ToggleButtonModule, ReactiveFormsModule],
  templateUrl: './pixel-canvas.component.html',
  styleUrls: ['./pixel-canvas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PixelCanvasComponent implements OnInit {
  initArray = input<boolean[]>([]);
  showValues = input<boolean>(false);
  size = input<number>(5);
  disabled = input<boolean>(true);

  outputArray = output<number[]>();

  form: FormGroup;
  indexArray: number[] = [];

  updatePixels = effect(() => {
    if (this.initArray().length > 0) this.setPixels();
  })

  disable = effect(() => {
    if (this.disabled()) this.form.disable()
  })

  constructor() {
    this.form = new FormGroup({});
  }

  ngOnInit(): void {
    this.initializeGrid();
    if (this.initArray().length > 0) this.setPixels();

    if (this.disabled()) this.form.disable()
  }

  initializeGrid() {
    // Dynamically generate the index array for grid dimensions
    this.indexArray = Array.from({ length: this.size() }, (_, i) => i);

    // Initialize form controls for each cell in the grid
    const group: { [key: string]: FormControl } = {};
    for (let i = 0; i < this.size() * this.size(); i++) {
      group[i.toString()] = new FormControl<boolean>(false);
    }
    this.form = new FormGroup(group);

    this.form.valueChanges.subscribe(() => {
      this.outputArray.emit(
        Object.values(this.form.getRawValue()).map((v) => (v ? 1 : 0))
      );
    });
  }

  setPixels() {
    // Populate initial values based on initArray
    this.initArray().forEach((value, i) => {
      this.form.get(i.toString())?.setValue(value);
    });
    this.outputArray.emit(
      Object.values(this.form.getRawValue()).map((v) => (v ? 1 : 0))
    );
  }

  getValues() {
    return this.form.getRawValue();
  }
}
