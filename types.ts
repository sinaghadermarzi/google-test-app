
export interface Source {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: Source;
}
