import PathHoister from "./hoister";
import isBoolean from "lodash/lang/isBoolean";
import isNumber from "lodash/lang/isNumber";
import isRegExp from "lodash/lang/isRegExp";
import isString from "lodash/lang/isString";
import traverse from "../index";
import includes from "lodash/collection/includes";
import assign from "lodash/object/assign";
import extend from "lodash/object/extend";
import Scope from "../scope";
import * as t from "../../types";

var hoistVariablesVisitor = {
  enter(node, parent, scope) {
    if (this.isFunction()) {
      return this.skip();
    }

    if (this.isVariableDeclaration() && node.kind === "var") {
      var bindings = this.getBindingIdentifiers();
      for (var key in bindings) {
        scope.push({ id: bindings[key] });
      }

      var exprs = [];

      for (var i = 0; i < node.declarations.length; i++) {
        var declar = node.declarations[i];
        if (declar.init) {
          exprs.push(t.expressionStatement(
            t.assignmentExpression("=", declar.id, declar.init)
          ));
        }
      }

      return exprs;
    }
  }
};

export default class TraversalPath {
  constructor(parent, container) {
    this.container = container;
    this.parent    = parent;
    this.data      = {};
  }

  static get(parentPath: TraversalPath, context?: TraversalContext, parent, container, key, file?: File) {
    var targetNode = container[key];
    var paths = container._paths ||= [];
    var path;

    for (var i = 0; i < paths.length; i++) {
      var pathCheck = paths[i];
      if (pathCheck.node === targetNode) {
        path = pathCheck;
        break;
      }
    }

    if (!path) {
      path = new TraversalPath(parent, container);
      paths.push(path);
    }

    path.setContext(parentPath, context, key, file);

    return path;
  }

  static getScope(path: TraversalPath, scope: Scope, file?: File) {
    var ourScope = scope;

    // we're entering a new scope so let's construct it!
    if (path.isScope()) {
      var log = path.isProgram();
      ourScope = new Scope(path, scope, file);
    }

    return ourScope;
  }

  queueNode(path) {
    if (this.context) {
      this.context.queue.push(path);
    }
  }

  insertBefore(nodes) {
    nodes = this._verifyNodeList(nodes);

    if (this.parentPath.isExpressionStatement() || this.parentPath.isLabeledStatement()) {
      return this.parentPath.insertBefore(nodes);
    } else if (this.isPreviousType("Expression") || (this.parentPath.isForStatement() && this.key === "init")) {
      if (this.node) nodes.push(this.node);
      this.replaceExpressionWithStatements(nodes);
    } else if (this.isPreviousType("Statement")) {
      this._maybePopFromStatements(nodes);
      if (Array.isArray(this.container)) {
        this._containerInsertBefore(nodes);
      } else if (this.isStatementOrBlock()) {
        if (this.node) nodes.push(this.node);
        this.container[this.key] = t.blockStatement(nodes);
        this.checkPaths(this);
      } else {
        throw new Error("We don't know what to do with this node type. We were previously a Statement but we can't fit in here?");
      }
    } else {
      throw new Error("No clue what to do with this node type.");
    }
  }

  _containerInsert(from, nodes) {
    this.updateSiblingKeys(from, nodes.length);

    var paths = [];

    for (var i = 0; i < nodes.length; i++) {
      var to = from + i;
      this.container.splice(to, 0, nodes[i]);

      if (this.context) {
        var path = this.context.create(this.parent, this.container, to);
        paths.push(path);
        this.queueNode(path);
      }
    }

    this.checkPaths(paths);
  }

  _containerInsertBefore(nodes) {
    this._containerInsert(this.key, nodes);
  }

  _containerInsertAfter(nodes) {
    this._containerInsert(this.key + 1, nodes);
  }

  _maybePopFromStatements(nodes) {
    var last = nodes[nodes.length - 1];
    if (t.isExpressionStatement(last) && t.isIdentifier(last.expression) && !this.isCompletionRecord()) {
      nodes.pop();
    }
  }

