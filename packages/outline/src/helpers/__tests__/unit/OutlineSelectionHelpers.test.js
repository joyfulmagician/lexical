/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {State} from 'outline';

import {createTextNode, TextNode, getSelection} from 'outline';
import {createParagraphNode} from 'outline/ParagraphNode';
import {
  insertText,
  insertNodes,
  insertParagraph,
  insertLineBreak,
  formatText,
  extractSelection,
  cloneContents,
} from 'outline/selection';
import {
  createTestEditor,
  createTestBlockNode,
  createTestExcludeFromCopyBlockNode,
} from '../../../__tests__/utils';
import {createHeadingNode} from '../../../extensions/OutlineHeadingNode';

function createParagraphWithNodes(editor, nodes) {
  const paragraph = createParagraphNode();
  const nodeMap = editor._pendingEditorState._nodeMap;
  for (let i = 0; i < nodes.length; i++) {
    const {text, key, mergeable} = nodes[i];
    const textNode = new TextNode(text, key);
    nodeMap.set(key, textNode);
    if (!mergeable) {
      textNode.toggleUnmergeable();
    }
    paragraph.append(textNode);
  }
  return paragraph;
}

function setAnchorPoint(state, point) {
  let selection = getSelection();
  if (selection === null) {
    const dummyTextNode = createTextNode();
    dummyTextNode.select();
    selection = getSelection();
  }
  const anchor = selection.anchor;
  anchor.type = point.type;
  anchor.offset = point.offset;
  anchor.key = point.key;
}

function setFocusPoint(state, point) {
  let selection = getSelection();
  if (selection === null) {
    const dummyTextNode = createTextNode();
    dummyTextNode.select();
    selection = getSelection();
  }
  const focus = selection.focus;
  focus.type = point.type;
  focus.offset = point.offset;
  focus.key = point.key;
}

