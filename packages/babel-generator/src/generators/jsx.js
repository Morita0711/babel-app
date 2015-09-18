export function JSXAttribute(node, print) {
  print.plain(node.name);
  if (node.value) {
    this.push("=");
    print.plain(node.value);
  }
}

export function JSXIdentifier(node) {
  this.push(node.name);
}

export function JSXNamespacedName(node, print) {
  print.plain(node.namespace);
  this.push(":");
  print.plain(node.name);
}

export function JSXMemberExpression(node, print) {
  print.plain(node.object);
  this.push(".");
  print.plain(node.property);
}

export function JSXSpreadAttribute(node, print) {
  this.push("{...");
  print.plain(node.argument);
  this.push("}");
}

export function JSXExpressionContainer(node, print) {
  this.push("{");
  print.plain(node.expression);
  this.push("}");
}

export function JSXText(node) {
  this.push(node.value, true);
}

export function JSXElement(node, print) {
  let open = node.openingElement;
  print.plain(open);
  if (open.selfClosing) return;

  this.indent();
  for (let child of (node.children: Array)) {
    print.plain(child);
  }
  this.dedent();

  print.plain(node.closingElement);
}

export function JSXOpeningElement(node, print) {
  this.push("<");
  print.plain(node.name);
  if (node.attributes.length > 0) {
    this.push(" ");
    print.join(node.attributes, { separator: " " });
  }
  this.push(node.selfClosing ? " />" : ">");
}

export function JSXClosingElement(node, print) {
  this.push("</");
  print.plain(node.name);
  this.push(">");
}

export function JSXEmptyExpression() {}