  isCompletionRecord() {
    var path = this;

    do {
      var container = path.container;
      if (Array.isArray(container) && path.key !== container.length - 1) {
        return false;
      }
    } while (path = path.parentPath && !path.isProgram());

    return true;
  }

  isStatementOrBlock() {
    if (t.isLabeledStatement(this.parent) || t.isBlockStatement(this.container)) {
      return false;
    } else {
      return includes(t.STATEMENT_OR_BLOCK_KEYS, this.key);
    }
  }

  insertAfter(nodes) {
    nodes = this._verifyNodeList(nodes);

    if (this.parentPath.isExpressionStatement() || this.parentPath.isLabeledStatement()) {
      return this.parentPath.insertAfter(nodes);
    } else if (this.isPreviousType("Expression") || (this.parentPath.isForStatement() && this.key === "init")) {
      if (this.node) {
        var temp = this.scope.generateTemp();
        nodes.unshift(t.expressionStatement(t.assignmentExpression("=", temp, this.node)));
        nodes.push(t.expressionStatement(temp));
      }
      this.replaceExpressionWithStatements(nodes);
    } else if (this.isPreviousType("Statement")) {
      this._maybePopFromStatements(nodes);
      if (Array.isArray(this.container)) {
        this._containerInsertAfter(nodes);
      } else if (this.isStatementOrBlock()) {
        if (this.node) nodes.unshift(this.node);
        this.container[this.key] = t.blockStatement(nodes);
        this.checkPaths(this);
      } else {
        throw new Error("We don't know what to do with this node type. We were previously a Statement but we can't fit in here?");
      }
    } else {
      throw new Error("No clue what to do with this node type.");
    }
  }

  updateSiblingKeys(fromIndex, incrementBy) {
    var paths = this.container._paths;
    for (var i = 0; i < paths.length; i++) {
      let path = paths[i];
      if (path.key >= fromIndex) {
        path.key += incrementBy;
      }
    }
  }

  setData(key, val) {
    return this.data[key] = val;
  }

  getData(key, def) {
    var val = this.data[key];
    if (!val && def) val = this.data[key] = def;
    return val;
  }

  setScope(file?) {
    this.scope = TraversalPath.getScope(this, this.context && this.context.scope, file);
  }

  clearContext() {
    this.context = null;
  }

  setContext(parentPath, context, key, file?) {
    this.shouldSkip = false;
    this.shouldStop = false;
    this.removed    = false;

    this.parentPath = parentPath || this.parentPath;
    this.key        = key;

    if (context) {
      this.context = context;
      this.state   = context.state;
      this.opts    = context.opts;
    }

    this.type = this.node && this.node.type;

    var log = file && this.type === "Program";
    if (log) file.log.debug("Start scope building");
    this.setScope(file);
    if (log) file.log.debug("End scope building");
  }

  _remove() {
    if (Array.isArray(this.container)) {
      this.container.splice(this.key, 1);
      this.updateSiblingKeys(this.key, -1);
    } else {
      this.container[this.key] = null;
    }
  }

  remove() {
    var removeParent = false;
    if (this.parentPath) {
      removeParent ||= this.parentPath.isExpressionStatement();
      removeParent ||= this.parentPath.isSequenceExpression() && this.parent.expressions.length === 1;
      if (removeParent) return this.parentPath.remove();
    }

    this._remove();
    this.removed = true;
  }

  skip() {
    this.shouldSkip = true;
  }

  stop() {
    this.shouldStop = true;
    this.shouldSkip = true;
  }

  errorWithNode(msg, Error = SyntaxError) {
    var loc = this.node.loc.start;
    var err = new Error(`Line ${loc.line}: ${msg}`);
    err.loc = loc;
    return err;
  }

  get node() {
    if (this.removed) {
      return null;
    } else {
      return this.container[this.key];
    }
  }

  set node(replacement) {
    throw new Error("Don't use `path.node = newNode;`, use `path.replaceWith(newNode)` or `path.replaceWithMultiple([newNode])`");
  }

