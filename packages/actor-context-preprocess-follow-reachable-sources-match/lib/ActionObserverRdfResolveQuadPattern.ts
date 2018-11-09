import {
  IActionRdfResolveQuadPattern,
  IActorRdfResolveQuadPatternOutput,
  KEY_CONTEXT_SOURCES
} from "@comunica/bus-rdf-resolve-quad-pattern";
import {ActionObserver, Actor, IActionObserverArgs, IActorTest} from "@comunica/core";
import * as RDF from "rdf-js";

export class ActionObserverRdfResolveQuadPattern
  extends ActionObserver<IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput> {

  public readonly patterns: RDF.Quad[] = [];
  public endedActions: number = 0;

  constructor(args: IActionObserverArgs<IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput>) {
    super(args);
    this.bus.subscribeObserver(this);
  }

  public onRun(actor: Actor<IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>,
               action: IActionRdfResolveQuadPattern, output: Promise<IActorRdfResolveQuadPatternOutput>): void {
    // Only capture top-level patterns
    if (action.context.has(KEY_CONTEXT_SOURCES)) {
      this.patterns.push(action.pattern);
    }
    this.endedActions++;
  }

}
