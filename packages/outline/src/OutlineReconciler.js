/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

import type {NodeKey} from './OutlineNode';
import type {NodeMapType, ViewModel} from './OutlineView';
import type {OutlineEditor} from './OutlineEditor';
import type {Selection} from './OutlineSelection';

import {getNodeByKey, IS_IMMUTABLE, IS_SEGMENTED} from './OutlineNode';
import {BlockNode, TextNode} from '.';
import {invariant} from './OutlineUtils';

let subTreeTextContent = '';
let editorTextContent = '';
let forceTextDirection = null;
let currentTextDirection = null;
let activeEditor: OutlineEditor;
let activeDirtySubTrees: Set<NodeKey>;
let activePrevNodeMap: NodeMapType;
let activeNextNodeMap: NodeMapType;
let activeViewModelIsHistoric: boolean = false;

const RTL = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC';
const LTR =
  'A-Za-z\u00C0-\u00D6\u00D8-\u00F6' +
  '\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u200E\u2C00-\uFB1C' +
  '\uFE00-\uFE6F\uFEFD-\uFFFF';

const rtl = new RegExp('^[^' + LTR + ']*[' + RTL + ']');
const ltr = new RegExp('^[^' + RTL + ']*[' + LTR + ']');

function getTextDirection(text: string): 'ltr' | 'rtl' | null {
  if (rtl.test(text)) {
    return 'rtl';
  }
  if (ltr.test(text)) {
    return 'ltr';
  }
  return null;
}

function handleElementTextDirection(element: HTMLElement): void {
  if (forceTextDirection === null) {
    // $FlowFixMe: internal field
    const prevSubTreeTextContent: string = element.__outlineTextContent;
    if (prevSubTreeTextContent !== subTreeTextContent) {
      const hasEmptyTextContent = subTreeTextContent === '';
      const direction = hasEmptyTextContent
        ? currentTextDirection
        : getTextDirection(subTreeTextContent);
      if (direction === null || (hasEmptyTextContent && direction === 'ltr')) {
        element.removeAttribute('dir');
      } else {
        element.dir = direction;
      }
      currentTextDirection = direction;
      // $FlowFixMe: internal field
      element.__outlineTextContent = subTreeTextContent;
    }
  }
}

function destroyNode(key: NodeKey, parentDOM: null | HTMLElement): void {
  const node = activePrevNodeMap[key];

  if (parentDOM !== null) {
    const dom = activeEditor.getElementByKey(key);
    parentDOM.removeChild(dom);
  }
  if (activeNextNodeMap[key] === undefined) {
    activeEditor._keyToDOMMap.delete(key);
  }
  if (node instanceof BlockNode) {
    const children = node.children;
    destroyChildren(children, 0, children.length - 1, null);
  }
}

function destroyChildren(
  children: Array<NodeKey>,
  _startIndex: number,
  endIndex: number,
  dom: null | HTMLElement,
): void {
  let startIndex = _startIndex;
  for (; startIndex <= endIndex; ++startIndex) {
    destroyNode(children[startIndex], dom);
  }
}

function createNode(
  key: NodeKey,
  parentDOM: null | HTMLElement,
  insertDOM: null | HTMLElement,
): HTMLElement {
  const node = activeNextNodeMap[key];
  const dom = node.createDOM();
  const flags = node.flags;
  storeDOMWithKey(key, dom, activeEditor);

  if (flags & IS_IMMUTABLE || flags & IS_SEGMENTED) {
    dom.contentEditable = 'false';
    if (!dom.hasAttribute('tabindex')) {
      dom.tabIndex = -1;
    }
  }

  if (node instanceof TextNode) {
    const text = node.text;
    subTreeTextContent += text;
    editorTextContent += text;
  } else if (node instanceof BlockNode) {
    // Handle block children
    const children = node.children;
    const endIndex = children.length - 1;
    if (node.hasDirection()) {
      createChildrenWithDirection(children, endIndex, dom);
    } else {
      createChildren(children, 0, endIndex, dom, null);
    }
  }
  if (parentDOM !== null) {
    if (insertDOM !== null) {
      parentDOM.insertBefore(dom, insertDOM);
    } else {
      parentDOM.appendChild(dom);
    }
  }
  return dom;
}