  replaceInline(nodes) {
    if (Array.isArray(nodes)) {
      if (Array.isArray(this.container)) {
        nodes = this._verifyNodeList(nodes);
        this._containerInsertAfter(nodes);
        return this.remove();
      } else {
        return this.replaceWithMultiple(nodes);
      }
    } else {
      return this.replaceWith(nodes);
    }
  }

  _verifyNodeList(nodes) {
    if (nodes.constructor !== Array) {
      nodes = [nodes];
    }

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!node) {
        throw new Error(`Node list has falsy node with the index of ${i}`);
      } else if (typeof node !== "object") {
        throw new Error(`Node list contains a non-object node with the index of ${i}`);
      } else if (!node.type) {
        throw new Error(`Node list contains a node without a type with the index of ${i}`);
      }
    }

    return nodes;
  }

  replaceWithMultiple(nodes: Array<Object>) {
    nodes = this._verifyNodeList(nodes);
    t.inheritsComments(nodes[0], this.node);
    this.container[this.key] = null;
    this.insertAfter(nodes);
    if (!this.node) this.remove();
  }

  replaceWith(replacement, arraysAllowed) {
    if (this.removed) {
      throw new Error("You can't replace this node, we've already removed it");
    }

    if (!replacement) {
      throw new Error("You passed `path.replaceWith()` a falsy node, use `path.remove()` instead");
    }

    if (Array.isArray(replacement)) {
      if (arraysAllowed) {
        return this.replaceWithMultiple(replacement);
      } else {
        throw new Error("Don't use `path.replaceWith()` with an array of nodes, use `path.replaceWithMultiple()`");
      }
    }

    if (this.isPreviousType("Expression") && t.isStatement(replacement)) {
      return this.replaceExpressionWithStatements([replacement]);
    }

    var oldNode = this.node;
    if (oldNode) t.inheritsComments(replacement, oldNode);

    // replace the node
    this.container[this.key] = replacement;
    this.type = replacement.type;

    // potentially create new scope
    this.setScope();

    this.checkPaths(this);
  }

  checkPaths(paths) {
    var scope = this.scope;
    var file  = scope && scope.file;
    if (file) file.checkPath(paths);
  }

  getStatementParent(): ?TraversalPath {
    var path = this;

    do {
      if (!path.parentPath || (Array.isArray(path.container) && path.isStatement())) {
        break;
      } else {
        path = path.parentPath;
      }
    } while (path);

    if (path && (path.isProgram() || path.isFile())) {
      throw new Error("File/Program node, we can't possibly find a statement parent to this");
    }

    return path;
  }

  getLastStatements(): Array<TraversalPath> {
    var paths = [];

    var add = function (path) {
      if (path) paths = paths.concat(path.getLastStatements());
    };

    if (this.isIfStatement()) {
      add(this.get("consequent"));
      add(this.get("alternate"));
    } else if (this.isDoExpression()) {
      add(this.get("body"));
    } else if (this.isProgram() || this.isBlockStatement()) {
      add(this.get("body").pop());
    } else {
      paths.push(this);
    }

    return paths;
  }

  replaceExpressionWithStatements(nodes: Array) {
    var toSequenceExpression = t.toSequenceExpression(nodes, this.scope);

    if (toSequenceExpression) {
      return this.replaceWith(toSequenceExpression);
    } else {
      var container = t.functionExpression(null, [], t.blockStatement(nodes));
      container.shadow = true;

      // add implicit returns to all ending expression statements
      var last = this.getLastStatements();
      for (var i = 0; i < last.length; i++) {
        var lastNode = last[i];
        if (lastNode.isExpressionStatement()) {
          lastNode.replaceWith(t.returnStatement(lastNode.node.expression));
        }
      }

      this.replaceWith(t.callExpression(container, []));

      this.traverse(hoistVariablesVisitor);

      return this.node;
    }
  }

  call(key) {
    var node = this.node;
    if (!node) return;

    var opts = this.opts;
    var fn   = opts[key] || opts;
    if (opts[node.type]) fn = opts[node.type][key] || fn;

    var replacement = fn.call(this, node, this.parent, this.scope, this.state);
    if (replacement) this.replaceWith(replacement, true);
  }

  isBlacklisted(): boolean {
    var blacklist = this.opts.blacklist;
    return blacklist && blacklist.indexOf(this.node.type) > -1;
  }

  visit(): boolean {
    if (this.isBlacklisted()) return false;
    if (this.opts.shouldSkip(this)) return false;

    this.call("enter");

    if (this.shouldSkip) {
      return this.shouldStop;
    }

    var node = this.node;
    var opts = this.opts;

    if (node) {
      if (Array.isArray(node)) {
        // traverse over these replacement nodes we purposely don't call exitNode
        // as the original node has been destroyed
        for (var i = 0; i < node.length; i++) {
          traverse.node(node[i], opts, this.scope, this.state, this);
        }
      } else {
        traverse.node(node, opts, this.scope, this.state, this);
        this.call("exit");
      }
    }

    return this.shouldStop;
  }

  getSibling(key) {
    return TraversalPath.get(this.parentPath, null, this.parent, this.container, key, this.file);
  }

  get(key: string): TraversalPath {
    var parts = key.split(".");
    if (parts.length === 1) { // "foo.bar"
      var node = this.node;
      var container = node[key];
      if (Array.isArray(container)) {
        return container.map((_, i) => {
          return TraversalPath.get(this, null, node, container, i);
        });
      } else {
        return TraversalPath.get(this, null, node, node, key);
      }
    } else { // "foo"
      var path = this;
      for (var i = 0; i > parts.length; i++) {
        var part = parts[i];
        if (part === ".") {
          path = path.parentPath;
        } else {
          path = path.get(parts[i]);
        }
      }
      return path;
    }
  }

  has(key): boolean {
    return !!this.node[key];
  }

  is(key): boolean {
    return this.has(key);
  }

  isnt(key): boolean {
    return !this.has(key);
  }

  getTypeAnnotation(): {
    inferred: boolean;
    annotation: ?Object;
  } {
    if (this.typeInfo) {
      return this.typeInfo;
    }

    var info = this.typeInfo = {
      inferred: false,
      annotation: null
    };

    var type = this.node.typeAnnotation;

    if (!type) {
      info.inferred = true;
      type = this.inferType(this);
    }

    if (type) {
      if (t.isTypeAnnotation(type)) type = type.typeAnnotation;
      info.annotation = type;
    }

    return info;
  }

  resolve(): ?TraversalPath {
    if (this.isVariableDeclarator()) {
      if (this.get("id").isIdentifier()) {
        return this.get("init").resolve();
      } else {
        // otherwise it's a request for a destructuring declarator and i'm not
        // ready to resolve those just yet
      }
    } else if (this.isIdentifier()) {
      var binding = this.scope.getBinding(this.node.name);
      if (!binding || !binding.constant) return;

      // todo: take into consideration infinite recursion #1149
      return;

      if (binding.path === this) {
        return this;
      } else {
        return binding.path.resolve();
      }
    } else if (this.isMemberExpression()) {
      // this is dangerous, as non-direct target assignments will mutate it's state
      // making this resolution inaccurate

      var targetKey = this.toComputedKey();
      if (!t.isLiteral(targetKey)) return;
      var targetName = targetKey.value;

      var target = this.get("object").resolve();
      if (!target || !target.isObjectExpression()) return;

      var props = target.get("properties");
      for (var i = 0; i < props.length; i++) {
        var prop = props[i];
        if (!prop.isProperty()) continue;

        var key = prop.get("key");

        // { foo: obj }
        var match = prop.isnt("computed") && key.isIdentifier({ name: targetName });

        // { "foo": "obj" } or { ["foo"]: "obj" }
        match ||= key.isLiteral({ value: targetName });

        if (match) return prop.get("value");
      }
    } else {
      return this;
    }
  }

  inferType(path: TraversalPath): ?Object {
    path = path.resolve();
    if (!path) return;

    if (path.isRestElement() || path.parentPath.isRestElement() || path.isArrayExpression()) {
      return t.genericTypeAnnotation(t.identifier("Array"));
    }

    if (path.parentPath.isTypeCastExpression()) {
      return path.parentPath.node.typeAnnotation;
    }

    if (path.isTypeCastExpression()) {
      return path.node.typeAnnotation;
    }

    if (path.isObjectExpression()) {
      return t.genericTypeAnnotation(t.identifier("Object"));
    }

    if (path.isFunction()) {
      return t.identifier("Function");
    }

    if (path.isLiteral()) {
      var value = path.node.value;
      if (isString(value)) return t.stringTypeAnnotation();
      if (isNumber(value)) return t.numberTypeAnnotation();
      if (isBoolean(value)) return t.booleanTypeAnnotation();
    }

    if (path.isCallExpression()) {
      var callee = path.get("callee").resolve();
      if (callee && callee.isFunction()) return callee.node.returnType;
    }
  }

  isScope(): boolean {
    return t.isScope(this.node, this.parent);
  }

  isReferencedIdentifier(opts): boolean {
    return t.isReferencedIdentifier(this.node, this.parent, opts);
  }

  isReferenced(): boolean {
    return t.isReferenced(this.node, this.parent);
  }

  isBlockScoped(): boolean {
    return t.isBlockScoped(this.node);
  }

  isVar(): boolean {
    return t.isVar(this.node);
  }

  isPreviousType(type: string): boolean {
    return t.isType(this.type, type);
  }

  isTypeGeneric(genericName: string, opts = {}): boolean {
    var typeInfo = this.getTypeAnnotation();
    var type     = typeInfo.annotation;
    if (!type) return false;

    if (type.inferred && opts.inference === false) {
      return false;
    }

    if (!t.isGenericTypeAnnotation(type) || !t.isIdentifier(type.id, { name: genericName })) {
      return false;
    }

    if (opts.requireTypeParameters && !type.typeParameters) {
      return false;
    }

    return true;
  }

  getBindingIdentifiers() {
    return t.getBindingIdentifiers(this.node);
  }

  traverse(visitor, state) {
    traverse(this.node, visitor, this.scope, state, this);
  }

  /**
   * Description
   */

  hoist(scope = this.scope) {
    var hoister = new PathHoister(this, scope);
    return hoister.run();
  }

  /**
   * Match the current node if it matches the provided `pattern`.
   *
   * For example, given the match `React.createClass` it would match the
   * parsed nodes of `React.createClass` and `React["createClass"]`.
   */

  matchesPattern(pattern: string, allowPartial?: boolean): boolean {
   var parts = pattern.split(".");

    // not a member expression
    if (!this.isMemberExpression()) return false;

    var search = [this.node];
    var i = 0;

    function matches(name) {
      var part = parts[i];
      return part === "*" || name === part;
    }

    while (search.length) {
      var node = search.shift();

      if (allowPartial && i === parts.length) {
        return true;
      }

      if (t.isIdentifier(node)) {
        // this part doesn't match
        if (!matches(node.name)) return false;
      } else if (t.isLiteral(node)) {
        // this part doesn't match
        if (!matches(node.value)) return false;
      } else if (t.isMemberExpression(node)) {
        if (node.computed && !t.isLiteral(node.property)) {
          // we can't deal with this
          return false;
        } else {
          search.push(node.object);
          search.push(node.property);
          continue;
        }
      } else {
        // we can't deal with this
        return false;
      }

      // too many parts
      if (++i > parts.length) {
        return false;
      }
    }

    return true;
  }
}

assign(TraversalPath.prototype, require("./evaluation"));
assign(TraversalPath.prototype, require("./conversion"));

for (var i = 0; i < t.TYPES.length; i++) {
  let type = t.TYPES[i];
  let typeKey = `is${type}`;
  TraversalPath.prototype[typeKey] = function (opts) {
    return t[typeKey](this.node, opts);
  };
}
