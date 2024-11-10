import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ToggleButtonModule } from 'primeng/togglebutton';

@Component({
  selector: 'app-pixel-canvas',
  standalone: true,
  imports: [CommonModule, ToggleButtonModule, ReactiveFormsModule],
  templateUrl: './pixel-canvas.component.html',
  styleUrl: './pixel-canvas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PixelCanvasComponent implements OnInit {
  initArray = input<boolean[]>([]);
  showValues = input<boolean>(false);

  size = 5;
  inputSize = computed(() => this.size * this.size);
  indexArray = computed(() => [...Array(this.size).keys()]);

  outputArray = output<number[]>();

  form: FormGroup;

  constructor() {
    var group = new FormGroup({});
    for (var i = 0; i < this.inputSize(); i++) {
      group.addControl(i.toString(), new FormControl<boolean>(false));
    }
    this.form = group;

    this.form.valueChanges.subscribe((_) => {
      this.outputArray.emit(
        Object.values(this.form.getRawValue()).map((v) => (v ? 1 : 0))
      );
    });
  }

  ngOnInit(): void {
    if (this.initArray().length > 0) this.setPixels();
  }

  setPixels() {
    for (var i = 0; i < this.initArray().length; i++) {
      this.form.get(i.toString())?.setValue(this.initArray()[i]);
    }
    this.outputArray.emit(
      Object.values(this.form.getRawValue()).map((v) => (v ? 1 : 0))
    );
  }

  getValues() {
    return this.form.getRawValue();
  }
}