function createChildrenWithDirection(
  children: Array<NodeKey>,
  endIndex: number,
  dom: HTMLElement,
): void {
  const previousSubTreeTextContent = subTreeTextContent;
  subTreeTextContent = '';
  createChildren(children, 0, endIndex, dom, null);
  handleElementTextDirection(dom);
  subTreeTextContent = previousSubTreeTextContent;
}

function createChildren(
  children: Array<NodeKey>,
  _startIndex: number,
  endIndex: number,
  dom: null | HTMLElement,
  insertDOM: null | HTMLElement,
): void {
  let startIndex = _startIndex;
  for (; startIndex <= endIndex; ++startIndex) {
    createNode(children[startIndex], dom, insertDOM);
  }
}

function reconcileChildrenWithDirection(
  prevChildren: Array<NodeKey>,
  nextChildren: Array<NodeKey>,
  dom: HTMLElement,
): void {
  const previousSubTreeTextContent = subTreeTextContent;
  subTreeTextContent = '';
  reconcileChildren(prevChildren, nextChildren, dom);
  handleElementTextDirection(dom);
  subTreeTextContent = previousSubTreeTextContent;
}

function reconcileChildren(
  prevChildren: Array<NodeKey>,
  nextChildren: Array<NodeKey>,
  dom: HTMLElement,
): void {
  const prevChildrenLength = prevChildren.length;
  const nextChildrenLength = nextChildren.length;
  if (prevChildrenLength === 1 && nextChildrenLength === 1) {
    const prevChildKey = prevChildren[0];
    const nextChildKey = nextChildren[0];
    if (prevChildKey === nextChildKey) {
      reconcileNode(prevChildKey, dom);
    } else {
      const lastDOM = activeEditor.getElementByKey(prevChildKey);
      const replacementDOM = createNode(nextChildKey, null, null);
      dom.replaceChild(replacementDOM, lastDOM);
      destroyNode(prevChildKey, null);
    }
  } else if (prevChildrenLength === 0) {
    if (nextChildrenLength !== 0) {
      createChildren(nextChildren, 0, nextChildrenLength - 1, dom, null);
    }
  } else if (nextChildrenLength === 0) {
    if (prevChildrenLength !== 0) {
      destroyChildren(prevChildren, 0, prevChildrenLength - 1, null);
      // Fast path for removing DOM nodes
      dom.textContent = '';
    }
  } else {
    reconcileNodeChildren(
      prevChildren,
      nextChildren,
      prevChildrenLength,
      nextChildrenLength,
      dom,
    );
  }
}

function reconcileNode(key: NodeKey, parentDOM: HTMLElement | null): void {
  const prevNode = activePrevNodeMap[key];
  const nextNode = activeNextNodeMap[key];
  // Some DEV time checking
  if (nextNode.type !== 'root' && nextNode.parent === null) {
    // eslint-disable-next-line no-debugger
    debugger;
    throw new Error('MUST FIX');
  }
  const hasDirtySubTree =
    activeViewModelIsHistoric || activeDirtySubTrees.has(key);
  const dom = activeEditor.getElementByKey(key);

  if (prevNode === nextNode && !hasDirtySubTree) {
    if (prevNode instanceof TextNode) {
      const text = prevNode.text;
      editorTextContent += text;
      subTreeTextContent += text;
    } else {
      // $FlowFixMe: internal field
      const prevSubTreeTextContent = dom.__outlineTextContent;
      if (prevSubTreeTextContent !== undefined) {
        subTreeTextContent += prevSubTreeTextContent;
        editorTextContent += prevSubTreeTextContent;
      }
    }
    return;
  }
  // Update node. If it returns true, we need to unmount and re-create the node
  if (nextNode.updateDOM(prevNode, dom)) {
    const replacementDOM = createNode(key, null, null);
    if (parentDOM === null) {
      throw new Error('Should never happen');
    }
    parentDOM.replaceChild(replacementDOM, dom);
    destroyNode(key, null);
    return;
  }
  // Handle text content, for LTR, LTR cases.
  if (nextNode instanceof TextNode) {
    const text = nextNode.text;
    subTreeTextContent += text;
    editorTextContent += text;
    return;
  } else if (prevNode instanceof BlockNode && nextNode instanceof BlockNode) {
    // Reconcile block children
    const prevChildren = prevNode.children;
    const nextChildren = nextNode.children;
    const childrenAreDifferent = prevChildren !== nextChildren;

    if (childrenAreDifferent || hasDirtySubTree) {
      if (nextNode.hasDirection()) {
        reconcileChildrenWithDirection(prevChildren, nextChildren, dom);
      } else {
        reconcileChildren(prevChildren, nextChildren, dom);
      }
    }
  }
}

