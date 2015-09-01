import type Transformer from "./transformer";
import traverse from "babel-traverse";
import type File from "./file";

/**
 * This class is responsible for traversing over the provided `File`s
 * AST and running it's parent transformers handlers over it.
 */

export default class PluginPass {
  constructor(file: File, plugin: Transformer) {
    this.plugin = plugin;
    this.file   = file;
    this.key    = plugin.key;

    if (this.canTransform() && plugin.metadata.experimental && !file.opts.experimental) {
      file.log.warn(`THE TRANSFORMER ${this.key} HAS BEEN MARKED AS EXPERIMENTAL AND IS WIP. USE AT YOUR OWN RISK. ` +
                    "THIS WILL HIGHLY LIKELY BREAK YOUR CODE SO USE WITH **EXTREME** CAUTION. ENABLE THE " +
                    "`experimental` OPTION TO IGNORE THIS WARNING.");
    }
  }

  canTransform(): boolean {
    if (this.plugin.metadata.mode !== this.file.opts.mode) {
      return false;
    } else {
      return this.canRun();
    }
  }

  canRun() {
    return this.file.transformerDependencies[this.key] ||
           this.file.pipeline.canRun(this.plugin, this.file.opts);
  }

  transform() {
    var file = this.file;
    file.log.debug(`Start transformer ${this.key}`);
    traverse(file.ast, this.plugin.visitor, file.scope, file);
    file.log.debug(`Finish transformer ${this.key}`);
  }
}
