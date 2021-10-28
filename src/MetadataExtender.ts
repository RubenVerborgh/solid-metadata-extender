import { PassthroughDataAccessor } from './PassthroughDataAccessor';
import { RDF, toNamedTerm } from '@solid/community-server';
import type { DataAccessor, ResourceIdentifier, RepresentationMetadata } from '@solid/community-server';

const IANA_TYPES = 'http://www.w3.org/ns/iana/media-types/';

export class MetadataExtender<T extends DataAccessor = DataAccessor> extends PassthroughDataAccessor<T> {
  public async * getChildren(identifier: ResourceIdentifier): AsyncIterableIterator<RepresentationMetadata> {
    for await (const child of super.getChildren(identifier)) {
      // Add the content type to the child if available
      const metadata = await this.getMetadata({ path: child.identifier.value });
      if (metadata.contentType) {
        child.add(RDF.type, toNamedTerm(`${IANA_TYPES}${metadata.contentType}#Resource`));
      }

      yield child;
    }
  }
}