function createKeyToIndexMap(
  children: Array<NodeKey>,
  startIndex: number,
  endIndex: number,
): Map<NodeKey, number> {
  let i, key;
  const map = new Map();
  for (i = startIndex; i <= endIndex; ++i) {
    key = children[i];
    if (key !== undefined) {
      map.set(key, i);
    }
  }
  return map;
}

function findIndexInPrevChildren(
  targetKey: NodeKey,
  prevChildren: Array<NodeKey>,
  startIndex: number,
  endIndex: number,
): number {
  for (let i = startIndex; i < endIndex; i++) {
    const c = prevChildren[i];
    if (c === targetKey) {
      return i;
    }
  }
  throw new Error('Should never happen');
}

// Disclaimer: this logic was adapted from Vue (MIT):
// https://github.com/vuejs/vue/blob/dev/src/core/vdom/patch.js#L404

function reconcileNodeChildren(
  _prevChildren: Array<NodeKey>,
  nextChildren: Array<NodeKey>,
  prevChildrenLength: number,
  nextChildrenLength: number,
  dom: HTMLElement,
): void {
  let hasClonedPrevChildren = false;
  let prevStartIndex = 0;
  let nextStartIndex = 0;
  let prevChildren = _prevChildren;
  let prevEndIndex = prevChildren.length - 1;
  let prevStartKey = prevChildren[0];
  let prevEndKey: NodeKey = prevChildren[prevEndIndex];
  let nextEndIndex = nextChildren.length - 1;
  let nextStartKey = nextChildren[0];
  let nextEndKey = nextChildren[nextEndIndex];
  let prevKeyToIndexMap = null;

  while (prevStartIndex <= prevEndIndex && nextStartIndex <= nextEndIndex) {
    if (prevStartKey === undefined) {
      prevStartKey = prevChildren[++prevStartIndex];
    } else if (nextEndKey === undefined) {
      nextEndKey = prevChildren[--prevEndIndex];
    } else if (prevStartKey === nextStartKey) {
      reconcileNode(prevStartKey, dom);
      prevStartKey = prevChildren[++prevStartIndex];
      nextStartKey = nextChildren[++nextStartIndex];
    } else if (prevEndKey === nextEndKey) {
      reconcileNode(prevEndKey, dom);
      prevEndKey = prevChildren[--prevEndIndex];
      nextEndKey = nextChildren[--nextEndIndex];
    } else if (prevStartKey === nextEndKey) {
      reconcileNode(prevStartKey, dom);
      dom.insertBefore(
        activeEditor.getElementByKey(prevStartKey),
        activeEditor.getElementByKey(prevEndKey).nextSibling,
      );
      prevStartKey = prevChildren[++prevStartIndex];
      nextEndKey = nextChildren[--nextEndIndex];
    } else if (prevEndKey === nextStartKey) {
      reconcileNode(prevEndKey, dom);
      dom.insertBefore(
        activeEditor.getElementByKey(prevEndKey),
        activeEditor.getElementByKey(prevStartKey),
      );
      prevEndKey = prevChildren[--prevEndIndex];
      nextStartKey = nextChildren[++nextStartIndex];
    } else {
      // Lazily create Map
      if (prevKeyToIndexMap === null) {
        prevKeyToIndexMap = createKeyToIndexMap(
          prevChildren,
          prevStartIndex,
          prevEndIndex,
        );
      }
      const indexInPrevChildren =
        nextStartKey !== undefined
          ? prevKeyToIndexMap.get(nextStartKey)
          : findIndexInPrevChildren(
              nextStartKey,
              prevChildren,
              prevStartIndex,
              prevEndIndex,
            );
      if (indexInPrevChildren === undefined) {
        createNode(
          nextStartKey,
          dom,
          activeEditor.getElementByKey(prevStartKey),
        );
      } else {
        const keyToMove = prevChildren[indexInPrevChildren];
        if (keyToMove === nextStartKey) {
          reconcileNode(keyToMove, dom);
          if (hasClonedPrevChildren) {
            hasClonedPrevChildren = true;
            prevChildren = [...prevChildren];
          }
          // $FlowFixMe: figure a way of typing this better
          prevChildren[indexInPrevChildren] = ((undefined: any): NodeKey);
          dom.insertBefore(
            activeEditor.getElementByKey(keyToMove),
            activeEditor.getElementByKey(prevStartKey),
          );
        } else {
          throw new Error('TODO: Should this ever happen?');
        }
      }
      nextStartKey = nextChildren[++nextStartIndex];
    }
  }
  if (prevStartIndex > prevEndIndex) {
    const previousNode = nextChildren[nextEndIndex + 1];
    const insertDOM =
      previousNode === undefined
        ? null
        : activeEditor.getElementByKey(previousNode);
    createChildren(nextChildren, nextStartIndex, nextEndIndex, dom, insertDOM);
  } else if (nextStartIndex > nextEndIndex) {
    destroyChildren(prevChildren, prevStartIndex, prevEndIndex, dom);
  }
}

