import { createTextElement, createElement, updateDom } from './utils';

function createDOM(fiber) {
    const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type);
    function isProperty(key) {
        return key !== 'children';
    }

    updateDom(dom, {}, fiber.props)

    // Object.keys(fiber.props)
    //     .filter(isProperty)
    //     .forEach(name => {
    //         dom[name] = fiber.props[name];
    //     })

    return dom;
}

let nextUnitOfWork = null;
// 内存中的Fiber树
let wipRoot = null;
// 界面展示的Fiber树（上一次渲染的Fiber树）
let currentRoot = null;
// 用于保存需要删除的旧Fiber节点
let deletions = null;

// commit阶段
function commitRoot() {
    // 对每个带有删除标志的旧fiber节点执行commitWork
    deletions.forEach(commitWork);
    // 执行commit，从wipRoot.child开始，因为wipRoot是头节点，本身就存在
    commitWork(wipRoot.child);
    // 将当前树节点的指针指向wipRoot
    currentRoot = wipRoot;
    // 清空wipRoot
    wipRoot = null;
}

// 删除操作，因为存在functionFiber节点，该fiber下没有dom
// 因此需要找到该fiber下有dom的节点
function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
      domParent.removeChild(fiber.dom)
    } else {
      commitDeletion(fiber.child, domParent)
    }
}

function commitWork(fiber) {
    if (!fiber) {
        return;
    }

    // 因为引入了functionFiber，因此fiber.parent可能没有dom
    // 需要往上遍历直到找到有dom节点的上级fiber
    let domParentFiber = fiber.parent
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent
    }

    // 递归fiber树，将dom拼接起来
    const domParent = domParentFiber.dom;

    if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
        domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === 'DELETION') {
        // 执行删除操作时，操作的一定是旧fiber树
        commitDeletion(fiber, domParent);
    } else if (fiber.effectTag === 'UPDATE' && fiber.dom !== null) {
        updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    }
    
    // domParent.appendChild(fiber.dom); 不用把update的dom与新Fiber关联吗？不用，如果是update，则本身就是复用dom
    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

// 比较当前Fiber的子节点列表和currentFiberTree对应节点的差异，为每个当前Fiber的子节点创建Fiber节点，并与其父节点串起来
function reconcileChildren(wipFiber, elements) {
    // 此函数流程解析：每次都是遍历一个Fiber节点（wipFiber）的子节点，这些子节点可能是新增，也可能是更新、删除，互不影响
    // 函数执行完后，重新进入performUnitOfWork，然后这些子节点将分别作为新的wipFiber进入此函数，遍历他们的子节点
    // 在其父级的函数执行中，标为新增的子节点，其alternate是null，所以其子节点们也都肯定是新增
    // 而作为update的子节点，则继续比较其子节点是新增还是更新
    // 总之，新增的节点子节点都是新增，因此如果第一个节点就新增了，那整棵树都会重新创建
    // 如果第一个节点是更新，则整棵树都会复用，因此，需要有delete，用来删除树下方无法复用的节点!
    let index = 0;
    let oldFiber = wipFiber.alternate?.child;
    let prevSibling = null;

    while (index < elements.length || (oldFiber !== null && oldFiber !== undefined)) {
        const element = elements[index];
        let newFiber = null;

        const sameType = element && oldFiber && (element?.type === oldFiber?.type);
        if (sameType) {
            // 当前节点与旧节点type相同，执行更新操作
            // we can keep the DOM node and just update it with the new props
            newFiber = {
                type: oldFiber.type,
                props: element.props, // use new props
                dom: oldFiber.dom,  // use old dom
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: 'UPDATE',
            }
        } else if (element && !sameType) {
            // 当前节点存在，不存在对应的旧节点，执行新增操作
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null, // 会在performUnitOfWork函数中创建dom
                parent: wipFiber,
                alternate: null,
                effectTag: 'PLACEMENT'
            }
        } else if (oldFiber && !sameType) {
            // 当前节点不存在，但存在旧节点，执行删除操作
            oldFiber.effectTag = 'DELETION';
            deletions.push(oldFiber);
        }

        // 移动oldFiber指针，指向和下一个element对应的oldFiber
        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }

        // 将第一个fiber作为child，其余的作为sibling
        if (index === 0) {
            wipFiber.child = newFiber
          } else if (element) {
            prevSibling.sibling = newFiber
          }
      
          prevSibling = newFiber
          index++
    }
}

// render阶段
function performUnitOfWork(fiber) {
    const isFunctionComponent = typeof fiber.type === 'function'; 
    if (isFunctionComponent) {
        updateFunctionComponent(fiber);
    } else {
        updateHostComponent(fiber);
    }
    

    // 返回下一个应该执行performUnitOfWork的Fiber
    // 这里通过模拟二叉树的遍历来实现整颗fiber树的遍历，当前节点有子节点，就返回子节点，否则返回当前节点的兄弟节点
    // 如果当前节点没有兄弟节点，就查看当前节点的父节点p（到这里，语义上来说，相当于p及其子节点都执行过performUnitOfWork了）
    // 如果p有兄弟节点，就返回，否则继续查看p的父节点
    if (fiber.child) {
        return fiber.child;
    }
    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.parent;
    }
    // 当nextFiber不存在，函数结束，返回值默认为undefined，进入commit阶段
  }

