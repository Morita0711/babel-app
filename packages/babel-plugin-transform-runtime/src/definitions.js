module.exports = {
  builtins: {
    Symbol: "symbol",
    Promise: "promise",
    Map: "map",
    WeakMap: "weak-map",
    Set: "set",
    WeakSet: "weak-set"
  },

  methods: {
    Array: {
      concat: "array/concat",
      copyWithin: "array/copy-within",
      entries: "array/entries",
      every: "array/every",
      fill: "array/fill",
      filter: "array/filter",
      findIndex: "array/find-index",
      find: "array/find",
      forEach: "array/for-each",
      from: "array/from",
      includes: "array/includes",
      indexOf: "array/index-of",
      join: "array/join",
      keys: "array/keys",
      lastIndexOf: "array/last-index-of",
      map: "array/map",
      of: "array/of",
      pop: "array/pop",
      push: "array/push",
      reduceRight: "array/reduce-right",
      reduce: "array/reduce",
      reverse: "array/reverse",
      shift: "array/shift",
      slice: "array/slice",
      some: "array/some",
      sort: "array/sort",
      splice: "array/splice",
      unshift: "array/unshift",
      values: "array/values"
    },

    Object: {
      assign: "object/assign",
      classof: "object/classof",
      create: "object/create",
      define: "object/define",
      defineProperties: "object/define-properties",
      defineProperty: "object/define-property",
      entries: "object/entries",
      freeze: "object/freeze",
      getOwnPropertyDescriptor: "object/get-own-property-descriptor",
      getOwnPropertyDescriptors: "object/get-own-property-descriptors",
      getOwnPropertyNames: "object/get-own-property-names",
      getOwnPropertySymbols: "object/get-own-property-symbols",
      getPrototypePf: "object/get-prototype-of",
      index: "object/index",
      isExtensible: "object/is-extensible",
      isFrozen: "object/is-frozen",
      isObject: "object/is-object",
      isSealed: "object/is-sealed",
      is: "object/is",
      keys: "object/keys",
      make: "object/make",
      preventExtensions: "object/prevent-extensions",
      seal: "object/seal",
      setPrototypeOf: "object/set-prototype-of",
      values: "object/values"
    },

    RegExp: {
      escape: "regexp/escape"
    },

    Function: {
      only: "function/only",
      part: "function/part"
    },

    Math: {
      acosh: "math/acosh",
      asinh: "math/asinh",
      atanh: "math/atanh",
      cbrt: "math/cbrt",
      clz32: "math/clz32",
      cosh: "math/cosh",
      expm1: "math/expm1",
      fround: "math/fround",
      hypot: "math/hypot",
      pot: "math/pot",
      imul: "math/imul",
      log10: "math/log10",
      log1p: "math/log1p",
      log2: "math/log2",
      sign: "math/sign",
      sinh: "math/sinh",
      tanh: "math/tanh",
      trunc: "math/trunc"
    },

    Date: {
      addLocale: "date/add-locale",
      formatUTC: "date/format-utc",
      format: "date/format"
    },

    Symbol: {
      for: "symbol/for",
      hasInstance: "symbol/has-instance",
      "is-concat-spreadable": "symbol/is-concat-spreadable",
      iterator: "symbol/iterator",
      keyFor: "symbol/key-for",
      match: "symbol/match",
      replace: "symbol/replace",
      search: "symbol/search",
      species: "symbol/species",
      split: "symbol/split",
      toPrimitive: "symbol/to-primitive",
      toStringTag: "symbol/to-string-tag",
      unscopables: "symbol/unscopables"
    },

    String: {
      at: "string/at",
      codePointAt: "string/code-point-at",
      endsWith: "string/ends-with",
      escapeHTML: "string/escape-html",
      fromCodePoint: "string/from-code-point",
      includes: "string/includes",
      raw: "string/raw",
      repeat: "string/repeat",
      startsWith: "string/starts-with",
      unescapeHTML: "string/unescape-html"
    },

    Number: {
      EPSILON: "number/epsilon",
      isFinite: "number/is-finite",
      isInteger: "number/is-integer",
      isNaN: "number/is-nan",
      isSafeInteger: "number/is-safe-integer",
      MAX_SAFE_INTEGER: "number/max-safe-integer",
      MIN_SAFE_INTEGER: "number/min-safe-integer",
      parseFloat: "number/parse-float",
      parseInt: "number/parse-int",
      random: "number/random"
    },

    Reflect: {
      apply: "reflect/apply",
      construct: "reflect/construct",
      defineProperty: "reflect/define-property",
      deleteProperty: "reflect/delete-property",
      enumerate: "reflect/enumerate",
      getOwnPropertyDescriptor: "reflect/get-own-property-descriptor",
      getPrototypeOf: "reflect/get-prototype-of",
      get: "reflect/get",
      has: "reflect/has",
      isExtensible: "reflect/is-extensible",
      ownKeys: "reflect/own-keys",
      preventExtensions: "reflect/prevent-extensions",
      setPrototypeOf: "reflect/set-prototype-of",
      set: "reflect/set"
    }
  }
};
