var esutils = require("esutils");
var _       = require("lodash");

var t = exports;

var addAssert = function (type, is) {
  t["assert" + type] = function (node, opts) {
    opts = opts || {};
    if (!is(node, opts)) {
      throw new Error("Expected type " + JSON.stringify(type) + " with option " + JSON.stringify(opts));
    }
  };
};

t.STATEMENT_OR_BLOCK_KEYS = ["consequent", "body"];

//

t.VISITOR_KEYS = require("./visitor-keys");

_.each(t.VISITOR_KEYS, function (keys, type) {
  var is = t["is" + type] = function (node, opts) {
    return node && node.type === type && t.shallowEqual(node, opts);
  };

  addAssert(type, is);
});

//

t.BUILDER_KEYS = _.defaults(require("./builder-keys"), t.VISITOR_KEYS);

_.each(t.BUILDER_KEYS, function (keys, type) {
  t[type[0].toLowerCase() + type.slice(1)] = function () {
    var args = arguments;
    var node = { type: type };
    _.each(keys, function (key, i) {
      node[key] = args[i];
    });
    return node;
  };
});

//

t.ALIAS_KEYS = require("./alias-keys");

t.FLIPPED_ALIAS_KEYS = {};

_.each(t.ALIAS_KEYS, function (aliases, type) {
  _.each(aliases, function (alias) {
    var types = t.FLIPPED_ALIAS_KEYS[alias] = t.FLIPPED_ALIAS_KEYS[alias] || [];
    types.push(type);
  });
});

_.each(t.FLIPPED_ALIAS_KEYS, function (types, type) {
  t[type.toUpperCase() + "_TYPES"] = types;

  var is = t["is" + type] = function (node, opts) {
    return node && types.indexOf(node.type) >= 0 && t.shallowEqual(node, opts);
  };

  addAssert(type, is);
});

//

t.isFalsyExpression = function (node) {
  if (t.isLiteral(node)) {
    return !node.value;
  } else if (t.isIdentifier(node)) {
    return node.name === "undefined";
  }
  return false;
};

//

t.toSequenceExpression = function (nodes, scope) {
  var exprs = [];

  _.each(nodes, function (node) {
    if (t.isExpression(node)) {
      exprs.push(node);
    } if (t.isExpressionStatement(node)) {
      exprs.push(node.expression);
    } else if (t.isVariableDeclaration(node)) {
      _.each(node.declarations, function (declar) {
        scope.push({
          kind: node.kind,
          key: declar.id.name,
          id: declar.id
        });
        exprs.push(t.assignmentExpression("=", declar.id, declar.init));
      });
    }
  });

  return t.sequenceExpression(exprs);
};

//

t.shallowEqual = function (actual, expected) {
  var same = true;

  if (expected) {
    _.each(expected, function (val, key) {
      if (actual[key] !== val) {
        return same = false;
      }
    });
  }

  return same;
};

//

t.isDynamic = function (node) {
  if (t.isExpressionStatement(node)) {
    return t.isDynamic(node.expression);
  } else if (t.isIdentifier(node) || t.isLiteral(node) || t.isThisExpression(node)) {
    return false;
  } else if (t.isMemberExpression(node)) {
    return t.isDynamic(node.object) || t.isDynamic(node.property);
  } else {
    return true;
  }
};

// todo: https://github.com/eventualbuddha/ast-util/blob/9bf91c5ce8/lib/index.js#L454-L507
t.isReferenced = function (node, parent) {
  // we're a property key and we aren't computed so we aren't referenced
  if (t.isProperty(parent) && parent.key === node && !parent.computed) return false;

  // we're a variable declarator id so we aren't referenced
  if (t.isVariableDeclarator(parent) && parent.id === node) return false;

  var isMemberExpression = t.isMemberExpression(parent);

  // we're in a member expression and we're the computed property so we're referenced
  var isComputedProperty = isMemberExpression && parent.property === node && parent.computed;

  // we're in a member expression and we're the object so we're referenced
  var isObject = isMemberExpression && parent.object === node;

  // we are referenced
  if (!isMemberExpression || isComputedProperty || isObject) return true;

  return false;
};

t.toIdentifier = function (name) {
  if (t.isIdentifier(name)) return name.name;

  // replace all non-valid identifiers with dashes
  name = name.replace(/[^a-zA-Z0-9$_]/g, "-");

  // remove all dashes and numbers from start of name
  name = name.replace(/^[-0-9]+/, "");

  // camel case
  name = name.replace(/[-_\s]+(.)?/g, function (match, c) {
    return c ? c.toUpperCase() : "";
  });

  // remove underscores from start of name
  name = name.replace(/^\_/, "");

  return name || '_';
};

