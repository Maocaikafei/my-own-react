import { Didact } from "./work";

// 注意这里的调用，会先调用createElement(a, null, 'bar')，接着createElement(b, null, null),然后createElement(div, { id: 'foo'}, element(a), element(b))
/** @jsx Didact.createElement */
const element = (
    <div id="foo">
      <h1>1234</h1>
      <a>bar</a>
      <b>test</b>
      <h1>1234</h1>
      <a>bar</a>
      <b>test</b>
      <h1>1234</h1>
      <a>bar</a>
      <b>test</b>
      <h1>1234</h1>
      <a>bar</a>
      <b>test</b>
      <h1>1234</h1>
      <a>bar</a>
      <b>test</b>
      <h1>1234</h1>
      <a>bar</a>
      <b>test</b>
      <h1>1234</h1>
      <a>bar</a>
      <b>test</b>
    </div>
  )
console.log(element);

const container = document.createElement('div');
Didact.render(element, container);
document.body.appendChild(container);
