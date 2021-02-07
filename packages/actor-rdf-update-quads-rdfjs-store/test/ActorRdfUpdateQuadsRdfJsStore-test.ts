import { ActorRdfUpdateQuads } from '@comunica/bus-rdf-update-quads';
import { Bus } from '@comunica/core';
import { ActorRdfUpdateQuadsRdfJsStore } from '../lib/ActorRdfUpdateQuadsRdfJsStore';

describe('ActorRdfUpdateQuadsRdfJsStore', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfUpdateQuadsRdfJsStore instance', () => {
    let actor: ActorRdfUpdateQuadsRdfJsStore;

    beforeEach(() => {
      actor = new ActorRdfUpdateQuadsRdfJsStore({ name: 'actor', bus });
    });

    it('should test', () => {
      return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    });

    it('should run', () => {
      return expect(actor.run({ todo: true })).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
