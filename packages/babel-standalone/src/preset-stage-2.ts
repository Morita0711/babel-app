import presetStage3 from "./preset-stage-3";
import * as babelPlugins from "./generated/plugins";

export default (_: any, opts: any = {}) => {
  const {
    loose = false,
    useBuiltIns = false,
    decoratorsLegacy = false,
    decoratorsBeforeExport,
    recordAndTupleSyntax = "hash",
  } = opts;

  return {
    presets: [[presetStage3, { loose, useBuiltIns }]],
    plugins: [
      [
        babelPlugins.proposalDecorators,
        { legacy: decoratorsLegacy, decoratorsBeforeExport },
      ],
      babelPlugins.proposalFunctionSent,
      babelPlugins.proposalThrowExpressions,
      [babelPlugins.syntaxRecordAndTuple, { syntaxType: recordAndTupleSyntax }],
      babelPlugins.syntaxModuleBlocks,
    ],
  };
};
