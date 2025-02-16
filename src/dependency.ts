import { IConstruct } from './construct';

/**
 * Trait marker for classes that can be depended upon
 *
 * The presence of this interface indicates that an object has
 * an `IDependableTrait` implementation.
 *
 * This interface can be used to take an (ordering) dependency on a set of
 * constructs. An ordering dependency implies that the resources represented by
 * those constructs are deployed before the resources depending ON them are
 * deployed.
 */
export interface IDependable {
  // Empty, this interface is a trait marker
}

/**
 * A set of constructs to be used as a dependable
 *
 * This class can be used when a set of constructs which are disjoint in the
 * construct tree needs to be combined to be used as a single dependable.
 *
 * @experimental
 */
export class DependencyGroup implements IDependable {
  private readonly _deps = new Array<IDependable>();

  constructor(...deps: IDependable[]) {
    const self = this;

    Dependable.implement(this, {
      get dependencyRoots() {
        const result = new Array<IConstruct>();
        for (const d of self._deps) {
          result.push(...Dependable.of(d).dependencyRoots);
        }
        return result;
      },
    });

    this.add(...deps);
  }

  /**
   * Add a construct to the dependency roots
   */
  public add(...scopes: IDependable[]) {
    this._deps.push(...scopes);
  }
}

const DEPENDABLE_SYMBOL = Symbol.for('@aws-cdk/core.DependableTrait');

/**
 * Trait for IDependable
 *
 * Traits are interfaces that are privately implemented by objects. Instead of
 * showing up in the public interface of a class, they need to be queried
 * explicitly. This is used to implement certain framework features that are
 * not intended to be used by Construct consumers, and so should be hidden
 * from accidental use.
 *
 * @example
 *
 * // Usage
 * const roots = DependableTrait.get(construct).dependencyRoots;
 *
 * // Definition
 * DependableTrait.implement(construct, {
 *   get dependencyRoots() { return []; }
 * });
 *
 * @experimental
 */
export abstract class Dependable {
  /**
   * Turn any object into an IDependable.
   */
  public static implement(instance: IDependable, trait: Dependable) {
    // I would also like to reference classes (to cut down on the list of objects
    // we need to manage), but we can't do that either since jsii doesn't have the
    // concept of a class reference.
    (instance as any)[DEPENDABLE_SYMBOL] = trait;
  }

  /**
   * Return the matching Dependable for the given class instance.
   */
  public static of(instance: IDependable): Dependable {
    const ret = (instance as any)[DEPENDABLE_SYMBOL];
    if (!ret) {
      throw new Error(`${instance} does not implement IDependable. Use "Dependable.implement()" to implement`);
    }
    return ret;
  }

  /**
   * Return the matching Dependable for the given class instance.
   * @deprecated use `of`
   */
  public static get(instance: IDependable): Dependable {
    return this.of(instance);
  }

  /**
   * The set of constructs that form the root of this dependable
   *
   * All resources under all returned constructs are included in the ordering
   * dependency.
   */
  public abstract readonly dependencyRoots: IConstruct[];
}
