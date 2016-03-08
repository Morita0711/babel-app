import { coroutine as _coroutine } from "bluebird";
var foo = (() => {
  var ref = _coroutine(function* () {
    console.log(bar);
  });

  function bar() {
    return ref.apply(this, arguments);
  }

  return bar;
})();
