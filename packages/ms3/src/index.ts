export interface MS3Library { readonly format: "ms3-tsl"; readonly sourcePath?: string; }
export function createEmptyLibrary(sourcePath?: string): MS3Library { return { format: "ms3-tsl", sourcePath }; }