export function reconcilePlaceholder(
  editor: OutlineEditor,
  nextViewModel: ViewModel,
): void {
  const placeholderText = editor._placeholderText;
  const editorElement = editor._editorElement;
  if (editorElement === null) {
    return;
  }
  const noPlaceholderText = placeholderText === '';
  let placeholderElement = editor._placeholderElement;
  if (placeholderElement === null) {
    if (noPlaceholderText) {
      return;
    }
    placeholderElement = document.createElement('div');
    placeholderElement.className = 'placeholder';
    placeholderElement.contentEditable = 'false';
    placeholderElement.appendChild(document.createTextNode(placeholderText));
    editorElement.appendChild(placeholderElement);
    editor._placeholderElement = placeholderElement;
  }
  if (
    editor._textContent !== '' ||
    noPlaceholderText ||
    editor._isComposing ||
    !isEditorEmpty(editor, nextViewModel)
  ) {
    placeholderElement.style.display = 'none';
  } else {
    placeholderElement.style.display = 'block';
  }
}

function isEditorEmpty(
  editor: OutlineEditor,
  nextViewModel: ViewModel,
): boolean {
  if (editor._textContent !== '') {
    return false;
  }
  const nodeMap = nextViewModel.nodeMap;
  const topBlockIDs = nodeMap.root.children;
  for (let i = 0; i < topBlockIDs.length; i++) {
    const topBlock = nodeMap[topBlockIDs[i]];

    if (topBlock && topBlock.type !== 'paragraph') {
      return false;
    }
  }
  return true;
}

