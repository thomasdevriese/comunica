import type { IActorQueryOperationOutput,
  IActorQueryOperationTypedMediatedArgs } from '@comunica/bus-query-operation';
import { ActorQueryOperation, ActorQueryOperationTypedMediated } from '@comunica/bus-query-operation';
import type { ActionContext, IActorTest } from '@comunica/core';
import { ArrayIterator, EmptyIterator, UnionIterator } from 'asynciterator';
import type * as RDF from 'rdf-js';
import type { Algebra } from 'sparqlalgebrajs';

/**
 * A comunica Update CompositeUpdate Query Operation Actor.
 */
export class ActorQueryOperationUpdateCompositeUpdate
  extends ActorQueryOperationTypedMediated<Algebra.CompositeUpdate> {
  public constructor(args: IActorQueryOperationTypedMediatedArgs) {
    super(args, 'compositeupdate');
  }

  public async testOperation(pattern: Algebra.CompositeUpdate, context: ActionContext): Promise<IActorTest> {
    return true;
  }

  public async runOperation(pattern: Algebra.CompositeUpdate, context: ActionContext):
  Promise<IActorQueryOperationOutput> {
    // Execute update operations in parallel
    const subResults = await Promise.all(pattern.updates
      .map(async operation => ActorQueryOperation
        .getSafeUpdate(await this.mediatorQueryOperation.mediate({ operation, context }))));

    // Merge update result promises
    const updateResult = Promise.all(subResults.map(subResult => subResult.updateResult))
      .then(() => {
        // Return void
      });

    // Join output streams
    const quadStreamInserted = new UnionIterator(new ArrayIterator(subResults
      .map(subResult => subResult.quadStreamInserted || new EmptyIterator<RDF.Quad>())));
    const quadStreamDeleted = new UnionIterator(new ArrayIterator(subResults
      .map(subResult => subResult.quadStreamDeleted || new EmptyIterator<RDF.Quad>())));

    return {
      type: 'update',
      updateResult,
      quadStreamInserted,
      quadStreamDeleted,
    };
  }
}
