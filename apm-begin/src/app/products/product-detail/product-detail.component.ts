import {
  Component,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';

import { NgIf, NgFor, CurrencyPipe } from '@angular/common';
import { Product } from '../product';
import { ProductService } from '../product.service';
import { catchError, EMPTY, Subscription } from 'rxjs';

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe],
})
export class ProductDetailComponent implements OnChanges, OnDestroy {
  private productService = inject(ProductService);

  @Input() productId: number = 0;
  errorMessage = '';

  // Product to display
  product: Product | null = null;
  productSub!: Subscription;

  // Set the page title
  pageTitle = this.product
    ? `Product Detail for: ${this.product.productName}`
    : 'Product Detail';

  ngOnChanges(changes: SimpleChanges): void {
    const productId = changes['productId'].currentValue;
    if (productId)
      this.productSub = this.productService
        .getProduct(productId)
        .pipe(
          catchError(err => {
            this.errorMessage = err;
            return EMPTY;
          })
        )
        .subscribe(product => (this.product = product));
  }

  ngOnDestroy(): void {
    this.productSub.unsubscribe();
  }

  addToCart(product: Product) {}
}