function reconcileRoot(
  prevViewModel: ViewModel,
  nextViewModel: ViewModel,
  editor: OutlineEditor,
  dirtySubTrees: Set<NodeKey>,
): void {
  // TODO: take this value from Editor props, default to null;
  // This will over-ride any sub-tree text direction properties.
  forceTextDirection = null;
  subTreeTextContent = '';
  editorTextContent = '';
  // Rather than pass around a load of arguments through the stack recursively
  // we instead set them as bindings within the scope of the module.
  activeEditor = editor;
  activeDirtySubTrees = dirtySubTrees;
  activePrevNodeMap = prevViewModel.nodeMap;
  activeNextNodeMap = nextViewModel.nodeMap;
  activeViewModelIsHistoric = nextViewModel.isHistoric;
  reconcileNode('root', null);
  editor._textContent = editorTextContent;
  reconcilePlaceholder(editor, nextViewModel);
  // We don't want a bunch of void checks throughout the scope
  // so instead we make it seem that these values are always set.
  // We also want to make sure we clear them down, otherwise we
  // can leak memory.
  // $FlowFixMe
  activeEditor = undefined;
  // $FlowFixMe
  activeDirtySubTrees = undefined;
  // $FlowFixMe
  activePrevNodeMap = undefined;
  // $FlowFixMe
  activeNextNodeMap = undefined;
}

export function reconcileViewModel(
  nextViewModel: ViewModel,
  editor: OutlineEditor,
): void {
  const prevViewModel = editor.getViewModel();
  const dirtySubTrees = nextViewModel.dirtySubTrees;
  const needsUpdate = nextViewModel.isHistoric || nextViewModel.hasDirtyNodes();
  const nextSelection = nextViewModel.selection;

  if (needsUpdate) {
    reconcileRoot(prevViewModel, nextViewModel, editor, dirtySubTrees);
  }
  if (nextSelection !== null && nextSelection.isDirty) {
    reconcileSelection(nextSelection, editor);
  }
}

function reconcileSelection(selection: Selection, editor: OutlineEditor): void {
  const anchorKey = selection.anchorKey;
  const focusKey = selection.focusKey;
  if (anchorKey === null || focusKey === null) {
    throw new Error('reconcileSelection: anchorKey or focusKey cannot be null');
  }
  const anchorOffset = selection.anchorOffset;
  const focusOffset = selection.focusOffset;
  const anchorNode = getNodeByKey(anchorKey);
  const focusNode = getNodeByKey(anchorKey);
  const domSelection = window.getSelection();

  if (
    anchorNode === focusNode &&
    anchorNode !== null &&
    (anchorNode.isImmutable() || anchorNode.isSegmented())
  ) {
    const anchorElement = editor.getElementByKey(anchorKey);
    domSelection.setBaseAndExtent(anchorElement, 0, anchorElement, 0);
    anchorElement.focus();
    return;
  }
  const anchorDOM = getSelectionDOMNode(anchorKey, editor);
  const focusDOM = getSelectionDOMNode(focusKey, editor);
  domSelection.setBaseAndExtent(anchorDOM, anchorOffset, focusDOM, focusOffset);
  const editorElement = editor.getEditorElement();
  if (document.activeElement !== editorElement && editorElement !== null) {
    editorElement.focus();
  }
}

function getSelectionDOMNode(key: NodeKey, editor: OutlineEditor): Node {
  const element = editor.getElementByKey(key);
  let node = element;
  while (node != null) {
    if (node.nodeType === 3) {
      return node;
    }
    node = node.firstChild;
  }
  invariant(false, 'Should not happen');
}

export function storeDOMWithKey(
  key: NodeKey,
  dom: HTMLElement,
  editor: OutlineEditor,
): void {
  if (key === null) {
    throw new Error('storeDOMWithNodeKey failed');
  }
  const keyToDOMMap = editor._keyToDOMMap;
  // $FlowFixMe: internal field
  dom.__outlineInternalRef = key;
  keyToDOMMap.set(key, dom);
}

export function getNodeKeyFromDOM(
  // Note that node here refers to a DOM Node, not an Outline Node
  dom: Node,
): NodeKey | null {
  let node = dom;
  while (node != null) {
    // $FlowFixMe: internal field
    const key: NodeKey | undefined = node.__outlineInternalRef;
    if (key !== undefined) {
      return key;
    }
    node = node.parentNode;
  }
  return null;
}
