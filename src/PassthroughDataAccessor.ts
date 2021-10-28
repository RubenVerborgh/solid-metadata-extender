import type {
  DataAccessor,
  Representation,
  RepresentationMetadata,
  ResourceIdentifier,
  Guarded,
} from '@solid/community-server';
import type { Readable } from 'stream';

/**
 * Data accessor that calls the corresponding functions of the source accessor.
 */
export class PassthroughDataAccessor<T extends DataAccessor = DataAccessor> implements DataAccessor {
  protected readonly source: T;

  public constructor(source: T) {
    this.source = source;
  }

  public async canHandle(representation: Representation): Promise<void> {
    return this.source.canHandle(representation);
  }

  public async getData(identifier: ResourceIdentifier): Promise<Guarded<Readable>> {
    return this.source.getData(identifier);
  }

  public async getMetadata(identifier: ResourceIdentifier): Promise<RepresentationMetadata> {
    return this.source.getMetadata(identifier);
  }

  public getChildren(identifier: ResourceIdentifier): AsyncIterableIterator<RepresentationMetadata> {
    return this.source.getChildren(identifier);
  }

  public async writeDocument(identifier: ResourceIdentifier, data: Guarded<Readable>, metadata: RepresentationMetadata): Promise<void> {
    return this.source.writeDocument(identifier, data, metadata);
  }

  public async writeContainer(identifier: ResourceIdentifier, metadata: RepresentationMetadata): Promise<void> {
    return this.source.writeContainer(identifier, metadata);
  }

  public async deleteResource(identifier: ResourceIdentifier): Promise<void> {
    return this.source.deleteResource(identifier);
  }
}

