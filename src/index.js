import { Didact } from "./work";

// 注意这里的调用，会先调用createElement(a, null, 'bar')，接着createElement(b, null, null),然后createElement(div, { id: 'foo'}, element(a), element(b))
/** @jsx Didact.createElement */
// const element = (
//     <div id="foo">
//       <h1>1234</h1>
//       <a>bar</a>
//       <b>test</b>
//       <h1>1234</h1>
//       <a>bar</a>
//       <b>test</b>
//       <h1>1234</h1>
//       <a>bar</a>
//       <b>test</b>
//       <h1>1234</h1>
//       <a>bar</a>
//       <b>test</b>
//       <h1>1234</h1>
//       <a>bar</a>
//       <b>test</b>
//       <h1>1234</h1>
//       <a>bar</a>
//       <b>test</b>
//       <h1>1234</h1>
//       <a>bar</a>
//       <b>test</b>
//     </div>
//   )
// console.log(element);

/** @jsx Didact.createElement */
const container = document.createElement('div');
document.body.appendChild(container);

function Counter() {
  const [state, setState] = Didact.useState(1);
  return (
    <h1 onClick={() => setState(c => c + 1)} style="user-select: none">
      Count: {state}
    </h1>
  );
}
const element = <Counter />;

Didact.render(element, container);


/** @jsx Didact.createElement */
// function App(props) {
//   return <h1>Hi {props.name}</h1>
// }
// const element = <App name="foo" />
// Didact.render(element, container)



// const updateValue = e => {
//   console.log(1)
//   console.log(e.target.value);
//   rerender(e.target.value)
// }
// const rerender = value => {
//   const element = (
//     <div>
//       <input onInput={updateValue} value={value} />
//       <h2>Hello {value}</h2>
//     </div>
//   )
//   Didact.render(element, container)
// }

// rerender("World")



// const container = document.createElement('div');
// Didact.render(element, container);
// document.body.appendChild(container);
