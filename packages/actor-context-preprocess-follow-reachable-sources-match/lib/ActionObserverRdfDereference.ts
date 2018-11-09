import {IActionRdfDereference, IActorRdfDereferenceOutput} from "@comunica/bus-rdf-dereference";
import {ActionObserver, Actor, IActionObserverArgs, IActorTest} from "@comunica/core";
import * as RDF from "rdf-js";
import {getNamedNodes, getTerms, QUAD_TERM_NAMES} from "rdf-terms";

export class ActionObserverRdfDereference extends ActionObserver<IActionRdfDereference, IActorRdfDereferenceOutput> {

  private patterns: RDF.Quad[];
  private endedStreams: number = 0;
  private readonly processedUris: {[uri: string]: boolean} = {};
  private readonly endedUris: {[uri: string]: boolean} = {}; // TODO
  private readonly uriListeners: IUriListener[] = [];

  constructor(args: IActionObserverArgs<IActionRdfDereference, IActorRdfDereferenceOutput>) {
    super(args);
    this.bus.subscribeObserver(this);
  }

  /**
   * Check if the given pattern matches with the given quad.
   * @param {Quad} pattern A quad pattern.
   * @param {Quad} quad A quad.
   * @return {boolean} If they match.
   */
  public static matchPattern(pattern: RDF.Quad, quad: RDF.Quad): boolean { // TODO: copy unit tests from QPF
    for (const termName of QUAD_TERM_NAMES) {
      const patternTerm: RDF.Term = (<any> pattern)[termName];
      if (patternTerm && patternTerm.termType !== 'BlankNode' && patternTerm.termType !== 'Variable') {
        const quadTerm: RDF.Term = (<any> quad)[termName];
        if (!patternTerm.equals(quadTerm)) {
          return false;
        }
      }
    }
    return true;
  }

  public onRun(actor: Actor<IActionRdfDereference, IActorTest, IActorRdfDereferenceOutput>,
               action: IActionRdfDereference, output: Promise<IActorRdfDereferenceOutput>): void {
    output.then((rdfDereferenceOutput) => {
      // Make sure that external calls for deref an URL are also blacklisted for future traversal.
      this.processedUris[action.url] = true;

      rdfDereferenceOutput.quads.on('data', (quad) => {
        for (const pattern of this.patterns) {
          if (ActionObserverRdfDereference.matchPattern(pattern, quad)) {
            for (const nameNode of getNamedNodes(getTerms(quad))) {
              const uri = nameNode.value;
              if (!this.processedUris[uri]) {
                this.processedUris[uri] = true;
                for (const uriListener of this.uriListeners) {
                  uriListener(uri);
                }
              }
            }

            // Only one pattern match is needed
            break;
          }
        }
      });
      rdfDereferenceOutput.quads.on('error', () => this.onEnd());

      // Once no streams are running anymore, emit an end event to all listeners.
      rdfDereferenceOutput.quads.on('end', () => {
        this.endedUris[action.url] = true;
        this.onEnd();
      });
    }).catch(() => this.onEnd());
  }

  public onError(action: IActionRdfDereference, error: Error): void {
    this.onEnd();
  }

  public addUriListener(uriListener: IUriListener) {
    this.uriListeners.push(uriListener);
  }

  public setPatterns(patterns: RDF.Quad[]) {
    this.patterns = patterns;
  }

  protected onEnd() {
    if (++this.endedStreams === Object.keys(this.processedUris).length) {
      for (const uriListener of this.uriListeners) {
        uriListener(null);
      }
    }
  }

}

export type IUriListener = (uri: string) => void;
