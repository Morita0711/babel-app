System.register("actual", ["foo"], function (_export) {
  "use strict";

  var __moduleName = "actual";

  var foo, xyz;
  return {
    setters: [function (m) {
      foo = m.default;
      xyz = m.baz;
    }],
    execute: function () {}
  };
});
