import { createTextElement, createElement, updateDom } from './utils';

function createDOM(fiber) {
    const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type);
    function isProperty(key) {
        return key !== 'children';
    }

    Object.keys(fiber.props)
        .filter(isProperty)
        .forEach(name => {
            dom[name] = fiber.props[name];
        })

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
    // why?
    deletions.forEach(commitWork);
    // 执行commit
    commitWork(wipRoot.child);
    // 将当前树节点的指针指向wipRoot
    currentRoot = wipRoot;
    // 清空wipRoot
    wipRoot = null;
}

function commitWork(fiber) {
    if (!fiber) {
        return;
    }

    // 递归fiber树，将dom拼接起来
    const domParent = fiber.parent.dom;

    if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
        domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === 'DELETION') {
        // 执行删除操作时，fiber一定是旧fiber
        domParent.removeChild(fiber.dom);
    } else if (fiber.effectTag === 'UPDATE' && fiber.dom !== null) {
        updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    }
    
    // domParent.appendChild(fiber.dom); 不用把update的dom与新Fiber关联吗？
    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

// 比较当前Fiber的子节点列表和currentFiberTree对应节点的差异
function reconcileChildren(wipFiber, elements) {
    let index = 0;
    let oldFiber = wipFiber.alternate?.child;
    let prevSibling = null;

    while (index < elements.length || oldFiber !== null) {
        const element = elements[index];
        let newFiber = null;

        const sameType = element?.type === oldFiber?.type;
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
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: 'PLACEMENT'
            }
        } else if (!element && !sameType) {
            // 当前节点不存在，但存在旧节点，执行删除操作
            oldFiber.effectTag = 'DELETION';
            deletions.push(oldFiber);
        }

        // 从这行开始都是抄的，要捋一下逻辑
        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }

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
    // 如果当前Fiber节点没有dom节点，则创建它的dom节点
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

    // 返回下一个Fiber
    // 这里遵循二叉树的遍历规则（模拟归阶段），先当前节点有子节点，就返回子节点，否则返回当前节点的兄弟节点
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
  }

// 任务轮询。
function workLoop(deadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        let i = 10000000;
        while(i > 0) {
            i = i - 1;
        }
        // 开始render阶段
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        // 判断是否有剩余时间
        shouldYield = deadline.timeRemaining() < 1;
    }

    // 当没有下一个Fiber节点时，进入同步的commit阶段
    if (!nextUnitOfWork && wipRoot) {
        commitRoot();
    }

    // 开始下一次轮询
    requestIdleCallback(workLoop);
}

// 首次执行任务，之后就一直轮询
requestIdleCallback(workLoop);

function render(element, container) {
    // 创建运行在内存中的Fiber树的Root节点
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
}