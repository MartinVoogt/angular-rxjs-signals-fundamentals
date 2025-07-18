import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { Product } from './product';
import { HttpErrorService } from '../utilities/http-error.service';
import { ReviewService } from '../reviews/review.service';
import { Review } from '../reviews/review';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private productsUrl = 'api/products';
  private http = inject(HttpClient);
  private readonly errorService = inject(HttpErrorService);
  private readonly reviewService = inject(ReviewService);

  private readonly productSelectedSubject = new BehaviorSubject<
    number | undefined
  >(undefined);

  public readonly productSelected$ = this.productSelectedSubject.asObservable();

  public readonly products$ = this.http.get<Product[]>(this.productsUrl).pipe(
    tap(p => console.log(JSON.stringify(p))),
    shareReplay(1),
    catchError(err => this.handleError(err))
  );

  public readonly product1$ = this.productSelected$.pipe(
    filter(Boolean),
    switchMap(id => {
      const productUrl = `${this.productsUrl}/${id}`;
      return this.http.get<Product>(productUrl).pipe(
        switchMap(product => this.getProductWithReviews(product)),
        catchError(err => this.handleError(err))
      );
    })
  );

  product$ = combineLatest([this.productSelected$, this.products$]).pipe(
    map(([selectedProductId, products]) =>
      products.find(product => product.id === selectedProductId)
    ),
    filter(Boolean),
    switchMap(product => this.getProductWithReviews(product)),
    catchError(err => this.handleError(err))
  );

  productSelected(selectedProductId: number): void {
    this.productSelectedSubject.next(selectedProductId);
  }

  private getProductWithReviews(product: Product): Observable<Product> {
    if (product.hasReviews) {
      return this.http
        .get<Review[]>(this.reviewService.getReviewUrl(product.id))
        .pipe(map(reviews => ({ ...product, reviews } as Product)));
    } else {
      return of(product);
    }
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    const formattedMessage = this.errorService.formatError(err);
    return throwError(() => formattedMessage);
  }
}