let wipFiber = null
let hookIndex = null

// 这里的update不是指Fiber属于update类型
// 此函数用于生成、加工Function类型的Fiber
function updateFunctionComponent(fiber) {
  // 对于每个FunctionComponent，都重新初始化以下参数
  wipFiber = fiber  // wip: work in progress
  hookIndex = 0 
  wipFiber.hooks = []; // hook数组，用于支持在同一个组件中多次调用hook
  // 这一步也是将hooks数组与fiber节点关联起来

  // 这里是执行function方法并获取其返回值，作为该function节点的孩子
  const children = [fiber.type(fiber.props)]
   reconcileChildren(fiber, children)
}

  function useState(initial) {
    // wipFiber就是当前正在处理的Fiber节点
    // 根据index获取对应的oldHook
    const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]
    const hook = {
        state: oldHook ? oldHook.state : initial,
        queue: [],
    }

    const actions = oldHook ? oldHook.queue : [];
    actions.forEach(action => {
        console.log('action', initial)
        if (typeof action === 'function') {
            hook.state = action(hook.state)
        } else {
            hook.state = action;
        }
    })

    const setState = action => {
        hook.queue.push(action)

        // 这就是为什么setState会重新render
        // set a new work in progress root as the next unit of work so the work loop can start a new render phase.
        wipRoot = {
          dom: currentRoot.dom,
          props: currentRoot.props,
          alternate: currentRoot,
        }
        nextUnitOfWork = wipRoot
        deletions = []
    }

    // 将新生成的hook存储到wipFiber中，对下一次render来说，他就可以获取到上一次的state
    wipFiber.hooks.push(hook)
    // 当下一次调用useHook时，就可以操作hook数组中的下一个hook，hook间不会相互干扰
    // 这也是为什么在function中，hook顺序要保持一致
    hookIndex++; 
    return [hook.state, setState];
  }
  
  function updateHostComponent(fiber) {
    // 如果当前Fiber节点没有dom节点，则创建它的dom节点（reconcileChildren中复用了dom的，这里就不会创建）
    if (!fiber.dom) {
        fiber.dom = createDOM(fiber);
    }


    // 这一步属于dom操作，将当前Fiber的dom接到parent的dom
    // 这样写会有问题，render阶段可能中断，因此当时间切片不足时，会出现更新不完整的情况。
    // 应该移动至commit阶段执行，因为是同步的，就不会有时间切片不足的情况，且只有js执行完才会渲染页面
    // if(fiber.parent) {
    //     fiber.parent.dom.appendChild(fiber.dom);
    // }

    const elements = fiber.props.children;
    reconcileChildren(fiber, elements);

    // ----下方的Fiber创建操作，移动到reconcileChildren中了
    // 将当前Fiber的children数组中的虚拟dom都转化为Fiber
    // 遵循Fiber.child Fiber.sibling Fiber.sibling ...
    // let preSibling = null;
    // fiber.props.children.map((child, index) => {
    //   const newFiber = {
    //       type: child.type,
    //       props: child.props,
    //       parent: fiber,
    //       dom: null,
    //   }

    //   if (index === 0) {
    //       fiber.child = newFiber;
    //   } else {
    //       preSibling.sibling = newFiber;
    //   }
    //   preSibling = newFiber;
    // });
  }

// 任务轮询。
function workLoop(deadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        // let i = 10000000;
        // while(i > 0) {
        //     i = i - 1;
        // }
        // 开始render阶段
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        // 判断是否有剩余时间
        shouldYield = deadline.timeRemaining() < 3;
    }

    // 当没有下一个Fiber节点时，此时每个虚拟dom都有对应的fiber节点了，且都有增删改标识，进入同步的commit阶段
    if (!nextUnitOfWork && wipRoot) {
        commitRoot();
    }

    // 开始下一次轮询
    requestIdleCallback(workLoop);
}

// 首次执行任务，之后就一直轮询
requestIdleCallback(workLoop);

function render(element, container) {
    // 创建运行在内存中的Fiber树的Root节点，以传递进来的element作为第一个子节点
    wipRoot = {
        dom: container,
        props: {
          children: [element],
        },
        alternate: currentRoot, // alternate指向。。。。
    }

    // 赋值给nextUnitOfWork，进入work loop，开始render阶段
    nextUnitOfWork = wipRoot;
    // 初始化deletions
    deletions = [];
}

// 模拟React
export const Didact = {
    createElement,
    render,
    useState
}