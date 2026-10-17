/** Transpile only: npm run check remains responsible for strict type checking. */
import ts from 'typescript';

export default function standaloneTypeScriptLoader(source) {
  const result = ts.transpileModule(source, {
    fileName: this.resourcePath,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      isolatedModules: true,
    },
  });
  const errors = (result.diagnostics ?? []).filter(item => item.category === ts.DiagnosticCategory.Error);
  if (errors.length) throw new Error(ts.formatDiagnostics(errors, {
    getCanonicalFileName: name => name,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => '\n',
  }));
  return result.outputText;
}