t.isValidIdentifier = function (name) {
  return _.isString(name) && esutils.keyword.isIdentifierName(name) && !esutils.keyword.isKeywordES6(name, true);
};

t.ensureBlock = function (node, key) {
  key = key || "body";
  node[key] = t.toBlock(node[key], node);
};

t.toStatement = function (node, ignore) {
  if (t.isStatement(node)) {
    return node;
  }

  var mustHaveId = false;
  var newType;

  if (t.isClass(node)) {
    mustHaveId = true;
    newType = "ClassDeclaration";
  } else if (t.isFunction(node)) {
    mustHaveId = true;
    newType = "FunctionDeclaration";
  }

  if (mustHaveId && !node.id) {
    newType = false;
  }

  if (!newType) {
    if (ignore) {
      return false;
    } else {
      throw new Error("cannot turn " + node.type + " to a statement");
    }
  }

  node.type = newType;

  return node;
};

t.toBlock = function (node, parent) {
  if (t.isBlockStatement(node)) {
    return node;
  }

  if (!_.isArray(node)) {
    if (!t.isStatement(node)) {
      if (t.isFunction(parent)) {
        node = t.returnStatement(node);
      } else {
        node = t.expressionStatement(node);
      }
    }

    node = [node];
  }

  return t.blockStatement(node);
};

t.getUid = function (parent, file, scope) {
  var node = parent;

  if (t.isAssignmentExpression(parent)) {
    node = parent.left;
  } else if (t.isVariableDeclarator(parent)) {
    node = parent.id;
  }

  var id = "ref";

  if (t.isProperty(node)) {
    node = node.key;
  }

  if (t.isIdentifier(node)) {
    id = node.name;
  } else if (t.isLiteral(node)) {
    id = node.value;
  } else if (t.isMemberExpression(node)) {
    var parts = [];

    var add = function (node) {
      if (t.isMemberExpression(node)) {
        add(node.object);
        add(node.property);
      } else if (t.isIdentifier(node)) {
        parts.push(node.name);
      } else if (t.isLiteral(node)) {
        parts.push(node.value);
      }
    };

    add(node);

    id = parts.join("$");
  }

  id = id.replace(/^_/, "");

  return file.generateUidIdentifier(id, scope);
};

t.getIds = function (node, map, ignoreTypes) {
  ignoreTypes = ignoreTypes || [];

  var search = [].concat(node);
  var ids    = {};

  while (search.length) {
    var id = search.shift();
    if (!id) continue;
    if (_.contains(ignoreTypes, id.type)) continue;

    var nodeKey = t.getIds.nodes[id.type];
    var arrKeys  = t.getIds.arrays[id.type];

    if (t.isIdentifier(id)) {
      ids[id.name] = id;
    } else if (nodeKey) {
      if (id[nodeKey]) search.push(id[nodeKey]);
    } else if (arrKeys) {
      for (var i in arrKeys) {
        var key = arrKeys[i];
        search = search.concat(id[key] || []);
      }
    }
  }

  if (!map) ids = _.keys(ids);
  return ids;
};

t.getIds.nodes = {
  AssignmentExpression: "left",
  ImportSpecifier: "name",
  ExportSpecifier: "name",
  VariableDeclarator: "id",
  FunctionDeclaration: "id",
  ClassDeclaration: "id",
  MemeberExpression: "object",
  SpreadElement: "argument",
  Property: "value"
};

t.getIds.arrays = {
  ExportDeclaration: ["specifiers", "declaration"],
  ImportDeclaration: ["specifiers"],
  VariableDeclaration: ["declarations"],
  ArrayPattern: ["elements"],
  ObjectPattern: ["properties"]
};

t.isLet = function (node) {
  return t.isVariableDeclaration(node) && (node.kind !== "var" || node._let);
};

t.isVar = function (node) {
  return t.isVariableDeclaration(node, { kind: "var" }) && !node._let;
};

//

t.COMMENT_KEYS = ["leadingComments", "trailingComments"];

t.removeComments = function (child) {
  _.each(t.COMMENT_KEYS, function (key) {
    delete child[key];
  });
  return child;
};

t.inheritsComments = function (child, parent) {
  _.each(t.COMMENT_KEYS, function (key) {
    child[key]  = _.uniq(_.compact([].concat(child[key], parent[key])));
  });
  return child;
};

//

t.inherits = function (child, parent) {
  child.loc   = parent.loc;
  child.end   = parent.end;
  child.range = parent.range;
  child.start = parent.start;
  t.inheritsComments(child, parent);
  return child;
};

t.getSpecifierName = function (specifier) {
  return specifier.name || specifier.id;
};

t.isSpecifierDefault = function (specifier) {
  return t.isIdentifier(specifier.id) && specifier.id.name === "default";
};
