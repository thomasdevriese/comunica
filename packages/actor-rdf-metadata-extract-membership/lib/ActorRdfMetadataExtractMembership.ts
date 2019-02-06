import {ActorRdfMetadataExtract, IActionRdfMetadataExtract,
  IActorRdfMetadataExtractOutput} from "@comunica/bus-rdf-metadata-extract";
import {IActorArgs, IActorTest} from "@comunica/core";
import * as RDF from "rdf-js";
import {termToString} from "rdf-string";

/**
 * A comunica Membership RDF Metadata Extract Actor.
 */
export class ActorRdfMetadataExtractMembership extends ActorRdfMetadataExtract {

  public static readonly RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
  public static readonly MEM: string = 'http://semweb.mmlab.be/ns/membership#';
  public static readonly MEM_LINK: string = ActorRdfMetadataExtractMembership.MEM + 'membershipFilter';

  constructor(args: IActorArgs<IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput>) {
    super(args);
  }

  public async test(action: IActionRdfMetadataExtract): Promise<IActorTest> {
    return true;
  }

  /**
   * Collect all membership properties from a given metadata stream
   * in a nice convenient nested hash (property / subject / objects).
   * @param {RDF.Stream} metadata The incoming metadata stream.
   * @param {any} filters The filters data object.
   * @return The collected membership properties.
   */
  public detectMembershipProperties(metadata: RDF.Stream,
                                    filters: {[filterId: string]: {[property: string]: string[]}}): Promise<void> {
    return new Promise((resolve, reject) => {
      metadata.on('error', reject);
      metadata.on('data', (quad) => {
        if (quad.predicate.value === ActorRdfMetadataExtractMembership.MEM_LINK) {
          filters[termToString(quad.object)] = { pageIri: quad.subject.value };
        } else if (filters[termToString(quad.subject)]) {
          const filter = filters[termToString(quad.subject)];
          if (quad.predicate.value.startsWith(ActorRdfMetadataExtractMembership.MEM)) {
            filter[quad.predicate.value.substr(ActorRdfMetadataExtractMembership.MEM.length)] = quad.object.value;
          } else if (quad.predicate.value === ActorRdfMetadataExtractMembership.RDF_TYPE) {
            filter.type = quad.object.value;
          }
        }
      });

      metadata.on('end', () => resolve());
    });
  }

  public async run(action: IActionRdfMetadataExtract): Promise<IActorRdfMetadataExtractOutput> {
    const metadata: {[id: string]: any} = {};
    const membershipProperties = {};
    await this.detectMembershipProperties(action.metadata, membershipProperties);
    metadata.membershipFilters = {};
    return { metadata };
  }

}
