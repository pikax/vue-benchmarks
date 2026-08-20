export type Loaded = { state: "loaded"; items: string[] };
export type Failed = { state: "failed"; message: string };
export type Result = Loaded | Failed;