describe('OutlineSelectionHelpers tests', () => {
  describe('Collapsed', () => {
    test('Can handle a text point', () => {
      const setupTestCase = (cb) => {
        const editor = createTestEditor();

        editor.addListener('error', (error) => {
          throw error;
        });

        editor.update((state) => {
          const root = state.getRoot();
          const block = createParagraphWithNodes(editor, [
            {text: 'a', key: 'a', mergeable: false},
            {text: 'b', key: 'b', mergeable: false},
            {text: 'c', key: 'c', mergeable: false},
          ]);
          root.append(block);
          setAnchorPoint(state, {
            type: 'text',
            offset: 0,
            key: 'a',
          });
          setFocusPoint(state, {
            type: 'text',
            offset: 0,
            key: 'a',
          });

          const selection = getSelection();
          cb(selection, state, block);
        });
      };

      // getNodes
      setupTestCase((selection, state) => {
        expect(selection.getNodes()).toEqual([state.getNodeByKey('a')]);
      });

      // getTextContent
      setupTestCase((selection) => {
        expect(selection.getTextContent()).toEqual('');
      });

      // insertText
      setupTestCase((selection, state) => {
        insertText(selection, 'Test');
        expect(state.getNodeByKey('a').getTextContent()).toBe('Testa');
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 4,
          key: 'a',
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 4,
          key: 'a',
        });
      });

      // insertNodes
      setupTestCase((selection, state, block) => {
        insertNodes(selection, [createTextNode('foo')]);
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 3,
          key: block.getFirstChild().getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 3,
          key: block.getFirstChild().getKey(),
        });
      });

      // insertParagraph
      setupTestCase((selection) => {
        insertParagraph(selection);
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 0,
          key: 'a',
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 0,
          key: 'a',
        });
      });

      // insertLineBreak
      setupTestCase((selection, state, block) => {
        insertLineBreak(selection, true);
        expect(selection.anchor).toEqual({
          type: 'block',
          offset: 0,
          key: block.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'block',
          offset: 0,
          key: block.getKey(),
        });
      });

      // Format text
      setupTestCase((selection, state, block) => {
        formatText(selection, 'bold');
        insertText(selection, 'Test');
        expect(block.getFirstChild().getTextContent()).toBe('Test');
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 4,
          key: block.getFirstChild().getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 4,
          key: block.getFirstChild().getKey(),
        });
        expect(block.getFirstChild().getNextSibling().getTextContent()).toBe(
          'a',
        );
      });

      // Extract selection
      setupTestCase((selection, state) => {
        expect(extractSelection(selection)).toEqual([state.getNodeByKey('a')]);
      });

      // cloneContents
      setupTestCase((selection, state, block) => {
        expect(cloneContents(selection)).toEqual({
          range: ['a'],
          nodeMap: [['a', {...state.getNodeByKey('a'), __text: ''}]],
        });
      });
    });

    test('Has correct text point after removal after merge', async () => {
      const editor = createTestEditor();

      editor.addListener('error', (error) => {
        throw error;
      });

      const element = document.createElement('div');
      let block;

      editor.setRootElement(element);

      editor.update((state) => {
        const root = state.getRoot();
        block = createParagraphWithNodes(
          editor,
          [
            {text: 'a', key: 'a', mergeable: true},
            {text: 'bb', key: 'bb', mergeable: true},
            {text: '', key: 'empty', mergeable: true},
            {text: 'cc', key: 'cc', mergeable: true},
            {text: 'd', key: 'd', mergeable: true},
          ],
          true,
        );
        root.append(block);
        setAnchorPoint(state, {
          type: 'text',
          key: 'bb',
          offset: 1,
        });
        setFocusPoint(state, {
          type: 'text',
          key: 'cc',
          offset: 1,
        });
      });

      await Promise.resolve().then();

      editor.getEditorState().read((state) => {
        const selection = getSelection();
        expect(selection.anchor).toEqual({
          type: 'text',
          key: 'a',
          offset: 2,
        });
        expect(selection.focus).toEqual({
          type: 'text',
          key: 'a',
          offset: 4,
        });
      });
    });

    test('Has correct text point after removal after merge (2)', async () => {
      const editor = createTestEditor();

      editor.addListener('error', (error) => {
        throw error;
      });

      const element = document.createElement('div');
      let block;

      editor.setRootElement(element);

      editor.update((state) => {
        const root = state.getRoot();
        block = createParagraphWithNodes(
          editor,
          [
            {text: 'a', key: 'a', mergeable: true},
            {text: '', key: 'empty', mergeable: true},
            {text: 'b', key: 'b', mergeable: true},
            {text: 'c', key: 'c', mergeable: true},
          ],
          true,
        );
        root.append(block);
        setAnchorPoint(state, {
          type: 'text',
          key: 'a',
          offset: 0,
        });
        setFocusPoint(state, {
          type: 'text',
          key: 'c',
          offset: 1,
        });
      });

      await Promise.resolve().then();

      editor.getEditorState().read((state) => {
        const selection = getSelection();
        expect(selection.anchor).toEqual({
          type: 'text',
          key: 'a',
          offset: 0,
        });
        expect(selection.focus).toEqual({
          type: 'text',
          key: 'a',
          offset: 3,
        });
      });
    });

    test('Has correct text point adjust to block point after removal of a single empty text node', async () => {
      const editor = createTestEditor();

      editor.addListener('error', (error) => {
        throw error;
      });

      const element = document.createElement('div');
      let block;

      editor.setRootElement(element);

      editor.update((state) => {
        const root = state.getRoot();
        block = createParagraphWithNodes(
          editor,
          [{text: '', key: 'a', mergeable: true}],
          true,
        );
        root.append(block);
        setAnchorPoint(state, {
          type: 'text',
          key: 'a',
          offset: 0,
        });
        setFocusPoint(state, {
          type: 'text',
          key: 'a',
          offset: 0,
        });
      });

      await Promise.resolve().then();

      editor.getEditorState().read((state) => {
        const selection = getSelection();
        expect(selection.anchor).toEqual({
          type: 'block',
          key: block.getKey(),
          offset: 0,
        });
        expect(selection.focus).toEqual({
          type: 'block',
          key: block.getKey(),
          offset: 0,
        });
      });
    });

    test('Has correct block point after removal of an empty text node in a group #1', async () => {
      const editor = createTestEditor();

      editor.addListener('error', (error) => {
        throw error;
      });

      const element = document.createElement('div');
      let block;

      editor.setRootElement(element);

      editor.update((state) => {
        const root = state.getRoot();
        block = createParagraphWithNodes(
          editor,
          [
            {text: '', key: 'a', mergeable: true},
            {text: 'b', key: 'b', mergeable: false},
          ],
          true,
        );
        root.append(block);
        setAnchorPoint(state, {
          type: 'block',
          key: block.getKey(),
          offset: 2,
        });
        setFocusPoint(state, {
          type: 'block',
          key: block.getKey(),
          offset: 2,
        });
      });

      await Promise.resolve().then();

      editor.getEditorState().read((state) => {
        const selection = getSelection();
        expect(selection.anchor).toEqual({
          type: 'text',
          key: 'b',
          offset: 1,
        });
        expect(selection.focus).toEqual({
          type: 'text',
          key: 'b',
          offset: 1,
        });
      });
    });

    test('Has correct block point after removal of an empty text node in a group #2', async () => {
      const editor = createTestEditor();

      editor.addListener('error', (error) => {
        throw error;
      });

      const element = document.createElement('div');
      let block;

      editor.setRootElement(element);

      editor.update((state) => {
        const root = state.getRoot();
        block = createParagraphWithNodes(
          editor,
          [
            {text: '', key: 'a', mergeable: true},
            {text: 'b', key: 'b', mergeable: false},
            {text: 'c', key: 'c', mergeable: true},
            {text: 'd', key: 'd', mergeable: true},
          ],
          true,
        );
        root.append(block);
        setAnchorPoint(state, {
          type: 'block',
          key: block.getKey(),
          offset: 4,
        });
        setFocusPoint(state, {
          type: 'block',
          key: block.getKey(),
          offset: 4,
        });
      });

      await Promise.resolve().then();

      editor.getEditorState().read((state) => {
        const selection = getSelection();
        expect(selection.anchor).toEqual({
          type: 'text',
          key: 'c',
          offset: 2,
        });
        expect(selection.focus).toEqual({
          type: 'text',
          key: 'c',
          offset: 2,
        });
      });
    });

    test('Has correct text point after removal of an empty text node in a group #3', async () => {
      const editor = createTestEditor();

      editor.addListener('error', (error) => {
        throw error;
      });

      const element = document.createElement('div');
      let block;

      editor.setRootElement(element);

      editor.update((state) => {
        const root = state.getRoot();
        block = createParagraphWithNodes(
          editor,
          [
            {text: '', key: 'a', mergeable: true},
            {text: 'b', key: 'b', mergeable: false},
            {text: 'c', key: 'c', mergeable: true},
            {text: 'd', key: 'd', mergeable: true},
          ],
          true,
        );
        root.append(block);
        setAnchorPoint(state, {
          type: 'text',
          key: 'd',
          offset: 1,
        });
        setFocusPoint(state, {
          type: 'text',
          key: 'd',
          offset: 1,
        });
      });

      await Promise.resolve().then();

      editor.getEditorState().read((state) => {
        const selection = getSelection();
        expect(selection.anchor).toEqual({
          type: 'text',
          key: 'c',
          offset: 2,
        });
        expect(selection.focus).toEqual({
          type: 'text',
          key: 'c',
          offset: 2,
        });
      });
    });

    test('Can handle a block point on empty block', () => {
      const setupTestCase = (cb) => {
        const editor = createTestEditor();

        editor.addListener('error', (error) => {
          throw error;
        });

        editor.update((state) => {
          const root = state.getRoot();
          const block = createParagraphWithNodes(editor, []);
          root.append(block);
          setAnchorPoint(state, {
            type: 'block',
            offset: 0,
            key: block.getKey(),
          });
          setFocusPoint(state, {
            type: 'block',
            offset: 0,
            key: block.getKey(),
          });

          const selection = getSelection();
          cb(selection, state, block);
        });
      };

      // getNodes
      setupTestCase((selection, state) => {
        expect(selection.getNodes()).toEqual([]);
      });

      // getTextContent
      setupTestCase((selection) => {
        expect(selection.getTextContent()).toEqual('');
      });

      // insertText
      setupTestCase((selection, state, block) => {
        insertText(selection, 'Test');
        const firstChild = block.getFirstChild();
        expect(firstChild.getTextContent()).toBe('Test');
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 4,
          key: firstChild.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 4,
          key: firstChild.getKey(),
        });
      });

      // insertParagraph
      setupTestCase((selection, state, block) => {
        insertParagraph(selection);
        const nextBlock = block.getNextSibling();
        expect(selection.anchor).toEqual({
          type: 'block',
          offset: 0,
          key: nextBlock.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'block',
          offset: 0,
          key: nextBlock.getKey(),
        });
      });

      // insertLineBreak
      setupTestCase((selection, state, block) => {
        insertLineBreak(selection, true);
        expect(selection.anchor).toEqual({
          type: 'block',
          offset: 0,
          key: block.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'block',
          offset: 0,
          key: block.getKey(),
        });
      });

      // Format text
      setupTestCase((selection, state, block) => {
        formatText(selection, 'bold');
        insertText(selection, 'Test');
        const firstChild = block.getFirstChild();
        expect(firstChild.getTextContent()).toBe('Test');
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 4,
          key: firstChild.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 4,
          key: firstChild.getKey(),
        });
      });

      // Extract selection
      setupTestCase((selection, state, block) => {
        expect(extractSelection(selection)).toEqual([]);
      });

      // cloneContents
      setupTestCase((selection, state, block) => {
        expect(cloneContents(selection)).toEqual({
          range: [],
          nodeMap: [],
        });
      });
    });

    test('Can handle a start block point', () => {
      const setupTestCase = (cb) => {
        const editor = createTestEditor();

        editor.addListener('error', (error) => {
          throw error;
        });

        editor.update((state) => {
          const root = state.getRoot();
          const block = createParagraphWithNodes(editor, [
            {text: 'a', key: 'a', mergeable: false},
            {text: 'b', key: 'b', mergeable: false},
            {text: 'c', key: 'c', mergeable: false},
          ]);
          root.append(block);
          setAnchorPoint(state, {
            type: 'block',
            offset: 0,
            key: block.getKey(),
          });
          setFocusPoint(state, {
            type: 'block',
            offset: 0,
            key: block.getKey(),
          });

          const selection = getSelection();
          cb(selection, state, block);
        });
      };

      // getNodes
      setupTestCase((selection, state) => {
        expect(selection.getNodes()).toEqual([state.getNodeByKey('a')]);
      });

      // getTextContent
      setupTestCase((selection) => {
        expect(selection.getTextContent()).toEqual('');
      });

      // insertText
      setupTestCase((selection, state, block) => {
        insertText(selection, 'Test');
        const firstChild = block.getFirstChild();
        expect(firstChild.getTextContent()).toBe('Test');
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 4,
          key: firstChild.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 4,
          key: firstChild.getKey(),
        });
      });

      // insertParagraph
      setupTestCase((selection, state, block) => {
        insertParagraph(selection);
        const firstChild = block.getNextSibling().getFirstChild();
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 0,
          key: firstChild.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 0,
          key: firstChild.getKey(),
        });
      });

      // insertLineBreak
      setupTestCase((selection, state, block) => {
        insertLineBreak(selection, true);
        expect(selection.anchor).toEqual({
          type: 'block',
          offset: 0,
          key: block.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'block',
          offset: 0,
          key: block.getKey(),
        });
      });

      // Format text
      setupTestCase((selection, state, block) => {
        formatText(selection, 'bold');
        insertText(selection, 'Test');
        const firstChild = block.getFirstChild();
        expect(firstChild.getTextContent()).toBe('Test');
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 4,
          key: firstChild.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 4,
          key: firstChild.getKey(),
        });
      });

      // Extract selection
      setupTestCase((selection, state, block) => {
        expect(extractSelection(selection)).toEqual([state.getNodeByKey('a')]);
      });

      // cloneContents
      setupTestCase((selection, state, block) => {
        expect(cloneContents(selection)).toEqual({
          range: [block.getKey()],
          nodeMap: [
            ['a', {...state.getNodeByKey('a'), __text: ''}],
            [block.getKey(), {...block, __children: ['a']}],
          ],
        });
      });
    });

    test('Can handle an end block point', () => {
      const setupTestCase = (cb) => {
        const editor = createTestEditor();

        editor.addListener('error', (error) => {
          throw error;
        });

        editor.update((state) => {
          const root = state.getRoot();
          const block = createParagraphWithNodes(editor, [
            {text: 'a', key: 'a', mergeable: false},
            {text: 'b', key: 'b', mergeable: false},
            {text: 'c', key: 'c', mergeable: false},
          ]);
          root.append(block);
          setAnchorPoint(state, {
            type: 'block',
            offset: 3,
            key: block.getKey(),
          });
          setFocusPoint(state, {
            type: 'block',
            offset: 3,
            key: block.getKey(),
          });

          const selection = getSelection();
          cb(selection, state, block);
        });
      };

      // getNodes
      setupTestCase((selection, state) => {
        expect(selection.getNodes()).toEqual([state.getNodeByKey('c')]);
      });

      // getTextContent
      setupTestCase((selection) => {
        expect(selection.getTextContent()).toEqual('');
      });

      // insertText
      setupTestCase((selection, state, block) => {
        insertText(selection, 'Test');
        const lastChild = block.getLastChild();
        expect(lastChild.getTextContent()).toBe('Test');
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 4,
          key: lastChild.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 4,
          key: lastChild.getKey(),
        });
      });

      // insertParagraph
      setupTestCase((selection, state, block) => {
        insertParagraph(selection);
        const nextSibling = block.getNextSibling();
        expect(selection.anchor).toEqual({
          type: 'block',
          offset: 0,
          key: nextSibling.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'block',
          offset: 0,
          key: nextSibling.getKey(),
        });
      });

      // insertLineBreak
      setupTestCase((selection, state, block) => {
        insertLineBreak(selection, true);
        const thirdChild = state.getNodeByKey('c');
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 1,
          key: thirdChild.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 1,
          key: thirdChild.getKey(),
        });
      });

      // Format text
      setupTestCase((selection, state, block) => {
        formatText(selection, 'bold');
        insertText(selection, 'Test');
        const lastChild = block.getLastChild();
        expect(lastChild.getTextContent()).toBe('Test');
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 4,
          key: lastChild.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 4,
          key: lastChild.getKey(),
        });
      });

      // Extract selection
      setupTestCase((selection, state, block) => {
        expect(extractSelection(selection)).toEqual([state.getNodeByKey('c')]);
      });

      // cloneContents
      setupTestCase((selection, state, block) => {
        expect(cloneContents(selection)).toEqual({
          range: [block.getKey()],
          nodeMap: [
            ['c', {...state.getNodeByKey('c'), __text: ''}],
            [block.getKey(), {...block, __children: ['c']}],
          ],
        });
      });
    });

    test('Has correct block point after merge from middle', async () => {
      const editor = createTestEditor();

      editor.addListener('error', (error) => {
        throw error;
      });

      const element = document.createElement('div');
      let block;

      editor.setRootElement(element);

      editor.update((state) => {
        const root = state.getRoot();
        block = createParagraphWithNodes(editor, [
          {text: 'a', key: 'a', mergeable: true},
          {text: 'b', key: 'b', mergeable: true},
          {text: 'c', key: 'c', mergeable: true},
        ]);
        root.append(block);
        setAnchorPoint(state, {
          type: 'block',
          key: block.getKey(),
          offset: 2,
        });
        setFocusPoint(state, {
          type: 'block',
          key: block.getKey(),
          offset: 2,
        });
      });

      await Promise.resolve().then();

      editor.getEditorState().read((state) => {
        const selection = getSelection();
        expect(selection.anchor).toEqual({
          type: 'text',
          key: 'a',
          offset: 2,
        });
        expect(selection.focus).toEqual({
          type: 'text',
          key: 'a',
          offset: 2,
        });
      });
    });

    test('Has correct block point after merge from end', async () => {
      const editor = createTestEditor();

      editor.addListener('error', (error) => {
        throw error;
      });

      const element = document.createElement('div');
      let block;

      editor.setRootElement(element);

      editor.update((state) => {
        const root = state.getRoot();
        block = createParagraphWithNodes(editor, [
          {text: 'a', key: 'a', mergeable: true},
          {text: 'b', key: 'b', mergeable: true},
          {text: 'c', key: 'c', mergeable: true},
        ]);
        root.append(block);
        setAnchorPoint(state, {
          type: 'block',
          key: block.getKey(),
          offset: 3,
        });
        setFocusPoint(state, {
          type: 'block',
          key: block.getKey(),
          offset: 3,
        });
      });

      await Promise.resolve().then();

      editor.getEditorState().read((state) => {
        const selection = getSelection();
        expect(selection.anchor).toEqual({
          type: 'text',
          key: 'a',
          offset: 3,
        });
        expect(selection.focus).toEqual({
          type: 'text',
          key: 'a',
          offset: 3,
        });
      });
    });
  });

  describe('Simple range', () => {
    test('Can handle multiple text points', () => {
      const setupTestCase = (cb) => {
        const editor = createTestEditor();

        editor.addListener('error', (error) => {
          throw error;
        });

        editor.update((state) => {
          const root = state.getRoot();
          const block = createParagraphWithNodes(editor, [
            {text: 'a', key: 'a', mergeable: false},
            {text: 'b', key: 'b', mergeable: false},
            {text: 'c', key: 'c', mergeable: false},
          ]);
          root.append(block);
          setAnchorPoint(state, {
            type: 'text',
            offset: 0,
            key: 'a',
          });
          setFocusPoint(state, {
            type: 'text',
            offset: 0,
            key: 'b',
          });

          const selection = getSelection();
          cb(selection, state, block);
        });
      };

      // getNodes
      setupTestCase((selection, state) => {
        expect(selection.getNodes()).toEqual([
          state.getNodeByKey('a'),
          state.getNodeByKey('b'),
        ]);
      });

      // getTextContent
      setupTestCase((selection) => {
        expect(selection.getTextContent()).toEqual('a');
      });

      // insertText
      setupTestCase((selection, state) => {
        insertText(selection, 'Test');
        expect(state.getNodeByKey('a').getTextContent()).toBe('Test');
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 4,
          key: 'a',
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 4,
          key: 'a',
        });
      });

      // insertNodes
      setupTestCase((selection, state, block) => {
        insertNodes(selection, [createTextNode('foo')]);
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 3,
          key: block.getFirstChild().getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 3,
          key: block.getFirstChild().getKey(),
        });
      });

      // insertParagraph
      setupTestCase((selection) => {
        insertParagraph(selection);
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 0,
          key: 'b',
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 0,
          key: 'b',
        });
      });

      // insertLineBreak
      setupTestCase((selection, state, block) => {
        insertLineBreak(selection, true);
        expect(selection.anchor).toEqual({
          type: 'block',
          offset: 0,
          key: block.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'block',
          offset: 0,
          key: block.getKey(),
        });
      });

      // Format text
      setupTestCase((selection, state, block) => {
        formatText(selection, 'bold');
        insertText(selection, 'Test');
        expect(block.getFirstChild().getTextContent()).toBe('Test');
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 4,
          key: block.getFirstChild().getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 4,
          key: block.getFirstChild().getKey(),
        });
      });

      // Extract selection
      setupTestCase((selection, state) => {
        expect(extractSelection(selection)).toEqual([
          {...state.getNodeByKey('a')},
        ]);
      });

      // cloneContents
      setupTestCase((selection, state, block) => {
        expect(cloneContents(selection)).toEqual({
          range: [block.getKey()],
          nodeMap: [
            ['a', state.getNodeByKey('a')],
            [block.getKey(), {...block, __children: ['a', 'b']}],
            ['b', {...state.getNodeByKey('b'), __text: ''}],
          ],
        });
      });
    });

    test('Can handle multiple block points', () => {
      const setupTestCase = (cb) => {
        const editor = createTestEditor();

        editor.addListener('error', (error) => {
          throw error;
        });

        editor.update((state) => {
          const root = state.getRoot();
          const block = createParagraphWithNodes(editor, [
            {text: 'a', key: 'a', mergeable: false},
            {text: 'b', key: 'b', mergeable: false},
            {text: 'c', key: 'c', mergeable: false},
          ]);
          root.append(block);
          setAnchorPoint(state, {
            type: 'block',
            offset: 0,
            key: block.getKey(),
          });
          setFocusPoint(state, {
            type: 'block',
            offset: 1,
            key: block.getKey(),
          });

          const selection = getSelection();
          cb(selection, state, block);
        });
      };

      // getNodes
      setupTestCase((selection, state) => {
        expect(selection.getNodes()).toEqual([
          state.getNodeByKey('a'),
          state.getNodeByKey('b'),
        ]);
      });

      // getTextContent
      setupTestCase((selection) => {
        expect(selection.getTextContent()).toEqual('a');
      });

      // insertText
      setupTestCase((selection, state, block) => {
        insertText(selection, 'Test');
        const firstChild = block.getFirstChild();
        expect(firstChild.getTextContent()).toBe('Test');
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 4,
          key: firstChild.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 4,
          key: firstChild.getKey(),
        });
      });

      // insertParagraph
      setupTestCase((selection, state, block) => {
        insertParagraph(selection);
        const firstChild = block.getNextSibling().getFirstChild();
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 0,
          key: firstChild.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 0,
          key: firstChild.getKey(),
        });
      });

      // insertLineBreak
      setupTestCase((selection, state, block) => {
        insertLineBreak(selection, true);
        expect(selection.anchor).toEqual({
          type: 'block',
          offset: 0,
          key: block.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'block',
          offset: 0,
          key: block.getKey(),
        });
      });

      // Format text
      setupTestCase((selection, state, block) => {
        formatText(selection, 'bold');
        insertText(selection, 'Test');
        const firstChild = block.getFirstChild();
        expect(firstChild.getTextContent()).toBe('Test');
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 4,
          key: firstChild.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 4,
          key: firstChild.getKey(),
        });
      });

      // Extract selection
      setupTestCase((selection, state, block) => {
        const firstChild = block.getFirstChild();
        expect(extractSelection(selection)).toEqual([firstChild]);
      });

      // cloneContents
      setupTestCase((selection, state, block) => {
        expect(cloneContents(selection)).toEqual({
          range: [block.getKey()],
          nodeMap: [
            ['a', state.getNodeByKey('a')],
            [block.getKey(), {...block, __children: ['a', 'b']}],
            ['b', {...state.getNodeByKey('b'), __text: ''}],
          ],
        });
      });
    });

    test('Can handle a mix of text and block points', () => {
      const setupTestCase = (cb) => {
        const editor = createTestEditor();

        editor.addListener('error', (error) => {
          throw error;
        });

        editor.update((state) => {
          const root = state.getRoot();
          const block = createParagraphWithNodes(editor, [
            {text: 'a', key: 'a', mergeable: false},
            {text: 'b', key: 'b', mergeable: false},
            {text: 'c', key: 'c', mergeable: false},
          ]);
          root.append(block);
          setAnchorPoint(state, {
            type: 'block',
            offset: 0,
            key: block.getKey(),
          });
          setFocusPoint(state, {
            type: 'text',
            offset: 1,
            key: 'c',
          });

          const selection = getSelection();
          cb(selection, state, block);
        });
      };

      // isBefore
      setupTestCase((selection, state) => {
        expect(selection.anchor.isBefore(selection.focus)).toEqual(true);
      });

      // getNodes
      setupTestCase((selection, state) => {
        expect(selection.getNodes()).toEqual([
          state.getNodeByKey('a'),
          state.getNodeByKey('b'),
          state.getNodeByKey('c'),
        ]);
      });

      // getTextContent
      setupTestCase((selection) => {
        expect(selection.getTextContent()).toEqual('abc');
      });

      // insertText
      setupTestCase((selection, state, block) => {
        insertText(selection, 'Test');
        const firstChild = block.getFirstChild();
        expect(firstChild.getTextContent()).toBe('Test');
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 4,
          key: firstChild.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 4,
          key: firstChild.getKey(),
        });
      });

      // insertParagraph
      setupTestCase((selection, state, block) => {
        insertParagraph(selection);
        const nextBlock = block.getNextSibling();
        expect(selection.anchor).toEqual({
          type: 'block',
          offset: 0,
          key: nextBlock.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'block',
          offset: 0,
          key: nextBlock.getKey(),
        });
      });

      // insertLineBreak
      setupTestCase((selection, state, block) => {
        insertLineBreak(selection, true);
        expect(selection.anchor).toEqual({
          type: 'block',
          offset: 0,
          key: block.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'block',
          offset: 0,
          key: block.getKey(),
        });
      });

      // Format text
      setupTestCase((selection, state, block) => {
        formatText(selection, 'bold');
        insertText(selection, 'Test');
        const firstChild = block.getFirstChild();
        expect(firstChild.getTextContent()).toBe('Test');
        expect(selection.anchor).toEqual({
          type: 'text',
          offset: 4,
          key: firstChild.getKey(),
        });
        expect(selection.focus).toEqual({
          type: 'text',
          offset: 4,
          key: firstChild.getKey(),
        });
      });

      // Extract selection
      setupTestCase((selection, state, block) => {
        expect(extractSelection(selection)).toEqual([
          state.getNodeByKey('a'),
          state.getNodeByKey('b'),
          state.getNodeByKey('c'),
        ]);
      });

      // cloneContents
      setupTestCase((selection, state, block) => {
        expect(cloneContents(selection)).toEqual({
          range: [block.getKey()],
          nodeMap: [
            ['a', state.getNodeByKey('a')],
            [block.getKey(), block],
            ['b', state.getNodeByKey('b')],
            ['c', state.getNodeByKey('c')],
          ],
        });
      });
    });
  });

  test('range with multiple paragraphs', async () => {
    const editor = createTestEditor();
    editor.addListener('error', (error) => {
      throw error;
    });
    const element = document.createElement('div');
    editor.setRootElement(element);

    await editor.update((state: State) => {
      const root = state.getRoot();
      const paragraph1 = createParagraphNode();
      const paragraph2 = createParagraphNode();
      const paragraph3 = createParagraphNode();
      const text1 = createTextNode('First');
      const text2 = createTextNode('Second');
      const text3 = createTextNode('Third');
      root.append(paragraph1, paragraph2, paragraph3);
      paragraph1.append(text1);
      paragraph2.append(text2);
      paragraph3.append(text3);

      text1.select(0, 0);
      const selection1 = getSelection();
      selection1.focus.set(text3.getKey(), 1, 'text');
      const selectedNodes1 = cloneContents(getSelection());
      expect(selectedNodes1.range).toEqual([
        paragraph1.getKey(),
        paragraph2.getKey(),
        paragraph3.getKey(),
      ]);
      expect(selectedNodes1.nodeMap[0][0]).toEqual(text1.getKey());
      expect(selectedNodes1.nodeMap[0][1].getTextContent()).toBe('First');
      expect(selectedNodes1.nodeMap[1][0]).toEqual(paragraph1.getKey());
      expect(selectedNodes1.nodeMap[2][0]).toEqual(paragraph2.getKey());
      expect(selectedNodes1.nodeMap[3][0]).toEqual(text2.getKey());
      expect(selectedNodes1.nodeMap[4][0]).toEqual(paragraph3.getKey());
      expect(selectedNodes1.nodeMap[5][0]).toEqual(text3.getKey());
      expect(selectedNodes1.nodeMap[5][1].getTextContent()).toBe('Third');

      text1.select(1, 1);
      const selection2 = getSelection();
      selection2.focus.set(text3.getKey(), 4, 'text');
      const selectedNodes2 = cloneContents(getSelection());
      expect(selectedNodes2.range).toEqual([
        paragraph1.getKey(),
        paragraph2.getKey(),
        paragraph3.getKey(),
      ]);
      expect(selectedNodes2.nodeMap[0][0]).toEqual(text1.getKey());
      expect(selectedNodes2.nodeMap[0][1].__text).toBe('irst');
      expect(selectedNodes2.nodeMap[1][0]).toEqual(paragraph1.getKey());
      expect(selectedNodes2.nodeMap[2][0]).toEqual(paragraph2.getKey());
      expect(selectedNodes2.nodeMap[3][0]).toEqual(text2.getKey());
      expect(selectedNodes2.nodeMap[4][0]).toEqual(paragraph3.getKey());
      expect(selectedNodes2.nodeMap[5][0]).toEqual(text3.getKey());
      expect(selectedNodes2.nodeMap[5][1].__text).toBe('Thir');
    });
  });

  test('range with excludeFromCopy nodes', async () => {
    const editor = createTestEditor();
    editor.addListener('error', (error) => {
      throw error;
    });
    const element = document.createElement('div');
    editor.setRootElement(element);

    await editor.update((state: State) => {
      const root = state.getRoot();
      const paragraph = createParagraphNode();
      root.append(paragraph);

      const excludeBlockNode1 = createTestExcludeFromCopyBlockNode();
      paragraph.append(excludeBlockNode1);
      paragraph.select(0, 0);
      const selectedNodes1 = cloneContents(getSelection());
      expect(selectedNodes1.range).toEqual([]);

      const text1 = createTextNode('1');
      excludeBlockNode1.append(text1);
      excludeBlockNode1.select(0, 0);
      const selectedNodes2 = cloneContents(getSelection());
      expect(selectedNodes2.range).toEqual([paragraph.getKey()]);

      paragraph.select(0, 0);
      const selectedNodes3 = cloneContents(getSelection());
      expect(selectedNodes3.range).toEqual([paragraph.getKey()]);

      const text2 = createTextNode('2');
      excludeBlockNode1.insertAfter(text2);
      paragraph.select(0, 2);
      const selectedNodes4 = cloneContents(getSelection());
      expect(selectedNodes4.range).toEqual([paragraph.getKey()]);
      expect(selectedNodes4.nodeMap[0][0]).toEqual(text1.getKey());
      expect(selectedNodes4.nodeMap[1][0]).toEqual(paragraph.getKey());
      expect(selectedNodes4.nodeMap[2][0]).toEqual(text2.getKey());

      const text3 = createTextNode('3');
      excludeBlockNode1.append(text3);
      paragraph.select(0, 2);
      const selectedNodes5 = cloneContents(getSelection());
      expect(selectedNodes5.range).toEqual([paragraph.getKey()]);
      expect(selectedNodes5.nodeMap[0][0]).toEqual(text1.getKey());
      expect(selectedNodes5.nodeMap[1][0]).toEqual(paragraph.getKey());
      expect(selectedNodes5.nodeMap[2][0]).toEqual(text3.getKey());
      expect(selectedNodes5.nodeMap[3][0]).toEqual(text2.getKey());

      const testBlockNode = createTestBlockNode();
      const excludeBlockNode2 = createTestExcludeFromCopyBlockNode();
      const text4 = createTextNode('4');
      text1.insertBefore(testBlockNode);
      testBlockNode.append(excludeBlockNode2);
      excludeBlockNode2.append(text4);
      paragraph.select(0, 3);
      const selectedNodes6 = cloneContents(getSelection());
      expect(selectedNodes6.range).toEqual([paragraph.getKey()]);
      expect(selectedNodes6.nodeMap[0][0]).toEqual(text4.getKey());
      expect(selectedNodes6.nodeMap[1][0]).toEqual(testBlockNode.getKey());
      expect(selectedNodes6.nodeMap[2][0]).toEqual(paragraph.getKey());
      expect(selectedNodes6.nodeMap[3][0]).toEqual(text1.getKey());
      expect(selectedNodes6.nodeMap[4][0]).toEqual(text3.getKey());
      expect(selectedNodes6.nodeMap[5][0]).toEqual(text2.getKey());

      text4.remove();
      paragraph.select(0, 3);
      const selectedNodes7 = cloneContents(getSelection());
      expect(selectedNodes7.range).toEqual([paragraph.getKey()]);
      expect(selectedNodes7.nodeMap[0][0]).toEqual(testBlockNode.getKey());
      expect(selectedNodes7.nodeMap[1][0]).toEqual(paragraph.getKey());
      expect(selectedNodes7.nodeMap[2][0]).toEqual(text1.getKey());
      expect(selectedNodes7.nodeMap[3][0]).toEqual(text3.getKey());
      expect(selectedNodes7.nodeMap[4][0]).toEqual(text2.getKey());
    });
  });

  describe('can insert non-block nodes correctly', () => {
    describe('with an empty paragraph node selected', () => {
      test('a single text node', async () => {
        const editor = createTestEditor();
        editor.addListener('error', (error) => {
          throw error;
        });
        const element = document.createElement('div');
        editor.setRootElement(element);

        await editor.update((state: State) => {
          const root = state.getRoot();
          const paragraph = createParagraphNode();
          root.append(paragraph);

          setAnchorPoint(state, {
            type: 'block',
            offset: 0,
            key: paragraph.getKey(),
          });
          setFocusPoint(state, {
            type: 'block',
            offset: 0,
            key: paragraph.getKey(),
          });
          const selection = getSelection();

          insertNodes(selection, [createTextNode('foo')]);
        });

        expect(element.innerHTML).toBe(
          '<p><span data-outline-text="true">foo</span></p>',
        );
      });

      test('two text nodes', async () => {
        const editor = createTestEditor();
        editor.addListener('error', (error) => {
          throw error;
        });
        const element = document.createElement('div');
        editor.setRootElement(element);

        await editor.update((state: State) => {
          const root = state.getRoot();
          const paragraph = createParagraphNode();
          root.append(paragraph);

          setAnchorPoint(state, {
            type: 'block',
            offset: 0,
            key: paragraph.getKey(),
          });
          setFocusPoint(state, {
            type: 'block',
            offset: 0,
            key: paragraph.getKey(),
          });
          const selection = getSelection();

          insertNodes(selection, [
            createTextNode('foo'),
            createTextNode('bar'),
          ]);
        });

        expect(element.innerHTML).toBe(
          '<p dir="ltr"><span data-outline-text="true">foobar</span></p>',
        );
      });

      test('a single heading node with a child text node', async () => {
        const editor = createTestEditor();
        editor.addListener('error', (error) => {
          throw error;
        });
        const element = document.createElement('div');
        editor.setRootElement(element);

        await editor.update((state: State) => {
          const root = state.getRoot();
          const paragraph = createParagraphNode();
          root.append(paragraph);

          setAnchorPoint(state, {
            type: 'block',
            offset: 0,
            key: paragraph.getKey(),
          });
          setFocusPoint(state, {
            type: 'block',
            offset: 0,
            key: paragraph.getKey(),
          });
          const selection = getSelection();
          const heading = createHeadingNode('h1');
          const child = createTextNode('foo');
          heading.append(child);

          insertNodes(selection, [heading]);
        });

        expect(element.innerHTML).toBe(
          '<h1><span data-outline-text="true">foo</span></h1>',
        );
      });

      test('a heading node with a child text node and a disjoint sibling text node should throw', async () => {
        const editor = createTestEditor();
        editor.addListener('error', (error) => {
          throw error;
        });
        const element = document.createElement('div');
        editor.setRootElement(element);

        await editor.update((state: State) => {
          const root = state.getRoot();
          const paragraph = createParagraphNode();
          root.append(paragraph);

          setAnchorPoint(state, {
            type: 'block',
            offset: 0,
            key: paragraph.getKey(),
          });
          setFocusPoint(state, {
            type: 'block',
            offset: 0,
            key: paragraph.getKey(),
          });
          const selection = getSelection();
          const heading = createHeadingNode('h1');
          const child = createTextNode('foo');
          heading.append(child);

          expect(() => {
            insertNodes(selection, [heading, createTextNode('bar')]);
          }).toThrow();
        });

        expect(element.innerHTML).toBe(
          '<h1><span data-outline-text="true">foo</span></h1>',
        );
      });
    });

    describe('with a paragraph node selected on some existing text', () => {
      test('a single text node', async () => {
        const editor = createTestEditor();
        editor.addListener('error', (error) => {
          throw error;
        });
        const element = document.createElement('div');
        editor.setRootElement(element);

        await editor.update((state: State) => {
          const root = state.getRoot();
          const paragraph = createParagraphNode();
          const text = createTextNode('Existing text...');
          paragraph.append(text);
          root.append(paragraph);

          setAnchorPoint(state, {
            type: 'text',
            offset: 16,
            key: text.getKey(),
          });
          setFocusPoint(state, {
            type: 'text',
            offset: 16,
            key: text.getKey(),
          });
          const selection = getSelection();

          insertNodes(selection, [createTextNode('foo')]);
        });

        expect(element.innerHTML).toBe(
          '<p dir="ltr"><span data-outline-text="true">Existing text...foo</span></p>',
        );
      });

      test('two text nodes', async () => {
        const editor = createTestEditor();
        editor.addListener('error', (error) => {
          throw error;
        });
        const element = document.createElement('div');
        editor.setRootElement(element);

        await editor.update((state: State) => {
          const root = state.getRoot();
          const paragraph = createParagraphNode();
          const text = createTextNode('Existing text...');
          paragraph.append(text);
          root.append(paragraph);

          setAnchorPoint(state, {
            type: 'text',
            offset: 16,
            key: text.getKey(),
          });
          setFocusPoint(state, {
            type: 'text',
            offset: 16,
            key: text.getKey(),
          });
          const selection = getSelection();

          insertNodes(selection, [
            createTextNode('foo'),
            createTextNode('bar'),
          ]);
        });

        expect(element.innerHTML).toBe(
          '<p dir="ltr"><span data-outline-text="true">Existing text...foobar</span></p>',
        );
      });

      test('a single heading node with a child text node', async () => {
        const editor = createTestEditor();
        editor.addListener('error', (error) => {
          throw error;
        });
        const element = document.createElement('div');
        editor.setRootElement(element);

        await editor.update((state: State) => {
          const root = state.getRoot();
          const paragraph = createParagraphNode();
          const text = createTextNode('Existing text...');
          paragraph.append(text);
          root.append(paragraph);

          setAnchorPoint(state, {
            type: 'text',
            offset: 16,
            key: text.getKey(),
          });
          setFocusPoint(state, {
            type: 'text',
            offset: 16,
            key: text.getKey(),
          });
          const selection = getSelection();
          const heading = createHeadingNode('h1');
          const child = createTextNode('foo');
          heading.append(child);

          insertNodes(selection, [heading]);
        });

        expect(element.innerHTML).toBe(
          '<p dir="ltr"><span data-outline-text="true">Existing text...foo</span></p>',
        );
      });

      test('a heading node with a child text node and a disjoint sibling text node should throw', async () => {
        const editor = createTestEditor();
        editor.addListener('error', (error) => {
          throw error;
        });
        const element = document.createElement('div');
        editor.setRootElement(element);

        await editor.update((state: State) => {
          const root = state.getRoot();
          const paragraph = createParagraphNode();
          const text = createTextNode('Existing text...');
          paragraph.append(text);
          root.append(paragraph);

          setAnchorPoint(state, {
            type: 'text',
            offset: 16,
            key: text.getKey(),
          });
          setFocusPoint(state, {
            type: 'text',
            offset: 16,
            key: text.getKey(),
          });
          const selection = getSelection();
          const heading = createHeadingNode('h1');
          const child = createTextNode('foo');
          heading.append(child);

          expect(() => {
            insertNodes(selection, [heading, createTextNode('bar')]);
          }).toThrow();
        });

        expect(element.innerHTML).toBe(
          '<p dir="ltr"><span data-outline-text="true">Existing text...foo</span></p>',
        );
      });
    });
  });
});
