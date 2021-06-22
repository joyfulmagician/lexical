/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

import type {NodeKey, EditorThemeClasses} from 'outline';
import type {ParagraphNode} from 'outline/ParagraphNode';

import {BlockNode} from 'outline';
import {createParagraphNode} from 'outline/ParagraphNode';

export class QuoteNode extends BlockNode {
  constructor(key?: NodeKey) {
    super(key);
    this.__type = 'quote';
  }

  clone(): QuoteNode {
    return new QuoteNode();
  }

  // View

  createDOM(editorThemeClasses: EditorThemeClasses): HTMLElement {
    const element = document.createElement('blockquote');
    const className = editorThemeClasses.quote;
    if (className !== undefined) {
      element.className = className;
    }
    return element;
  }
  updateDOM(prevNode: QuoteNode, dom: HTMLElement): boolean {
    return false;
  }

  // Mutation

  insertNewAfter(): ParagraphNode {
    const newBlock = createParagraphNode();
    const direction = this.getDirection();
    newBlock.setDirection(direction);
    this.insertAfter(newBlock);
    return newBlock;
  }
}

export function createQuoteNode(): QuoteNode {
  return new QuoteNode();
}
