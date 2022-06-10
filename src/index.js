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
  const [value, setValue] = Didact.useState(2);
  const [value2, setValue2] = Didact.useState(3);
  const [value3, setValue3] = Didact.useState(4);
  const [value4, setValue4] = Didact.useState(5);
  const [value5, setValue5] = Didact.useState(6);
  const [value6, setValue6] = Didact.useState(7);
  const [value7, setValue7] = Didact.useState(8);
  const [value8, setValue8] = Didact.useState(9);
  const [value9, setValue9] = Didact.useState(10);
  const [value10, setValue10] = Didact.useState(11);
  const [value11, setValue11] = Didact.useState(12);

  function change(_value) {
      let i = 1000;
      while (i > 0) {
        let j = 100000;
        while (j > 0) {
          j -= 1;
        }
        i -= 1;
      }
    return `${Number(_value) + 1}`;
  }
  return (
    <div>
      <h1 onClick={() => setState(c => c + 1)} style="user-select: none">
        Count1: {value}
      </h1>
      <h1>
        Count2: {value2}
      </h1>
      <h1>
        Count3: {value3}
      </h1>
      <h1>
        Count3: {value4}
      </h1>
      <h1>
        Count3: {value5}
      </h1>
      <h1>
        Count3: {value6}
      </h1>
      <h1>
        Count3: {value7}
      </h1>
      <h1>
        Count3: {value8}
      </h1>
      <h1>
        Count3: {value9}
      </h1>
      <h1>
        Count3: {value10}
      </h1>
      <h1>
        Count3: {value11}
      </h1>
      {/* 每次输入都需要更新所有元素，因为有多个元素用到了state，所以需要执行多个setState函数
        因为react每次更新页面都是所有元素一起更新，所以需要等候所有的setState计算完后，才能更新页面
        又因为每个节点的setState的计算时间都很长，因此当某一节点计算完毕后，就没有剩余时间了
        这时候如果有渲染页面的请求，（例如用户输入），react会先渲染页面，然后再更新fiber节点，继续执行之前的setState的计算


        短时间内不停的触发setState会导致state卡住没变化，是因为每次都会重新render，重新从第一个节点开始计算

        是否有剩余时间渲染，是在当前setState函数执行完后，再判断是否有剩余时间渲染
        因此只有当setState量很大，执行时间较短时，才能够体现出异步的效果
        如果单个setState的执行时间很长，还是会卡住，异步效果不明显

        总之，concurrent模式默认并未开启，目前使用频率并不高
        其实现原理就是借助Fiber结构（类链表）达到可中断并还原的效果
        同时使用时间切片，来判断什么时候需要中断
        在当前帧的剩余时间不足时，就中断当前的Fiber树计算，进行渲染等操作，在下一帧再
        从之前中断的Fiber结单继续计算
        实现的效果就是当后台需要大量计算时，input输入框等可以流畅执行（可为什么不用Async来规避呢？因为Async最终同样是要放到主线程来执行）
      */}
      <input onInput={e => {
        setValue(change);
        setValue2(change);
        setValue3(change);
        setValue4(change);
        setValue5(change);
        setValue6(change);
        setValue7(change);
        setValue8(change);
        setValue9(change);
        setValue10(change);
        setValue11(change);
      }} />
      <input />
    </div>
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
