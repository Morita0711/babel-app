export default function ({ types: t }) {
  function hasRefOrSpread(attrs) {
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      if (t.isJSXSpreadAttribute(attr)) return true;
      if (isJSXAttributeOfName(attr, "ref")) return true;
    }
    return false;
  }

  function isJSXAttributeOfName(attr, name) {
    return t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: name });
  }

  return {
    visitor: {
      JSXElement({ node }, file) {
        // filter
        var open = node.openingElement;
        if (hasRefOrSpread(open.attributes)) return;

        // init
        var isComponent = true;
        var props       = t.objectExpression([]);
        var obj         = t.objectExpression([]);
        var key         = t.nullLiteral();
        var type        = open.name;

        if (t.isJSXIdentifier(type) && t.react.isCompatTag(type.name)) {
          type = t.stringLiteral(type.name);
          isComponent = false;
        }

        function pushElemProp(key, value) {
          pushProp(obj.properties, t.identifier(key), value);
        }

        function pushProp(objProps, key, value) {
          objProps.push(t.property("init", key, value));
        }

        // metadata
        pushElemProp("type", type);
        pushElemProp("ref", t.nullLiteral());

        if (node.children.length) {
          var children = t.react.buildChildren(node);
          children = children.length === 1 ? children[0] : t.arrayExpression(children);
          pushProp(props.properties, t.identifier("children"), children);
        }

        // props
        for (var attr of (open.attributes: Array)) {
          if (isJSXAttributeOfName(attr, "key")) {
            key = attr.value;
          } else {
            pushProp(props.properties, t.identifier(attr.name.name), attr.value || t.identifier("true"));
          }
        }

        if (isComponent) {
          props = t.callExpression(file.addHelper("default-props"), [t.memberExpression(type, t.identifier("defaultProps")), props]);
        }

        pushElemProp("props", props);

        // key
        pushElemProp("key", key);

        return obj;
      }
    }
  };
}
