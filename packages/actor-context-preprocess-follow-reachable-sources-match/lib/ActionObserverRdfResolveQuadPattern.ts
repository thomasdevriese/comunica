import {IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput} from "@comunica/bus-rdf-resolve-quad-pattern";
import {ActionObserver, Actor, IActionObserverArgs, IActorTest} from "@comunica/core";
import {getNamedNodes, getTerms} from "rdf-terms";

export class ActionObserverRdfResolveQuadPattern
  extends ActionObserver<IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput> {

  private readonly processedUris: {[uri: string]: boolean} = {};
  private readonly uriListeners: IUriListener[] = [];

  constructor(args: IActionObserverArgs<IActionRdfResolveQuadPattern, IActorRdfResolveQuadPatternOutput>) {
    super(args);
    this.bus.subscribeObserver(this);
  }

  public onRun(actor: Actor<IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>,
               action: IActionRdfResolveQuadPattern, output: Promise<IActorRdfResolveQuadPatternOutput>): void {
    output.then((rdfDereferenceOutput) => {
      rdfDereferenceOutput.data.on('data', (quad) => {
        for (const nameNode of getNamedNodes(getTerms(quad))) {
          const uri = nameNode.value;
          if (!this.processedUris[uri]) {
            this.processedUris[uri] = true;
            for (const uriListener of this.uriListeners) {
              uriListener(uri);
            }
          }
        }
      });
    });
  }

  public addUriListener(uriListener: IUriListener) {
    this.uriListeners.push(uriListener);
  }

}

export type IUriListener = (uri: string) => void;
