import { PassthroughDataAccessor } from './PassthroughDataAccessor';
import { createTermNamespace, toNamedTerm, RDF, POSIX } from '@solid/community-server';
import type { DataAccessor, ResourceIdentifier, RepresentationMetadata } from '@solid/community-server';
import rdfParser from 'rdf-parse';

// Namespaces
const IANA_TYPES = 'http://www.w3.org/ns/iana/media-types/';
const DCT = createTermNamespace('http://purl.org/dc/terms/', 'format', 'modified');
const LDP = createTermNamespace('http://www.w3.org/ns/ldp#', 'RDFSource', 'NonRDFSource');

// List of RDF content types
const RDF_TYPES = new Set<string>();
rdfParser.getContentTypes().then((types: string[]): void => {
  for (const type of types) {
    RDF_TYPES.add(type);
  }
}, (): null => null);

// Metadata elements to switch on or off
export interface MetadataOptions {
  dctFormat?: boolean;
  dctModified?: boolean;
  ianaType?: boolean;
  rdfSource?: boolean;
  statMtime?: boolean;
  statSize?: boolean;
}

export type MetadataProcessor = (source: RepresentationMetadata, destination: RepresentationMetadata) => void;

// Generators of metadata triples
const METADATA_PROCESSORS: Record<keyof MetadataOptions, MetadataProcessor> = {
  // <> dct:format "text/turtle".
  dctFormat(source: RepresentationMetadata, destination: RepresentationMetadata): void {
    if (source.contentType) {
      destination.add(DCT.format, source.contentType);
    }
  },

  // <> dct:modified "2021-10-25T09:10:05.000Z"^^xsd:dateTime.
  dctModified(source: RepresentationMetadata, destination: RepresentationMetadata): void {
    const value = source.get(DCT.modified);
    if (value?.termType === 'Literal') {
      destination.add(DCT.modified, value);
    }
  },

  // <> rdf:type <http://www.w3.org/ns/iana/media-types/text/turtle#Resource>.
  ianaType(source: RepresentationMetadata, destination: RepresentationMetadata): void {
    if (source.contentType) {
      destination.add(RDF.type, toNamedTerm(`${IANA_TYPES}${source.contentType}#Resource`));
    }
  },

  // <> rdf:type ldp:RDFSource.
  rdfSource(source: RepresentationMetadata, destination: RepresentationMetadata): void {
    if (source.contentType) {
      destination.add(RDF.type, RDF_TYPES.has(source.contentType) ? LDP.RDFSource : LDP.NonRDFSource);
    }
  },

  // <> stat:mtime 1635153005.
  statMtime(source: RepresentationMetadata, destination: RepresentationMetadata): void {
    const value = source.get(POSIX.mtime);
    if (value?.termType === 'Literal') {
      destination.add(POSIX.mtime, value);
    }
  },

  // <> stat:size 4.
  statSize(source: RepresentationMetadata, destination: RepresentationMetadata): void {
    const value = source.get(POSIX.size);
    if (value?.termType === 'Literal') {
      destination.add(POSIX.size, value);
    }
  },
};

export class MetadataExtender<T extends DataAccessor = DataAccessor> extends PassthroughDataAccessor<T> {
  private readonly options: MetadataOptions;

  public constructor(source: T, options: MetadataOptions = {}) {
    super(source);
    this.options = options;
  }

  public async * getChildren(identifier: ResourceIdentifier): AsyncIterableIterator<RepresentationMetadata> {
    for await (const child of super.getChildren(identifier)) {
      // Remove any existing metadata
      child.removeAll(DCT.modified);
      child.removeAll(POSIX.mtime);
      child.removeAll(POSIX.size);

      // Add metadata according to the options
      const source = await this.getMetadata({ path: child.identifier.value });
      for (const [option, enabled] of Object.entries(this.options)) {
        if (enabled) {
          METADATA_PROCESSORS[option as keyof MetadataOptions](source, child);
        }
      }
      yield child;
    }
  }
}
